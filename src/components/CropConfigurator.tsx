/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SatisfyingVideoConfig } from "../types";
import { Crop, Sparkles, Sliders, Smartphone, LayoutGrid, Gamepad2, Layers } from "lucide-react";

interface CropConfiguratorProps {
  isAiPanning: boolean;
  onToggleAiPanning: (enabled: boolean) => void;
  manualOffset: number;
  onManualOffsetChange: (offset: number) => void;
  satisfyingConfig: SatisfyingVideoConfig;
  onChangeSatisfyingConfig: (config: SatisfyingVideoConfig) => void;
}

export default function CropConfigurator({
  isAiPanning,
  onToggleAiPanning,
  manualOffset,
  onManualOffsetChange,
  satisfyingConfig,
  onChangeSatisfyingConfig
}: CropConfiguratorProps) {
  
  const handleSatisfyingToggle = (enabled: boolean) => {
    onChangeSatisfyingConfig({
      ...satisfyingConfig,
      enabled
    });
  };

  const handleSatisfyingTypeChange = (type: "subway_surfers" | "soap_cutting" | "slime") => {
    onChangeSatisfyingConfig({
      ...satisfyingConfig,
      type
    });
  };

  const handleSplitRatioChange = (ratio: number) => {
    onChangeSatisfyingConfig({
      ...satisfyingConfig,
      splitRatio: ratio
    });
  };

  return (
    <div id="crop-configurator-root" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full space-y-6">
      {/* Seção 1: Enquadramento Retrato 9:16 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Formato Retrato (9:16)</h3>
            <p className="text-[11px] text-slate-400">Para uso direto no TikTok, Shorts e Reels</p>
          </div>
        </div>

        <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 space-y-3.5">
          {/* Toggle IA Panning */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">AI Speaker Tracking</span>
              <span className="text-[10px] text-slate-500">Mover câmera automaticamente focando em quem fala</span>
            </div>
            <button
              id="btn-toggle-ai-panning"
              onClick={() => onToggleAiPanning(!isAiPanning)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                isAiPanning
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {isAiPanning ? "✓ Ativo (Auto)" : "Manual"}
            </button>
          </div>

          {/* Slider Manual se o AI Panning estiver desativado */}
          {!isAiPanning ? (
            <div className="space-y-1.5 pt-1.5 border-t border-slate-900">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-450 font-semibold">Enquadramento Manual Horizontal (Crop)</span>
                <span className="font-mono text-emerald-400 font-bold">{manualOffset > 0 ? `+${manualOffset}` : manualOffset}%</span>
              </div>
              <input
                id="manual-panning-slider"
                type="range"
                min="-50"
                max="50"
                value={manualOffset}
                onChange={(e) => onManualOffsetChange(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase">
                <span>Esquerda</span>
                <span>Centro</span>
                <span>Direita</span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/5 rounded-lg p-2.5 border border-emerald-500/10 text-[10px] text-emerald-400/90 leading-relaxed flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              A IA gerou eventos inteligentes de enquadramento ao longo da timeline do vídeo. O vídeo centralizará automaticamente no locutor ativo sem que você precise ajustar manualmente!
            </div>
          )}
        </div>
      </div>

      {/* Seção 2: Split Screen (Tela Dividida) */}
      <div className="border-t border-slate-800 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <LayoutGrid className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fundo Viral ASMR / Gameplay</h3>
            <p className="text-[11px] text-slate-400">Inserir gameplay split-screen para dobrar retenção</p>
          </div>
        </div>

        <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 space-y-4">
          {/* Ativar Satisfying Split Screen */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Modo Tela Dividida (Split)</span>
              <span className="text-[10px] text-slate-500">Combina o vídeo de fala com conteúdo magnético abajo</span>
            </div>
            <button
              id="btn-toggle-satisfying"
              onClick={() => handleSatisfyingToggle(!satisfyingConfig.enabled)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                satisfyingConfig.enabled
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {satisfyingConfig.enabled ? "Ativado" : "Desativado"}
            </button>
          </div>

          {satisfyingConfig.enabled && (
            <div className="space-y-4 pt-3 border-t border-slate-900">
              {/* Opções de Jogo */}
              <div>
                <label className="text-[11px] text-slate-450 block mb-2 font-semibold flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" /> Escolha o Gameplay
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["subway_surfers", "soap_cutting", "slime"] as const).map((type) => {
                    const labels = {
                      subway_surfers: "Subway 3D",
                      soap_cutting: "Cortar Sabão",
                      slime: "Fluido Slime"
                    };
                    const isCurrent = satisfyingConfig.type === type;
                    return (
                      <button
                        id={`btn-gameplay-${type}`}
                        key={type}
                        onClick={() => handleSatisfyingTypeChange(type)}
                        className={`text-[10px] py-2 px-1.5 font-bold rounded border transition-colors ${
                          isCurrent
                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                            : "border-slate-800 text-slate-400 bg-slate-950/20 hover:text-white"
                        }`}
                      >
                        {labels[type]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider Altura da Divisão */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-slate-450 font-semibold flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Altura do Split ({(satisfyingConfig.splitRatio * 100).toFixed(0)}%)
                  </span>
                </div>
                <input
                  id="split-ratio-slider"
                  type="range"
                  min="0.25"
                  max="0.55"
                  step="0.05"
                  value={satisfyingConfig.splitRatio}
                  onChange={(e) => handleSplitRatioChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
