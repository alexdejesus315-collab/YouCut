/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clock, RotateCcw, Maximize2, Sparkles, Sliders, Info, Brain, Globe } from "lucide-react";
import { ClipItem } from "../types";

interface ClipTimeAdjusterProps {
  activeClip: ClipItem;
  videoDuration: number;
  onAdjustTimes: (start: number, end: number) => void;
  originalStart: number;
  originalEnd: number;
  onCaptionSegment: () => void;
  isCaptioning: boolean;
  onTranslateSegment: (lang: "en" | "es" | "pt") => void;
  isTranslating: boolean;
}

export default function ClipTimeAdjuster({
  activeClip,
  videoDuration,
  onAdjustTimes,
  originalStart,
  originalEnd,
  onCaptionSegment,
  isCaptioning,
  onTranslateSegment,
  isTranslating
}: ClipTimeAdjusterProps) {
  const { start, end } = activeClip;
  const currentDuration = end - start;

  // Handlers para os botões de ajuste rápido (Alargamento)
  const stretchStart = (seconds: number) => {
    const newStart = Math.max(0, start - seconds);
    onAdjustTimes(newStart, end);
  };

  const stretchEnd = (seconds: number) => {
    const newEnd = Math.min(videoDuration, end + seconds);
    onAdjustTimes(start, newEnd);
  };

  const stretchBoth = (seconds: number) => {
    const half = seconds / 2;
    const newStart = Math.max(0, start - half);
    const newEnd = Math.min(videoDuration, end + half);
    onAdjustTimes(newStart, newEnd);
  };

  const handleReset = () => {
    onAdjustTimes(originalStart, originalEnd);
  };

  // Recomendações de visualização baseadas no tempo
  const getRecommendation = (duration: number) => {
    if (duration < 10) {
      return {
        label: "Retenção Extrema",
        desc: "Ideal para Shorts ultra rápidos com entrega direta ao ponto.",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
      };
    }
    if (duration <= 22) {
      return {
        label: "Formato TikTok Viral",
        desc: "Duração perfeita para prender interesse e maximizar repetição.",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      };
    }
    return {
      label: "Conteúdo Envolvente",
      desc: "Excelente para narrativas e explicações profundas com alto engajamento.",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    };
  };

  const recommendation = getRecommendation(currentDuration);

  return (
    <div id="clip-time-adjuster-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ajuste de Tempo & Alargamento</h3>
            <p className="text-[11px] text-slate-400">Personalize ou estique a duração do vídeo ativo</p>
          </div>
        </div>
        
        {/* Badge da Duração Atual */}
        <span className="font-mono text-xs text-white bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
          Duração: <span className="text-emerald-400">{currentDuration.toFixed(1)}s</span>
        </span>
      </div>

      {/* Régua Visual do Corte em relação ao vídeo completo */}
      <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
        <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1.5 uppercase font-mono tracking-wider">
          <span>Vídeo Completo ({videoDuration}s)</span>
          <span className="text-emerald-400">{start.toFixed(1)}s — {end.toFixed(1)}s</span>
        </div>
        
        {/* Barra de Progresso Visual */}
        <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
          <div 
            className="absolute h-full bg-emerald-500/15 border-l border-r border-emerald-500/50"
            style={{
              left: `${(start / videoDuration) * 100}%`,
              width: `${((end - start) / videoDuration) * 100}%`
            }}
          />
          {/* Marcador do Início */}
          <div 
            className="absolute top-0 w-1.5 h-full bg-emerald-400"
            style={{ left: `${(start / videoDuration) * 100}%` }}
          />
          {/* Marcador do Fim */}
          <div 
            className="absolute top-0 w-1.5 h-full bg-emerald-400"
            style={{ left: `${(end / videoDuration) * 100}%`, transform: 'translateX(-100%)' }}
          />
        </div>

        <div className="flex justify-between text-[8px] text-slate-500 font-mono pt-1">
          <span>0.0s</span>
          <span>{(videoDuration / 2).toFixed(1)}s</span>
          <span>{videoDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Ajustadores manuais finos de tempo (Dois Sliders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Slider Início */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Tempo de Início
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">{start.toFixed(1)}s</span>
          </div>
          <input
            id="adjust-start-slider"
            type="range"
            min="0"
            max={Math.max(0, end - 1.5).toString()}
            step="0.5"
            value={start}
            onChange={(e) => onAdjustTimes(parseFloat(e.target.value), end)}
            className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Slider Fim */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Tempo de Fim
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">{end.toFixed(1)}s</span>
          </div>
          <input
            id="adjust-end-slider"
            type="range"
            min={(start + 1.5).toString()}
            max={videoDuration.toString()}
            step="0.5"
            value={end}
            onChange={(e) => onAdjustTimes(start, parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

      </div>

      {/* Seção das Opções Rápidas de Alargamento */}
      <div className="space-y-2.5">
        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Opções de Alargamento Rápido</label>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          
          <button
            id="btn-stretch-start-3s"
            type="button"
            onClick={() => stretchStart(3)}
            disabled={start <= 0}
            className="py-2 px-1 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-center flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <Maximize2 className="w-3 h-3 rotate-180 text-emerald-400" />
            +3s no Início
          </button>

          <button
            id="btn-stretch-start-5s"
            type="button"
            onClick={() => stretchStart(5)}
            disabled={start <= 0}
            className="py-2 px-1 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-center flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <Maximize2 className="w-3 h-3 rotate-180 text-emerald-400" />
            +5s no Início
          </button>

          <button
            id="btn-stretch-end-3s"
            type="button"
            onClick={() => stretchEnd(3)}
            disabled={end >= videoDuration}
            className="py-2 px-1 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-center flex items-center justify-center gap-1 disabled:opacity-40"
          >
            +3s no Fim
            <Maximize2 className="w-3 h-3 text-emerald-400" />
          </button>

          <button
            id="btn-stretch-end-5s"
            type="button"
            onClick={() => stretchEnd(5)}
            disabled={end >= videoDuration}
            className="py-2 px-1 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-center flex items-center justify-center gap-1 disabled:opacity-40"
          >
            +5s no Fim
            <Maximize2 className="w-3 h-3 text-emerald-400" />
          </button>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          
          <button
            id="btn-stretch-both-5s"
            type="button"
            onClick={() => stretchBoth(5)}
            disabled={start <= 0 && end >= videoDuration}
            className="py-2.5 px-3 text-[10px] font-bold rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 transition-all text-center flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Alargar Ambas Direções (+5s)
          </button>

          <button
            id="btn-reset-original"
            type="button"
            onClick={handleReset}
            disabled={start === originalStart && end === originalEnd}
            className="py-2.5 px-3 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-center flex items-center justify-center gap-1.5 disabled:opacity-30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Duração Original da IA
          </button>

        </div>
      </div>

      {/* Seção Geração & Tradução de Legendas por IA */}
      <div id="ai-custom-captioning-card" className="bg-slate-950/80 p-4 border border-slate-850 rounded-xl space-y-3 shadow-inner">
        <div className="flex items-center gap-1.5 justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Ações de Inteligência Artificial</span>
          </div>
          <span className="text-[8px] text-slate-400 font-bold bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded uppercase font-mono">Sincronia Total</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Sincronize ou traduza as palavras faladas instantaneamente para este intervalo customizado contido entre <strong className="text-white font-semibold">{start.toFixed(1)}s</strong> e <strong className="text-white font-semibold">{end.toFixed(1)}s</strong>.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Botão Legendar Trecho */}
          <button
            id="btn-ai-caption-chosen-segment"
            type="button"
            onClick={onCaptionSegment}
            disabled={isCaptioning}
            className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow disabled:opacity-40"
          >
            {isCaptioning ? (
              <>
                <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-slate-950 inline-block" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Legendando trecho com IA...
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5" />
                Legendar trecho com IA
              </>
            )}
          </button>

          {/* Tradução instantânea de qualquer parte */}
          <div className="flex gap-1">
            <button
              id="btn-ai-translate-en-segment"
              type="button"
              onClick={() => onTranslateSegment("en")}
              disabled={isTranslating || isCaptioning}
              className="flex-1 py-2.5 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 disabled:opacity-30"
            >
              <Globe className="w-3 h-3 text-blue-400" />
              EN
            </button>
            <button
              id="btn-ai-translate-es-segment"
              type="button"
              onClick={() => onTranslateSegment("es")}
              disabled={isTranslating || isCaptioning}
              className="flex-1 py-2.5 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 disabled:opacity-30"
            >
              <Globe className="w-3 h-3 text-amber-500" />
              ES
            </button>
            <button
              id="btn-ai-translate-pt-segment"
              type="button"
              onClick={() => onTranslateSegment("pt")}
              disabled={isTranslating || isCaptioning}
              className="flex-1 py-2.5 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 disabled:opacity-30"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              PT
            </button>
          </div>
        </div>

        {isTranslating && (
          <div className="flex items-center gap-2 justify-center py-1 text-[10px] text-emerald-400 font-bold animate-pulse text-center">
            <svg className="animate-spin h-3 w-3 inline-block" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Traduzindo trecho do corte...
          </div>
        )}
      </div>

      {/* Card Informativo com Recomendações */}
      <div className={`p-3 rounded-xl border flex gap-2.5 items-start transition-colors ${recommendation.color}`}>
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-xs font-extrabold leading-none">{recommendation.label}</span>
          <p className="text-[10px] leading-relaxed text-slate-300">
            {recommendation.desc} Ajustar o tempo expande as legendas para abranger o novo intervalo ao vivo.
          </p>
        </div>
      </div>

    </div>
  );
}
