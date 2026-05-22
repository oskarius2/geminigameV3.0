/**
 * VOID PURSUIT — procedural stem layers until WAV assets ship.
 * Threat tier crossfades + boss theme overrides.
 */

import { getThreatTier, getThreatVisualConfig, type ThreatTier } from '../balance/threat';
import {
  connectToMusic,
  duckMusic,
  getAudioContext,
  isMusicMuted,
  resumeAudioContext,
} from './audioEngine';

export type BossMusicTheme =
  | 'mechanical_hunter'
  | 'red_predator'
  | 'void_whisper'
  | 'titan_strike'
  | 'reality_break';

const BOSS_THEME_BY_ID: Record<string, BossMusicTheme> = {
  salvage_hauler: 'mechanical_hunter',
  hive_regent: 'red_predator',
  void_cardinal: 'void_whisper',
  crimson_tyrant: 'red_predator',
  colossus: 'titan_strike',
  hive_queen: 'red_predator',
  wraith_lord: 'void_whisper',
};

const BPM_BY_TIER: Record<ThreatTier, number> = {
  calm: 100,
  pressure: 120,
  danger: 140,
  critical: 160,
};

const STEM_TARGETS: Record<ThreatTier, { pad: number; drums: number; bass: number; melody: number }> = {
  calm: { pad: 1, drums: 0, bass: 0.35, melody: 0.45 },
  pressure: { pad: 0.85, drums: 0.55, bass: 0.75, melody: 0.65 },
  danger: { pad: 0.65, drums: 0.9, bass: 1, melody: 0.9 },
  critical: { pad: 0.55, drums: 1, bass: 1, melody: 1 },
};

const STAGE_LAYER_GAIN: Record<number, number> = {
  1: 0.35,
  2: 0.5,
  3: 0.55,
  4: 0.65,
  5: 0.75,
};

type StemId = 'pad' | 'drums' | 'bass' | 'melody';

let running = false;
let masterMusicGain: GainNode | null = null;
const stemGains: Partial<Record<StemId, GainNode>> = {};
let padOscs: OscillatorNode[] = [];
let bassOsc: OscillatorNode | null = null;
let melodyOsc: OscillatorNode | null = null;
let drumTimer: ReturnType<typeof setInterval> | null = null;
let melodyTimer: ReturnType<typeof setInterval> | null = null;
let currentTier: ThreatTier = 'calm';
let currentBpm = 100;
let bossTheme: BossMusicTheme | null = null;
let stageLayerGain = 0.35;
let bossIntensity = 1;
let lastBossIntensitySample = -1;

function themeRootFreq(theme: BossMusicTheme | null): number {
  switch (theme) {
    case 'mechanical_hunter':
      return 55;
    case 'red_predator':
      return 49;
    case 'void_whisper':
      return 41.2;
    case 'titan_strike':
      return 36.7;
    case 'reality_break':
      return 65;
    default:
      return 55;
  }
}

function crossfadeStems(tier: ThreatTier, fadeSec = 2.5): void {
  const ac = getAudioContext();
  if (!ac) return;
  const targets = STEM_TARGETS[tier];
  (Object.keys(targets) as StemId[]).forEach((id) => {
    const g = stemGains[id];
    if (!g) return;
    const mult = bossTheme ? Math.min(1, targets[id] * 1.15) : targets[id];
    g.gain.setTargetAtTime(mult * bossIntensity, ac.currentTime, fadeSec / 3);
  });
}

function setBpm(bpm: number): void {
  currentBpm = bpm;
  if (drumTimer) clearInterval(drumTimer);
  if (melodyTimer) clearInterval(melodyTimer);
  const beatMs = (60 / bpm) * 1000;
  drumTimer = setInterval(() => tickDrums(), beatMs);
  melodyTimer = setInterval(() => tickMelody(), beatMs * 2);
}

function tickDrums(): void {
  const ac = getAudioContext();
  if (!ac || !stemGains.drums || stemGains.drums.gain.value < 0.05) return;
  const len = 0.04 + (bossTheme === 'titan_strike' ? 0.02 : 0);
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * len), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  g.gain.value = currentTier === 'critical' ? 0.2 : 0.12;
  const f = ac.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = bossTheme === 'void_whisper' ? 400 : 120;
  src.connect(f);
  f.connect(g);
  g.connect(stemGains.drums!);
  src.start();
  src.stop(ac.currentTime + len);
}

function tickMelody(): void {
  const ac = getAudioContext();
  if (!ac || !melodyOsc || !stemGains.melody) return;
  const g = stemGains.melody.gain.value;
  if (g < 0.08) return;
  const roots = [1, 1.25, 1.5, 1.25];
  const idx = Math.floor(Date.now() / 200) % roots.length;
  const root = themeRootFreq(bossTheme) * 2;
  melodyOsc.frequency.setTargetAtTime(root * roots[idx], ac.currentTime, 0.04);
}

function startStems(): void {
  const ac = getAudioContext();
  if (!ac) return;
  masterMusicGain = ac.createGain();
  masterMusicGain.gain.value = 0.85;
  connectToMusic(masterMusicGain, 1);

  (['pad', 'drums', 'bass', 'melody'] as StemId[]).forEach((id) => {
    const g = ac.createGain();
    g.gain.value = 0;
    g.connect(masterMusicGain!);
    stemGains[id] = g;
  });

  const root = themeRootFreq(null);
  padOscs = [root, root * 1.25, root * 1.5].map((freq, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = 0.04 / (i + 1);
    o.connect(g);
    g.connect(stemGains.pad!);
    o.start();
    return o;
  });

  bassOsc = ac.createOscillator();
  const bassG = ac.createGain();
  bassOsc.type = 'sawtooth';
  bassOsc.frequency.value = root * 0.5;
  bassG.gain.value = 0.03;
  bassOsc.connect(bassG);
  bassG.connect(stemGains.bass!);
  bassOsc.start();

  melodyOsc = ac.createOscillator();
  const melG = ac.createGain();
  melodyOsc.type = 'triangle';
  melodyOsc.frequency.value = root * 2;
  melG.gain.value = 0.025;
  melodyOsc.connect(melG);
  melG.connect(stemGains.melody!);
  melodyOsc.start();

  const lfo = ac.createOscillator();
  const lfoG = ac.createGain();
  lfo.frequency.value = 0.06;
  lfoG.gain.value = 6;
  lfo.connect(lfoG);
  if (padOscs[0]) lfoG.connect(padOscs[0].frequency);
  lfo.start();
}

export function mapBossIdToTheme(bossId: string | null, stage: number): BossMusicTheme | null {
  if (!bossId) return null;
  const mapped = BOSS_THEME_BY_ID[bossId];
  if (mapped) return mapped;
  if (stage >= 5) return 'reality_break';
  if (stage >= 4) return 'titan_strike';
  return 'mechanical_hunter';
}

export function startSurvivalMusic(): void {
  if (running || isMusicMuted()) return;
  resumeAudioContext();
  const ac = getAudioContext();
  if (!ac) return;
  running = true;
  startStems();
  setBpm(BPM_BY_TIER.calm);
  crossfadeStems('calm', 0.5);
}

export function stopSurvivalMusic(): void {
  running = false;
  lastBossIntensitySample = -1;
  if (drumTimer) clearInterval(drumTimer);
  if (melodyTimer) clearInterval(melodyTimer);
  drumTimer = null;
  melodyTimer = null;
  [...padOscs, bassOsc, melodyOsc].forEach((o) => {
    if (!o) return;
    try {
      o.stop();
    } catch {
      /* stopped */
    }
  });
  padOscs = [];
  bassOsc = null;
  melodyOsc = null;
  masterMusicGain = null;
}

export function setSurvivalThreatMusic(threatLevel: number, fadeSec = 2.5): void {
  if (!running) return;
  const tier = getThreatTier(threatLevel);
  if (tier === currentTier && !bossTheme) return;
  currentTier = tier;
  const visual = getThreatVisualConfig(tier);
  const bpm = Math.round(BPM_BY_TIER[tier] * (visual.musicTempo / 1));
  if (!bossTheme) setBpm(bpm);
  crossfadeStems(tier, fadeSec);
}

export function setSurvivalStageLayer(stage: number): void {
  stageLayerGain = STAGE_LAYER_GAIN[Math.min(5, Math.max(1, stage))] ?? 0.75;
  if (bassOsc) {
    const ac = getAudioContext();
    if (ac) {
      const detune = (stage - 1) * 15;
      bassOsc.detune.setTargetAtTime(detune, ac.currentTime, 1);
    }
  }
}

export function enterBossMusic(bossId: string, stage: number, healthRatio = 1): void {
  bossTheme = mapBossIdToTheme(bossId, stage);
  bossIntensity = 0.85 + (1 - healthRatio) * 0.25;
  lastBossIntensitySample = bossIntensity;
  const bpm =
    bossTheme === 'mechanical_hunter'
      ? 140
      : bossTheme === 'red_predator'
        ? 150
        : bossTheme === 'void_whisper'
          ? 130
          : bossTheme === 'titan_strike'
            ? 160
            : 140;
  setBpm(bpm);
  crossfadeStems('danger', 1.2);
  const ac = getAudioContext();
  if (ac && bassOsc) {
    bassOsc.frequency.setTargetAtTime(themeRootFreq(bossTheme), ac.currentTime, 0.8);
  }
}

export function updateBossMusicIntensity(healthRatio: number): void {
  if (!bossTheme) return;
  const ratio = Math.max(0, Math.min(1, healthRatio));
  const nextIntensity = 0.85 + (1 - ratio) * 0.35;
  const intensityChanged = Math.abs(nextIntensity - lastBossIntensitySample) > 0.04;
  bossIntensity = nextIntensity;
  const ac = getAudioContext();
  if (!ac) return;

  if (intensityChanged) {
    lastBossIntensitySample = nextIntensity;
    const extraBpm = Math.floor((1 - ratio) * 20);
    const targetBpm =
      (bossTheme === 'reality_break' ? 120 + extraBpm * 2 : currentBpm) + extraBpm;
    if (Math.abs(targetBpm - currentBpm) >= 4) {
      setBpm(targetBpm);
    }
    crossfadeStems(currentTier, 0.8);
  }
}

export function exitBossMusic(threatLevel: number): void {
  bossTheme = null;
  bossIntensity = 1;
  lastBossIntensitySample = -1;
  setSurvivalThreatMusic(threatLevel, 2.5);
}

export function dipMusicForStinger(durationMs = 400): void {
  duckMusic(0.15, 0.05);
  window.setTimeout(() => duckMusic(1, 0.4), durationMs);
}

export function playVictorySting(stage: number): void {
  const ac = getAudioContext();
  if (!ac || isMusicMuted()) return;
  const notes =
    stage >= 5
      ? [523, 659, 784, 1047]
      : stage >= 4
        ? [440, 554, 659, 880]
        : [392, 494, 587, 740];
  notes.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = stage >= 5 ? 'sawtooth' : 'triangle';
    o.frequency.value = f;
    const t = ac.currentTime + i * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g);
    connectToMusic(g, 1);
    o.start(t);
    o.stop(t + 0.4);
  });
}

export function playDefeatSting(): void {
  const ac = getAudioContext();
  if (!ac || isMusicMuted()) return;
  [220, 165, 110].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    const t = ac.currentTime + i * 0.25;
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g);
    connectToMusic(g, 1);
    o.start(t);
    o.stop(t + 0.55);
  });
}

export function isSurvivalMusicRunning(): boolean {
  return running;
}
