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

// Classic boom-bap tempos — stays in the 90s hip-hop pocket.
const BPM_BY_TIER: Record<ThreatTier, number> = {
  calm: 92,
  pressure: 98,
  danger: 106,
  critical: 114,
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

/** Master output before music bus — keeps procedural stems from clipping. */
const MUSIC_MASTER_GAIN = 0.09;
/** Stereo pad carriers (Hz): left warm, right air — avoids harsh 300–1000 Hz squares. */
const PAD_FREQ_LEFT = 100;
const PAD_FREQ_RIGHT = 200;
const BASS_CARRIER_HZ = 100;
const MELODY_CARRIER_HZ = 200;
const STEM_VOICE_GAIN = 0.04;

type StemId = 'pad' | 'drums' | 'bass' | 'melody';

let running = false;
let masterMusicGain: GainNode | null = null;
const stemGains: Partial<Record<StemId, GainNode>> = {};
let padOscs: OscillatorNode[] = [];
let bassOsc: OscillatorNode | null = null;
let melodyOsc: OscillatorNode | null = null;
let drumTimer: ReturnType<typeof setInterval> | null = null;
let hihatTimer: ReturnType<typeof setInterval> | null = null;
let melodyTimer: ReturnType<typeof setInterval> | null = null;
let currentTier: ThreatTier = 'calm';
let currentBpm = 92;
let stageBpmBase = 88;
let stageBpmMax = 120;
let bossTheme: BossMusicTheme | null = null;
let stageLayerGain = 0.35;
let bossIntensity = 1;
let lastBossIntensitySample = -1;
let lastThreatMusicSample = -1;
/** Beat position within a 4/4 bar (0 = downbeat). */
let drumBeat = 0;

/** Game threat scale (computeThreatLevel clamps to 0–100). */
export const THREAT_MUSIC_MAX = 100;

/** Min BPM delta before retuning drum/melody timers (was 3 → stutter; 20 matches tier steps). */
const THREAT_BPM_STEP_THRESHOLD = 20;

const THREAT_FREQ_MIN_HZ = 80;
const THREAT_FREQ_MAX_HZ = 240;
const THREAT_RAMP_SEC = 0.1;

/** Normalized threat 0–1 for audio mapping. */
export function threatToMusicRatio(threatLevel: number, maxThreat = THREAT_MUSIC_MAX): number {
  const clamped = Math.min(maxThreat, Math.max(0, threatLevel));
  return clamped / maxThreat;
}

/** Root frequency (Hz) for bass/pad — calm → intense. */
export function threatToRootFrequency(threatLevel: number): number {
  const ratio = threatToMusicRatio(threatLevel);
  return THREAT_FREQ_MIN_HZ + (THREAT_FREQ_MAX_HZ - THREAT_FREQ_MIN_HZ) * ratio;
}

function lerpStemTargets(ratio: number): Record<StemId, number> {
  const calm = STEM_TARGETS.calm;
  const critical = STEM_TARGETS.critical;
  return {
    pad: calm.pad + (critical.pad - calm.pad) * ratio,
    drums: calm.drums + (critical.drums - calm.drums) * ratio,
    bass: calm.bass + (critical.bass - calm.bass) * ratio,
    melody: calm.melody + (critical.melody - calm.melody) * ratio,
  };
}

function applyContinuousStemGains(ratio: number): void {
  const ac = getAudioContext();
  if (!ac) return;
  const targets = lerpStemTargets(ratio);
  (Object.keys(targets) as StemId[]).forEach((id) => {
    const g = stemGains[id];
    if (!g) return;
    const mult = bossTheme ? Math.min(1, targets[id] * 1.15) : targets[id];
    g.gain.setTargetAtTime(mult * bossIntensity, ac.currentTime, THREAT_RAMP_SEC);
  });
}

function applyThreatOscillatorFrequencies(rootHz: number): void {
  const ac = getAudioContext();
  if (!ac) return;
  const padRoot = rootHz;
  const padMults = [1, 1.25, 1.5];
  padOscs.forEach((o, i) => {
    if (!o) return;
    o.frequency.setTargetAtTime(padRoot * padMults[i], ac.currentTime, THREAT_RAMP_SEC);
  });
  if (bassOsc) {
    bassOsc.frequency.setTargetAtTime(rootHz * 0.5, ac.currentTime, THREAT_RAMP_SEC);
  }
  if (melodyOsc) {
    melodyOsc.frequency.setTargetAtTime(rootHz * 2, ac.currentTime, THREAT_RAMP_SEC);
  }
}

function applyThreatMasterGain(ratio: number): void {
  const ac = getAudioContext();
  if (!ac || !masterMusicGain) return;
  const base = 0.72 + stageLayerGain * 0.12;
  const target = base + 0.12 * ratio;
  masterMusicGain.gain.setTargetAtTime(target, ac.currentTime, THREAT_RAMP_SEC);
}

function createMusicCompressor(ac: AudioContext): DynamicsCompressorNode {
  const compressor = ac.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.ratio.value = 4;
  compressor.knee.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  return compressor;
}

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

function tickHiHat(): void {
  const ac = getAudioContext();
  if (!ac || !stemGains.drums) return;
  const drumsVol = stemGains.drums.gain.value;
  if (drumsVol < 0.03) return;
  // 8th-note hi-hats — every other 8th is slightly quieter (swing feel)
  const isWeakEighth = (Date.now() % 2) === 1;
  const gain = isWeakEighth ? 0.028 : 0.042;
  // Occasional open hat on weak 8ths in higher tiers
  if (isWeakEighth && (currentTier === 'danger' || currentTier === 'critical') && Math.random() > 0.7) {
    playOpenHiHat(ac, stemGains.drums!, gain * 0.9);
  } else {
    playClosedHiHat(ac, stemGains.drums!, gain);
  }
}

function setBpm(bpm: number): void {
  currentBpm = bpm;
  drumBeat = 0;
  if (drumTimer) clearInterval(drumTimer);
  if (hihatTimer) clearInterval(hihatTimer);
  if (melodyTimer) clearInterval(melodyTimer);
  const beatMs = (60 / bpm) * 1000;
  const eighthMs = beatMs * 0.5;
  drumTimer = setInterval(() => tickDrums(), beatMs);
  hihatTimer = setInterval(() => tickHiHat(), eighthMs);
  melodyTimer = setInterval(() => tickMelody(), beatMs * 2);
}

/** 808-style kick: sine with fast pitch drop, punchy attack. */
function play808Kick(ac: AudioContext, dest: GainNode, gain: number): void {
  const now = ac.currentTime;
  const startPitch = bossTheme === 'titan_strike' ? 180 : 150;
  const endPitch = bossTheme === 'void_whisper' ? 35 : 42;
  const decay = 0.45;

  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startPitch, now);
  osc.frequency.exponentialRampToValueAtTime(endPitch, now + decay);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.003);
  g.gain.exponentialRampToValueAtTime(0.001, now + decay);
  osc.connect(g);
  g.connect(dest);
  osc.start(now);
  osc.stop(now + decay + 0.02);
}

/** Boom-bap snare: layered noise + body tone, crisp attack. */
function playSnare(ac: AudioContext, dest: GainNode, gain: number): void {
  const now = ac.currentTime;
  const decay = 0.18;

  // Noise body
  const len = Math.floor(ac.sampleRate * decay);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.6;
  const noiseG = ac.createGain();
  noiseG.gain.value = gain * 0.75;
  src.connect(bp);
  bp.connect(noiseG);
  noiseG.connect(dest);
  src.start(now);
  src.stop(now + decay);

  // Snare body tone
  const toneOsc = ac.createOscillator();
  const toneG = ac.createGain();
  toneOsc.type = 'triangle';
  toneOsc.frequency.value = 185;
  toneG.gain.setValueAtTime(gain * 0.45, now);
  toneG.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  toneOsc.connect(toneG);
  toneG.connect(dest);
  toneOsc.start(now);
  toneOsc.stop(now + 0.08);
}

/** Closed hi-hat: very short highpass noise burst. */
function playClosedHiHat(ac: AudioContext, dest: GainNode, gain: number): void {
  const now = ac.currentTime;
  const len = Math.floor(ac.sampleRate * 0.032);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 9000;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(hp);
  hp.connect(g);
  g.connect(dest);
  src.start(now);
  src.stop(now + 0.04);
}

/** Open hi-hat: longer, slightly filtered. */
function playOpenHiHat(ac: AudioContext, dest: GainNode, gain: number): void {
  const now = ac.currentTime;
  const decay = 0.22;
  const len = Math.floor(ac.sampleRate * decay);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.9;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + decay);
  src.connect(hp);
  hp.connect(g);
  g.connect(dest);
  src.start(now);
  src.stop(now + decay);
}

/**
 * Boom-bap 4/4 sequencer:
 *   Beat 1 → 808 kick
 *   Beat 2 → snare
 *   Beat 3 → 808 kick (with occasional ghost)
 *   Beat 4 → snare
 * Called once per quarter-note by setInterval.
 */
function tickDrums(): void {
  const ac = getAudioContext();
  if (!ac || !stemGains.drums) return;
  const drumsVol = stemGains.drums.gain.value;
  if (drumsVol < 0.03) {
    drumBeat = (drumBeat + 1) % 4;
    return;
  }

  const beat = drumBeat % 4;
  const kickGain = (currentTier === 'critical' ? 0.11 : 0.085) * bossIntensity;
  const snareGain = (currentTier === 'critical' ? 0.095 : 0.07) * bossIntensity;

  if (beat === 0) {
    // Downbeat kick
    play808Kick(ac, stemGains.drums!, kickGain);
  } else if (beat === 1) {
    // Snare on 2
    playSnare(ac, stemGains.drums!, snareGain);
  } else if (beat === 2) {
    // Off-beat kick — sometimes doubled for pressure tiers
    play808Kick(ac, stemGains.drums!, kickGain * 0.85);
    if (currentTier === 'danger' || currentTier === 'critical') {
      // Ghost kick at +half-beat
      const beatMs = (60 / currentBpm) * 1000;
      window.setTimeout(() => {
        const ac2 = getAudioContext();
        if (ac2 && stemGains.drums) play808Kick(ac2, stemGains.drums, kickGain * 0.4);
      }, beatMs * 0.5);
    }
  } else {
    // Snare on 4
    playSnare(ac, stemGains.drums!, snareGain);
    // Open hat on final beat of bar for "breathing" feel
    if (Math.random() > 0.55) {
      playOpenHiHat(ac, stemGains.drums!, snareGain * 0.35);
    }
  }

  drumBeat = (drumBeat + 1) % 4;
}

function tickMelody(): void {
  const ac = getAudioContext();
  if (!ac || !melodyOsc || !stemGains.melody) return;
  const g = stemGains.melody.gain.value;
  if (g < 0.08) return;
  const ladder = [0.75, 0.875, 1, 0.875];
  const idx = Math.floor(Date.now() / 200) % ladder.length;
  const themeScale =
    bossTheme === 'void_whisper' ? 0.9 : bossTheme === 'titan_strike' ? 1.05 : 1;
  const freq = Math.min(MELODY_CARRIER_HZ, MELODY_CARRIER_HZ * ladder[idx] * themeScale);
  melodyOsc.frequency.setTargetAtTime(freq, ac.currentTime, 0.04);
}

function startStems(): void {
  const ac = getAudioContext();
  if (!ac) return;
  masterMusicGain = ac.createGain();
  masterMusicGain.gain.value = MUSIC_MASTER_GAIN;
  const compressor = createMusicCompressor(ac);
  masterMusicGain.connect(compressor);
  connectToMusic(compressor, 1);

  (['pad', 'drums', 'bass', 'melody'] as StemId[]).forEach((id) => {
    const g = ac.createGain();
    g.gain.value = 0;
    g.connect(masterMusicGain!);
    stemGains[id] = g;
  });

  const padSpec: { freq: number; pan: number; gain: number }[] = [
    { freq: PAD_FREQ_LEFT, pan: -0.35, gain: STEM_VOICE_GAIN },
    { freq: PAD_FREQ_RIGHT, pan: 0.35, gain: STEM_VOICE_GAIN * 0.85 },
  ];
  padOscs = padSpec.map(({ freq, pan, gain }) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = gain;
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    o.connect(g);
    g.connect(p);
    p.connect(stemGains.pad!);
    o.start();
    return o;
  });

  bassOsc = ac.createOscillator();
  const bassG = ac.createGain();
  bassOsc.type = 'sine';
  bassOsc.frequency.value = BASS_CARRIER_HZ;
  bassG.gain.value = STEM_VOICE_GAIN;
  const bassPan = ac.createStereoPanner();
  bassPan.pan.value = -0.2;
  bassOsc.connect(bassG);
  bassG.connect(bassPan);
  bassPan.connect(stemGains.bass!);
  bassOsc.start();

  melodyOsc = ac.createOscillator();
  const melG = ac.createGain();
  melodyOsc.type = 'sine';
  melodyOsc.frequency.value = MELODY_CARRIER_HZ * 0.875;
  melG.gain.value = STEM_VOICE_GAIN * 0.75;
  const melPan = ac.createStereoPanner();
  melPan.pan.value = 0.25;
  melodyOsc.connect(melG);
  melG.connect(melPan);
  melPan.connect(stemGains.melody!);
  melodyOsc.start();

  const lfo = ac.createOscillator();
  const lfoG = ac.createGain();
  lfo.frequency.value = 0.06;
  lfoG.gain.value = 3;
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
  lastThreatMusicSample = -1;
  startStems();
  setBpm(BPM_BY_TIER.calm);
  crossfadeStems('calm', 0.5);
}

/**
 * Smooth threat → frequency and stem mix; tempo steps only on threat tier change
 * (avoids clearing drum/melody intervals every frame). Call every frame during survival.
 */
function bpmForThreatTier(tier: ThreatTier): number {
  const step =
    tier === 'calm' ? 0 : tier === 'pressure' ? 0.33 : tier === 'danger' ? 0.66 : 1;
  return Math.round(stageBpmBase + (stageBpmMax - stageBpmBase) * step);
}

/** Stage difficulty curve — widens procedural music tempo range. */
export function setStageThreatBpmRange(base: number, max: number): void {
  stageBpmBase = base;
  stageBpmMax = max;
}

export function updateMusicThreat(threatLevel: number): void {
  if (!running || bossTheme) return;

  const tier = getThreatTier(threatLevel);
  if (tier !== currentTier) {
    currentTier = tier;
    const tierBpm = bpmForThreatTier(tier);
    if (Math.abs(tierBpm - currentBpm) >= THREAT_BPM_STEP_THRESHOLD) {
      setBpm(tierBpm);
    }
  }

  const ratio = threatToMusicRatio(threatLevel);
  if (Math.abs(ratio - lastThreatMusicSample) < 0.008) return;
  lastThreatMusicSample = ratio;

  const rootHz = threatToRootFrequency(threatLevel);
  applyThreatOscillatorFrequencies(rootHz);
  applyContinuousStemGains(ratio);
  applyThreatMasterGain(ratio);
}

export function stopSurvivalMusic(): void {
  running = false;
  lastBossIntensitySample = -1;
  lastThreatMusicSample = -1;
  drumBeat = 0;
  if (drumTimer) clearInterval(drumTimer);
  if (hihatTimer) clearInterval(hihatTimer);
  if (melodyTimer) clearInterval(melodyTimer);
  drumTimer = null;
  hihatTimer = null;
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
  lastThreatMusicSample = -1;
  updateMusicThreat(threatLevel);
  const tier = getThreatTier(threatLevel);
  currentTier = tier;
  if (!bossTheme) crossfadeStems(tier, fadeSec);
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
    const bassTarget =
      bossTheme === 'titan_strike'
        ? BASS_CARRIER_HZ * 1.05
        : bossTheme === 'void_whisper'
          ? BASS_CARRIER_HZ * 0.95
          : BASS_CARRIER_HZ;
    bassOsc.frequency.setTargetAtTime(bassTarget, ac.currentTime, 0.8);
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
      ? [196, 247, 294, 392]
      : stage >= 4
        ? [165, 208, 247, 330]
        : [147, 185, 220, 277];
  notes.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    const t = ac.currentTime + i * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.02);
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
  [110, 82.5, 55].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    const t = ac.currentTime + i * 0.25;
    g.gain.setValueAtTime(0.08, t);
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
