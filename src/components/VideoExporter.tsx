/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { ClipItem, ClipStyleConfig } from "../types";
import { Download, Sparkles, AlertCircle, RefreshCw, Film, CheckCircle, Share2, Clipboard, ExternalLink, Settings } from "lucide-react";

interface VideoExporterProps {
  clip: ClipItem;
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  styleConfig: ClipStyleConfig;
  exportResolution: "720p" | "1080p";
  onResolutionChange: (res: "720p" | "1080p") => void;
  exportFramerate: 30 | 60;
  onFramerateChange: (fps: 30 | 60) => void;
}

export default function VideoExporter({
  clip,
  videoElement,
  canvasElement,
  styleConfig,
  exportResolution,
  onResolutionChange,
  exportFramerate,
  onFramerateChange
}: VideoExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState("");
  const [copiedTitle, setCopiedTitle] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const exportProgressIntervalRef = useRef<any>(null);

  // Limpar links criados para evitar memory leaks
  useEffect(() => {
    return () => {
      if (renderedBlobUrl) {
        URL.revokeObjectURL(renderedBlobUrl);
      }
      if (exportProgressIntervalRef.current) {
        clearInterval(exportProgressIntervalRef.current);
      }
    };
  }, [renderedBlobUrl]);

  const handleExport = async () => {
    if (!videoElement || !canvasElement) {
      setExportError("Instâncias do Tocador e Canvas não encontradas para exportação.");
      return;
    }

    try {
      setExportError("");
      setRenderedBlobUrl(null);
      setIsExporting(true);
      setExportProgress(0);

      // 1. Pausar qualquer reprodução corrente e buscar o início do corte
      videoElement.pause();
      videoElement.currentTime = clip.start;
      
      // Garantir que as legendas apareçam sem que dependa de mutar
      videoElement.muted = false;

      // Espera o Seek terminar
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          videoElement.removeEventListener("seeked", onSeeked);
          resolve();
        };
        videoElement.addEventListener("seeked", onSeeked);
      });

      // 2. Extrair as trilhas de vídeo do canvas e áudio do elemento de vídeo
      const canvasStream = (canvasElement as any).captureStream(exportFramerate);
      const videoTrack = canvasStream.getVideoTracks()[0];

      // Tenta obter stream de áudio direto do elemento de vídeo
      let audioTrack: MediaStreamTrack | null = null;
      try {
        const videoStream = (videoElement as any).captureStream 
          ? (videoElement as any).captureStream() 
          : (videoElement as any).mozCaptureStream();
        
        audioTrack = videoStream.getAudioTracks()[0] || null;
      } catch (err) {
        console.warn("Não foi possível capturar o áudio da origem do vídeo:", err);
      }

      // Combinar as trilhas em uma nova Stream
      const tracksToCombine = [videoTrack];
      if (audioTrack) {
        tracksToCombine.push(audioTrack);
      }
      const combinedStream = new MediaStream(tracksToCombine);

      // 3. Escolher formato compatível com o navegador
      let options = { mimeType: "video/webm;codecs=vp9,opus" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "video/webm;codecs=vp8,opus" };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "video/webm" };
      }

      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRenderedBlobUrl(url);
        setIsExporting(false);
        setExportProgress(100);
      };

      // 4. Iniciar Gravação
      mediaRecorder.start();

      // Começar a tocar o vídeo de fato
      videoElement.play();

      // Atualização de progresso estrita baseada na duração do fragmento de vídeo
      const clipDuration = clip.end - clip.start;
      const startTime = Date.now();

      exportProgressIntervalRef.current = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const rawProgress = (elapsedSeconds / clipDuration) * 100;
        
        if (rawProgress >= 100 || videoElement.currentTime >= clip.end) {
          clearInterval(exportProgressIntervalRef.current);
          setExportProgress(98); // seguro antes de parar de fato

          // Parar de gravar
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
          videoElement.pause();
          videoElement.currentTime = clip.start;
        } else {
          setExportProgress(Math.min(95, Math.floor(rawProgress)));
        }
      }, 100);

    } catch (err: any) {
      console.error("Erro durante a gravação d canvas stream:", err);
      setExportError(err.message || "Seu navegador barrou a exportação do canvas por segurança (bloqueio CORS local). Tente usar seus próprios vídeos enviados localmente para remover essa restrição.");
      setIsExporting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(clip.title);
    setCopiedTitle(true);
    setTimeout(() => {
      setCopiedTitle(false);
    }, 2000);
  };

  return (
    <div id="video-exporter-root" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4">
        <Film className="w-6 h-6" />
      </div>

      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Exportação e Publicação</h3>
      <p className="text-xs text-slate-400 mb-5 max-w-sm">
        Grave em tempo real o formato retrato 9:16 com as legendas coloridas animadas estilizadas no canvas.
      </p>

      {exportError && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-left text-[11px] leading-relaxed mb-5 max-w-sm">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Falha de Segurança (CORS)
          </div>
          {exportError}
        </div>
      )}

      {/* Configuração de Resolução e Framerate */}
      {!isExporting && !renderedBlobUrl && (
        <div id="export-settings-panel" className="w-full bg-slate-950/60 border border-slate-850 p-4 rounded-xl mb-4 text-left space-y-3.5">
          <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
            <Settings className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Configuração do Arquivo</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Resolução */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Resolução de Saída</label>
              <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  id="btn-export-res-720p"
                  type="button"
                  onClick={() => onResolutionChange("720p")}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-md transition-all ${
                    exportResolution === "720p"
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/10"
                  }`}
                >
                  720p
                </button>
                <button
                  id="btn-export-res-1080p"
                  type="button"
                  onClick={() => onResolutionChange("1080p")}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-md transition-all ${
                    exportResolution === "1080p"
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/10"
                  }`}
                >
                  1080p
                </button>
              </div>
            </div>

            {/* Framerate */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Taxa de Quadros (FPS)</label>
              <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  id="btn-export-fps-30"
                  type="button"
                  onClick={() => onFramerateChange(30)}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-md transition-all ${
                    exportFramerate === 30
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/10"
                  }`}
                >
                  30
                </button>
                <button
                  id="btn-export-fps-60"
                  type="button"
                  onClick={() => onFramerateChange(60)}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-md transition-all ${
                    exportFramerate === 60
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/10"
                  }`}
                >
                  60
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão de Exportar Principal */}
      {!isExporting && !renderedBlobUrl && (
        <button
          id="btn-trigger-export"
          onClick={handleExport}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-slate-950 font-bold text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          Gerar Corte Retrato 9:16
        </button>
      )}

      {/* Estado Gravando em Tempo Real */}
      {isExporting && (
        <div id="export-processing-loading" className="w-full bg-slate-950 p-6 rounded-xl border border-slate-850">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Queimando Legendas no Vídeo...</h4>
          <p className="text-[10px] text-slate-500 mb-4">
            Isso leva a duração original do corte ({ (clip.end - clip.start).toFixed(0) }s) em velocidade real. Por favor, mantenha a janela aberta.
          </p>

          {/* Barra de Progresso */}
          <div className="w-full bg-slate-900 rounded-full h-2 mb-2 p-0.5 overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-1 rounded-full transition-all duration-100"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-emerald-400 font-bold">{exportProgress}% completo</span>
        </div>
      )}

      {/* Resultado da Exportação Ativo */}
      {renderedBlobUrl && (
        <div id="export-success-container" className="w-full bg-slate-950/60 p-5 rounded-xl border border-emerald-500/20 text-left">
          <div className="flex items-center gap-2 text-emerald-400 mb-3 text-sm font-bold">
            <CheckCircle className="w-5 h-5" /> Registo Criado com Sucesso!
          </div>

          <p className="text-[10px] text-slate-400 leading-normal mb-4">
            Seu clipe de { (clip.end - clip.start).toFixed(0) } segundos em formato retrato (9:16) foi finalizado localmente. Faça o download abaixo e envie diretamente para o Reels ou Shorts.
          </p>

          <div className="space-y-3.5 mb-5 pb-4 border-b border-slate-900">
            {/* Título Recomendado para Prática Social */}
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Título sugerido (Copywriter IA)</span>
              <div className="flex bg-slate-900 p-2.5 rounded-lg border border-slate-800 gap-2 items-center justify-between">
                <span className="text-xs font-medium text-white line-clamp-1">{clip.title}</span>
                <button
                  id="btn-copy-clip-title"
                  onClick={copyToClipboard}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[9px]"
                >
                  {copiedTitle ? "Copiado!" : <Clipboard className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5">
            <a
              id="anchor-download-clip"
              href={renderedBlobUrl}
              download={`${clip.title.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_").toLowerCase()}_corte_retrato.webm`}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow"
            >
              <Download className="w-3.5 h-3.5 stroke-[3]" /> Baixar Arquivo
            </a>
            
            <button
              id="btn-clear-export"
              onClick={() => setRenderedBlobUrl(null)}
              className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 px-4 py-2 text-[11px] rounded-lg font-bold"
            >
              Refazer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
