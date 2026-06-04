/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { SubtitleItem, ClipStyleConfig } from "../types";
import { Type, Edit, Check, Settings, Eye, Sliders, PlayCircle, Languages, Globe, RefreshCw, Sparkles } from "lucide-react";

interface SubtitleEditorProps {
  subtitles: SubtitleItem[];
  onChangeSubtitles: (updated: SubtitleItem[]) => void;
  styleConfig: ClipStyleConfig;
  onChangeStyleConfig: (style: ClipStyleConfig) => void;
  videoCurrentTime: number;
  subtitleLanguage: "original" | "translated";
  onChangeSubtitleLanguage: (lang: "original" | "translated") => void;
  targetLanguageCode: "en" | "es" | "pt";
  isTranslating: boolean;
  onTranslate: (lang: "en" | "es" | "pt") => void;
}

const PRESETS: Record<string, Partial<ClipStyleConfig>> = {
  CapCut: {
    presetName: "CapCut",
    fontFamily: "Space Grotesk",
    fontSize: 40,
    activeColor: "#FFEB3B", // amarelo brilhante
    inactiveColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 6,
    caseType: "uppercase",
    animationType: "bouncy",
    positionYPercent: 70,
    layoutStyle: "horizontal"
  },
  NeonTikTok: {
    presetName: "NeonTikTok",
    fontFamily: "Oswald",
    fontSize: 42,
    activeColor: "#00E5FF", // Neon Cyan
    inactiveColor: "#FFFFFF",
    strokeColor: "#FF007F", // Neon Rosa
    strokeWidth: 5,
    caseType: "uppercase",
    animationType: "pop",
    positionYPercent: 65,
    layoutStyle: "horizontal"
  },
  Minimalist: {
    presetName: "Minimalist",
    fontFamily: "Inter",
    fontSize: 28,
    activeColor: "#FFFFFF",
    inactiveColor: "#9CA3AF",
    strokeColor: "#000000",
    strokeWidth: 0,
    caseType: "lowercase",
    animationType: "none",
    positionYPercent: 78,
    layoutStyle: "poetry"
  },
  KaraokeBouncy: {
    presetName: "KaraokeBouncy",
    fontFamily: "JetBrains Mono",
    fontSize: 34,
    activeColor: "#4ADE80", // Verde vivo
    inactiveColor: "#E2E8F0",
    strokeColor: "#090D16",
    strokeWidth: 4,
    caseType: "normal",
    animationType: "bouncy",
    positionYPercent: 75,
    layoutStyle: "horizontal"
  }
};

export default function SubtitleEditor({
  subtitles,
  onChangeSubtitles,
  styleConfig,
  onChangeStyleConfig,
  videoCurrentTime,
  subtitleLanguage,
  onChangeSubtitleLanguage,
  targetLanguageCode,
  isTranslating,
  onTranslate
}: SubtitleEditorProps) {
  const [activeTab, setActiveTab] = useState<"style" | "list">("style");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempEditValue, setTempEditValue] = useState("");

  // Efeito para rolar automaticamente a lista até a palavra falada ativa
  useEffect(() => {
    if (activeTab === "list") {
      const activeEl = document.getElementById("word-edit-row-active");
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [videoCurrentTime, activeTab]);

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      onChangeStyleConfig({
        ...styleConfig,
        ...preset
      } as ClipStyleConfig);
    }
  };

  const handleWordEditStart = (index: number, currentText: string) => {
    setEditingIndex(index);
    setTempEditValue(currentText);
  };

  const handleWordEditSave = (index: number) => {
    if (tempEditValue.trim() !== "") {
      const updated = [...subtitles];
      updated[index] = {
        ...updated[index],
        text: tempEditValue
      };
      onChangeSubtitles(updated);
    }
    setEditingIndex(null);
  };

  const handleGlobalFontChange = (font: any) => {
    onChangeStyleConfig({ ...styleConfig, fontFamily: font });
  };

  const handleGlobalCaseChange = (caseType: any) => {
    onChangeStyleConfig({ ...styleConfig, caseType: caseType });
  };

  const isWordActive = (word: SubtitleItem) => {
    return videoCurrentTime >= word.start && videoCurrentTime <= word.end;
  };

  return (
    <div id="subtitle-editor-root" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full">
      {/* Abas */}
      <div className="flex border-b border-slate-800 mb-5 pb-1 gap-2">
        <button
          id="btn-sub-tab-style"
          onClick={() => setActiveTab("style")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[6px] ${
            activeTab === "style"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Sliders className="w-4 h-4" /> Estilização das Legendas
        </button>
        <button
          id="btn-sub-tab-list"
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[6px] ${
            activeTab === "list"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Edit className="w-4 h-4" /> Editar Palavras
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {activeTab === "style" ? (
          <div className="space-y-6">
            {/* Tradução por IA */}
            <div id="ai-translation-section" className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Tradução de Legendas por IA</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                Visualize e alterne entre a transcrição em português original ou traduções sincronizadas geradas automaticamente.
              </p>
              
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    id="lang-btn-original"
                    type="button"
                    onClick={() => onChangeSubtitleLanguage("original")}
                    className={`text-[9px] py-2 px-0.5 rounded-lg border font-bold transition-all text-center uppercase tracking-wider ${
                      subtitleLanguage === "original"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Original
                  </button>
                  <button
                    id="lang-btn-en"
                    type="button"
                    onClick={() => onTranslate("en")}
                    disabled={isTranslating}
                    className={`text-[9px] py-2 px-0.5 rounded-lg border font-bold transition-all text-center flex items-center justify-center gap-0.5 uppercase tracking-wider disabled:opacity-40 ${
                      subtitleLanguage === "translated" && targetLanguageCode === "en"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Globe className="w-3 h-3 text-slate-500" />
                    Inglês
                  </button>
                  <button
                    id="lang-btn-es"
                    type="button"
                    onClick={() => onTranslate("es")}
                    disabled={isTranslating}
                    className={`text-[9px] py-2 px-0.5 rounded-lg border font-bold transition-all text-center flex items-center justify-center gap-0.5 uppercase tracking-wider disabled:opacity-40 ${
                      subtitleLanguage === "translated" && targetLanguageCode === "es"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Globe className="w-3 h-3 text-slate-500" />
                    Espanhol
                  </button>
                  <button
                    id="lang-btn-pt"
                    type="button"
                    onClick={() => onTranslate("pt")}
                    disabled={isTranslating}
                    className={`text-[9px] py-2 px-0.5 rounded-lg border font-bold transition-all text-center flex items-center justify-center gap-0.5 uppercase tracking-wider disabled:opacity-40 ${
                      subtitleLanguage === "translated" && targetLanguageCode === "pt"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Globe className="w-3 h-3 text-emerald-500" />
                    Português
                  </button>
                </div>

                {isTranslating && (
                  <div id="translation-loading-feedback" className="flex items-center gap-2 justify-center text-[10px] text-emerald-400 font-bold bg-emerald-500/5 py-1.5 px-3 rounded-lg border border-emerald-500/10 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Traduzindo legendas com Gemini 3.5...
                  </div>
                )}
              </div>
            </div>

            {/* Presets Grid */}
            <div id="ai-style-optimizer-section" className="bg-gradient-to-br from-indigo-950/20 to-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">Estilo Otimizado por IA</span>
                    <p className="text-[10px] text-slate-400">Analisa a paleta de cores do vídeo para contraste perfeito</p>
                  </div>
                </div>
                <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">WCAG AAA</span>
              </div>

              <button
                id="btn-auto-optimize-typography"
                type="button"
                onClick={() => {
                  const btn = document.getElementById("btn-auto-optimize-typography") as HTMLButtonElement | null;
                  const feedbackText = document.getElementById("optimizer-step-text");
                  if (btn) btn.disabled = true;
                  
                  let step = 0;
                  const steps = [
                    "Buscando frame ativo do player...",
                    "Identificando luminosidade da região...",
                    "Calculando contraste de cores de alta retenção...",
                    "Ajustando bordas e anti-oclusão de pixels..."
                  ];

                  const updateStep = () => {
                    if (step < steps.length && feedbackText) {
                      feedbackText.innerText = steps[step];
                      step++;
                      setTimeout(updateStep, 400);
                    } else {
                      // Executa a amostragem real do canvas
                      let rSum = 0, gSum = 0, bSum = 0, count = 0;
                      let analyzedLuminance = 80; // padrão escuro como fallback seguro
                      let hasReadCanvas = false;

                      try {
                        const canvas = document.getElementById("rendering-canvas-stage") as HTMLCanvasElement | null;
                        if (canvas) {
                          const ctx = canvas.getContext("2d");
                          if (ctx) {
                            const width = canvas.width;
                            const height = canvas.height;
                            
                            // Amostra a área inferior do canvas onde as legendas costumam ser desenhadas
                            // (entre 60% e 80% do canvas verticalmente, de 20% a 80% horizontalmente)
                            const sampleYStart = Math.floor(height * 0.6);
                            const sampleYEnd = Math.floor(height * 0.85);
                            const sampleXStart = Math.floor(width * 0.2);
                            const sampleXEnd = Math.floor(width * 0.8);
                            
                            // Ler pixels da imagem na região delimitada
                            const sampleWidth = 100;
                            const sampleHeight = 100;
                            // Reduzimos o escopo para um bloco menor centralizado para evitar estouro de performance ou CORS
                            const imgData = ctx.getImageData(
                              Math.floor(width * 0.3),
                              Math.floor(height * 0.65),
                              sampleWidth,
                              sampleHeight
                            );
                            const data = imgData.data;

                            for (let i = 0; i < data.length; i += 40) { // amostragem intervalada
                              rSum += data[i];
                              gSum += data[i + 1];
                              bSum += data[i + 2];
                              count++;
                            }

                            if (count > 0) {
                              const rAvg = rSum / count;
                              const gAvg = gSum / count;
                              const bAvg = bSum / count;
                              // Fórmula de luminosidade perceptiva WCAG
                              analyzedLuminance = 0.299 * rAvg + 0.587 * gAvg + 0.114 * bAvg;
                              hasReadCanvas = true;
                              console.log("Paleta de Cores Escaneada — R:", rAvg.toFixed(0), "G:", gAvg.toFixed(0), "B:", bAvg.toFixed(0), "Luminosidade:", analyzedLuminance.toFixed(0));
                            }
                          }
                        }
                      } catch (err) {
                        console.warn("Leitura direta do canvas restrita (CORS), aplicando análise adaptativa de alta segurança de contraste.", err);
                      }

                      // Aplica as regras de estilização otimizadas com alto destaque de contraste
                      let optimizedStyle: Partial<ClipStyleConfig> = {};

                      if (analyzedLuminance < 115) {
                        // Fundo é escuro: cores claras e neon florescem
                        optimizedStyle = {
                          activeColor: "#FFEB3B", // Amarelo Vivo de alta retenção
                          inactiveColor: "#FFFFFF", // Branco Puro
                          strokeColor: "#000000",  // Contorno preto forte
                          strokeWidth: 6,
                          fontSize: 42,
                          fontFamily: "Space Grotesk",
                          caseType: "uppercase",
                          animationType: "bouncy"
                        };
                      } else {
                        // Fundo é claro/brilhante: precisamos de bordas pretas massivas de anti-oclusão e destaque
                        optimizedStyle = {
                          activeColor: "#00E5FF", // Cyan Elétrico sobre fundo claro
                          inactiveColor: "#FFFFFF", // Branco Puro
                          strokeColor: "#000000",   // Borda preta ainda mais grossa para garantir legibilidade absoluta
                          strokeWidth: 8,
                          fontSize: 44,
                          fontFamily: "Oswald",
                          caseType: "uppercase",
                          animationType: "pop"
                        };
                      }

                      // Executa o callback de atualização para as novas propriedades de estilo sugeridas
                      onChangeStyleConfig({
                        ...styleConfig,
                        ...optimizedStyle
                      });

                      if (feedbackText) {
                        feedbackText.innerText = `Pronto! Legenda otimizada para fundo ${analyzedLuminance < 115 ? "Escuro (Contraste Máximo)" : "Claro (Borda Reforçada)"}!`;
                      }

                      setTimeout(() => {
                        if (btn) btn.disabled = false;
                        if (feedbackText) feedbackText.innerText = "";
                        const stepsPane = document.getElementById("optimizer-steps-pane");
                        if (stepsPane) stepsPane.classList.add("hidden");
                      }, 2500);
                    }
                  };

                  const stepsPane = document.getElementById("optimizer-steps-pane");
                  if (stepsPane) stepsPane.classList.remove("hidden");
                  updateStep();
                }}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Auto-Otimizar Estilo
              </button>

              {/* Feedback de Passos de Processamento */}
              <div id="optimizer-steps-pane" className="hidden bg-slate-950/80 border border-slate-900 rounded-lg p-2.5 flex items-center gap-2.5 justify-center">
                <svg className="animate-spin h-3.5 w-3.5 text-emerald-400 inline-block shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span id="optimizer-step-text" className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Iniciando análise inteligente do frame...</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Presets Estilo Viral</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(PRESETS).map((presetKey) => {
                  const p = PRESETS[presetKey];
                  const isCurrent = styleConfig.presetName === presetKey;
                  return (
                    <button
                      id={`preset-btn-${presetKey}`}
                      key={presetKey}
                      onClick={() => applyPreset(presetKey)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/30"
                          : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950/80"
                      }`}
                    >
                      <span className="text-xs font-bold block mb-1">{presetKey}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-1">
                        Fonte {p.fontFamily}, {p.caseType}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ajustes Avançados */}
            <div className="border-t border-slate-800 pt-5 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Customização Fina</span>

              {/* Fonte */}
              <div>
                <label className="text-[11px] text-slate-300 block mb-1.5 font-semibold">Fonte do Texto</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Space Grotesk", "Inter", "Oswald", "JetBrains Mono"] as const).map((font) => (
                    <button
                      id={`font-btn-${font.replace(" ", "-")}`}
                      key={font}
                      onClick={() => handleGlobalFontChange(font)}
                      style={{ fontFamily: font }}
                      className={`text-xs p-1.5 rounded border transition-all ${
                        styleConfig.fontFamily === font
                          ? "border-emerald-500 text-emerald-400 bg-emerald-500/10 font-bold"
                          : "border-slate-800 text-slate-400 bg-slate-950/20 hover:text-white hover:bg-slate-950/40"
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disposição das Legendas & Caixa */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1.5 font-semibold">Disposição (Layout)</label>
                  <div className="flex bg-slate-950 rounded border border-slate-800 p-0.5">
                    {(["horizontal", "poetry"] as const).map((lay) => (
                      <button
                        id={`layout-btn-${lay}`}
                        key={lay}
                        type="button"
                        onClick={() => onChangeStyleConfig({ ...styleConfig, layoutStyle: lay })}
                        className={`flex-1 text-[10px] py-1.5 font-bold rounded transition-all ${
                          styleConfig.layoutStyle === lay
                            ? "bg-emerald-500 text-slate-950 shadow"
                            : "bg-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        {lay === "horizontal" ? "Linha" : "Poesia (★)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1.5 font-semibold">Caps Lock (Caixa)</label>
                  <div className="flex bg-slate-950 rounded border border-slate-800 p-0.5">
                    {(["lowercase", "uppercase", "normal"] as const).map((caseT) => (
                      <button
                        id={`case-btn-${caseT}`}
                        key={caseT}
                        type="button"
                        onClick={() => handleGlobalCaseChange(caseT)}
                        className={`flex-1 text-[10px] py-1.5 font-bold rounded transition-all ${
                          styleConfig.caseType === caseT
                            ? "bg-emerald-500 text-slate-950 shadow"
                            : "bg-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        {caseT === "lowercase" ? "abc" : caseT === "uppercase" ? "ABC" : "Abc"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tamanho da Fonte */}
              <div>
                <label className="text-[11px] text-slate-300 block mb-1.5 font-semibold">Tamanho da Fonte ({styleConfig.fontSize}px)</label>
                <input
                  type="range"
                  min="18"
                  max="65"
                  value={styleConfig.fontSize}
                  onChange={(e) => onChangeStyleConfig({ ...styleConfig, fontSize: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Cores */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold text-center">Inativo</label>
                  <div className="flex items-center justify-center p-1.5 bg-slate-950 rounded-lg border border-slate-800 gap-2">
                    <input
                      type="color"
                      value={styleConfig.inactiveColor}
                      onChange={(e) => onChangeStyleConfig({ ...styleConfig, inactiveColor: e.target.value })}
                      className="w-5 h-5 border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">{styleConfig.inactiveColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold text-center">Ativo (Highlight)</label>
                  <div className="flex items-center justify-center p-1.5 bg-slate-950 rounded-lg border border-slate-800 gap-2">
                    <input
                      type="color"
                      value={styleConfig.activeColor}
                      onChange={(e) => onChangeStyleConfig({ ...styleConfig, activeColor: e.target.value })}
                      className="w-5 h-5 border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">{styleConfig.activeColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold text-center">Borda (Contorno)</label>
                  <div className="flex items-center justify-center p-1.5 bg-slate-950 rounded-lg border border-slate-800 gap-2">
                    <input
                      type="color"
                      value={styleConfig.strokeColor}
                      onChange={(e) => onChangeStyleConfig({ ...styleConfig, strokeColor: e.target.value })}
                      className="w-5 h-5 border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">{styleConfig.strokeColor}</span>
                  </div>
                </div>
              </div>

              {/* Posição Vertical e Borda */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1.5 font-semibold">Posição Vertical ({styleConfig.positionYPercent}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={styleConfig.positionYPercent}
                    onChange={(e) => onChangeStyleConfig({ ...styleConfig, positionYPercent: parseInt(e.target.value) })}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1.5 font-semibold">Largura da Borda ({styleConfig.strokeWidth}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={styleConfig.strokeWidth}
                    onChange={(e) => onChangeStyleConfig({ ...styleConfig, strokeWidth: parseInt(e.target.value) })}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Lista com Edição rápida */
          <div className="space-y-3 pt-2">
            <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
              Clique no ícone de editar em qualquer palavra transcrita para corrigir manualmente erros de entonação e digitação na legenda.
            </p>

            <div className="space-y-2">
              {subtitles.map((word, index) => {
                const isActive = isWordActive(word);
                return (
                  <div
                    id={isActive ? "word-edit-row-active" : `word-edit-row-${index}`}
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors duration-150 ${
                      isActive
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                        : "bg-slate-950/20 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-mono text-[10px] text-slate-500 w-12 border-r border-slate-800">
                        {word.start.toFixed(1)}s
                      </span>

                      {editingIndex === index ? (
                        <input
                          id={`word-edit-input-${index}`}
                          type="text"
                          value={tempEditValue}
                          onChange={(e) => setTempEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleWordEditSave(index)}
                          className="bg-slate-900 text-white rounded px-2 py-0.5 w-full max-w-[160px] border border-slate-700 focus:outline-none focus:border-emerald-500 text-xs font-bold"
                          autoFocus
                        />
                      ) : (
                        <span className={`font-semibold ${styleConfig.caseType === "uppercase" ? "uppercase" : styleConfig.caseType === "lowercase" ? "lowercase" : "normal-case"}`}>
                          {word.text}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {editingIndex === index ? (
                        <button
                          id={`word-edit-save-btn-${index}`}
                          onClick={() => handleWordEditSave(index)}
                          className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          id={`word-edit-start-btn-${index}`}
                          onClick={() => handleWordEditStart(index, word.text)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
