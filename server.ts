import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("A variável de ambiente GEMINI_API_KEY não está configurada.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Endpoint para análise de vídeo via Gemini AI (com suporte a áudio real)
app.post("/api/analyze-video", async (req, res) => {
  try {
    const { topic, transcript, duration = 60, language = "pt-BR", audioData, mimeType } = req.body;

    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      console.warn("Gemini client initialization failed, falling back to mock generator:", err.message);
      return res.status(400).json({
        error: "GEMINI_API_KEY_MISSING",
        message: "Chave API do Gemini não configurada. Por favor, configure a GEMINI_API_KEY."
      });
    }

    const systemInstruction = `Você é um editor sênior de vídeos virais especializado em TikTok, Instagram Reels e YouTube Shorts.
Seu objetivo é extrair ou criar até 3 cortes (clips) altamente engajantes do vídeo especificado.

IMPORTANTE: Se um arquivo de áudio for fornecido, você deve OBRIGATORIAMENTE escutar o áudio e transcrever fielmente as palavras ouvidas nos trechos dos cortes sugeridos para preencher o campo 'subtitles'. As legendas devem corresponder exatamente às falas com timestamps precisos de início e fim para cada palavra e/ou frase de 1 a 3 palavras no máximo para caber perfeitamente na tela vertical 9:16.

Se NÃO houver áudio fornecido, você deve criar diálogos de legendas super realistas, engraçadas ou inspiradoras relativos ao tema oferecido.

Para cada corte, gere legendas detalhadas com timestamps exatos em SEGUNDOS, além de sugerir enquadramentos (panningEvents) para o modo retrato (9:16) mudando a direção do enquadramento horizontal (-50 esquerda, 0 centro, 50 direita) para simular o acompanhamento do locutor que fala.

Toda a resposta deve vir estritamente estruturada conforme o JSON Schema solicitado. As legendas e títulos devem estar no idioma: ${language}.`;

    const promptText = `Analise as informações do vídeo a seguir:
Tópico/Tema do Vídeo: ${topic || "Conversa espontânea/Entrevista geral"}
Duração total considerada: ${duration} segundos.
${audioData ? "Transcreva as falas do áudio fornecido com máxima precisão e preencha as legendas com base no áudio ouvido com timestamps de palavra por palavra corretos." : `Transcrição original/Roteiro fornecido (se houver): ${transcript || "Não disponível. Crie diálogos e legendas super realistas, engraçados ou inspiradores relativos ao tema escolhido."}`}

Gere cortes curtos altamente otimizados para ir viral. Forneça o resultado exatamente respeitando o formato JSON Schema indicado.`;

    // Criar conteúdo para Gemini (Suporta Multimodal: Texto + Áudio)
    let contents: any = promptText;
    if (audioData && mimeType) {
      contents = {
        parts: [
          {
            inlineData: {
              data: audioData,
              mimeType: mimeType
            }
          },
          {
            text: promptText
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clips: {
              type: Type.ARRAY,
              description: "Array de cortes de vídeo virais sugeridos",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Título das canais/redes de corte chamativo e instigante com emojis" },
                  start: { type: Type.NUMBER, description: "Tempo de início em segundos" },
                  end: { type: Type.NUMBER, description: "Tempo de encerramento em segundos" },
                  viralScore: { type: Type.INTEGER, description: "Pontuação de viralidade estimada de 1 a 100" },
                  justification: { type: Type.STRING, description: "Justificativa curta do porquê esse corte funciona nas redes sociais" },
                  subtitles: {
                    type: Type.ARRAY,
                    description: "Lista de legendas sincronizadas palavra por palavra ou frase muito curta para caber na tela em 9:16",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING, description: "Texto" },
                        start: { type: Type.NUMBER, description: "Tempo de início em segundos" },
                        end: { type: Type.NUMBER, description: "Tempo de fim em segundos" },
                        speaker: { type: Type.STRING, description: "Identificação do falante" }
                      },
                      required: ["text", "start", "end"]
                    }
                  },
                  panningEvents: {
                    type: Type.ARRAY,
                    description: "Lista de enquadramentos de câmera automáticos (Face-Tracking simulado)",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.NUMBER, description: "Tempo em segundos" },
                        offsetPercent: { type: Type.INTEGER, description: "Foco horizontal relativo: -50 esquerda, 0 centro, 50 direita" }
                      },
                      required: ["time", "offsetPercent"]
                    }
                  }
                },
                required: ["title", "start", "end", "viralScore", "justification", "subtitles"]
              }
            }
          },
          required: ["clips"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Erro na rota de análise do Gemini:", error);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: error.message || "Erro inesperado ao processar o vídeo."
    });
  }
});

// Endpoint para tradução de legendas mantendo o sincronismo
app.post("/api/translate-subtitles", async (req, res) => {
  try {
    const { subtitles, targetLanguage = "Inglês" } = req.body;

    if (!Array.isArray(subtitles)) {
      return res.status(400).json({
        error: "BAD_REQUEST",
        message: "O parâmetro subtitles é obrigatório e deve ser uma lista."
      });
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      console.warn("Gemini client initialization failed, falling back to local simulation:", err.message);
      return res.status(400).json({
        error: "GEMINI_API_KEY_MISSING",
        message: "Chave API do Gemini não configurada."
      });
    }

    const systemInstruction = `Você é um tradutor profissional e sênior de vídeos virais e clips digitais.
Sua responsabilidade única e estrita é traduzir as palavras/frases das legendas originais fornecidas no JSON para o idioma de destino: ${targetLanguage}.
MUITO IMPORTANTE:
1. Preserve com precisão exata de 100% os tempos (timestamps) de 'start' e 'end' de cada palavra. NÃO os modifique sob hipótese alguma.
2. Traduza apenas o conteúdo textual do campo 'text', mantendo o estilo de falar conciso, ágil e espontâneo apropriado para mídias como Shorts/TikTok.
3. Não acrescente explicações, notas adicionais ou formatação alternativa. Devolva apenas o JSON correspondente ao formato JSON Schema especificado.`;

    const promptText = `Traduza os seguintes itens de legenda para o idioma correspondente: ${targetLanguage}.
Legendas Originais:
${JSON.stringify(subtitles, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedSubtitles: {
              type: Type.ARRAY,
              description: "Array de legendas traduzidas com exatidão cronológica preservada",
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "Palavra ou termo traduzido" },
                  start: { type: Type.NUMBER, description: "Tempo de início original do timestamp" },
                  end: { type: Type.NUMBER, description: "Tempo de encerramento original do timestamp" },
                  speaker: { type: Type.STRING, description: "Nome ou ID opcional do locutor" }
                },
                required: ["text", "start", "end"]
              }
            }
          },
          required: ["translatedSubtitles"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Erro na rota de tradução do Gemini:", error);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: error.message || "Erro inesperado ao realizar tradução."
    });
  }
});

// Endpoint para legendagem por IA de qualquer trecho escolhido do vídeo
app.post("/api/caption-segment", async (req, res) => {
  try {
    const { start, end, topic, transcript, audioData, mimeType, language = "pt-BR" } = req.body;
    
    if (typeof start !== "number" || typeof end !== "number" || start >= end) {
      return res.status(400).json({
        error: "BAD_REQUEST",
        message: "O intervalo de tempo (start e end) especificado é inválido."
      });
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      console.warn("Gemini client initialization failed, falling back to local simulation:", err.message);
      const simulated = generateServerProceduralSubtitles(start, end);
      return res.json({ subtitles: simulated });
    }

    const systemInstruction = `Você é um transcritor e editor profissional sênior de vídeos verticais (9:16) para TikTok, Instagram Reels e Shorts.
O usuário selecionou um trecho de vídeo/áudio específico do tempo ${start} a ${end} segundos.
Seu objetivo é escutar o áudio fornecido com máxima atenção OU analisar o roteiro, extrair tudo o que for dito estritamente nesse intervalo de tempo, e de modo algum inventar textos que estejam de fora da janela temporal de ${start} a ${end}.
As legendas geradas devem ser sincronizadas palavra por palavra ou em frases curtíssimas (de 1 a 3 palavras no máximo) com tempos corretos das falas para caber na tela retrato vertical.
Todos os tempos gerados devem ser superiores a ${start} e inferiores a ${end}.
Gere as legendas estruturadas conforme o JSON Schema para o idioma: ${language}.`;

    const promptText = `Analise este segmento específico de tempo do vídeo:
Trecho de Tempo Escolhido: ${start} a ${end} segundos (Duração: ${(end - start).toFixed(1)} segundos).
Vídeo Original / Tópico: ${topic || "Conversa espontânea"}
${audioData ? "Transcreva EXATAMENTE as falas do áudio fornecido de forma muito precisa para este termo de tempo." : `Transcrição/Roteiro Completo de Referência: ${transcript || "Não disponível"}. Crie diálogos simulados super realistas para esta parte.`}

Retorne um JSON contendo as legendas geradas para este trecho de tempo correspondente.`;

    let contents: any = promptText;
    if (audioData && mimeType) {
      contents = {
        parts: [
          {
            inlineData: {
              data: audioData,
              mimeType: mimeType
            }
          },
          {
            text: promptText
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtitles: {
              type: Type.ARRAY,
              description: "Array de legendas sincronizadas palavra por palavra ou frase curta",
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "Texto ou palavra dita" },
                  start: { type: Type.NUMBER, description: "Tempo de início da fala (segundos)" },
                  end: { type: Type.NUMBER, description: "Tempo de fim da fala (segundos)" },
                  speaker: { type: Type.STRING, description: "Nome do falante, ex: Speaker 1" }
                },
                required: ["text", "start", "end"]
              }
            }
          },
          required: ["subtitles"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Erro na rota de legendagem de trecho do Gemini:", error);
    try {
      const { start, end } = req.body;
      const simulated = generateServerProceduralSubtitles(start || 0, end || 10);
      res.json({ subtitles: simulated });
    } catch {
      res.status(500).json({ error: "SERVER_ERROR", message: "Erro ao gerar legendas para o trecho." });
    }
  }
});

// Helper procedural no servidor também para segurança contra erros
function generateServerProceduralSubtitles(startSec: number, endSec: number): any[] {
  const words = [
    "Trecho", "personalizado", "por", "você", "com", "sucesso,", "sincronizado",
    "pela", "nossa", "Inteligência", "Artificial.", "Ajuste", "os", "tempos",
    "para", "analisar", "as", "múltiplas", "partições", "de", "fala", "com", "precisão."
  ];
  const subtitles: any[] = [];
  const duration = endSec - startSec;
  const wordsPerSec = 2.4;
  const numWords = Math.floor(duration * wordsPerSec);
  let currentStart = startSec + 0.3;
  for (let i = 0; i < numWords; i++) {
    const text = words[i % words.length];
    const wordLen = 0.45;
    const wordEnd = currentStart + wordLen;
    subtitles.push({
      text: text,
      start: Number(currentStart.toFixed(1)),
      end: Number(wordEnd.toFixed(1)),
      speaker: "Speaker 1"
    });
    currentStart = wordEnd + 0.12;
  }
  return subtitles;
}

// Endpoint para geração de títulos e copy viral de postagens
app.post("/api/generate-viral-copy", async (req, res) => {
  try {
    const { clipTitle, transcript, subtitles, language = "pt-BR" } = req.body;

    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      console.warn("Gemini client initialization failed, falling back to local simulation:", err.message);
      return res.json({
        socialTitle: `🔥 COMO FAZER CORTES QUE ENGAJAM! (${clipTitle || "Corte viral"})`,
        socialCaption: `Esse é um dos melhores conselhos que você vai ouvir hoje! 💡👇\n\nTodo criador de conteúdo que quer crescer no orgânico precisa dominar isso. Se você concorda, curte e segue para mais dicas! 🚀🎨\n\n#cortes #clips #youcut #socialmedia #marketingdigital #viral`
      });
    }

    const systemInstruction = `Você é um social media manager de altíssima performance, especialista em gerar títulos clickbait saudáveis e descrições/legendas virais para Instagram Reels, TikTok e YouTube Shorts.
Seu objetivo é extrair o assunto principal das legendas/roteiro fornecidos e gerar:
1. Um título curto e intrigante (socialTitle), com no máximo 10 palavras, emojis marcantes, para prender a atenção em 1 segundo.
2. Uma legenda cativante (socialCaption), estruturada para leitura ágil, com ganchos (hooks) de retenção, bullets se apropriado e um call-to-action (CTA) forte para engajamento (comentário, compartilhamento), complementada por hashtags virais e relevantes.
Gere a resposta estritamente formatada no JSON Schema fornecido e no idioma do vídeo: ${language}.`;

    const promptText = `Crie o material de postagem para este corte de vídeo:
Título Base do corte: ${clipTitle || ""}
Roteiro / Legendas: ${JSON.stringify(subtitles || transcript || [])}

Gere o título viral e a legenda perfeita agora!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            socialTitle: { type: Type.STRING, description: "Título engajante focado em gancho (hook) para chamar atenção" },
            socialCaption: { type: Type.STRING, description: "Legenda estruturada, instigante com espaçamento e com emojis e hashtags do nicho" }
          },
          required: ["socialTitle", "socialCaption"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Erro na rota de copy viral:", error);
    res.json({
      socialTitle: `🔥 SEGREDOS DOS CORTES REVELADOS! 🎬`,
      socialCaption: `Aprenda de uma vez por todas a dominar o algoritmo de visualizações orgânicas! 🚀👇\n\nO que achou deste corte? Deixe seu comentário de feedback!\n\n#youcut #cortes #reels #audiovisual #marketing #shorts`
    });
  }
});

// Middleware do Vite para desenvolvimento, ou arquivos estáticos para produção
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando com sucesso no endereço http://localhost:${PORT}`);
  });
}

bootstrap();
