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

/** Stage 1 — AWAKENING: calm intro, CHASER only (~2 min target). */
export const STAGE_1_WAVES: WaveTemplate[] = [
  {
    stage: 1,
    waveIndex: 0,
    spawnDelay: 2.46,
    enemies: [{ type: EnemyType.CHASER, count: 4 }],
    duration: 35,
  },
  {
    stage: 1,
    waveIndex: 1,
    spawnDelay: 1.32,
    enemies: [
      { type: EnemyType.CHASER, count: 4 },
      { type: EnemyType.FAST, count: 3 },
      { type: EnemyType.SWARMER, count: 2 },
    ],
    duration: 30,
  },
  {
    stage: 1,
    waveIndex: 2,
    spawnDelay: 1.06,
    enemies: [
      { type: EnemyType.CHASER, count: 5 },
      { type: EnemyType.FAST, count: 3 },
      { type: EnemyType.SWARMER, count: 3 },
    ],
    duration: 25,
  },
];

/** Stage 2 — PRESSURE: CHASER + RANGED (~3 min target). */
export const STAGE_2_WAVES: WaveTemplate[] = [
  {
    stage: 2,
    waveIndex: 0,
    spawnDelay: 1.41,
    enemies: [
      { type: EnemyType.CHASER, count: 5 },
      { type: EnemyType.RANGED, count: 3 },
    ],
    duration: 35,
  },
  {
    stage: 2,
    waveIndex: 1,
    spawnDelay: 1.41,
    enemies: [
      { type: EnemyType.CHASER, count: 6 },
      { type: EnemyType.RANGED, count: 4 },
    ],
    duration: 35,
  },
  {
    stage: 2,
    waveIndex: 2,
    spawnDelay: 1.27,
    miniBosses: [{ id: 'shockwave_sentinel', count: 1 }],
    enemies: [
      { type: EnemyType.CHASER, count: 4 },
      { type: EnemyType.RANGED, count: 4 },
    ],
    duration: 35,
  },
  {
    stage: 2,
    waveIndex: 3,
    spawnDelay: 1.13,
    enemies: [
      { type: EnemyType.CHASER, count: 7 },
      { type: EnemyType.RANGED, count: 6 },
    ],
    duration: 45,
  },
];

/** Stage 3 — VARIATION: adds TANK + SWARM (~3 min target). */
export const STAGE_3_WAVES: WaveTemplate[] = [
  {
    stage: 3,
    waveIndex: 0,
    spawnDelay: 1.06,
    enemies: [
      { type: EnemyType.CHASER, count: 5 },
      { type: EnemyType.RANGED, count: 4 },
      { type: EnemyType.SWARMER, count: 6 },
    ],
    duration: 35,
  },
  {
    stage: 3,
    waveIndex: 1,
    spawnDelay: 0.99,
    miniBosses: [{ id: 'eclipse_dasher', count: 1 }],
    enemies: [
      { type: EnemyType.CHASER, count: 3 },
      { type: EnemyType.RANGED, count: 3 },
      { type: EnemyType.TANK, count: 2 },
    ],
    duration: 35,
  },
  {
    stage: 3,
    waveIndex: 2,
    spawnDelay: 0.92,
    enemies: [
      { type: EnemyType.DASHER, count: 4 },
      { type: EnemyType.RANGED, count: 4 },
      { type: EnemyType.SWARM_V2, count: 8 },
    ],
    duration: 35,
  },
  {
    stage: 3,
    waveIndex: 3,
    spawnDelay: 0.85,
    miniBosses: [{ id: 'eclipse_dasher', count: 1 }],
    enemies: [
      { type: EnemyType.CHASER, count: 4 },
      { type: EnemyType.TANK, count: 2 },
      { type: EnemyType.SWARMER, count: 6 },
      { type: EnemyType.RANGED, count: 4 },
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
    stage: 4,
    waveIndex: 0,
    spawnDelay: 1.06,
    enemies: [
      { type: EnemyType.CHASER, count: scaleWaveCount(4) },
      { type: EnemyType.RANGED, count: scaleWaveCount(4) },
      { type: EnemyType.ELITE, count: scaleWaveCount(2) },
    ],
    duration: 60,
  },
  {
    stage: 4,
    waveIndex: 1,
    spawnDelay: 0.99,
    miniBosses: [{ id: 'void_harbinger', count: 1 }],
    enemies: [
      { type: EnemyType.TANK, count: scaleWaveCount(2) },
      { type: EnemyType.SPLINTER, count: scaleWaveCount(2) },
      { type: EnemyType.SWARM_V2, count: scaleWaveCount(6) },
    ],
    duration: 60,
  },
  {
    stage: 4,
    waveIndex: 2,
    spawnDelay: 0.92,
    enemies: [
      { type: EnemyType.ELITE, count: scaleWaveCount(3) },
      { type: EnemyType.NOVA, count: scaleWaveCount(2) },
      { type: EnemyType.RANGED, count: scaleWaveCount(4) },
    ],
    duration: 60,
  },
  {
    stage: 4,
    waveIndex: 3,
    spawnDelay: 0.77,
    miniBosses: [{ id: 'void_harbinger', count: 1 }],
    enemies: [
      { type: EnemyType.DASHER, count: scaleWaveCount(3) },
      { type: EnemyType.ELITE, count: scaleWaveCount(2) },
      { type: EnemyType.WRAITH, count: scaleWaveCount(2) },
      { type: EnemyType.SWARMER, count: scaleWaveCount(5) },
    ],
    duration: 60,
  },
];

/** Stage 5+ — ENDLESS CHAOS: full roster, cycles forever. */
export const STAGE_5_WAVES: WaveTemplate[] = [
  {
    stage: 5,
    waveIndex: 0,
    spawnDelay: 0.7,
    enemies: [
      { type: EnemyType.FAST, count: scaleWaveCount(6) },
      { type: EnemyType.RANGED, count: scaleWaveCount(4) },
      { type: EnemyType.CHASER, count: scaleWaveCount(4) },
    ],
    duration: 50,
  },
  {
    stage: 5,
    waveIndex: 1,
    spawnDelay: 0.63,
    miniBosses: [{ id: 'rotating', count: 1 }],
    enemies: [
      { type: EnemyType.ELITE, count: scaleWaveCount(2) },
      { type: EnemyType.TANK, count: scaleWaveCount(2) },
      { type: EnemyType.ZAPPER, count: scaleWaveCount(3) },
    ],
    duration: 50,
  },
  {
    stage: 5,
    waveIndex: 2,
    spawnDelay: 0.6,
    enemies: [
      { type: EnemyType.SWARM_V2, count: scaleWaveCount(10) },
      { type: EnemyType.STRIKER, count: scaleWaveCount(3) },
      { type: EnemyType.PHANTOM, count: scaleWaveCount(2) },
    ],
    duration: 50,
  },
  {
    stage: 5,
    waveIndex: 3,
    spawnDelay: 0.56,
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
    stage: 5,
    waveIndex: 4,
    spawnDelay: 0.53,
    enemies: [
      { type: EnemyType.SHIELDED, count: scaleWaveCount(3) },
      { type: EnemyType.SNIPER, count: scaleWaveCount(2) },
      { type: EnemyType.PHALANX, count: scaleWaveCount(2) },
      { type: EnemyType.SPLINTER, count: scaleWaveCount(3) },
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
  1: { min: 5, max: 8 },
  2: { min: 8, max: 12 },
  3: { min: 12, max: 18 },
  4: { min: 18, max: 30 },
  5: { min: 30, max: 50 },
};

/** Exponential enemy count scaling per survival stage (targets STAGE_WAVE_ENEMY_TARGETS). */
export function scaleWaveEnemyCount(stage: number, count: number): number {
  const mult =
    stage <= 1
      ? 1.35
      : stage === 2
        ? 1.45
        : stage === 3
          ? 1.12
          : stage === 4
            ? 2.55
            : 3.5;
  return Math.max(1, Math.round(count * mult));
}

/** Faster spawn cadence in later stages (multiplier on spawnDelay). */
export function getStageSpawnDelayScale(stage: number): number {
  if (stage <= 1) return 0.92;
  if (stage === 2) return 0.8;
  if (stage === 3) return 0.68;
  if (stage === 4) return 0.55;
  return 0.45;
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
