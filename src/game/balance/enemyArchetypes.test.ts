import { describe, expect, it } from 'vitest';
import { EnemyType } from '../types';
import {
  ENEMY_ARCHETYPE,
  STAGE_ENEMY_POOLS,
  getEnemyArchetype,
  getEnemySpawnDelayMult,
  getStageEnemyPool,
  selectMixedEnemies,
  toSlotList,
} from './enemyArchetypes';

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

describe('ENEMY_ARCHETYPE', () => {
  it('classifies every enemy type', () => {
    for (const type of Object.values(EnemyType)) {
      expect(ENEMY_ARCHETYPE[type]).toBeDefined();
    }
  });

  it('groups core types into expected archetypes', () => {
    expect(getEnemyArchetype(EnemyType.CHASER)).toBe('melee');
    expect(getEnemyArchetype(EnemyType.TANK)).toBe('tank');
    expect(getEnemyArchetype(EnemyType.RANGED)).toBe('ranged');
    expect(getEnemyArchetype(EnemyType.SWARMER)).toBe('swarm');
    expect(getEnemyArchetype(EnemyType.ELITE)).toBe('special');
  });
});

describe('getEnemySpawnDelayMult', () => {
  it('makes tanks spawn slower than the baseline', () => {
    expect(getEnemySpawnDelayMult(EnemyType.TANK)).toBeGreaterThan(1);
    expect(getEnemySpawnDelayMult(EnemyType.FORTIFIED)).toBeGreaterThan(1);
  });

  it('keeps light types at baseline (1.0)', () => {
    expect(getEnemySpawnDelayMult(EnemyType.CHASER)).toBe(1);
    expect(getEnemySpawnDelayMult(EnemyType.FAST)).toBe(1);
    expect(getEnemySpawnDelayMult(EnemyType.SWARMER)).toBe(1);
  });
});

describe('STAGE_ENEMY_POOLS', () => {
  it('escalates from gentle stage 1 to full roster at stage 5', () => {
    expect(STAGE_ENEMY_POOLS[1].length).toBeLessThan(STAGE_ENEMY_POOLS[5].length);
    expect(STAGE_ENEMY_POOLS[1].length).toBeGreaterThanOrEqual(3);
  });

  it('stage 1 pool stays melee + swarm only (no tank/ranged yet)', () => {
    for (const entry of STAGE_ENEMY_POOLS[1]) {
      const arch = getEnemyArchetype(entry.type);
      expect(['melee', 'swarm']).toContain(arch);
    }
  });

  it('stage 2 pool introduces ranged + tank archetypes', () => {
    const archs = STAGE_ENEMY_POOLS[2].map((e) => getEnemyArchetype(e.type));
    expect(archs).toContain('ranged');
    expect(archs).toContain('tank');
  });

  it('falls back to stage 5 pool for higher stages', () => {
    expect(getStageEnemyPool(99)).toBe(STAGE_ENEMY_POOLS[5]);
    expect(getStageEnemyPool(0)).toBe(STAGE_ENEMY_POOLS[1]);
  });
});

describe('selectMixedEnemies', () => {
  it('returns exactly the requested count', () => {
    const out = selectMixedEnemies({ stage: 3, count: 10, rng: seededRng(42) });
    expect(out).toHaveLength(10);
  });

  it('produces at least minVariety distinct types when pool allows', () => {
    const out = selectMixedEnemies({
      stage: 3,
      count: 12,
      minVariety: 4,
      rng: seededRng(7),
    });
    const unique = new Set(out);
    expect(unique.size).toBeGreaterThanOrEqual(4);
  });

  it('caps any single type at maxPerTypeRatio share of the wave', () => {
    const count = 20;
    const out = selectMixedEnemies({
      stage: 5,
      count,
      maxPerTypeRatio: 0.3,
      rng: seededRng(123),
    });
    const counts = new Map<EnemyType, number>();
    for (const t of out) counts.set(t, (counts.get(t) ?? 0) + 1);
    const maxAllowed = Math.ceil(count * 0.3);
    for (const c of counts.values()) {
      expect(c).toBeLessThanOrEqual(maxAllowed);
    }
  });

  it('never returns 5x the same enemy type in a wave of 8 (stage 1)', () => {
    for (let seed = 1; seed < 20; seed++) {
      const out = selectMixedEnemies({ stage: 1, count: 8, rng: seededRng(seed) });
      const counts = new Map<EnemyType, number>();
      for (const t of out) counts.set(t, (counts.get(t) ?? 0) + 1);
      for (const c of counts.values()) {
        expect(c).toBeLessThan(5);
      }
    }
  });

  it('returns empty array for non-positive count', () => {
    expect(selectMixedEnemies({ stage: 1, count: 0 })).toEqual([]);
    expect(selectMixedEnemies({ stage: 1, count: -3 })).toEqual([]);
  });
});

describe('toSlotList', () => {
  it('compresses a flat type array into wave slot pairs', () => {
    const slots = toSlotList([
      EnemyType.CHASER,
      EnemyType.FAST,
      EnemyType.CHASER,
      EnemyType.SWARMER,
      EnemyType.FAST,
    ]);
    const byType = Object.fromEntries(slots.map((s) => [s.type, s.count]));
    expect(byType[EnemyType.CHASER]).toBe(2);
    expect(byType[EnemyType.FAST]).toBe(2);
    expect(byType[EnemyType.SWARMER]).toBe(1);
  });
});
