import { BuffRarity } from '../types';

let ctx: AudioContext | null = null;
let muted = false;
let sfxVolume = 0.7;

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (!ctx && typeof window !== 'undefined') {
    ctx = new AudioContext();
  }
  return ctx;
}

export function resumeAudio(): void {
  const ac = getCtx();
  if (ac?.state === 'suspended') void ac.resume();
}

export function setSfxMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem('sfxMuted', value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function setSfxVolume(value: number) {
  sfxVolume = Math.max(0, Math.min(1, value));
  try {
    localStorage.setItem('sfxVolume', String(sfxVolume));
  } catch {
    /* ignore */
  }
}

export function getSfxVolume(): number {
  return sfxVolume;
}

export function loadSfxMuted(): boolean {
  try {
    muted = localStorage.getItem('sfxMuted') === '1';
    const vol = localStorage.getItem('sfxVolume');
    if (vol != null) sfxVolume = Math.max(0, Math.min(1, parseFloat(vol)));
  } catch {
    muted = false;
  }
  return muted;
}

function tone(freq: number, duration: number, type: OscillatorType = 'square', gain = 0.08) {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const vol = gain * sfxVolume;
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

import { BuffRarity } from '../types';

export type SfxEvent =
  | 'augment'
  | 'exclusive'
  | 'boss'
  | 'lowHp'
  | 'artifact'
  | 'hit'
  | 'crit'
  | 'shield'
  | 'shoot_a'
  | 'shoot_b'
  | 'shoot_c'
  | 'levelUp'
  | 'cardFlip'
  | 'pickup'
  | 'gameOver'
  | 'switchWeapon'
  | 'rails_sentinel_stinger'
  | 'rails_iron_clang'
  | 'rails_void_tear'
  | 'rails_death_ranged'
  | 'rails_death_dasher'
  | 'rails_death_zapper'
  | 'rails_death_blocker'
  | 'rails_death_swarm'
  | 'rails_death_charger'
  | 'rails_weak_beep'
  | 'rails_weak_ding'
  | 'rails_weak_tear'
  | 'rails_boss_defeat_sentinel'
  | 'rails_boss_defeat_iron'
  | 'rails_boss_defeat_void'
  | 'miniBossSpawn'
  | 'miniBossDefeat';

export function playSfx(event: SfxEvent) {
  switch (event) {
    case 'switchWeapon':
      tone(600, 0.05, 'square', 0.03);
      setTimeout(() => tone(900, 0.08, 'square', 0.03), 40);
      break;
    case 'exclusive':
      tone(880, 0.12, 'sawtooth', 0.1);
      setTimeout(() => tone(1320, 0.15, 'sawtooth', 0.09), 80);
      setTimeout(() => tone(1760, 0.2, 'square', 0.07), 160);
      break;
    case 'augment':
      tone(520, 0.08, 'triangle', 0.06);
      setTimeout(() => tone(780, 0.1, 'triangle', 0.05), 60);
      break;
    case 'boss':
      tone(110, 0.4, 'sawtooth', 0.12);
      break;
    case 'lowHp':
      tone(200, 0.15, 'sine', 0.05);
      break;
    case 'artifact':
      playArtifactAcquireSfx(BuffRarity.RARE);
      break;
    case 'hit':
      tone(240, 0.04, 'square', 0.03);
      break;
    case 'crit':
      tone(520, 0.06, 'sawtooth', 0.06);
      setTimeout(() => tone(780, 0.08, 'square', 0.05), 40);
      break;
    case 'shield':
      tone(320, 0.08, 'sine', 0.05);
      setTimeout(() => tone(480, 0.1, 'triangle', 0.04), 50);
      break;
    case 'shoot_a':
      tone(420, 0.03, 'square', 0.025);
      break;
    case 'shoot_b':
      tone(180, 0.08, 'sawtooth', 0.04);
      break;
    case 'shoot_c':
      tone(120, 0.15, 'sawtooth', 0.06);
      setTimeout(() => tone(880, 0.2, 'sine', 0.04), 60);
      break;
    case 'levelUp':
      tone(440, 0.1, 'triangle', 0.06);
      setTimeout(() => tone(660, 0.12, 'triangle', 0.05), 80);
      setTimeout(() => tone(880, 0.15, 'triangle', 0.05), 160);
      break;
    case 'cardFlip':
      tone(300, 0.05, 'square', 0.03);
      setTimeout(() => tone(400, 0.05, 'square', 0.025), 50);
      break;
    case 'pickup':
      tone(600, 0.06, 'sine', 0.04);
      setTimeout(() => tone(900, 0.08, 'sine', 0.03), 50);
      break;
    case 'gameOver':
      tone(220, 0.3, 'sawtooth', 0.08);
      setTimeout(() => tone(165, 0.4, 'sine', 0.06), 200);
      break;
    case 'rails_sentinel_stinger':
      tone(880, 0.06, 'square', 0.07);
      setTimeout(() => tone(1320, 0.08, 'sawtooth', 0.06), 50);
      setTimeout(() => tone(1760, 0.12, 'triangle', 0.05), 120);
      break;
    case 'rails_iron_clang':
      tone(90, 0.25, 'sawtooth', 0.14);
      setTimeout(() => tone(55, 0.35, 'square', 0.1), 40);
      setTimeout(() => tone(120, 0.08, 'triangle', 0.05), 180);
      break;
    case 'rails_void_tear':
      tone(220, 0.2, 'sine', 0.06);
      setTimeout(() => tone(165, 0.35, 'triangle', 0.05), 100);
      setTimeout(() => tone(330, 0.15, 'sine', 0.04), 220);
      setTimeout(() => tone(110, 0.4, 'sawtooth', 0.05), 300);
      break;
    case 'rails_death_ranged':
      tone(520, 0.05, 'square', 0.04);
      setTimeout(() => tone(320, 0.08, 'triangle', 0.03), 40);
      break;
    case 'rails_death_dasher':
      tone(380, 0.06, 'sawtooth', 0.05);
      setTimeout(() => tone(180, 0.1, 'square', 0.04), 50);
      break;
    case 'rails_death_zapper':
      tone(720, 0.07, 'sine', 0.04);
      setTimeout(() => tone(960, 0.05, 'triangle', 0.03), 60);
      break;
    case 'rails_death_blocker':
      tone(140, 0.12, 'sawtooth', 0.06);
      setTimeout(() => tone(90, 0.15, 'square', 0.05), 80);
      break;
    case 'rails_death_swarm':
      tone(880, 0.04, 'square', 0.03);
      break;
    case 'rails_death_charger':
      tone(110, 0.1, 'sawtooth', 0.07);
      setTimeout(() => tone(220, 0.08, 'square', 0.05), 60);
      break;
    case 'rails_weak_beep':
      tone(1200, 0.05, 'square', 0.04);
      break;
    case 'rails_weak_ding':
      tone(660, 0.08, 'triangle', 0.05);
      setTimeout(() => tone(990, 0.06, 'sine', 0.04), 70);
      break;
    case 'rails_weak_tear':
      tone(440, 0.1, 'sine', 0.04);
      setTimeout(() => tone(220, 0.12, 'triangle', 0.03), 90);
      break;
    case 'rails_boss_defeat_sentinel':
      tone(880, 0.1, 'sawtooth', 0.08);
      setTimeout(() => tone(1320, 0.15, 'square', 0.07), 100);
      setTimeout(() => tone(1760, 0.2, 'triangle', 0.06), 200);
      break;
    case 'rails_boss_defeat_iron':
      tone(80, 0.35, 'sawtooth', 0.12);
      setTimeout(() => tone(55, 0.4, 'square', 0.1), 120);
      break;
    case 'rails_boss_defeat_void':
      tone(330, 0.2, 'sine', 0.05);
      setTimeout(() => tone(165, 0.35, 'triangle', 0.04), 150);
      setTimeout(() => tone(110, 0.45, 'sawtooth', 0.04), 300);
      break;
    case 'miniBossSpawn':
      tone(140, 0.35, 'sawtooth', 0.1);
      setTimeout(() => tone(220, 0.25, 'triangle', 0.07), 120);
      setTimeout(() => tone(330, 0.2, 'sine', 0.05), 220);
      break;
    case 'miniBossDefeat':
      tone(660, 0.1, 'triangle', 0.08);
      setTimeout(() => tone(880, 0.12, 'sawtooth', 0.07), 80);
      setTimeout(() => tone(1100, 0.16, 'square', 0.06), 160);
      break;
    default:
      break;
  }
}

/** Rarity-scaled acquire sting — common low, legendary high. */
export function playArtifactAcquireSfx(rarity: BuffRarity): void {
  switch (rarity) {
    case BuffRarity.COMMON:
      tone(440, 0.1, 'triangle', 0.06);
      break;
    case BuffRarity.RARE:
      tone(550, 0.1, 'triangle', 0.07);
      setTimeout(() => tone(720, 0.12, 'triangle', 0.06), 70);
      break;
    case BuffRarity.EPIC:
      tone(660, 0.1, 'sawtooth', 0.07);
      setTimeout(() => tone(880, 0.12, 'triangle', 0.065), 80);
      setTimeout(() => tone(1100, 0.14, 'sine', 0.05), 150);
      break;
    case BuffRarity.LEGENDARY:
      tone(880, 0.12, 'sawtooth', 0.09);
      setTimeout(() => tone(1320, 0.14, 'sawtooth', 0.08), 90);
      setTimeout(() => tone(1760, 0.18, 'square', 0.07), 170);
      break;
    case BuffRarity.EXCLUSIVE:
      tone(990, 0.12, 'sawtooth', 0.09);
      setTimeout(() => tone(1480, 0.15, 'square', 0.08), 80);
      setTimeout(() => tone(1980, 0.2, 'sawtooth', 0.07), 160);
      break;
    default:
      tone(520, 0.1, 'triangle', 0.06);
      break;
  }
}
