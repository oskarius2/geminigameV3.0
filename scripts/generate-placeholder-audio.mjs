/**
 * Generates minimal silent placeholder audio for Howler preload paths.
 * Run: node scripts/generate-placeholder-audio.mjs
 */
import { execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const audioRoot = join(root, 'public', 'audio');

const dirs = ['music', 'ui', 'weapons'];
for (const d of dirs) {
  mkdirSync(join(audioRoot, d), { recursive: true });
}

function runFfmpeg(outPath, durationSec, ext) {
  const codec = ext === 'mp3' ? ['-codec:a', 'libmp3lame', '-q:a', '9'] : ['-codec:a', 'pcm_s16le'];
  const cmd = [
    'ffmpeg',
    '-y',
    '-f', 'lavfi',
    '-i', 'anullsrc=r=44100:cl=mono',
    '-t', String(durationSec),
    ...codec,
    `"${outPath}"`,
  ].join(' ');
  execSync(cmd, { stdio: 'inherit', shell: true });
}

const musicFiles = [
  'menu-boombap.mp3',
  'battle-loop-stage1.mp3',
  'battle-loop-stage3.mp3',
  'battle-loop-stage5.mp3',
  'boss-theme.mp3',
  'victory-stab.mp3',
];

const uiFiles = [
  'hihat-hover.wav',
  'mpc-click.wav',
  'vinyl-scratch.wav',
  'cassette-click.wav',
];

const weaponFiles = [
  'snare-punch-primary.wav',
  'heavy-bass-secondary.wav',
  'reload-mechanical.wav',
  'empty-click.wav',
];

console.log('Generating silent music (1s MP3)...');
for (const name of musicFiles) {
  const path = join(audioRoot, 'music', name);
  if (!existsSync(path) || process.argv.includes('--force')) {
    runFfmpeg(path, 1, 'mp3');
  } else {
    console.log(`  skip (exists): ${name}`);
  }
}

console.log('Generating silent UI SFX (0.1s WAV)...');
for (const name of uiFiles) {
  const path = join(audioRoot, 'ui', name);
  if (!existsSync(path) || process.argv.includes('--force')) {
    runFfmpeg(path, 0.1, 'wav');
  } else {
    console.log(`  skip (exists): ${name}`);
  }
}

console.log('Generating silent weapon SFX (0.1s WAV)...');
for (const name of weaponFiles) {
  const path = join(audioRoot, 'weapons', name);
  if (!existsSync(path) || process.argv.includes('--force')) {
    runFfmpeg(path, 0.1, 'wav');
  } else {
    console.log(`  skip (exists): ${name}`);
  }
}

console.log('Done. Placeholder audio is in public/audio/');
