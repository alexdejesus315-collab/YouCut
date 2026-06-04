/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, RefObject } from "react";
import { SubtitleItem, ClipStyleConfig, SatisfyingVideoConfig, ClipItem } from "../types";
import { drawSubwaySurfers, drawSoapCutting, drawSlimeFluid } from "../utils/satisfyingDraw";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Smartphone, Award, Settings, Maximize2, Shrink } from "lucide-react";

interface VideoPlayerCanvasProps {
  videoUrl: string;
  clip: ClipItem;
  styleConfig: ClipStyleConfig;
  satisfyingConfig: SatisfyingVideoConfig;
  isAiPanning: boolean;
  manualOffset: number;
  onTimeUpdate: (time: number) => void;
  playbackTime: number; // passed back to parent if needed
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  exportResolution: "720p" | "1080p";
}

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 1280;

export default function VideoPlayerCanvas({
  videoUrl,
  clip,
  styleConfig,
  satisfyingConfig,
  isAiPanning,
  manualOffset,
  onTimeUpdate,
  videoRef,
  canvasRef,
  exportResolution
}: VideoPlayerCanvasProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(clip.start);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const requestRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef(0);

  // Armazenar estados de reprodução e propriedades do canvas em referências persistentes
  // para que o loop renderLoop de requestAnimationFrame nunca fique com encerramento desatualizado (stale closure)
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const propsRef = useRef({ clip, styleConfig, satisfyingConfig, isAiPanning, manualOffset, onTimeUpdate });
  useEffect(() => {
    propsRef.current = { clip, styleConfig, satisfyingConfig, isAiPanning, manualOffset, onTimeUpdate };
  }, [clip, styleConfig, satisfyingConfig, isAiPanning, manualOffset, onTimeUpdate]);

  // Carrega o vídeo APENAS quando o endereço URL mudar realmente!
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setVideoLoaded(false);
    video.src = videoUrl;
    video.load();

    const handleLoadedMetadata = () => {
      video.currentTime = clip.start;
      setCurrentTime(clip.start);
      onTimeUpdate(clip.start);
      setVideoLoaded(true);
      lastUpdateTimeRef.current = clip.start;
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [videoUrl]);

  // Se as marcações do corte ou carregamento inicial mudarem, apenas desliza o ponteiro de reprodução instantaneamente
  useEffect(() => {
    const video = videoRef.current;
    if (video && videoLoaded) {
      video.currentTime = clip.start;
      setCurrentTime(clip.start);
      onTimeUpdate(clip.start);
      lastUpdateTimeRef.current = clip.start;
      // Forçar pelo menos uma renderização no estado parado para exibir a mudança de enquadramento
      if (!isPlaying) {
        renderLoop();
      }
    }
  }, [clip.start, clip.end, videoLoaded]);

  // Loop de Renderização do Canvas (Executado a 60fps usando dados das referências)
  const renderLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentProps = propsRef.current;
    const currentClip = currentProps.clip;
    const time = video.currentTime;

    // Redução drástica: atualizar estado do React apenas se o tempo mudar em pelo menos 0.1 segundo.
    // Isso evita re-renderizar todo o layout principal 60 vezes por segundo de forma desnecessária!
    if (Math.abs(time - lastUpdateTimeRef.current) >= 0.1 || time < lastUpdateTimeRef.current) {
      setCurrentTime(time);
      currentProps.onTimeUpdate(time);
      lastUpdateTimeRef.current = time;
    }

    // Loop de reprodução do corte
    if (time >= currentClip.end) {
      video.currentTime = currentClip.start;
      setCurrentTime(currentClip.start);
      currentProps.onTimeUpdate(currentClip.start);
      lastUpdateTimeRef.current = currentClip.start;
    }

    // Limpar Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Escalar dinamicamente considerando a base lógica de 720x1280 do reprodutor
    const scaleFactor = canvas.width / 720;
    ctx.scale(scaleFactor, scaleFactor);

    // 1. Calcular o Deslocamento Horizontal (Panning / Enquadramento)
    let offsetPercent = currentProps.manualOffset;
    if (currentProps.isAiPanning && currentClip.panningEvents && currentClip.panningEvents.length > 0) {
      offsetPercent = getInterpolatedPanningOffset(time, currentClip.panningEvents);
    }

    // 2. Desenhar as Partições (Vídeo Principal vs Gameplay ASMR)
    const isSplitEnabled = currentProps.satisfyingConfig.enabled;
    const splitRatio = currentProps.satisfyingConfig.splitRatio;

    if (isSplitEnabled) {
      const topHeight = CANVAS_HEIGHT * (1 - splitRatio);
      const bottomHeight = CANVAS_HEIGHT * splitRatio;

      // Renderizar o vídeo cortado na metade de cima do canvas
      drawCroppedVideoSegment(ctx, video, 0, topHeight, offsetPercent, CANVAS_WIDTH, topHeight);

      // Renderizar o gameplay asmr procedural na metade abaixo
      ctx.save();
      ctx.translate(0, topHeight);
      
      // Criar máscara retangular do split screen para as bolhas e moedas não vazarem
      ctx.beginPath();
      ctx.rect(0, 0, CANVAS_WIDTH, bottomHeight);
      ctx.clip();

      if (currentProps.satisfyingConfig.type === "subway_surfers") {
        drawSubwaySurfers(ctx, CANVAS_WIDTH, bottomHeight, time);
      } else if (currentProps.satisfyingConfig.type === "soap_cutting") {
        drawSoapCutting(ctx, CANVAS_WIDTH, bottomHeight, time);
      } else {
        drawSlimeFluid(ctx, CANVAS_WIDTH, bottomHeight, time);
      }
      ctx.restore();

      // Divisória amarela/preta estilosa entre os vídeos
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(0, topHeight - 4, CANVAS_WIDTH, 8);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(0, topHeight - 1.5, CANVAS_WIDTH, 3);

    } else {
      // Vídeo preenchendo a tela toda 9:16
      drawCroppedVideoSegment(ctx, video, 0, CANVAS_HEIGHT, offsetPercent, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 3. Desenhar Legendas por cima do canvas completo usando os dados atuais de estilo
    drawCaptions(ctx, currentClip.subtitles, time, currentProps.styleConfig);

    ctx.restore();

    // Re-chamar frame se o estado de reprodução atualizado estiver ativo
    if (isPlayingRef.current) {
      requestRef.current = requestAnimationFrame(renderLoop);
    }
  };

  // Ativa/Desativa o loop do vídeo baseado puramente no estado de tocar/pausar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && videoLoaded) {
      video.play().catch(err => {
        console.warn("Erro ao reproduzir vídeo:", err);
        setIsPlaying(false);
      });
      requestRef.current = requestAnimationFrame(renderLoop);
    } else {
      video.pause();
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      // Re-desenhar o quadro exato de pausa uma única vez
      renderLoop();
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, videoLoaded]);

  // Sempre que houver mudanças de ajustes enquanto PAUSADO, redesenhar instantaneamente sem setTimeout
  useEffect(() => {
    if (!isPlaying) {
      renderLoop();
    }
  }, [clip, styleConfig, satisfyingConfig, isAiPanning, manualOffset]);

  // Calcula amortecimento suave entre eventos de panning
  const getInterpolatedPanningOffset = (time: number, events: any[]): number => {
    if (events.length === 0) return 0;
    if (time <= events[0].time) return events[0].offsetPercent;
    if (time >= events[events.length - 1].time) return events[events.length - 1].offsetPercent;

    // Encontra eventos adjacentes
    for (let i = 0; i < events.length - 1; i++) {
      const e1 = events[i];
      const e2 = events[i + 1];
      if (time >= e1.time && time <= e2.time) {
        const progress = (time - e1.time) / (e2.time - e1.time);
        // Interpolação senoidal suave
        const smoothProgress = Math.sin((progress * Math.PI) / 2);
        return e1.offsetPercent + (e2.offsetPercent - e1.offsetPercent) * smoothProgress;
      }
    }
    return 0;
  };

  // Corta o vídeo 16:9 widescreen para o formato adequado horizontalmente
  const drawCroppedVideoSegment = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    dy: number,
    dheight: number,
    offsetPercent: number,
    dwidth: number,
    totalSegmentHeight: number
  ) => {
    try {
      const vWidth = video.videoWidth || 1920;
      const vHeight = video.videoHeight || 1080;

      // Proporções: Queremos preencher o retângulo destWidth x destHeight
      // Mantendo o aspecto original da caixa cortada
      const targetRatio = dwidth / dheight;

      // Proporções de corte na fonte em pixels
      const sHeight = vHeight;
      const sWidth = vHeight * targetRatio;

      // Calcular o centro x padrão
      let sx = (vWidth - sWidth) / 2;

      // Aplicar o panning offset em pixels (proporcional à margem disponível de corte)
      const maxDeltaX = (vWidth - sWidth) / 2; // quanto podemos deslizar para cada lado
      const shiftX = (offsetPercent / 50) * maxDeltaX;
      sx += shiftX;

      // Limitar e garantir que fiquemos dentro das bordas do vídeo original
      sx = Math.max(0, Math.min(vWidth - sWidth, sx));

      ctx.drawImage(video, sx, 0, sWidth, sHeight, 0, dy, dwidth, dheight);
    } catch (e) {
      // Caso o vídeo ainda ocorra carregamentos
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, dy, dwidth, dheight);
    }
  };

  const drawCaptions = (
    ctx: CanvasRenderingContext2D,
    subtitles: SubtitleItem[],
    time: number,
    cfg: ClipStyleConfig
  ) => {
    // 1. Procurar palavra ativa correspondente ao tempo
    const activeWordIndex = subtitles.findIndex((w) => time >= w.start && time <= w.end);
    if (activeWordIndex === -1) {
      // Se não há palavra no exato instante, manter a última desenhada ou não desenhar nada
      return;
    }

    const activeWord = subtitles[activeWordIndex];

    // 2. Definir tamanhos de janela de palavras customizados por Preset (Altamente otimizado para prender atenção)
    let windowBefore = 1;
    let windowAfter = 1;

    if (cfg.presetName === "NeonTikTok") {
      // Impacto máximo: 1 única palavra em destaque gigante na tela (Estilo MrBeast/Shorts profissional)
      windowBefore = 0;
      windowAfter = 0;
    } else if (cfg.presetName === "CapCut") {
      // Estilo focado: apenas palavra ativa mais um spolier da próxima para manter curiosity loop
      windowBefore = 0;
      windowAfter = 1;
    } else if (cfg.presetName === "Minimalist") {
      // Capsule discreta: 3 palavras para leitura limpa com contexto
      windowBefore = 1;
      windowAfter = 1;
    } else if (cfg.presetName === "KaraokeBouncy") {
      // Estilo dinâmico: 3 palavras
      windowBefore = 1;
      windowAfter = 1;
    }

    let startIdx = Math.max(0, activeWordIndex - windowBefore);
    let endIdx = Math.min(subtitles.length - 1, activeWordIndex + windowAfter);
    
    // Obter array inicial de palavras a desenhar
    let phraseWords = subtitles.slice(startIdx, endIdx + 1);

    // Configurar fontes iniciais para medição de tamanho
    ctx.save();
    const fontStyle = `900 ${cfg.fontSize}px "${cfg.fontFamily}"`;
    ctx.font = fontStyle;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const spacing = 16; // espaçamento de respiro horizontal
    const maxAllowedWidth = CANVAS_WIDTH * 0.82; // Margem segura contra cortes laterais (590px)

    // Formatar texto conforme caseType para fins de medição correta
    const getFormattedText = (text: string) => {
      let displayText = text;
      if (cfg.caseType === "uppercase") displayText = displayText.toUpperCase();
      if (cfg.caseType === "lowercase") displayText = displayText.toLowerCase();
      return displayText;
    };

    // 3. Renderização conforme a escolha de Layout (horizontal vs vertical poetry)
    if (cfg.layoutStyle === "poetry") {
      // LAYOUT FORMATO POESIA (Vertical Compact Stack)
      // Cada palavra do grupo ativo é disposta em uma linha própria acumulando na vertical
      const N = phraseWords.length;
      const lineHeight = cfg.fontSize * 1.35; // Espaçamento de linha confortável

      // Se temos o preset Minimalist, desenhar uma máscara/cápsula de poesia unificada
      if (cfg.presetName === "Minimalist") {
        ctx.fillStyle = "rgba(9, 13, 22, 0.7)";
        // Medir a palavra mais longa para a largura da cápsula
        let maxWordWidth = 0;
        phraseWords.forEach((word) => {
          const wWidth = ctx.measureText(getFormattedText(word.text)).width;
          if (wWidth > maxWordWidth) maxWordWidth = wWidth;
        });

        const bgW = maxWordWidth + 60;
        const bgH = N * lineHeight + 20;
        const centerY = CANVAS_HEIGHT * (cfg.positionYPercent / 100);
        
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - bgW / 2, centerY - bgH / 2, bgW, bgH, 16);
        ctx.fill();
      }

      phraseWords.forEach((word, index) => {
        const isWordCurrent = word.start === activeWord.start && word.end === activeWord.end;
        
        // Posição coordenada de cada linha na poesia
        const centerY = CANVAS_HEIGHT * (cfg.positionYPercent / 100);
        const lineY = centerY + (index - (N - 1) / 2) * lineHeight;
        const lineX = CANVAS_WIDTH / 2;

        ctx.save();
        ctx.translate(lineX, lineY);

        let displayText = getFormattedText(word.text);

        // Ajustar filtros de sombra (Glow) para o estilo NeonTikTok
        if (cfg.presetName === "NeonTikTok") {
          ctx.shadowColor = cfg.strokeColor;
          ctx.shadowBlur = isWordCurrent ? 24 : 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        } else {
          ctx.shadowBlur = 0;
        }

        // Aplicação das animações avançadas da física do corte
        if (isWordCurrent) {
          ctx.fillStyle = cfg.activeColor;
          
          let scale = 1.18;
          let translateY = 0;

          if (cfg.animationType === "bouncy") {
            const duration = word.end - word.start;
            const progress = (time - word.start) / duration;
            const bounceFactor = Math.sin(progress * Math.PI); // de 0 a 1 a 0
            scale += bounceFactor * 0.16;
            translateY = -bounceFactor * 16;
          } else if (cfg.animationType === "pop") {
            const duration = word.end - word.start;
            const elapsed = time - word.start;
            if (elapsed < 0.14) {
              scale += (1 - elapsed / 0.14) * 0.35;
            }
          }

          // Estilo de Rotação Humana do CapCut (inclina levemente para esquerda)
          if (cfg.presetName === "CapCut") {
            ctx.rotate(-0.04);
          }

          ctx.scale(scale, scale);
          ctx.translate(0, translateY);
        } else {
          ctx.fillStyle = cfg.inactiveColor;
          
          // Palavras inativas no estilo Neon ficam levemente translúcidas
          if (cfg.presetName === "NeonTikTok") {
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          }
        }

        // Desenhar o contorno de contraste do texto se aplicável
        if (cfg.strokeWidth > 0 && cfg.presetName !== "Minimalist") {
          ctx.strokeStyle = cfg.strokeColor;
          ctx.lineWidth = cfg.strokeWidth;
          ctx.lineJoin = "round";
          ctx.strokeText(displayText, 0, 0);
        }

        // Texto final frontal
        ctx.fillText(displayText, 0, 0);
        ctx.restore();
      });
    } else {
      // LAYOUT TRADICIONAL (Linha Contínua Horizontal)
      let totalWordsWidth = 0;
      let wordWidths: number[] = [];

      const calculateCurrentWidth = (words: SubtitleItem[]) => {
        wordWidths = words.map((w) => ctx.measureText(getFormattedText(w.text)).width);
        return wordWidths.reduce((a, b) => a + b, 0) + spacing * (words.length - 1);
      };

      totalWordsWidth = calculateCurrentWidth(phraseWords);

      while (totalWordsWidth > maxAllowedWidth && phraseWords.length > 1) {
        // Tenta remover a primeira palavra do grupo (se não for a ativa)
        if (phraseWords[0].start !== activeWord.start) {
          phraseWords.shift();
        } else if (phraseWords[phraseWords.length - 1].start !== activeWord.start) {
          // Senão tenta remover a última palavra
          phraseWords.pop();
        } else {
          // Se sobrou apenas a ativa e ainda é grande demais, paramos para desenhar com escala menor
          break;
        }
        totalWordsWidth = calculateCurrentWidth(phraseWords);
      }

      // Posição central na timeline vertical e horizontal
      const centerY = CANVAS_HEIGHT * (cfg.positionYPercent / 100);
      const startX = CANVAS_WIDTH / 2 - totalWordsWidth / 2;

      // Se o preset selecionado for Minimalist, desenhar cápsula escura de fundo estilosa
      if (cfg.presetName === "Minimalist") {
        ctx.fillStyle = "rgba(9, 13, 22, 0.7)";
        const bgW = totalWordsWidth + 40;
        const bgH = cfg.fontSize * 1.6;
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - bgW / 2, centerY - bgH / 2, bgW, bgH, 14);
        ctx.fill();
      }

      // Renderizar cada palavra na tela
      let elapsedX = 0;
      phraseWords.forEach((word, index) => {
        const isWordCurrent = word.start === activeWord.start && word.end === activeWord.end;
        const wordWidth = wordWidths[index];
        const wordPositionX = startX + elapsedX + wordWidth / 2;

        ctx.save();
        ctx.translate(wordPositionX, centerY);

        let displayText = getFormattedText(word.text);

        // Ajustar filtros de sombra (Glow) para o estilo NeonTikTok
        if (cfg.presetName === "NeonTikTok") {
          ctx.shadowColor = cfg.strokeColor;
          ctx.shadowBlur = isWordCurrent ? 24 : 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        } else {
          ctx.shadowBlur = 0;
        }

        // Aplicação das animações avançadas da física do corte
        if (isWordCurrent) {
          ctx.fillStyle = cfg.activeColor;
          
          let scale = 1.18;
          let translateY = 0;

          if (cfg.animationType === "bouncy") {
            const duration = word.end - word.start;
            const progress = (time - word.start) / duration;
            const bounceFactor = Math.sin(progress * Math.PI); // de 0 a 1 a 0
            scale += bounceFactor * 0.16;
            translateY = -bounceFactor * 16;
          } else if (cfg.animationType === "pop") {
            const duration = word.end - word.start;
            const elapsed = time - word.start;
            if (elapsed < 0.14) {
              scale += (1 - elapsed / 0.14) * 0.35;
            }
          }

          // Estilo de Rotação Humana do CapCut (inclina levemente para esquerda)
          if (cfg.presetName === "CapCut") {
            ctx.rotate(-0.04);
          }

          ctx.scale(scale, scale);
          ctx.translate(0, translateY);
        } else {
          ctx.fillStyle = cfg.inactiveColor;
          
          // Palavras inativas no estilo Neon ficam levemente translúcidas
          if (cfg.presetName === "NeonTikTok") {
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          }
        }

        // Desenhar o contorno de contraste do texto se aplicável
        if (cfg.strokeWidth > 0 && cfg.presetName !== "Minimalist") {
          ctx.strokeStyle = cfg.strokeColor;
          ctx.lineWidth = cfg.strokeWidth;
          ctx.lineJoin = "round";
          ctx.strokeText(displayText, 0, 0);
        }

        // Texto final frontal
        ctx.fillText(displayText, 0, 0);
        ctx.restore();

        // Próxima coordenada X
        elapsedX += wordWidth + spacing;
      });
    }

    ctx.restore();
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleRewind = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = clip.start;
      setCurrentTime(clip.start);
    }
  };

  return (
    <div id="video-canvas-player-container" className="flex flex-col items-center">
      {/* Moldura de Smartphone (Aesthetic) */}
      <div className={
        isFullscreen
          ? "fixed inset-0 bg-slate-950/98 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 transition-all"
          : "relative mx-auto bg-slate-950 p-3 pb-4 rounded-[42px] border-4 border-slate-800 shadow-2xl max-w-[270px] sm:max-w-[290px]"
      }>
        
        {isFullscreen && (
          <div className="absolute top-6 right-6 flex items-center gap-3 z-55 bg-slate-900/80 p-2 rounded-xl border border-slate-850">
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest font-mono">Modo Cinema YouCut 9:16</span>
            <button
              id="btn-close-fullscreen-overlay"
              onClick={() => setIsFullscreen(false)}
              className="py-1 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs rounded-lg transition-all flex items-center gap-1"
            >
              <Shrink className="w-3.5 h-3.5" /> Sair Tela Cheia
            </button>
          </div>
        )}

        {/* The Actual Smartphone Body content */}
        <div className={
          isFullscreen
            ? "relative bg-slate-950 p-4 pb-6 rounded-[50px] border-8 border-slate-800 shadow-2xl h-[80vh] aspect-[9/16]"
            : "relative w-full"
        }>
          {/* Notch ca caixa */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-b-2xl z-20 flex items-center justify-center">
            <div className="w-10 h-1 bg-slate-900 rounded-full" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full ml-1" />
          </div>

          {/* Canvas de Vídeo 9:16 real */}
          <div className="relative rounded-[30px] overflow-hidden bg-slate-950 border border-slate-900 aspect-[9/16] h-full w-full">
            <canvas
              id="rendering-canvas-stage"
              ref={canvasRef}
              width={exportResolution === "1080p" ? 1080 : 720}
              height={exportResolution === "1080p" ? 1920 : 1280}
              className="w-full h-full object-cover rounded-[30px]"
            />
            
            {/* Fullscreen Trigger Floating button (Only visible in normal mode) */}
            {!isFullscreen && (
              <button
                id="btn-trigger-fullscreen"
                type="button"
                onClick={() => setIsFullscreen(true)}
                title="Prévia em Tela Cheia"
                className="absolute bottom-4 right-4 z-40 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-emerald-400 p-2.5 rounded-full border border-slate-800 transition-all shadow-lg active:scale-95"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {/* Overlay Carregando inicial */}
            {!videoLoaded && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-xs font-bold text-white mb-1 uppercase tracking-wider">Ajustando Proporções...</p>
                <p className="text-[10px] text-slate-500">Renderizando trilha de face-tracking e canvas no modo retrato</p>
              </div>
            )}
          </div>
        </div>

        {/* Render controls in fullscreen wrapper or beneath wrapper */}
        {isFullscreen && (
          <div className="flex flex-col items-center mt-6 w-full max-w-[320px] select-none z-50">
            {/* Controles do Player de Vídeo */}
            <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 rounded-full px-5 py-2 w-full justify-between shadow-xl animate-fade-in">
              <button
                id="btn-player-rewind-fs"
                onClick={handleRewind}
                title="Reiniciar Corte"
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors active:scale-90"
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>

              <button
                id="btn-player-play-pause-fs"
                onClick={handlePlayPause}
                className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 rounded-full flex items-center justify-center transition-all shadow"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
              </button>

              <button
                id="btn-player-mute-toggle-fs"
                onClick={handleMuteToggle}
                className={`p-1.5 rounded-full transition-colors active:scale-90 ${
                  isMuted ? "text-slate-400 hover:bg-slate-800" : "text-emerald-400 bg-emerald-500/10"
                }`}
              >
                {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
              </button>
            </div>

            <div className="text-[10px] text-slate-400 font-mono mt-3 uppercase tracking-wider flex items-center gap-1.5 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-full">
              <span>Tempo:</span>
              <span className="text-emerald-400 font-bold">{currentTime.toFixed(1)}s</span>
              <span className="text-slate-700 font-semibold">/</span>
              <span>Corte:</span>
              <span className="text-slate-300 font-semibold">{clip.start.toFixed(0)}s a {clip.end.toFixed(0)}s</span>
            </div>
          </div>
        )}

      </div>

      {/* Controles do Player de Vídeo (Hidden when in fullscreen to keep them only in overlay) */}
      {!isFullscreen && (
        <>
          <div className="flex items-center gap-4 mt-6 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-full px-5 py-2 w-full max-w-[290px] justify-between shadow-xl">
            <button
              id="btn-player-rewind"
              onClick={handleRewind}
              title="Reiniciar Corte"
              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-full transition-colors active:scale-90"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>

            <button
              id="btn-player-play-pause"
              onClick={handlePlayPause}
              className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 rounded-full flex items-center justify-center transition-all shadow"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
            </button>

            <button
              id="btn-player-mute-toggle"
              onClick={handleMuteToggle}
              title={isMuted ? "Ativar Áudio" : "Mudar pra Mudo"}
              className={`p-1.5 rounded-full transition-colors active:scale-90 ${
                isMuted ? "text-slate-400 hover:bg-slate-900" : "text-emerald-400 bg-emerald-500/10"
              }`}
            >
              {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* HUD de status de timeline */}
          <div className="text-[10px] text-slate-400 font-mono mt-3 uppercase tracking-wider flex items-center gap-1.5">
            <span>Tempo:</span>
            <span className="text-emerald-400 font-bold">{currentTime.toFixed(1)}s</span>
            <span className="text-slate-700 text-slate-500 font-black">/</span>
            <span>Corte:</span>
            <span className="text-slate-300 font-medium">{clip.start.toFixed(0)}s a {clip.end.toFixed(0)}s</span>
          </div>
        </>
      )}

      {/* Elemento de áudio/vídeo original ocultado no DOM para processar frames */}
      <video
        ref={videoRef}
        playsInline
        muted={isMuted}
        loop
        crossOrigin="anonymous"
        className="hidden"
      />
    </div>
  );
}
