import { describe, expect, it } from 'vitest';
import {
  STAGE_1_WAVES,
  STAGE_5_WAVES,
  getStageWaveDuration,
  getWaveCompositionSnapshot,
  getWaveForStage,
  getWavesForStage,
} from './waveCompositions';
import { EnemyType } from '../types';

describe('waveCompositions', () => {
  it('stage 1 uses only small enemy types across 3 waves', () => {
    expect(STAGE_1_WAVES).toHaveLength(3);
    const allowed = new Set([EnemyType.CHASER, EnemyType.FAST, EnemyType.SWARMER]);
    for (const wave of STAGE_1_WAVES) {
      expect(wave.enemies.every((e) => allowed.has(e.type))).toBe(true);
    }
  });

  it('returns wave 0 at stage start', () => {
    const wave = getWaveForStage(1, 0);
    expect(wave?.waveIndex).toBe(0);
    expect(wave?.stage).toBe(1);
  });

  it('advances to wave 1 after first wave duration', () => {
    const wave = getWaveForStage(1, STAGE_1_WAVES[0].duration + 1);
    expect(wave?.waveIndex).toBe(1);
  });

  it('stage 5 loops waves endlessly', () => {
    const cycle = getStageWaveDuration(5);
    const first = getWaveForStage(5, 0);
    const again = getWaveForStage(5, cycle);
    expect(first?.waveIndex).toBe(0);
    expect(again?.waveIndex).toBe(0);
  });

  it('stage 5 exposes full roster over cycle', () => {
    const types = new Set(
      STAGE_5_WAVES.flatMap((w) => w.enemies.map((e) => e.type))
    );
    expect(types.has(EnemyType.PHANTOM)).toBe(true);
    expect(types.has(EnemyType.TRACKER)).toBe(true);
  });

  it('snapshot mirrors active wave', () => {
    const snap = getWaveCompositionSnapshot(2, 0);
    expect(snap?.waveIndex).toBe(0);
    expect(snap?.totalEnemiesInWave).toBeGreaterThan(0);
    expect(getWavesForStage(2).length).toBeGreaterThanOrEqual(3);
  });
});
