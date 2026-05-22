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
