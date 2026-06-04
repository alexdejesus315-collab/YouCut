/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const mockTranslateWord = (text: string, lang: "en" | "es" | "pt"): string => {
  if (lang === "pt") {
    return text;
  }
  const dictionaryPTtoEN: Record<string, string> = {
    "Bem-vindo": "Welcome",
    "bem-vindo": "welcome",
    "ao": "to",
    "o": "the",
    "gerador": "generator",
    "de": "of",
    "cortes": "clips",
    "inteligente": "intelligent",
    "inteligência": "intelligence",
    "artificial": "artificial",
    "você": "you",
    "pode": "can",
    "mudar": "change",
    "esse": "this",
    "texto": "text",
    "quando": "when",
    "quiser": "want",
    "clicando": "clicking",
    "no": "on",
    "painel": "panel",
    "palavras": "words",
    "palavras.": "words.",
    "A": "The",
    "nossa": "our",
    "centraliza": "centers",
    "foco": "focus",
    "da": "of",
    "discussão": "discussion",
    "e": "and",
    "permite": "allows",
    "que": "that",
    "crie": "create",
    "peças": "pieces",
    "virais": "virals",
    "para": "for",
    "TikTok": "TikTok",
    "Instagram": "Instagram",
    "Reels.": "Reels.",
    "insights": "insights",
    "descubra": "discover",
    "segredo": "secret",
    "vídeo": "video",
    "dica": "tip",
    "ouro": "gold",
    "revelada": "revealed",
    "apenas": "only",
    "criadores": "creators"
  };

  const dictionaryPTtoES: Record<string, string> = {
    "Bem-vindo": "Bienvenido",
    "bem-vindo": "bienvenido",
    "ao": "al",
    "o": "el",
    "gerador": "generador",
    "de": "de",
    "cortes": "cortes",
    "inteligente": "inteligente",
    "inteligência": "inteligencia",
    "artificial": "artificial",
    "você": "tú",
    "pode": "puedes",
    "mudar": "cambiar",
    "esse": "este",
    "texto": "texto",
    "quando": "cuando",
    "quiser": "quieras",
    "clicando": "haciendo clic",
    "no": "en el",
    "painel": "panel",
    "palavras": "palabras",
    "palavras.": "palabras.",
    "A": "La",
    "nossa": "nuestra",
    "centraliza": "centraliza",
    "foco": "enfoque",
    "da": "de la",
    "discussão": "discusión",
    "e": "y",
    "permite": "permite",
    "que": "que",
    "crie": "crees",
    "peças": "piezas",
    "virais": "virales",
    "para": "para",
    "TikTok": "TikTok",
    "Instagram": "Instagram",
    "Reels.": "Reels.",
    "insights": "ideas",
    "descubra": "descubre",
    "segredo": "secreto",
    "vídeo": "video",
    "dica": "consejo",
    "ouro": "oro",
    "revelada": "revelada",
    "apenas": "solo",
    "criadores": "creadores"
  };

  const cleaned = text.trim();
  const dict = lang === "es" ? dictionaryPTtoES : dictionaryPTtoEN;
  const match = dict[cleaned] || dict[cleaned.toLowerCase()];
  if (match) {
    if (text[0] === text[0].toUpperCase()) {
      return match[0].toUpperCase() + match.slice(1);
    }
    return match;
  }
  
  if (lang === "en") {
    if (cleaned.endsWith("ando")) return cleaned.replace("ando", "ing");
    if (cleaned.endsWith("mente")) return cleaned.replace("mente", "ly");
    return cleaned + "*";
  } else {
    if (cleaned.endsWith("cão")) return cleaned.replace("cão", "ción");
    return cleaned;
  }
};
