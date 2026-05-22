import type { MiniBossId } from '../bosses/miniBossDefs';
import { clearMiniBossHudState } from '../bosses/miniBossJuice';
import { getMiniBossDef, pickRotatingMiniBossId } from '../bosses/miniBossDefs';
import {
  getSurvivalDifficulty,
  getSurvivalSpawnModifiers,
  shouldSpawnMiniBossesOnWave,
} from './miniBossDifficulty';
import { EnemyType, Entity, GameState } from '../types';
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
  const cooldown = wave.spawnDelay * delayScale * diffDelay;

  if (state.waveMiniBossQueue.length > 0 && spawnMiniBoss) {
    const miniId = state.waveMiniBossQueue.shift()!;
    const entity = spawnMiniBoss(miniId);
    state.waveSpawnCooldown = cooldown;
    return entity;
  }

  const nextType = state.waveSpawnQueue.shift();
  if (!nextType) return null;

  const pick = getSpawnPickForEnemyType(nextType);
  const entity = spawnFromPick(pick);
  state.waveSpawnCooldown = cooldown;
  return entity;
}
