/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, DragEvent, ChangeEvent, FormEvent } from "react";
import { SAMPLE_VIDEOS } from "../utils/staticSamples";
import { VideoMetadata } from "../types";
import { Upload, Video, Camera, Link, AlertCircle, Play, StopCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VideoSelectorProps {
  onSelectVideo: (video: VideoMetadata, localFile?: File) => void;
  isAnalyzing: boolean;
}

export default function VideoSelector({ onSelectVideo, isAnalyzing }: VideoSelectorProps) {
  const [activeTab, setActiveTab] = useState<"samples" | "upload" | "webcam" | "url">("samples");
  const [isDragging, setIsDragging] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  // Webcam states
  const [isRecordingWebcam, setIsRecordingWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamRecordingTime, setWebcamRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamIntervalRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Por favor, envie apenas arquivos de vídeo (MP4, WebM, etc).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    
    // Obter duração real do vídeo de maneira precisa no navegador
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration && !isNaN(tempVideo.duration) && tempVideo.duration !== Infinity
        ? Math.round(tempVideo.duration)
        : 60;

      const mockMetadata: VideoMetadata = {
        id: "local_upload_" + Date.now(),
        title: file.name,
        url: objectUrl,
        description: `Vídeo enviado localmente: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
        duration: duration
      };

      onSelectVideo(mockMetadata, file);
    };
    
    tempVideo.onerror = () => {
      const mockMetadata: VideoMetadata = {
        id: "local_upload_" + Date.now(),
        title: file.name,
        url: objectUrl,
        description: `Vídeo enviado localmente: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
        duration: 45
      };
      onSelectVideo(mockMetadata, file);
    };

    tempVideo.src = objectUrl;
  };

  const handleUrlSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customUrl) return;

    if (!customUrl.startsWith("http://") && !customUrl.startsWith("https://")) {
      setUrlError("O link deve começar com http:// ou https://");
      return;
    }

    setUrlError("");
    const mockMetadata: VideoMetadata = {
      id: "url_video_" + Date.now(),
      title: "Vídeo do Link Externo",
      url: customUrl,
      description: `Vídeo importado via link externo: ${customUrl}`,
      duration: 45
    };

    onSelectVideo(mockMetadata);
  };

  // Webcam Recording functions
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      setWebcamStream(stream);
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar a webcam:", err);
      alert("Não foi possível acessar a câmera e o microfone. Verifique as permissões do navegador.");
    }
  };

  const stopWebcamSource = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    if (webcamIntervalRef.current) {
      clearInterval(webcamIntervalRef.current);
    }
    setWebcamRecordingTime(0);
  };

  const startRecordingWebcam = () => {
    if (!webcamStream) return;
    setRecordedChunks([]);
    
    // Configurar gravações
    const recorder = new MediaRecorder(webcamStream, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        setRecordedChunks(prev => [...prev, e.data]);
      }
    };

    recorder.onstop = () => {
      // Quando parar, criar o ficheiro e passar para o app
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const recordUrl = URL.createObjectURL(blob);
      const webcamFile = new File([blob], "gravacao_webcam.webm", { type: "video/webm" });

      const mockMetadata: VideoMetadata = {
        id: "webcam_recording_" + Date.now(),
        title: "Gravação de Câmera ao Vivo",
        url: recordUrl,
        description: "Vídeo gravado ao vivo usando a webcam e o microfone do dispositivo.",
        duration: webcamRecordingTime
      };

      onSelectVideo(mockMetadata, webcamFile);
      stopWebcamSource();
      setIsRecordingWebcam(false);
    };

    recorder.start();
    setIsRecordingWebcam(true);

    // Contagem de tempo
    webcamIntervalRef.current = setInterval(() => {
      setWebcamRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingWebcam = () => {
    if (mediaRecorderRef.current && isRecordingWebcam) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div id="video-selector-root" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 id="selector-headline" className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Selecione ou Grave seu Vídeo
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Para começar a criar seus cortes virais inteligentes no formato 9:16 com legendas geradas automaticamente por Inteligência Artificial.
        </p>
      </div>

      {/* Navegação de Abas */}
      <div className="flex border-b border-slate-800 mb-6 justify-center gap-2">
        {(["samples", "upload", "webcam", "url"] as const).map((tab) => {
          const tabLabels = {
            samples: "Modelos Prontos",
            upload: "Enviar Arquivo",
            webcam: "Gravar WebCam",
            url: "Importar Link"
          };
          const tabIcons = {
            samples: <Play className="w-4 h-4" />,
            upload: <Upload className="w-4 h-4" />,
            webcam: <Camera className="w-4 h-4" />,
            url: <Link className="w-4 h-4" />
          };

          return (
            <button
              id={`tab-btn-${tab}`}
              key={tab}
              onClick={() => {
                stopWebcamSource();
                setActiveTab(tab);
              }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                activeTab === tab
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tabIcons[tab]}
              {tabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* Conteúdos das Abas */}
      <div className="min-h-[280px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {activeTab === "samples" && (
            <motion.div
              id="tab-samples-container"
              key="samples"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {SAMPLE_VIDEOS.map((video) => (
                <div
                  id={`sample-card-${video.id}`}
                  key={video.id}
                  className="group relative bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between"
                  onClick={() => onSelectVideo(video)}
                >
                  <div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                      <Video className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2 leading-snug group-hover:text-emerald-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3">
                      {video.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">DURAÇÃO: {video.duration}s</span>
                    <span className="text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">
                      Testar Agora
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "upload" && (
            <motion.div
              id="tab-upload-container"
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center"
            >
              <div
                id="drop-zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-xl border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
                }`}
              >
                <input
                  id="video-uploader-input"
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 mb-4 shadow">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-base font-medium text-white mb-2">
                  Arraste seu arquivo de vídeo para cá
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  Compatível com MP4, WebM ou MOV. Recomenda-se vídeos de até 2 minutos para melhores resultados.
                </p>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-lg transition-colors">
                  Procurar Arquivo
                </span>
              </div>
            </motion.div>
          )}

          {activeTab === "webcam" && (
            <motion.div
              id="tab-webcam-container"
              key="webcam"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              {!webcamStream ? (
                <div className="text-center p-8 bg-slate-950/40 rounded-xl border border-slate-800 max-w-md">
                  <Camera className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-white mb-2">Ativar Câmera e Microfone</h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Grave um pitch, uma opinião ou sua fala ao vivo diretamente do seu navegador para a inteligência artificial cortar.
                  </p>
                  <button
                    id="btn-start-webcam"
                    onClick={startWebcam}
                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-bold px-5 py-3 rounded-lg flex items-center gap-2 mx-auto transition-all"
                  >
                    <Camera className="w-4 h-4" /> Ativar Minha Câmera
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-lg">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 mb-4 shadow-lg">
                    <video
                      id="webcam-live-preview"
                      ref={webcamVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* Status de gravação */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-mono font-bold">
                      {isRecordingWebcam ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-red-400">GRAVANDO: {webcamRecordingTime}s</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-emerald-400">CAMERA OPERANTE</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    {!isRecordingWebcam ? (
                      <button
                        id="webcam-record-start"
                        onClick={startRecordingWebcam}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow"
                      >
                        <Play className="w-4 h-4" /> Iniciar Gravação
                      </button>
                    ) : (
                      <button
                        id="webcam-record-stop"
                        onClick={stopRecordingWebcam}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow"
                      >
                        <StopCircle className="w-4 h-4 text-red-500 animate-pulse" /> Finalizar & Cortar
                      </button>
                    )}

                    <button
                      id="webcam-restart-cam"
                      onClick={stopWebcamSource}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs px-4 py-2.5 rounded-lg"
                    >
                      Desativar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "url" && (
            <motion.div
              id="tab-url-container"
              key="url"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center"
            >
              <form onSubmit={handleUrlSubmit} className="w-full max-w-xl bg-slate-950/40 p-8 rounded-xl border border-slate-800">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 mb-4 shadow mx-auto">
                  <Link className="w-6 h-6" />
                </div>
                <h3 className="text-base font-medium text-white mb-2 text-center">Cole um link de vídeo direto</h3>
                <p className="text-xs text-slate-400 text-center mb-6 max-w-sm mx-auto">
                  Forneça um endereço web público contendo o arquivo de vídeo MP4 para que o editor possa importá-lo.
                </p>

                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      id="custom-url-input"
                      type="text"
                      placeholder="https://exemplo.com/meu-video.mp4"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 bg-slate-900 hover:bg-slate-900/80 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      id="btn-url-import"
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs"
                    >
                      Importar
                    </button>
                  </div>
                  {urlError && (
                    <div className="flex items-center gap-2 text-red-500 text-xs mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {urlError}
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isAnalyzing && (
        <div id="selector-analyzing-overlay" className="mt-8 pt-6 border-t border-slate-800 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
          <p className="text-sm font-medium text-white">Analisando vídeo com Inteligência Artificial...</p>
          <p className="text-xs text-slate-500 mt-1">Isso pode levar alguns segundos adicionais enquanto o Gemini gera os recortes ideais.</p>
        </div>
      )}
    </div>
  );
}
