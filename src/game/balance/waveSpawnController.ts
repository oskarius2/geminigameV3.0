import type { MiniBossId } from '../bosses/miniBossDefs';
import { clearMiniBossHudState } from '../bosses/miniBossJuice';
import { getMiniBossDef, pickRotatingMiniBossId } from '../bosses/miniBossDefs';
import {
  getSurvivalDifficulty,
  getSurvivalSpawnModifiers,
  shouldSpawnMiniBossesOnWave,
} from './miniBossDifficulty';
import { EnemyType, Entity, GameState } from '../types';
import { getSpawnIntervalMs } from '../progression/difficultyScaler';
import { getEffectiveTypeCap, countEnemiesByType } from './spawnComposition';
import { getLevelProgress, getStageQuota } from './spawnCurve';
import { getWaveForStage, WaveTemplate } from './waveCompositions';

/** Maps wave EnemyType → spawnEnemy() switch index (Logic.ts). */
export const ENEMY_TYPE_TO_SPAWN_PICK: Partial<Record<EnemyType, number>> = {
  [EnemyType.CHASER]: 7,
  [EnemyType.RANGED]: 6,
  [EnemyType.TANK]: 1,
  [EnemyType.FAST]: 9,
  [EnemyType.ELITE]: 3,
  [EnemyType.SWARMER]: 10,
  [EnemyType.PHALANX]: 1,
  [EnemyType.WRAITH]: 2,
  [EnemyType.SPLINTER]: 4,
  [EnemyType.NOVA]: 5,
  [EnemyType.SNIPER]: 11,
  [EnemyType.DASHER]: 12,
  [EnemyType.PHANTOM]: 13,
  [EnemyType.ZAPPER]: 14,
  [EnemyType.STRIKER]: 15,
  [EnemyType.SWARM_V2]: 16,
  [EnemyType.TRACKER]: 17,
  [EnemyType.FORTIFIED]: 18,
  [EnemyType.SHIELDED]: 19,
  [EnemyType.REGENERATING]: 20,
};

export function getSpawnPickForEnemyType(type: EnemyType): number {
  return ENEMY_TYPE_TO_SPAWN_PICK[type] ?? 7;
}

function buildWaveQueue(wave: WaveTemplate): EnemyType[] {
  const queue: EnemyType[] = [];
  for (const slot of wave.enemies) {
    for (let i = 0; i < slot.count; i++) {
      queue.push(slot.type);
    }
  }
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
}

function buildMiniBossQueue(wave: WaveTemplate, stage: number): MiniBossId[] {
  const hasWaveSlots = Boolean(wave.miniBosses?.length);
  const queue: MiniBossId[] = [];

  if (hasWaveSlots) {
    for (const slot of wave.miniBosses!) {
      const count = slot.count ?? 1;
      for (let i = 0; i < count; i++) {
        if (slot.id === 'rotating') {
          queue.push(pickRotatingMiniBossId(stage, wave.waveIndex + i));
        } else {
          queue.push(slot.id);
        }
      }
    }
  }

  if (
    queue.length === 0 &&
    stage >= 2 &&
    getSurvivalDifficulty() === 'hard'
  ) {
    queue.push(pickRotatingMiniBossId(stage, wave.waveIndex));
  }

  if (!shouldSpawnMiniBossesOnWave(stage, wave.waveIndex, hasWaveSlots || queue.length > 0)) {
    return [];
  }

  return queue;
}

function announceMiniBossWave(state: GameState, queue: MiniBossId[]): void {
  if (queue.length === 0) return;
  const def = getMiniBossDef(queue[0]);
  state.miniBossIncomingTimer = 4;
  state.miniBossIncomingText = def.displayName;
  state.miniBossIncomingColor = def.auraColor;
}

/** Call when a survival stage begins (run start or stage advance). */
export function resetWaveSpawnState(state: GameState): void {
  state.stageEnteredAt = state.survivalTime;
  state.waveSpawnQueue = [];
  state.waveMiniBossQueue = [];
  state.waveSpawnCooldown = 0;
  state.activeWaveIndex = -1;
  clearMiniBossHudState(state);
}

/**
 * Scripted survival spawns driven by waveCompositions.ts.
 * Returns spawned entity when one was created this tick.
 */
export function tickSurvivalWaveSpawns(
  state: GameState,
  dtSec: number,
  maxEnemies: number,
  spawnFromPick: (pick: number) => Entity | null,
  spawnMiniBoss?: (id: MiniBossId) => Entity | null,
): Entity | null {
  if (state.enemiesToKill <= 0 || state.enemies.length >= maxEnemies) {
    return null;
  }

  const timeInStage = Math.max(0, state.survivalTime - state.stageEnteredAt);
  const wave = getWaveForStage(state.stage, timeInStage);
  if (!wave) return null;

  if (wave.waveIndex !== state.activeWaveIndex) {
    state.activeWaveIndex = wave.waveIndex;
    state.waveSpawnQueue = buildWaveQueue(wave);
    state.waveMiniBossQueue = buildMiniBossQueue(wave, state.stage);
    announceMiniBossWave(state, state.waveMiniBossQueue);
    state.waveSpawnCooldown = 0;
  }

  if (state.waveSpawnQueue.length === 0 && state.waveMiniBossQueue.length === 0) {
    state.waveSpawnQueue = buildWaveQueue(wave);
    state.waveMiniBossQueue = buildMiniBossQueue(wave, state.stage);
  }

  state.waveSpawnCooldown -= dtSec;
  if (state.waveSpawnCooldown > 0) {
    return null;
  }

    const delayScale = state.stage === 1 ? 0.88 : 1;
  const diffDelay = getSurvivalSpawnModifiers().waveSpawnDelayMult;
  
  // Apply threat scaling to pacing
  const basePacingSec = (state.difficultyScaleSpawnIntervalMs ?? getSpawnIntervalMs(state.stage)) / 1000;
  const threatScale = 0.5 + (Math.min(100, state.threatLevel) / 100) * 0.5; // Up to 50% faster at max threat
  const pacingSec = basePacingSec * threatScale;
  
  const cooldown = pacingSec * delayScale * diffDelay;

  if (state.waveMiniBossQueue.length > 0 && spawnMiniBoss) {
    const miniId = state.waveMiniBossQueue.shift()!;
    const entity = spawnMiniBoss(miniId);
    state.waveSpawnCooldown = cooldown;
    return entity;
  }

  // Calculate current level progress for type caps
  const totalQuota = getStageQuota(state.stage);
  const progress = getLevelProgress(state.enemiesToKill, totalQuota);
  const currentCounts = countEnemiesByType(state.enemies);

  // Find next valid type in queue that hasn't hit cap
  let nextType: EnemyType | undefined;
  while (state.waveSpawnQueue.length > 0) {
    const candidateType = state.waveSpawnQueue.shift();
    if (!candidateType) continue;
    
    const cap = getEffectiveTypeCap(candidateType, progress);
    const current = currentCounts[candidateType] ?? 0;
    
    if (current < cap) {
      nextType = candidateType;
      break;
    }
  }

  if (!nextType) return null;

  const entity = spawnFromPick(getSpawnPickForEnemyType(nextType));
  state.waveSpawnCooldown = cooldown;
  return entity;
}
