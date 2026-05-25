/**
 * Shared Web Audio busses: music / SFX / UI.
 * Procedural playback until WAV stems are wired (see AUDIO_SYSTEM.md).
 */

export type AudioChannel = 'music' | 'sfx' | 'ui';

const CHANNEL_MASTER: Record<AudioChannel, number> = {
  music: 0.8,
  sfx: 0.8,
  ui: 0.7,
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const channelGains: Partial<Record<AudioChannel, GainNode>> = {};
let musicMuted = false;
let sfxMuted = false;
let uiMuted = false;
let musicUserVol = 1;
let sfxUserVol = 1;
let uiUserVol = 1;
let duckFactor = 1;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function ensureMaster(): { ac: AudioContext; master: GainNode } | null {
  const ac = getAudioContext();
  if (!ac) return null;
  if (!masterGain) {
    masterGain = ac.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ac.destination);
    (['music', 'sfx', 'ui'] as AudioChannel[]).forEach((ch) => {
      const g = ac.createGain();
      g.gain.value = CHANNEL_MASTER[ch];
      g.connect(masterGain!);
      channelGains[ch] = g;
    });
  }
  return { ac, master: masterGain };
}

export function getChannelGain(channel: AudioChannel): GainNode | null {
  ensureMaster();
  return channelGains[channel] ?? null;
}

export function resumeAudioContext(): void {
  const ac = getAudioContext();
  if (ac?.state === 'suspended') void ac.resume();
}

export function isSfxMuted(): boolean {
  return sfxMuted;
}

export function isMusicMuted(): boolean {
  return musicMuted;
}

export function setChannelMuted(channel: AudioChannel, muted: boolean): void {
  if (channel === 'music') musicMuted = muted;
  else if (channel === 'sfx') sfxMuted = muted;
  else uiMuted = muted;
  applyChannelVolumes();
}

export function setChannelUserVolume(channel: AudioChannel, value: number): void {
  const v = Math.max(0, Math.min(1, value));
  if (channel === 'music') musicUserVol = v;
  else if (channel === 'sfx') sfxUserVol = v;
  else uiUserVol = v;
  applyChannelVolumes();
}

export function getChannelUserVolume(channel: AudioChannel): number {
  if (channel === 'music') return musicUserVol;
  if (channel === 'sfx') return sfxUserVol;
  return uiUserVol;
}

function channelUserVol(ch: AudioChannel): number {
  return ch === 'music' ? musicUserVol : ch === 'sfx' ? sfxUserVol : uiUserVol;
}

function channelMuted(ch: AudioChannel): boolean {
  return ch === 'music' ? musicMuted : ch === 'sfx' ? sfxMuted : uiMuted;
}

function applyChannelVolumes(): void {
  const bus = ensureMaster();
  if (!bus) return;
  const t = bus.ac.currentTime;
  (['music', 'sfx', 'ui'] as AudioChannel[]).forEach((ch) => {
    const g = channelGains[ch];
    if (!g) return;
    const base = CHANNEL_MASTER[ch] * channelUserVol(ch);
    const target =
      ch === 'music' ? (channelMuted(ch) ? 0 : base * duckFactor) : channelMuted(ch) ? 0 : base;
    g.gain.setTargetAtTime(target, t, 0.05);
  });
}

/** Immediate duck multiplier on music bus (0–1). */
export function duckMusic(factor: number, timeConstant = 0.08): void {
  duckFactor = Math.max(0, Math.min(1, factor));
  const bus = ensureMaster();
  const g = channelGains.music;
  if (!bus || !g || musicMuted) return;
  const target = CHANNEL_MASTER.music * musicUserVol * duckFactor;
  g.gain.setTargetAtTime(target, bus.ac.currentTime, timeConstant);
}

/** Timed duck: attack → hold → release to previous duckFactor. */
export function scheduleMusicDuck(
  factor: number,
  holdMs: number,
  attackSec = 0.06,
  releaseSec = 0.35
): void {
  if (!ensureMaster()) return;
  const prior = duckFactor;
  duckMusic(factor, attackSec);
  window.setTimeout(() => {
    duckFactor = prior;
    duckMusic(prior, releaseSec);
  }, holdMs);
}

/** Connect node to SFX bus with stereo pan (-1..1) and gain (0–1 relative). */
export function connectToSfx(
  node: AudioNode,
  opts?: { pan?: number; gain?: number }
): void {
  const bus = ensureMaster();
  const dest = channelGains.sfx;
  if (!bus || !dest || sfxMuted) return;
  const ac = bus.ac;
  const g = ac.createGain();
  g.gain.value = (opts?.gain ?? 1) * sfxUserVol;
  if (opts?.pan != null && Math.abs(opts.pan) > 0.02) {
    const p = ac.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, opts.pan));
    node.connect(p);
    p.connect(g);
  } else {
    node.connect(g);
  }
  g.connect(dest);
}

export function connectToMusic(node: AudioNode, gain = 1): void {
  const bus = ensureMaster();
  const dest = channelGains.music;
  if (!bus || !dest || musicMuted) {
    if (import.meta.env.DEV) {
      console.warn(
        '[audioEngine] connectToMusic() bailed — bus:', !!bus,
        '| dest:', !!dest,
        '| musicMuted:', musicMuted,
        '— oscillators will be disconnected from output!',
      );
    }
    return;
  }
  const g = bus.ac.createGain();
  g.gain.value = gain;
  node.connect(g);
  g.connect(dest);
}

export function loadAudioSettings(): void {
  try {
    musicMuted = localStorage.getItem('musicMuted') === '1';
    sfxMuted = localStorage.getItem('sfxMuted') === '1';
    const mv = localStorage.getItem('musicVolume');
    const sv = localStorage.getItem('sfxVolume');
    const uv = localStorage.getItem('uiVolume');
    if (mv != null) musicUserVol = Math.max(0, Math.min(1, parseFloat(mv)));
    if (sv != null) sfxUserVol = Math.max(0, Math.min(1, parseFloat(sv)));
    if (uv != null) uiUserVol = Math.max(0, Math.min(1, parseFloat(uv)));
  } catch {
    /* ignore */
  }
  applyChannelVolumes();
}

export function persistMusicMuted(muted: boolean): void {
  musicMuted = muted;
  try {
    localStorage.setItem('musicMuted', muted ? '1' : '0');
  } catch {
    /* ignore */
  }
  applyChannelVolumes();
}

export function persistSfxMuted(muted: boolean): void {
  sfxMuted = muted;
  try {
    localStorage.setItem('sfxMuted', muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function persistMusicVolume(v: number): void {
  setChannelUserVolume('music', v);
  try {
    localStorage.setItem('musicVolume', String(musicUserVol));
  } catch {
    /* ignore */
  }
}

export function persistSfxVolume(v: number): void {
  setChannelUserVolume('sfx', v);
  try {
    localStorage.setItem('sfxVolume', String(sfxUserVol));
  } catch {
    /* ignore */
  }
}
