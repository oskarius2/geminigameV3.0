import { EnemyType } from '../types';
import type { MiniBossId } from '../bosses/miniBossDefs';

/**
 * Scripted wave slice for survival stage progression.
 * Data-only — spawn loop integration lives in App.tsx / Logic.ts (future).
 *
 * @see src/game/docs/SURVIVAL_PROGRESSION_DESIGN.md
 * @see src/game/bossLifecycle.ts — similar pattern: pure lookup + snapshot helpers
 */

export interface WaveEnemySlot {
  type: EnemyType;
  count: number;
}

export interface WaveMiniBossSlot {
  id: MiniBossId | 'rotating';
  count?: number;
}

export interface WaveTemplate {
  stage: number;
  waveIndex: number;
  /** Seconds between individual spawns within this wave (~12% faster than baseline). */
  spawnDelay: number;
  enemies: WaveEnemySlot[];
  /** Optional mini-boss spawns (spawn before regular queue entries). */
  miniBosses?: WaveMiniBossSlot[];
  /** How long this wave stays active before the next wave index. */
  duration: number;
}

/** Stage 1 — AWAKENING: mixed intro from the first spawn (~2 min target). */
export const STAGE_1_WAVES: WaveTemplate[] = [
  {
    // Wave 0: immediate variety — melee + fast + swarm teaser so game feels alive
    stage: 1,
    waveIndex: 0,
    spawnDelay: 2.2,
    enemies: [
      { type: EnemyType.CHASER, count: 3 },
      { type: EnemyType.FAST, count: 2 },
      { type: EnemyType.SWARMER, count: 2 },
    ],
    duration: 35,
  },
  {
    // Wave 1: adds WRAITH as a speed/evasion teaser
    stage: 1,
    waveIndex: 1,
    spawnDelay: 1.28,
    enemies: [
      { type: EnemyType.CHASER, count: 3 },
      { type: EnemyType.FAST, count: 3 },
      { type: EnemyType.SWARMER, count: 3 },
      { type: EnemyType.WRAITH, count: 1 },
    ],
    duration: 30,
  },
  {
    // Wave 2: DASHER teaser + denser swarms to build intensity
    stage: 1,
    waveIndex: 2,
    spawnDelay: 1.0,
    enemies: [
      { type: EnemyType.CHASER, count: 4 },
      { type: EnemyType.FAST, count: 3 },
      { type: EnemyType.SWARMER, count: 3 },
      { type: EnemyType.DASHER, count: 1 },
    ],
    duration: 25,
  },
];

/** Stage 2 — PRESSURE: melee + ranged + speed mix (~3 min target). */
export const STAGE_2_WAVES: WaveTemplate[] = [
  {
    // Wave 0: 3-type mix from the start — no more 2-type monotony
    stage: 2,
    waveIndex: 0,
    spawnDelay: 1.38,
    enemies: [
      { type: EnemyType.CHASER, count: 4 },
      { type: EnemyType.RANGED, count: 3 },
      { type: EnemyType.FAST, count: 2 },
    ],
    duration: 35,
  },
  {
    // Wave 1: swarm pressure added alongside ranged threat
    stage: 2,
    waveIndex: 1,
    spawnDelay: 1.38,
    enemies: [
      { type: EnemyType.CHASER, count: 4 },
      { type: EnemyType.RANGED, count: 4 },
      { type: EnemyType.SWARMER, count: 3 },
    ],
    duration: 35,
  },
  {
    // Wave 2: DASHER adds burst threat alongside the mini-boss
    stage: 2,
    waveIndex: 2,
    spawnDelay: 1.24,
    miniBosses: [{ id: 'shockwave_sentinel', count: 1 }],
    enemies: [
      { type: EnemyType.CHASER, count: 3 },
      { type: EnemyType.RANGED, count: 3 },
      { type: EnemyType.DASHER, count: 2 },
      { type: EnemyType.FAST, count: 2 },
    ],
    duration: 35,
  },
  {
    // Wave 3: WRAITH introduced as fast melee + ZAPPER as ranged surprise
    stage: 2,
    waveIndex: 3,
    spawnDelay: 1.1,
    enemies: [
      { type: EnemyType.CHASER, count: 5 },
      { type: EnemyType.RANGED, count: 4 },
      { type: EnemyType.WRAITH, count: 2 },
      { type: EnemyType.ZAPPER, count: 2 },
    ],
    duration: 45,
  },
];

/** Stage 3 — VARIATION: TANK + SWARM + special preview (~3 min target). */
export const STAGE_3_WAVES: WaveTemplate[] = [
  {
    // Wave 0: TANK arrives immediately — 4-type variety
    stage: 3,
    waveIndex: 0,
    spawnDelay: 1.04,
    enemies: [
      { type: EnemyType.CHASER, count: 4 },
      { type: EnemyType.RANGED, count: 3 },
      { type: EnemyType.SWARMER, count: 4 },
      { type: EnemyType.TANK, count: 1 },
    ],
    duration: 35,
  },
  {
    // Wave 1: STRIKER teaser as burst melee threat alongside mini-boss
    stage: 3,
    waveIndex: 1,
    spawnDelay: 0.97,
    miniBosses: [{ id: 'eclipse_dasher', count: 1 }],
    enemies: [
      { type: EnemyType.CHASER, count: 3 },
      { type: EnemyType.RANGED, count: 3 },
      { type: EnemyType.TANK, count: 2 },
      { type: EnemyType.STRIKER, count: 1 },
    ],
    duration: 35,
  },
  {
    // Wave 2: speed wave — DASHER + SWARM_V2 + ZAPPER for multi-direction pressure
    stage: 3,
    waveIndex: 2,
    spawnDelay: 0.9,
    enemies: [
      { type: EnemyType.DASHER, count: 3 },
      { type: EnemyType.SWARM_V2, count: 6 },
      { type: EnemyType.ZAPPER, count: 2 },
      { type: EnemyType.RANGED, count: 3 },
    ],
    duration: 35,
  },
  {
    // Wave 3: 5-type showcase — PHANTOM introduced as unpredictable threat
    stage: 3,
    waveIndex: 3,
    spawnDelay: 0.83,
    miniBosses: [{ id: 'eclipse_dasher', count: 1 }],
    enemies: [
      { type: EnemyType.CHASER, count: 3 },
      { type: EnemyType.TANK, count: 2 },
      { type: EnemyType.SWARMER, count: 4 },
      { type: EnemyType.RANGED, count: 3 },
      { type: EnemyType.PHANTOM, count: 1 },
    ],
    duration: 35,
  },
];

/** Stage 4 — ESCALATION: adds ELITE + special threats (~4 min target). */
/** ~+20% enemy counts for late survival stages (launch balance pass). */
function scaleWaveCount(count: number): number {
  return Math.max(1, Math.round(count * 1.2));
}

export const STAGE_4_WAVES: WaveTemplate[] = [
  {
    // Wave 0: 4-type diversity — SHIELDED introduced as defensive enemy
    stage: 4,
    waveIndex: 0,
    spawnDelay: 1.04,
    enemies: [
      { type: EnemyType.CHASER, count: scaleWaveCount(3) },
      { type: EnemyType.RANGED, count: scaleWaveCount(3) },
      { type: EnemyType.ELITE, count: scaleWaveCount(2) },
      { type: EnemyType.SHIELDED, count: scaleWaveCount(2) },
    ],
    duration: 60,
  },
  {
    // Wave 1: tank cluster + swarm burst + TRACKER (persistent hunter threat)
    stage: 4,
    waveIndex: 1,
    spawnDelay: 0.97,
    miniBosses: [{ id: 'void_harbinger', count: 1 }],
    enemies: [
      { type: EnemyType.TANK, count: scaleWaveCount(2) },
      { type: EnemyType.SPLINTER, count: scaleWaveCount(2) },
      { type: EnemyType.SWARM_V2, count: scaleWaveCount(5) },
      { type: EnemyType.TRACKER, count: scaleWaveCount(1) },
    ],
    duration: 60,
  },
  {
    // Wave 2: REGENERATING added — forces sustained DPS; mixed ranged lineup
    stage: 4,
    waveIndex: 2,
    spawnDelay: 0.9,
    enemies: [
      { type: EnemyType.ELITE, count: scaleWaveCount(2) },
      { type: EnemyType.NOVA, count: scaleWaveCount(2) },
      { type: EnemyType.RANGED, count: scaleWaveCount(3) },
      { type: EnemyType.REGENERATING, count: scaleWaveCount(2) },
    ],
    duration: 60,
  },
  {
    // Wave 3: 5-type chaos — STRIKER high-damage melee + PHANTOM evasion
    stage: 4,
    waveIndex: 3,
    spawnDelay: 0.75,
    miniBosses: [{ id: 'void_harbinger', count: 1 }],
    enemies: [
      { type: EnemyType.DASHER, count: scaleWaveCount(3) },
      { type: EnemyType.ELITE, count: scaleWaveCount(2) },
      { type: EnemyType.WRAITH, count: scaleWaveCount(2) },
      { type: EnemyType.STRIKER, count: scaleWaveCount(2) },
      { type: EnemyType.SWARMER, count: scaleWaveCount(4) },
    ],
    duration: 60,
  },
];

/** Stage 5+ — ENDLESS CHAOS: full roster, cycles forever. */
export const STAGE_5_WAVES: WaveTemplate[] = [
  {
    // Wave 0: 4-type fast-lane opener — speed + ranged + tank surprise
    stage: 5,
    waveIndex: 0,
    spawnDelay: 0.68,
    enemies: [
      { type: EnemyType.FAST, count: scaleWaveCount(5) },
      { type: EnemyType.RANGED, count: scaleWaveCount(3) },
      { type: EnemyType.CHASER, count: scaleWaveCount(3) },
      { type: EnemyType.TANK, count: scaleWaveCount(1) },
    ],
    duration: 50,
  },
  {
    // Wave 1: elite + swarm pressure + PHANTOM + TRACKER alongside mini-boss
    stage: 5,
    waveIndex: 1,
    spawnDelay: 0.61,
    miniBosses: [{ id: 'rotating', count: 1 }],
    enemies: [
      { type: EnemyType.ELITE, count: scaleWaveCount(2) },
      { type: EnemyType.SWARM_V2, count: scaleWaveCount(5) },
      { type: EnemyType.ZAPPER, count: scaleWaveCount(2) },
      { type: EnemyType.PHANTOM, count: scaleWaveCount(1) },
    ],
    duration: 50,
  },
  {
    // Wave 2: high-speed + STRIKER burst + SHIELDED to break up the rush
    stage: 5,
    waveIndex: 2,
    spawnDelay: 0.58,
    enemies: [
      { type: EnemyType.SWARM_V2, count: scaleWaveCount(7) },
      { type: EnemyType.STRIKER, count: scaleWaveCount(2) },
      { type: EnemyType.SHIELDED, count: scaleWaveCount(2) },
      { type: EnemyType.DASHER, count: scaleWaveCount(2) },
    ],
    duration: 50,
  },
  {
    // Wave 3: sustain gauntlet — REGENERATING + FORTIFIED + hunter + AoE threat
    stage: 5,
    waveIndex: 3,
    spawnDelay: 0.54,
    miniBosses: [{ id: 'rotating', count: 1 }],
    enemies: [
      { type: EnemyType.TRACKER, count: scaleWaveCount(2) },
      { type: EnemyType.FORTIFIED, count: scaleWaveCount(2) },
      { type: EnemyType.NOVA, count: scaleWaveCount(2) },
      { type: EnemyType.REGENERATING, count: scaleWaveCount(2) },
    ],
    duration: 50,
  },
  {
    // Wave 4: tanky + sniper line + SPLINTER burst + WRAITH evasion chaos
    stage: 5,
    waveIndex: 4,
    spawnDelay: 0.51,
    enemies: [
      { type: EnemyType.SHIELDED, count: scaleWaveCount(2) },
      { type: EnemyType.SNIPER, count: scaleWaveCount(2) },
      { type: EnemyType.PHALANX, count: scaleWaveCount(2) },
      { type: EnemyType.SPLINTER, count: scaleWaveCount(2) },
      { type: EnemyType.WRAITH, count: scaleWaveCount(2) },
    ],
    duration: 50,
  },
];

const STAGE_WAVE_TABLE: Record<number, readonly WaveTemplate[]> = {
  1: STAGE_1_WAVES,
  2: STAGE_2_WAVES,
  3: STAGE_3_WAVES,
  4: STAGE_4_WAVES,
};

const ENDLESS_STAGE = 5;

/** Design targets: enemies spawned per wave (min–max) by stage. */
export const STAGE_WAVE_ENEMY_TARGETS: Record<number, { min: number; max: number }> = {
  1: { min: 4, max: 8 },
  2: { min: 8, max: 14 },
  3: { min: 12, max: 20 },
  4: { min: 16, max: 26 },
  5: { min: 20, max: 35 },
};

/** Smooth enemy count scaling per survival stage. */
export function scaleWaveEnemyCount(stage: number, count: number): number {
  const mult =
    stage <= 1
      ? 1.0
      : stage === 2
        ? 1.15
        : stage === 3
          ? 1.3
          : stage === 4
            ? 1.5
            : Math.min(2.0, 1.5 + (stage - 4) * 0.1);
  return Math.max(1, Math.round(count * mult));
}

/** Faster spawn cadence in later stages (multiplier on spawnDelay). */
export function getStageSpawnDelayScale(stage: number): number {
  if (stage <= 1) return 0.95;
  if (stage === 2) return 0.85;
  if (stage === 3) return 0.75;
  if (stage === 4) return 0.65;
  return Math.max(0.55, 0.65 - (stage - 4) * 0.02);
}

function applyWaveScaling(wave: WaveTemplate): WaveTemplate {
  return {
    ...wave,
    spawnDelay: Math.max(0.3, wave.spawnDelay * getStageSpawnDelayScale(wave.stage)),
    enemies: wave.enemies.map((slot) => ({
      ...slot,
      count: scaleWaveEnemyCount(wave.stage, slot.count),
    })),
  };
}

export function getWaveEnemyTotal(wave: WaveTemplate): number {
  return wave.enemies.reduce((sum, slot) => sum + slot.count, 0);
}

export function getWavesForStage(stage: number): readonly WaveTemplate[] {
  if (stage >= ENDLESS_STAGE) return STAGE_5_WAVES;
  return STAGE_WAVE_TABLE[stage] ?? STAGE_5_WAVES;
}

/** Total scripted wave time for stages 1–4 (seconds). Stage 5+ is unbounded. */
export function getStageWaveDuration(stage: number): number {
  const waves = getWavesForStage(stage);
  return waves.reduce((sum, wave) => sum + wave.duration, 0);
}

function resolveWaveAtTime(
  waves: readonly WaveTemplate[],
  stage: number,
  timeInStage: number
): WaveTemplate | null {
  if (waves.length === 0 || timeInStage < 0) return null;

  let elapsed = 0;
  for (const wave of waves) {
    const windowEnd = elapsed + wave.duration;
    if (timeInStage < windowEnd) {
      return applyWaveScaling({ ...wave, stage });
    }
    elapsed = windowEnd;
  }

  return applyWaveScaling({ ...waves[waves.length - 1], stage });
}

/**
 * Returns the active wave template for a survival stage at a given time offset.
 *
 * @param stage - Current survival stage (1 = AWAKENING, 5+ loops ENDLESS CHAOS)
 * @param timeInStage - Seconds elapsed since entering this stage
 */
export function getWaveForStage(stage: number, timeInStage: number): WaveTemplate | null {
  if (stage < 1) return null;

  const waves = getWavesForStage(stage);

  if (stage >= ENDLESS_STAGE) {
    const cycleDuration = getStageWaveDuration(stage);
    if (cycleDuration <= 0) return null;
    const loopTime = timeInStage % cycleDuration;
    return resolveWaveAtTime(waves, stage, loopTime);
  }

  return resolveWaveAtTime(waves, stage, timeInStage);
}

/** Lightweight snapshot for dev HUD / future spawn controller (mirrors bossLifecycle pattern). */
export interface WaveCompositionSnapshot {
  stage: number;
  timeInStage: number;
  waveIndex: number | null;
  spawnDelay: number | null;
  totalEnemiesInWave: number;
  waveDuration: number | null;
}

export function getWaveCompositionSnapshot(
  stage: number,
  timeInStage: number
): WaveCompositionSnapshot {
  const wave = getWaveForStage(stage, timeInStage);
  const totalEnemiesInWave = wave
    ? wave.enemies.reduce((sum, slot) => sum + slot.count, 0)
    : 0;

  return {
    stage,
    timeInStage,
    waveIndex: wave?.waveIndex ?? null,
    spawnDelay: wave?.spawnDelay ?? null,
    totalEnemiesInWave,
    waveDuration: wave?.duration ?? null,
  };
}
