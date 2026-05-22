import { describe, expect, it } from 'vitest';
import {
  getDifficultyForStage,
  DIFFICULTY_PROGRESSION,
} from './difficultyConfig';
import {
  getEnemyCountRange,
  getSpawnIntervalMs,
  getMiniBossStats,
  getArtifactPoolForStage,
} from './difficultyScaler';

describe('difficulty progression', () => {
  it('returns configured stages 1–5', () => {
    expect(getDifficultyForStage(1).spawnIntervalMs).toBe(2000);
    expect(getDifficultyForStage(5).enemyHealthMultiplier).toBe(3);
    expect(DIFFICULTY_PROGRESSION).toHaveLength(5);
  });

  it('scales endless stages beyond 5', () => {
    const s6 = getDifficultyForStage(6);
    const s5 = getDifficultyForStage(5);
    expect(s6.enemyHealthMultiplier).toBeGreaterThan(s5.enemyHealthMultiplier);
    expect(s6.miniBossHealth).toBeGreaterThan(s5.miniBossHealth);
  });

  it('exposes spawn pacing and pools', () => {
    expect(getSpawnIntervalMs(1)).toBe(2000);
    expect(getSpawnIntervalMs(5)).toBe(400);
    expect(getEnemyCountRange(4).max).toBe(30);
    expect(getMiniBossStats(1).maxHealth).toBe(100);
    expect(getMiniBossStats(5).damage).toBe(100);
    expect(getArtifactPoolForStage(1)).toContain('utility');
    expect(getArtifactPoolForStage(5)).toContain('corrupted');
  });
});
