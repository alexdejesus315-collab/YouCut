/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubtitleItem {
  text: string;
  start: number; // in seconds
  end: number; // in seconds
  speaker?: string;
}

export interface PanningEvent {
  time: number; // in seconds
  offsetPercent: number; // -50 to 50
}

export interface ClipItem {
  title: string;
  start: number; // in seconds
  end: number; // in seconds
  viralScore: number; // 1 to 100
  justification: string;
  subtitles: SubtitleItem[];
  translatedSubtitles?: SubtitleItem[];
  panningEvents?: PanningEvent[];
  socialTitle?: string;
  socialCaption?: string;
}

export interface ClipStyleConfig {
  presetName: "CapCut" | "NeonTikTok" | "Minimalist" | "KaraokeBouncy";
  fontFamily: "Inter" | "Oswald" | "Space Grotesk" | "JetBrains Mono";
  fontSize: number; // size on local canvas scale, e.g. 36
  activeColor: string; // active text highlights
  inactiveColor: string;
  strokeColor: string;
  strokeWidth: number;
  caseType: "lowercase" | "uppercase" | "normal";
  positionYPercent: number; // 0 to 100, default is 70
  animationType: "none" | "bouncy" | "pop";
  layoutStyle: "horizontal" | "poetry";
}

export interface SatisfyingVideoConfig {
  enabled: boolean;
  type: "subway_surfers" | "soap_cutting" | "slime";
  splitRatio: number; // value between 0.2 and 0.6, default is 0.4 (40% of bottom screen)
}

export interface VideoMetadata {
  id: string;
  title: string;
  url: string; // sample source URL
  description: string;
  duration: number;
  transcript?: string;
}
