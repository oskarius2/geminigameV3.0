import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  getSurvivalDifficulty,
  resetSurvivalDifficultyCache,
  setSurvivalDifficulty,
  shouldSpawnMiniBossesOnWave,
  getMiniBossHpMultiplier,
  getSurvivalSpawnModifiers,
  applySurvivalDifficultyToThreat,
} from './miniBossDifficulty';

describe('miniBossDifficulty', () => {
  beforeEach(() => {
    setSurvivalDifficulty('normal');
  });

  afterEach(() => {
    setSurvivalDifficulty('normal');
    resetSurvivalDifficultyCache();
  });

  it('persists difficulty choice', () => {
    setSurvivalDifficulty('hard');
    expect(getSurvivalDifficulty()).toBe('hard');
  });

  it('easy skips some mini-boss waves', () => {
    setSurvivalDifficulty('easy');
    expect(shouldSpawnMiniBossesOnWave(2, 1, true)).toBe(false);
    expect(shouldSpawnMiniBossesOnWave(2, 2, true)).toBe(true);
  });

  it('hard always spawns from stage 2', () => {
    setSurvivalDifficulty('hard');
    expect(shouldSpawnMiniBossesOnWave(2, 0, false)).toBe(true);
    expect(shouldSpawnMiniBossesOnWave(1, 0, false)).toBe(false);
  });

  it('scales HP by difficulty', () => {
    setSurvivalDifficulty('easy');
    expect(getMiniBossHpMultiplier()).toBeLessThan(1);
    setSurvivalDifficulty('hard');
    expect(getMiniBossHpMultiplier()).toBeGreaterThan(1);
  });

  it('adjusts global spawn and threat by difficulty', () => {
    setSurvivalDifficulty('easy');
    expect(getSurvivalSpawnModifiers().spawnChanceMult).toBeLessThan(1);
    expect(applySurvivalDifficultyToThreat(50)).toBe(38);
    setSurvivalDifficulty('hard');
    expect(getSurvivalSpawnModifiers().maxEnemiesMult).toBeGreaterThan(1);
    expect(applySurvivalDifficultyToThreat(50)).toBe(60);
  });
});
