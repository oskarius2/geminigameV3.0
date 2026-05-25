import { describe, expect, it } from 'vitest';
import {
  STAGE_1_WAVES,
  STAGE_5_WAVES,
  STAGE_WAVE_ENEMY_TARGETS,
  getStageWaveDuration,
  getWaveCompositionSnapshot,
  getWaveEnemyTotal,
  getWaveForStage,
  getWavesForStage,
} from './waveCompositions';
import { EnemyType } from '../types';

describe('waveCompositions', () => {
  it('stage 1 has 3 waves and uses only intro-tier enemy types', () => {
    expect(STAGE_1_WAVES).toHaveLength(3);
    // Stage 1 uses the lightweight roster: core melee, fast, swarm, and late-wave
    // WRAITH/DASHER teasers to preview Stage 2+ threats without overwhelming new players.
    const allowed = new Set([
      EnemyType.CHASER,
      EnemyType.FAST,
      EnemyType.SWARMER,
      EnemyType.WRAITH,   // speed-preview teaser in wave 1
      EnemyType.DASHER,   // burst-dash teaser in wave 2
    ]);
    for (const wave of STAGE_1_WAVES) {
      expect(wave.enemies.every((e) => allowed.has(e.type))).toBe(true);
    }
    // Confirm core types appear in wave 0 for immediate variety
    const wave0Types = new Set(STAGE_1_WAVES[0].enemies.map((e) => e.type));
    expect(wave0Types.has(EnemyType.CHASER)).toBe(true);
    expect(wave0Types.has(EnemyType.FAST)).toBe(true);
    expect(wave0Types.has(EnemyType.SWARMER)).toBe(true);
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

  it('scales wave enemy counts toward stage targets', () => {
    for (const stage of [1, 2, 3, 4] as const) {
      const wave = getWaveForStage(stage, 0);
      expect(wave).not.toBeNull();
      const total = getWaveEnemyTotal(wave!);
      const { min, max } = STAGE_WAVE_ENEMY_TARGETS[stage];
      expect(total).toBeGreaterThanOrEqual(min);
      expect(total).toBeLessThanOrEqual(max + 8);
    }
    const s5 = getWaveForStage(5, 0);
    expect(getWaveEnemyTotal(s5!)).toBeGreaterThanOrEqual(STAGE_WAVE_ENEMY_TARGETS[5].min);
  });
});
