import { describe, expect, it } from 'vitest';
import {
  getLevelProgress,
  getMaxAliveEnemies,
  getSpawnChance,
  getStageQuota,
} from './spawnCurve';

describe('getStageQuota', () => {
  it('matches stage 1 initial and later stage formula', () => {
    expect(getStageQuota(1)).toBe(50);
    expect(getStageQuota(2)).toBe(85);
  });
});

describe('getLevelProgress', () => {
  it('is 0 at stage start and 1 when quota cleared', () => {
    expect(getLevelProgress(50, 50)).toBe(0);
    expect(getLevelProgress(0, 50)).toBe(1);
    expect(getLevelProgress(25, 50)).toBe(0.5);
  });
});

describe('getMaxAliveEnemies', () => {
  it('keeps early run small', () => {
    expect(
      getMaxAliveEnemies({
        levelProgress: 0,
        threatFactor: 0,
        isRamping: false,
        mobile: false,
      })
    ).toBeLessThanOrEqual(8);

    expect(
      getMaxAliveEnemies({
        levelProgress: 0,
        threatFactor: 0,
        isRamping: true,
        mobile: false,
      })
    ).toBeLessThanOrEqual(4);
  });

  it('grows with progress', () => {
    const early = getMaxAliveEnemies({
      levelProgress: 0,
      threatFactor: 0,
      isRamping: false,
      mobile: false,
    });
    const mid = getMaxAliveEnemies({
      levelProgress: 0.5,
      threatFactor: 0,
      isRamping: false,
      mobile: false,
    });
    expect(mid).toBeGreaterThan(early);
  });
});

describe('getSpawnChance', () => {
  it('applies start grace for first 30 seconds', () => {
    const early = getSpawnChance({
      levelProgress: 0.5,
      threatFactor: 0,
      survivalTime: 10,
      mobile: false,
    });
    const later = getSpawnChance({
      levelProgress: 0.5,
      threatFactor: 0,
      survivalTime: 60,
      mobile: false,
    });
    expect(early).toBeLessThan(later);
    expect(early).toBeCloseTo(later * 0.35, 5);
  });
});
