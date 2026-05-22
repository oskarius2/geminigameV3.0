import { EntityType, type Entity, type GameState } from '../types';
import { getDifficultyForStage } from './difficultyConfig';

/** Apply stage difficulty fields (drop rate, pools, spawn pacing, BPM). */
export function initStageDifficulty(state: GameState): GameState {
  const difficulty = getDifficultyForStage(state.stage);
  return {
    ...state,
    artifactDropRate: difficulty.artifactDropRate,
    activeArtifactPool: [...difficulty.availableArtifactPool],
    difficultyScaleSpawnIntervalMs: difficulty.spawnIntervalMs,
    threatMusicBpmBase: difficulty.threatBPMBase,
    threatMusicBpmMax: difficulty.threatBPMMax,
  };
}

/**
 * Re-scale live enemies when stage changes (pure — no mutations).
 * Requires baseHealth / baseDamage on spawned enemies.
 */
export function applyDifficultyScaling(state: GameState): GameState {
  const difficulty = getDifficultyForStage(state.stage);

  const scaledEnemies: Entity[] = state.enemies.map((entity) => {
    if (entity.miniBossId) {
      return {
        ...entity,
        baseDamage: difficulty.miniBossDamage,
        baseHealth: difficulty.miniBossHealth,
        damage: difficulty.miniBossDamage,
        maxHealth: difficulty.miniBossHealth,
        health: Math.min(entity.health, difficulty.miniBossHealth),
      };
    }

    if (
      entity.type === EntityType.ENEMY &&
      entity.baseHealth != null &&
      entity.baseDamage != null
    ) {
      const maxHealth = entity.baseHealth * difficulty.enemyHealthMultiplier;
      const damage = entity.baseDamage * difficulty.enemyDamageMultiplier;
      return {
        ...entity,
        maxHealth,
        health: Math.min(entity.health, maxHealth),
        damage,
      };
    }

    return entity;
  });

  return initStageDifficulty({
    ...state,
    enemies: scaledEnemies,
  });
}

export function getEnemyCountRange(stage: number): { min: number; max: number } {
  const difficulty = getDifficultyForStage(stage);
  return {
    min: difficulty.enemyCountMin,
    max: difficulty.enemyCountMax,
  };
}

export function getSpawnIntervalMs(stage: number): number {
  return getDifficultyForStage(stage).spawnIntervalMs;
}

export function getMiniBossStats(stage: number): {
  damage: number;
  maxHealth: number;
} {
  const difficulty = getDifficultyForStage(stage);
  return {
    damage: difficulty.miniBossDamage,
    maxHealth: difficulty.miniBossHealth,
  };
}

export function getArtifactPoolForStage(stage: number): string[] {
  return [...getDifficultyForStage(stage).availableArtifactPool];
}
