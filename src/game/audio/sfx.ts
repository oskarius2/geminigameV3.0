import { BuffRarity, type ShipId } from '../types';
import {
  getChannelUserVolume,
  isSfxMuted,
  loadAudioSettings,
  persistSfxMuted,
  persistSfxVolume,
  resumeAudioContext,
  setChannelMuted,
} from './audioEngine';
import { playGunshot, playNoiseBurst, playTone, playToneSequence } from './sfxPresets';

export type SfxEvent =
  | 'augment'
  | 'exclusive'
  | 'boss'
  | 'lowHp'
  | 'artifact'
  | 'hit'
  | 'playerHit'
  | 'crit'
  | 'shield'
  | 'shoot_a'
  | 'shoot_b'
  | 'shoot_c'
  | 'shoot_falcon'
  | 'shoot_sentinel'
  | 'shoot_swarm'
  | 'playerUltimate'
  | 'playerDeath'
  | 'levelUp'
  | 'cardFlip'
  | 'pickup'
  | 'gameOver'
  | 'switchWeapon'
  | 'enemySpawn'
  | 'enemyFire'
  | 'enemyHit'
  | 'enemyDeath'
  | 'enemyDeathHeavy'
  | 'companionTaunt'
  | 'companionSpeed'
  | 'companionHeal'
  | 'companionBurst'
  | 'companionUnlock'
  | 'companionLevelUp'
  | 'threatChange'
  | 'bossSpawn'
  | 'bossHit'
  | 'bossDeath'
  | 'bossPhase2'
  | 'bossTellCharge'
  | 'bossTellLaser'
  | 'bossTellSummon'
  | 'bossTellMelee'
  | 'miniBossSpawn'
  | 'miniBossTell'
  | 'miniBossHit'
  | 'miniBossExplosion'
  | 'miniBossDefeat'
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
  | 'rails_boss_defeat_void';

/** Relative loudness 0–1 before channel master (see AUDIO_SYSTEM.md). */
export const SFX_VOLUME: Partial<Record<SfxEvent, number>> = {
  bossSpawn: 1,
  bossDeath: 1,
  bossHit: 1,
  playerDeath: 1,
  playerUltimate: 0.9,
  miniBossSpawn: 0.9,
  miniBossDefeat: 0.95,
  bossPhase2: 0.95,
  companionTaunt: 0.85,
  companionSpeed: 0.7,
  companionHeal: 0.65,
  companionBurst: 0.75,
  companionUnlock: 0.9,
  artifact: 0.85,
  hit: 0.8,
  playerHit: 0.8,
  crit: 0.75,
  shoot_falcon: 0.7,
  shoot_sentinel: 0.7,
  shoot_swarm: 0.7,
  enemyDeath: 0.7,
  enemyDeathHeavy: 0.85,
  enemySpawn: 0.6,
  enemyFire: 0.5,
  enemyHit: 0.55,
  threatChange: 0.5,
  miniBossTell: 0.75,
  miniBossExplosion: 0.88,
  bossTellCharge: 0.8,
  bossTellLaser: 0.8,
  bossTellSummon: 0.8,
  bossTellMelee: 0.8,
};

export interface SfxPlayOptions {
  pan?: number;
  gainScale?: number;
  pitchMul?: number;
}

let shootPitchJitter = 1;

const SHIP_SHOOT_FREQ: Record<ShipId, number> = {
  interceptor: 320,
  gunship: 260,
  drone: 300,
};

export interface MainWeaponSfxOptions {
  pan?: number;
  gainScale?: number;
  pitchMul?: number;
  /** Base frequency Hz (200–400). */
  baseFreq?: number;
}

/** Player main weapon — bass boom with fast attack and smooth decay (no square beep). */
export function fireMainWeapon(options?: MainWeaponSfxOptions): void {
  if (isSfxMuted()) return;
  const scale = options?.gainScale ?? 1;
  const pm = options?.pitchMul ?? 1;
  const peak = Math.min(0.25, 0.2 * scale);
  playGunshot({
    freq: options?.baseFreq ?? 300,
    gain: peak,
    pan: options?.pan,
    pitchMul: pm,
    duration: 0.1,
  });
}

export function resumeAudio(): void {
  resumeAudioContext();
}

export function setSfxMuted(value: boolean): void {
  setChannelMuted('sfx', value);
  persistSfxMuted(value);
}

export function setSfxVolume(value: number): void {
  persistSfxVolume(value);
}

export function getSfxVolume(): number {
  loadAudioSettings();
  return getChannelUserVolume('sfx');
}

export function loadSfxMuted(): boolean {
  loadAudioSettings();
  return isSfxMuted();
}

export function playSfx(event: SfxEvent, options?: SfxPlayOptions): void {
  if (isSfxMuted()) return;
  const scale = (SFX_VOLUME[event] ?? 0.65) * (options?.gainScale ?? 1);
  const pan = options?.pan;
  const pm = options?.pitchMul ?? 1;

  const t = (freq: number, dur: number, type?: OscillatorType, gain?: number) =>
    playTone({ freq: freq * pm, duration: dur, type, gain: (gain ?? 0.08) * scale, pan });

  switch (event) {
    case 'shoot_falcon':
    case 'shoot_a':
      shootPitchJitter = 0.95 + Math.random() * 0.1;
      fireMainWeapon({ baseFreq: 320, gainScale: scale, pan, pitchMul: pm * shootPitchJitter });
      break;
    case 'shoot_sentinel':
    case 'shoot_b':
      fireMainWeapon({ baseFreq: 260, gainScale: scale, pan, pitchMul: pm });
      break;
    case 'shoot_swarm':
    case 'shoot_c':
      fireMainWeapon({ baseFreq: 300, gainScale: scale, pan, pitchMul: pm });
      break;
    case 'playerUltimate':
      t(120, 0.2, 'sawtooth', 0.1);
      playNoiseBurst(0.15, 0.08 * scale, pan, 120);
      setTimeout(() => t(55, 0.25, 'square', 0.12), 180);
      break;
    case 'playerHit':
    case 'hit':
      t(280 * pm, 0.06, 'square', 0.035);
      break;
    case 'playerDeath':
    case 'gameOver':
      playToneSequence(
        [
          { freq: 220, dur: 0.35, type: 'sawtooth', gain: 0.1 * scale },
          { freq: 165, dur: 0.45, type: 'sine', gain: 0.08 * scale, gap: 0.3 },
          { freq: 98, dur: 0.6, type: 'sine', gain: 0.07 * scale, gap: 0.35 },
        ],
        pan
      );
      break;
    case 'enemySpawn':
      t(880, 0.05, 'triangle', 0.04);
      setTimeout(() => playTone({ freq: 440, duration: 0.12, type: 'sine', gain: 0.03 * scale, pan }), 60);
      break;
    case 'enemyFire':
      t(640, 0.06, 'square', 0.025);
      break;
    case 'enemyHit':
      t(320, 0.05, 'square', 0.028);
      break;
    case 'enemyDeath':
      playNoiseBurst(0.12, 0.05 * scale, pan);
      setTimeout(() => t(660, 0.08, 'triangle', 0.04), 80);
      break;
    case 'enemyDeathHeavy':
      playNoiseBurst(0.25, 0.09 * scale, pan);
      setTimeout(() => t(110, 0.2, 'sawtooth', 0.08), 100);
      setTimeout(() => t(880, 0.1, 'triangle', 0.05), 200);
      break;
    case 'companionTaunt':
      t(55, 0.35, 'sawtooth', 0.1);
      playNoiseBurst(0.2, 0.06 * scale, -0.2);
      break;
    case 'companionSpeed':
      playTone({ freq: 440, freqEnd: 880, duration: 0.28, type: 'sine', gain: 0.06 * scale, pan });
      break;
    case 'companionHeal':
      t(660, 0.12, 'triangle', 0.05);
      setTimeout(() => t(880, 0.12, 'sine', 0.045), 140);
      break;
    case 'companionBurst':
      for (let i = 0; i < 5; i++) {
        setTimeout(() => t(420 + i * 40, 0.03, 'square', 0.03), i * 55);
      }
      break;
    case 'companionUnlock':
      playToneSequence(
        [
          { freq: 523, dur: 0.12, gain: 0.07 * scale },
          { freq: 659, dur: 0.12, gain: 0.07 * scale, gap: 0.1 },
          { freq: 784, dur: 0.18, gain: 0.08 * scale, gap: 0.1 },
        ],
        pan
      );
      break;
    case 'companionLevelUp':
      playToneSequence(
        [
          { freq: 440, dur: 0.08, gain: 0.05 * scale },
          { freq: 554, dur: 0.08, gain: 0.05 * scale, gap: 0.07 },
          { freq: 659, dur: 0.12, gain: 0.055 * scale, gap: 0.07 },
        ],
        pan
      );
      break;
    case 'threatChange':
      t(330 + Math.random() * 80, 0.15, 'sine', 0.03);
      break;
    case 'bossSpawn':
      t(110, 0.5, 'sawtooth', 0.12);
      setTimeout(() => t(880, 0.2, 'sawtooth', 0.1), 200);
      setTimeout(() => t(1320, 0.25, 'triangle', 0.08), 400);
      break;
    case 'bossTellCharge':
      playTone({ freq: 80, freqEnd: 160, duration: 1.2, type: 'sawtooth', gain: 0.07 * scale, pan });
      break;
    case 'bossTellLaser':
      playTone({ freq: 400, freqEnd: 1200, duration: 1, type: 'sine', gain: 0.06 * scale, pan });
      break;
    case 'bossTellSummon':
      t(220, 0.15, 'sine', 0.05);
      setTimeout(() => t(165, 0.2, 'triangle', 0.04), 150);
      setTimeout(() => t(330, 0.25, 'sine', 0.04), 300);
      break;
    case 'bossTellMelee':
      playNoiseBurst(0.08, 0.06 * scale, pan);
      setTimeout(() => t(1200, 0.05, 'square', 0.05), 40);
      break;
    case 'bossHit':
      playNoiseBurst(0.08, 0.1 * scale, pan);
      t(80, 0.15, 'square', 0.1);
      break;
    case 'bossPhase2':
      t(110, 0.3, 'sawtooth', 0.1);
      setTimeout(() => t(55, 0.4, 'square', 0.09), 120);
      break;
    case 'bossDeath':
      playNoiseBurst(0.4, 0.12 * scale);
      playToneSequence(
        [
          { freq: 110, dur: 0.3, type: 'sawtooth', gain: 0.1 * scale },
          { freq: 880, dur: 0.2, gain: 0.08 * scale, gap: 0.15 },
          { freq: 1320, dur: 0.35, gain: 0.07 * scale, gap: 0.12 },
        ],
        pan
      );
      break;
    case 'miniBossTell':
      playTone({ freq: 200, freqEnd: 600, duration: 1.1, type: 'sine', gain: 0.065 * scale, pan });
      break;
    case 'miniBossHit':
      t(90, 0.2, 'sawtooth', 0.09);
      playNoiseBurst(0.06, 0.04 * scale, pan);
      break;
    case 'miniBossExplosion':
      playNoiseBurst(0.22, 0.11 * scale, pan);
      t(70, 0.28, 'sawtooth', 0.1 * scale);
      setTimeout(() => t(140, 0.18, 'square', 0.07 * scale), 60);
      setTimeout(() => t(220, 0.12, 'triangle', 0.05 * scale), 120);
      break;
    case 'switchWeapon':
      t(600, 0.05, 'square', 0.03);
      setTimeout(() => t(900, 0.08, 'square', 0.03), 40);
      break;
    case 'exclusive':
      t(880, 0.12, 'sawtooth', 0.1 * scale);
      setTimeout(() => t(1320, 0.15, 'sawtooth', 0.09 * scale), 80);
      setTimeout(() => t(1760, 0.2, 'square', 0.07 * scale), 160);
      break;
    case 'augment':
      t(520, 0.08, 'triangle', 0.06 * scale);
      setTimeout(() => t(780, 0.1, 'triangle', 0.05 * scale), 60);
      break;
    case 'boss':
      t(110, 0.4, 'sawtooth', 0.12 * scale);
      break;
    case 'lowHp':
      t(200, 0.15, 'sine', 0.05 * scale);
      break;
    case 'artifact':
      playArtifactAcquireSfx(BuffRarity.RARE);
      break;
    case 'crit':
      t(520, 0.06, 'sawtooth', 0.06 * scale);
      setTimeout(() => t(780, 0.08, 'square', 0.05 * scale), 40);
      break;
    case 'shield':
      t(320, 0.08, 'sine', 0.05 * scale);
      setTimeout(() => t(480, 0.1, 'triangle', 0.04 * scale), 50);
      break;
    case 'levelUp':
      t(440, 0.1, 'triangle', 0.06 * scale);
      setTimeout(() => t(660, 0.12, 'triangle', 0.05 * scale), 80);
      setTimeout(() => t(880, 0.15, 'triangle', 0.05 * scale), 160);
      break;
    case 'cardFlip':
      t(300, 0.05, 'square', 0.03 * scale);
      setTimeout(() => t(400, 0.05, 'square', 0.025 * scale), 50);
      break;
    case 'pickup':
      t(600, 0.06, 'sine', 0.04 * scale);
      setTimeout(() => t(900, 0.08, 'sine', 0.03 * scale), 50);
      break;
    case 'miniBossSpawn':
      t(140, 0.35, 'sawtooth', 0.1 * scale);
      setTimeout(() => t(220, 0.25, 'triangle', 0.07 * scale), 120);
      setTimeout(() => t(330, 0.2, 'sine', 0.05 * scale), 220);
      break;
    case 'miniBossDefeat':
      t(660, 0.1, 'triangle', 0.08 * scale);
      setTimeout(() => t(880, 0.12, 'sawtooth', 0.07 * scale), 80);
      setTimeout(() => t(1100, 0.16, 'square', 0.06 * scale), 160);
      break;
    case 'rails_sentinel_stinger':
      t(880, 0.06, 'square', 0.07 * scale);
      setTimeout(() => t(1320, 0.08, 'sawtooth', 0.06 * scale), 50);
      setTimeout(() => t(1760, 0.12, 'triangle', 0.05 * scale), 120);
      break;
    case 'rails_iron_clang':
      t(90, 0.25, 'sawtooth', 0.14 * scale);
      setTimeout(() => t(55, 0.35, 'square', 0.1 * scale), 40);
      break;
    case 'rails_void_tear':
      t(220, 0.2, 'sine', 0.06 * scale);
      setTimeout(() => t(165, 0.35, 'triangle', 0.05 * scale), 100);
      break;
    case 'rails_death_ranged':
      t(520, 0.05, 'square', 0.04 * scale);
      break;
    case 'rails_death_dasher':
      t(380, 0.06, 'sawtooth', 0.05 * scale);
      break;
    case 'rails_death_zapper':
      t(720, 0.07, 'sine', 0.04 * scale);
      break;
    case 'rails_death_blocker':
      t(140, 0.12, 'sawtooth', 0.06 * scale);
      break;
    case 'rails_death_swarm':
      t(880, 0.04, 'square', 0.03 * scale);
      break;
    case 'rails_death_charger':
      t(110, 0.1, 'sawtooth', 0.07 * scale);
      break;
    case 'rails_weak_beep':
      t(1200, 0.05, 'square', 0.04 * scale);
      break;
    case 'rails_weak_ding':
      t(660, 0.08, 'triangle', 0.05 * scale);
      break;
    case 'rails_weak_tear':
      t(440, 0.1, 'sine', 0.04 * scale);
      break;
    case 'rails_boss_defeat_sentinel':
      t(880, 0.1, 'sawtooth', 0.08 * scale);
      setTimeout(() => t(1320, 0.15, 'square', 0.07 * scale), 100);
      break;
    case 'rails_boss_defeat_iron':
      t(80, 0.35, 'sawtooth', 0.12 * scale);
      break;
    case 'rails_boss_defeat_void':
      t(330, 0.2, 'sine', 0.05 * scale);
      setTimeout(() => t(165, 0.35, 'triangle', 0.04 * scale), 150);
      break;
    default:
      break;
  }
}

export function playArtifactAcquireSfx(rarity: BuffRarity): void {
  switch (rarity) {
    case BuffRarity.COMMON:
      playSfx('pickup', { gainScale: 1.1 });
      break;
    case BuffRarity.RARE:
      playTone({ freq: 550, duration: 0.1, type: 'triangle', gain: 0.07 });
      setTimeout(() => playTone({ freq: 720, duration: 0.12, type: 'triangle', gain: 0.06 }), 70);
      break;
    case BuffRarity.EPIC:
      playSfx('levelUp', { gainScale: 0.9 });
      break;
    case BuffRarity.LEGENDARY:
      playSfx('exclusive', { gainScale: 0.85 });
      break;
    case BuffRarity.EXCLUSIVE:
      playSfx('exclusive');
      break;
    default:
      playSfx('pickup');
      break;
  }
}

const SHIP_SHOOT: Record<ShipId, SfxEvent> = {
  interceptor: 'shoot_falcon',
  gunship: 'shoot_sentinel',
  drone: 'shoot_swarm',
};

export function playShipShootSfx(shipId: ShipId, screenX?: number, viewWidth?: number): void {
  const ev = SHIP_SHOOT[shipId] ?? 'shoot_falcon';
  shootPitchJitter = 0.95 + Math.random() * 0.1;
  let pan: number | undefined;
  if (screenX != null && viewWidth != null && viewWidth > 0) {
    pan = (screenX / viewWidth) * 2 - 1;
  }
  fireMainWeapon({
    baseFreq: SHIP_SHOOT_FREQ[shipId] ?? 300,
    pan,
    pitchMul: shootPitchJitter,
    gainScale: SFX_VOLUME[ev] ?? 0.7,
  });
}

export { loadAudioSettings };
