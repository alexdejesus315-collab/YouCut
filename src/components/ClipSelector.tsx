/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { ClipItem } from "../types";
import { Sparkles, Play, Award, HelpCircle, MessageSquare, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface ClipSelectorProps {
  clips: ClipItem[];
  selectedClipIndex: number;
  onSelectClip: (index: number) => void;
  onRefineClips: (refinementPrompt: string) => void;
  isRefining: boolean;
  apiKeyMissing: boolean;
  onGenerateSocialPromo: (index: number) => void;
  isGeneratingSocial: boolean;
}

export default function ClipSelector({
  clips,
  selectedClipIndex,
  onSelectClip,
  onRefineClips,
  isRefining,
  apiKeyMissing,
  onGenerateSocialPromo,
  isGeneratingSocial
}: ClipSelectorProps) {
  const [refinePrompt, setRefinePrompt] = useState("");

  const handleRefineSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim()) return;
    onRefineClips(refinePrompt);
    setRefinePrompt("");
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 75) return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  };

  return (
    <div id="clip-selector-root" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cortes Recomendados pela IA</h3>
            <p className="text-[11px] text-slate-400">Pedaços com maior potencial de atração orgânica</p>
          </div>
        </div>
        <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
          {clips.length} {clips.length === 1 ? "CORTE" : "CORTES"} GERAIS
        </span>
      </div>

      {apiKeyMissing && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 rounded-xl p-3 mb-4 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Modo de Testes Ativo:</span> Sem chave de API Gemini no painel de segredos, estamos gerando cortes e legendas inteligentes locais instantâneos ideais para testar toda a plataforma sem esperas.
          </div>
        </div>
      )}

      {/* Lista de Clips */}
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[380px] pr-1 mb-5 scrollbar-thin scrollbar-thumb-slate-800">
        {clips.map((clip, index) => {
          const isSelected = selectedClipIndex === index;
          return (
            <div
              id={`clip-card-${index}`}
              key={index}
              onClick={() => onSelectClip(index)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                isSelected
                  ? "bg-slate-950/80 border-emerald-500/70 shadow-md shadow-emerald-500/5"
                  : "bg-slate-950/20 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white leading-tight mb-1">
                    {clip.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span className="bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded">
                      Início: {clip.start.toFixed(1)}s
                    </span>
                    <span className="bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded">
                      Fim: {clip.end.toFixed(1)}s
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      {(clip.end - clip.start).toFixed(1)}s de vídeo
                    </span>
                  </div>
                </div>

                <div className={`text-xs font-bold border rounded-lg px-2.5 py-1.5 flex flex-col items-center shrink-0 ${getScoreColor(clip.viralScore)}`}>
                  <Award className="w-3.5 h-3.5 mb-0.5" />
                  <span>{clip.viralScore}%</span>
                </div>
              </div>

              {/* Justificativa de Virilidade */}
              {clip.justification && (
                <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-850">
                  <span className="text-[10px] font-bold text-emerald-400 block mb-0.5 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Fator Viralidade IA:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {clip.justification}
                  </p>
                </div>
              )}

              {/* Sugestão de Post e Título IA */}
              {isSelected && (
                <div id={`ai-post-promo-${index}`} className="mt-2 text-left bg-slate-900 border border-emerald-500/20 rounded-xl p-3.5 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Promoção Viral IA</span>
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono uppercase bg-slate-950 px-1.5 py-0.5 border border-slate-850 rounded">Redes Sociais</span>
                  </div>

                  {!clip.socialTitle && !clip.socialCaption ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Analise o diálogo para gerar um **título ultra cativante (clickbait saudável)** e uma **legenda recomendada** com hashtags virais.
                      </p>
                      <button
                        id={`btn-generate-promo-${index}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateSocialPromo(index);
                        }}
                        disabled={isGeneratingSocial}
                        className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow disabled:opacity-40"
                      >
                        {isGeneratingSocial ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-slate-950 inline-block" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Escrevendo Cópia Perfeita...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            Gerar Título & Post IA
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-left">
                      {/* Título sugerido */}
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Título Cativante</span>
                        <h5 className="text-xs font-black text-emerald-400 leading-snug">{clip.socialTitle}</h5>
                      </div>

                      {/* Legenda sugerida */}
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 relative">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Legenda Sugerida</span>
                        <p className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-line font-medium">{clip.socialCaption}</p>
                        
                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-900 justify-end">
                          <button
                            id={`btn-copy-caption-${index}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${clip.socialTitle}\n\n${clip.socialCaption}`);
                              const b = document.getElementById(`btn-copy-caption-${index}`);
                              if (b) {
                                b.innerText = "Copiado! ✓";
                                setTimeout(() => { b.innerText = "Copiar Texto"; }, 1500);
                              }
                            }}
                            className="text-[9px] font-bold text-emerald-400 hover:text-white transition-colors bg-emerald-500/10 px-2.5 py-1.5 rounded-md"
                          >
                            Copiar Texto
                          </button>
                          <button
                            id={`btn-regenerate-promo-${index}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onGenerateSocialPromo(index);
                            }}
                            disabled={isGeneratingSocial}
                            className="text-[9px] font-bold text-slate-400 hover:text-white transition-colors bg-slate-900 px-2.5 py-1.5 rounded-md border border-slate-850"
                          >
                            Regerar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Refinador de Prompts do Editor */}
      <div className="border-t border-slate-800 pt-4 mt-auto">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Refinar Diálogos e Cortes
        </h4>
        <p className="text-[10px] text-slate-400 mb-3 leading-snug">
          Comande o Gemini para recriar as legendas, reorganizar cortes ou mudar o tema das conversas instantaneamente!
        </p>

        <form onSubmit={handleRefineSubmit} className="flex gap-2">
          <input
            id="refine-prompt-input"
            type="text"
            placeholder="Ex: faça ficar mais sarcástico, ou faça cortes de 10s..."
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            disabled={isRefining}
            className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            id="btn-refine-submit"
            type="submit"
            disabled={isRefining || !refinePrompt.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold p-2 px-3 rounded-lg text-xs flex items-center gap-1 transition-all"
          >
            {isRefining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
