/**
 * Generates audible placeholder audio (simple synthesis, no deps).
 * Run: node scripts/generate-audio.mjs
 * Overwrites silent placeholders with tonal WAV files.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RATE = 44100;
const PI2 = 2 * Math.PI;

// --- WAV builder ---
function wav(durationSec, gen) {
  const n = Math.floor(RATE * durationSec);
  const dataBytes = n * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);        // PCM
  buf.writeUInt16LE(1, 22);        // mono
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);        // block align
  buf.writeUInt16LE(16, 34);       // 16-bit
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < n; i++) {
    const s = gen(i / RATE, i, n);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2);
  }
  return buf;
}

// Helpers
const sin = (f, t) => Math.sin(PI2 * f * t);
const rnd = () => Math.random() * 2 - 1;
const loop = (t, dur) => t - Math.floor(t / dur) * dur;
const fade = (t, dur, ms = 0.04) =>
  Math.min(t / ms, 1) * Math.min((dur - t) / ms, 1);

// Sine chirp (linear freq sweep — proper phase accumulation)
function chirp(f0, f1, T, t) {
  const phase = PI2 * (f0 * t + ((f1 - f0) / (2 * T)) * t * t);
  return Math.sin(phase);
}

// --- SFX ---
const sfxFiles = {
  'ui/hihat-hover.wav': wav(0.055, (t) => {
    // Short high-freq transient (hat tick)
    return 0.35 * sin(7800, t) * Math.exp(-t * 130);
  }),

  'ui/mpc-click.wav': wav(0.09, (t) => {
    // Punchy MPC pad click: fast noise burst + low thump
    const click = rnd() * Math.exp(-t * 90);
    const thump = sin(160, t) * Math.exp(-t * 55);
    return 0.5 * click + 0.35 * thump;
  }),

  'ui/vinyl-scratch.wav': wav(0.18, (t) => {
    // Pitch sweep 2 kHz → 350 Hz
    return 0.45 * chirp(2000, 350, 0.18, t) * (0.25 + 0.75 * Math.exp(-t * 18));
  }),

  'ui/cassette-click.wav': wav(0.055, (t) => {
    // Clean mechanical transient
    return 0.5 * rnd() * Math.exp(-t * 110);
  }),

  'weapons/snare-punch-primary.wav': wav(0.22, (t) => {
    // Snare (noise) + bass punch (low sine)
    const snare = rnd() * Math.exp(-t * 28);
    const punch = sin(185, t) * Math.exp(-t * 14);
    return 0.5 * snare + 0.55 * punch;
  }),

  'weapons/heavy-bass-secondary.wav': wav(0.3, (t) => {
    // Sub bass hit
    const bass = sin(78, t) * Math.exp(-t * 9);
    const sub  = sin(39, t) * Math.exp(-t * 7);
    const body = rnd() * Math.exp(-t * 55) * 0.35;
    return 0.55 * bass + 0.3 * sub + 0.2 * body;
  }),

  'weapons/reload-mechanical.wav': wav(0.38, (t) => {
    // Two metallic clicks: t=0 and t=0.19
    const c1 = rnd() * Math.exp(-t * 160);
    const t2 = t - 0.19;
    const c2 = t2 > 0 ? rnd() * Math.exp(-t2 * 160) : 0;
    return 0.45 * c1 + 0.4 * c2;
  }),

  'weapons/empty-click.wav': wav(0.055, (t) => {
    // Dry empty-chamber click
    return 0.38 * rnd() * Math.exp(-t * 200);
  }),
};

// --- Music loops (simple additive synthesis) ---
// All music generates .wav so AudioManager can use them as primary source.
// Chord helpers
const amChord = [220, 261.6, 329.6]; // A3, C4, E4

function arpeggio(notes, bpm, t) {
  const noteDur = 60 / bpm / 2; // 8th notes
  const idx = Math.floor(t / noteDur) % notes.length;
  const noteT = t - Math.floor(t / noteDur) * noteDur;
  const env = Math.min(noteT / 0.008, 1) * Math.max(0, 1 - noteT / (noteDur * 0.85));
  return 0.22 * sin(notes[idx], t) * env;
}

function bassPulse(freq, bpm, t, decay = 14) {
  const beat = 60 / bpm;
  const beatT = t - Math.floor(t / beat) * beat;
  return 0.35 * sin(freq, t) * Math.exp(-beatT * decay);
}

const musicFiles = {
  // --- Menu: C major warm pad with slow tremolo (4s loop)
  'music/menu-boombap.wav': wav(4.0, (t) => {
    const lt = loop(t, 4.0);
    const lfo = 0.78 + 0.22 * sin(0.65, lt);
    const pad = (sin(261.6, lt) + sin(329.6, lt) + sin(392, lt) + 0.5 * sin(523.2, lt)) * 0.1;
    const bass = 0.12 * sin(65.4, lt) * (0.6 + 0.4 * sin(0.3, lt)); // C2
    return (pad + bass) * lfo * fade(t, 4.0);
  }),

  // --- Battle Stage 1: Am arp 120 bpm (2s loop)
  'music/battle-loop-stage1.wav': wav(2.0, (t) => {
    const lt = loop(t, 2.0);
    const notes = [220, 261.6, 329.6, 440]; // Am up
    const mel = arpeggio(notes, 120, lt);
    const bass = bassPulse(110, 120, lt);
    return (mel + bass) * fade(t, 2.0);
  }),

  // --- Battle Stage 3: Am arp 140 bpm + harmony (2s loop)
  'music/battle-loop-stage3.wav': wav(2.0, (t) => {
    const lt = loop(t, 2.0);
    const notes = [220, 261.6, 329.6, 440, 329.6, 261.6]; // Am up/down
    const mel = arpeggio(notes, 140, lt);
    const harm = 0.55 * arpeggio(notes.map((f) => f * 1.5), 140, lt);
    const bass = bassPulse(110, 140, lt, 16);
    return (mel + harm + bass) * fade(t, 2.0);
  }),

  // --- Battle Stage 5: Am arp 160 bpm + full layers (2s loop)
  'music/battle-loop-stage5.wav': wav(2.0, (t) => {
    const lt = loop(t, 2.0);
    const notes = [220, 329.6, 440, 329.6, 261.6, 392, 261.6, 220];
    const mel = arpeggio(notes, 160, lt);
    const harm5 = 0.5 * arpeggio(notes.map((f) => f * 1.5), 160, lt);
    const harm8 = 0.35 * arpeggio(notes.map((f) => f * 2), 160, lt);
    const rawBass = bassPulse(110, 160, lt, 20);
    // Soft-clip bass for crunch
    const bass = rawBass > 0.28 ? 0.28 + (rawBass - 0.28) * 0.15
      : rawBass < -0.28 ? -0.28 + (rawBass + 0.28) * 0.15
      : rawBass;
    return (mel + harm5 + harm8 + bass) * fade(t, 2.0);
  }),

  // --- Boss: ominous tritone drone (4s loop)
  'music/boss-theme.wav': wav(4.0, (t) => {
    const lt = loop(t, 4.0);
    const trem = 0.65 + 0.35 * sin(0.28, lt);
    const d1 = 0.22 * sin(41.2, lt);  // E1
    const d2 = 0.18 * sin(58.3, lt);  // Bb1 (tritone)
    const d3 = 0.12 * sin(82.4, lt);  // E2
    const sweep = 0.07 * sin(164.8, lt) * (0.4 + 0.6 * sin(0.17, lt));
    return (d1 + d2 + d3 + sweep) * trem * fade(t, 4.0);
  }),

  // --- Victory stab: C major arpeggio up + tail chord (1.5s)
  'music/victory-stab.wav': wav(1.5, (t) => {
    const notes = [261.6, 329.6, 392.0, 523.2]; // C4 E4 G4 C5
    const noteDur = 0.17;
    if (t < notes.length * noteDur) {
      const idx = Math.floor(t / noteDur);
      const nt = t - idx * noteDur;
      const env = Math.min(nt / 0.01, 1) * Math.max(0, 1 - nt / (noteDur * 0.9));
      return 0.32 * sin(notes[idx], t) * env;
    }
    // Tail: full chord fades out
    const chord = notes.reduce((s, f) => s + sin(f, t) * 0.08, 0);
    const tailEnv = Math.max(0, 1 - (t - notes.length * noteDur) / 0.65);
    return chord * tailEnv;
  }),
};

// --- Write all files ---
const audioRoot = join(root, 'public', 'audio');

for (const [relPath, buf] of Object.entries({ ...sfxFiles, ...musicFiles })) {
  const parts = relPath.split('/');
  mkdirSync(join(audioRoot, parts[0]), { recursive: true });
  const outPath = join(audioRoot, relPath);
  writeFileSync(outPath, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`  ✓ ${relPath} (${kb} kB)`);
}

console.log('\nDone. All audio files generated in public/audio/');
