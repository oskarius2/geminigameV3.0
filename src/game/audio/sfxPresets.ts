import {
  connectToSfx,
  getAudioContext,
  resumeAudioContext,
} from './audioEngine';

export interface ToneOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  pan?: number;
  /** Frequency glide to this value over duration. */
  freqEnd?: number;
  delayMs?: number;
}

export interface GunshotOpts {
  /** Base frequency Hz (200–400 for bass boom). */
  freq?: number;
  /** Peak gain before channel master (0.15–0.25). */
  gain?: number;
  pan?: number;
  /** Decay length in seconds. */
  duration?: number;
  pitchMul?: number;
}

/** Short bass gunshot: low triangle + attack/decay envelope (no square beep). */
export function playGunshot(opts: GunshotOpts = {}): void {
  resumeAudioContext();
  const ac = getAudioContext();
  if (!ac) return;

  const pm = opts.pitchMul ?? 1;
  const freq = (opts.freq ?? 300) * pm;
  const peak = Math.min(0.25, Math.max(0.001, opts.gain ?? 0.2));
  const decay = opts.duration ?? 0.1;
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.65), now + decay);

  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + decay);

  osc.connect(g);
  connectToSfx(g, { pan: opts.pan, gain: 1 });
  osc.start(now);
  osc.stop(now + decay + 0.03);
}

export function playTone(opts: ToneOpts): void {
  resumeAudioContext();
  const ac = getAudioContext();
  if (!ac) return;
  const startAt = ac.currentTime + (opts.delayMs ?? 0) / 1000;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = opts.type ?? 'square';
  osc.frequency.setValueAtTime(opts.freq, startAt);
  if (opts.freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, opts.freqEnd),
      startAt + opts.duration
    );
  }
  const peak = opts.gain ?? 0.08;
  g.gain.setValueAtTime(0.001, startAt);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.001), startAt + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, startAt + opts.duration);
  osc.connect(g);
  connectToSfx(g, { pan: opts.pan, gain: 1 });
  osc.start(startAt);
  osc.stop(startAt + opts.duration + 0.02);
}

export function playNoiseBurst(
  duration: number,
  gain = 0.06,
  pan?: number,
  delayMs = 0
): void {
  resumeAudioContext();
  const ac = getAudioContext();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  const g = ac.createGain();
  const startAt = ac.currentTime + delayMs / 1000;
  g.gain.setValueAtTime(gain, startAt);
  g.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  src.connect(filter);
  filter.connect(g);
  connectToSfx(g, { pan, gain: 1 });
  src.start(startAt);
  src.stop(startAt + duration);
}

export function playToneSequence(
  notes: Array<{ freq: number; dur: number; gap?: number; type?: OscillatorType; gain?: number }>,
  pan?: number
): void {
  let delay = 0;
  for (const n of notes) {
    playTone({
      freq: n.freq,
      duration: n.dur,
      type: n.type,
      gain: n.gain,
      pan,
      delayMs: delay,
    });
    delay += (n.gap ?? n.dur) * 1000;
  }
}

export interface KickOpts {
  /** Starting pitch Hz (default 150). */
  startHz?: number;
  /** Ending pitch Hz (default 42). */
  endHz?: number;
  /** Peak gain before channel master (default 0.18). */
  gain?: number;
  pan?: number;
  /** Decay length in seconds (default 0.42). */
  decay?: number;
}

/** 808-style bass drum: sine with fast pitch drop. */
export function play808Kick(opts: KickOpts = {}): void {
  resumeAudioContext();
  const ac = getAudioContext();
  if (!ac) return;
  const now = ac.currentTime;
  const startHz = opts.startHz ?? 150;
  const endHz = opts.endHz ?? 42;
  const peak = Math.min(0.35, opts.gain ?? 0.18);
  const decay = opts.decay ?? 0.42;

  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startHz, now);
  osc.frequency.exponentialRampToValueAtTime(endHz, now + decay);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + 0.003);
  g.gain.exponentialRampToValueAtTime(0.001, now + decay);
  osc.connect(g);
  connectToSfx(g, { pan: opts.pan, gain: 1 });
  osc.start(now);
  osc.stop(now + decay + 0.02);
}

export interface SnareOpts {
  gain?: number;
  pan?: number;
  /** Decay length in seconds (default 0.18). */
  decay?: number;
  /** Body tone Hz (default 185). */
  toneHz?: number;
}

/** Boom-bap snare: bandpass noise + body tone. */
export function playBoomBapSnare(opts: SnareOpts = {}): void {
  resumeAudioContext();
  const ac = getAudioContext();
  if (!ac) return;
  const now = ac.currentTime;
  const peak = Math.min(0.25, opts.gain ?? 0.14);
  const decay = opts.decay ?? 0.18;
  const toneHz = opts.toneHz ?? 185;

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
  noiseG.gain.value = peak * 0.75;
  src.connect(bp);
  bp.connect(noiseG);
  connectToSfx(noiseG, { pan: opts.pan, gain: 1 });
  src.start(now);
  src.stop(now + decay);

  const toneOsc = ac.createOscillator();
  const toneG = ac.createGain();
  toneOsc.type = 'triangle';
  toneOsc.frequency.value = toneHz;
  toneG.gain.setValueAtTime(peak * 0.5, now);
  toneG.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  toneOsc.connect(toneG);
  connectToSfx(toneG, { pan: opts.pan, gain: 1 });
  toneOsc.start(now);
  toneOsc.stop(now + 0.08);
}

export interface HiHatOpts {
  gain?: number;
  pan?: number;
  /** true = open (longer decay), false = closed (short tick). */
  open?: boolean;
}

/** Crisp hi-hat: highpass-filtered noise burst. */
export function playHiHat(opts: HiHatOpts = {}): void {
  resumeAudioContext();
  const ac = getAudioContext();
  if (!ac) return;
  const now = ac.currentTime;
  const peak = opts.gain ?? 0.07;
  const decay = opts.open ? 0.22 : 0.032;
  const hpFreq = opts.open ? 7000 : 9000;

  const len = Math.floor(ac.sampleRate * decay);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = hpFreq;
  const g = ac.createGain();
  g.gain.setValueAtTime(peak, now);
  if (opts.open) g.gain.exponentialRampToValueAtTime(0.001, now + decay);
  src.connect(hp);
  hp.connect(g);
  connectToSfx(g, { pan: opts.pan, gain: 1 });
  src.start(now);
  src.stop(now + decay + 0.01);
}

/** Vinyl crackle: sparse random pops at very low level. */
export function playVinylCrackle(pan?: number): void {
  resumeAudioContext();
  const ac = getAudioContext();
  if (!ac) return;
  const now = ac.currentTime;
  const popCount = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < popCount; i++) {
    const delay = Math.random() * 0.04;
    const len = Math.floor(ac.sampleRate * 0.003);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < len; j++) {
      data[j] = (Math.random() * 2 - 1) * (1 - j / len);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    g.gain.value = 0.012 + Math.random() * 0.018;
    src.connect(g);
    connectToSfx(g, { pan: pan ?? (Math.random() * 2 - 1) * 0.4, gain: 1 });
    src.start(now + delay);
    src.stop(now + delay + 0.005);
  }
}
