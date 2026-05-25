import { describe, it, expect } from 'vitest';
import { Vector2 } from '../utils/vector';
import { EnemyType, EntityType, type Entity } from '../types';
import {
  BOSS_HIT_DAMAGE_CAP_PCT,
  BOSS_ENTRY_GRACE_SECONDS,
  capBossHitDamage,
  estimateBossTTK,
  getEffectiveBossDamageResist,
  isBossEntity,
} from './bossDamageRules';

/**
 * Make a stub boss entity with sane defaults — only the fields touched by
 * the damage-rules helpers are populated. Cast through `Partial` so we
 * don't have to spell out every field on Entity.
 */
function makeBoss(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'boss-test',
    type: EntityType.ENEMY,
    active: true,
    enemyType: EnemyType.BOSS,
    pos: new Vector2(0, 0),
    velocity: new Vector2(0, 0),
    radius: 100,
    health: 24000,
    maxHealth: 24000,
    speed: 1,
    color: '#991b1b',
    damageResist: 0.35,
    bossEngageTimer: 30, // past entry grace by default
    ...overrides,
  } as Entity;
}

describe('isBossEntity', () => {
  it('returns true for BOSS, false for everything else', () => {
    expect(isBossEntity(makeBoss())).toBe(true);
    expect(isBossEntity(makeBoss({ enemyType: EnemyType.CHASER }))).toBe(false);
    expect(isBossEntity(makeBoss({ enemyType: EnemyType.ELITE }))).toBe(false);
  });
});

describe('capBossHitDamage', () => {
  it('caps damage at 3% of maxHealth on bosses', () => {
    const boss = makeBoss({ maxHealth: 24000 });
    // 24000 × 0.03 = 720
    expect(capBossHitDamage(boss, 5000)).toBe(720);
    expect(capBossHitDamage(boss, 720)).toBe(720);
    expect(capBossHitDamage(boss, 100)).toBe(100);
  });

  it('passes through unchanged for non-boss entities', () => {
    const elite = makeBoss({ enemyType: EnemyType.ELITE, maxHealth: 500 });
    expect(capBossHitDamage(elite, 5000)).toBe(5000);
  });

  it('handles 0 / negative / NaN gracefully', () => {
    const boss = makeBoss();
    expect(capBossHitDamage(boss, 0)).toBe(0);
    expect(capBossHitDamage(boss, -10)).toBe(-10);
    expect(capBossHitDamage(boss, Number.NaN)).toBeNaN();
  });

  it('scales the cap with maxHealth (stage 5 boss)', () => {
    const stage5 = makeBoss({ maxHealth: 304_800 });
    // 304800 × 0.03 = 9144
    expect(capBossHitDamage(stage5, 1_000_000)).toBeCloseTo(9144, 5);
  });
});

describe('getEffectiveBossDamageResist', () => {
  it('returns baseline once past the entry-grace window', () => {
    const boss = makeBoss({ bossEngageTimer: BOSS_ENTRY_GRACE_SECONDS });
    expect(getEffectiveBossDamageResist(boss)).toBeCloseTo(0.35, 5);
  });

  it('boosts resist during the entry-grace window', () => {
    const boss = makeBoss({ bossEngageTimer: 0, damageResist: 0.35 });
    // 1 - (1 - 0.35) * (1 - 0.25) = 1 - 0.65 * 0.75 = 1 - 0.4875 = 0.5125
    expect(getEffectiveBossDamageResist(boss)).toBeCloseTo(0.5125, 4);
  });

  it('falls back to baseline for non-boss entities', () => {
    const e = makeBoss({ enemyType: EnemyType.SHIELDED, damageResist: 0.85 });
    expect(getEffectiveBossDamageResist(e)).toBeCloseTo(0.85, 5);
  });
});

describe('estimateBossTTK — design sanity checks', () => {
  /**
   * These tests double as living documentation: if we ever change the cap
   * fraction or HP curve, the expected TTK numbers below pin the design
   * spec ("30–90 second boss fights").
   */

  it('stage 1 boss vs unbuffed player → meaningful but not absurd', () => {
    // Unbuffed: 18 dmg × 10 fire/sec, 35% resist → 117 effective DPS.
    const dps = 18 * 10 * (1 - 0.35);
    const ttk = estimateBossTTK(24_000, dps, 10);
    // With 24k HP, unbuffed TTK is still long (~205s) — that's why the
    // *design* assumes some augment investment by the boss wave. The cap
    // doesn't engage here because per-hit damage is well under 720.
    expect(ttk).toBeGreaterThan(180);
    expect(ttk).toBeLessThan(240);
  });

  it('stage 1 boss vs over-stacked player → cap saves it from 1-second kill', () => {
    // Pretend the player has 5,000 effective dmg per shot at 30 hits/sec
    // (Crit × Phantom × Hunter × Multi-shot stacked). Without the cap that
    // would be 150,000 DPS → 0.16s kill. With cap = 720 × 30 = 21,600 DPS.
    const ttk = estimateBossTTK(24_000, 5_000 * 30, 30);
    expect(ttk).toBeGreaterThanOrEqual(1.0); // floor: at least 1s
    expect(ttk).toBeLessThan(2.0); // still fast — but not 0.16s
  });

  it('stage 5 boss vs heavy augment build → 30–90 second target', () => {
    // Stage 5 colossus: 304,800 HP. Realistic late-game DPS ~8000.
    const ttk = estimateBossTTK(304_800, 8_000, 20);
    expect(ttk).toBeGreaterThanOrEqual(30);
    expect(ttk).toBeLessThanOrEqual(90);
  });

  it('returns Infinity for zero DPS', () => {
    expect(estimateBossTTK(24_000, 0, 10)).toBe(Infinity);
    expect(estimateBossTTK(24_000, 100, 0)).toBe(Infinity);
  });
});

describe('design constants — wire fence so future tweaks are intentional', () => {
  it('BOSS_HIT_DAMAGE_CAP_PCT is in a sensible range', () => {
    // 1%–5% — outside this range either trivializes (5%+) or stalls (<1%) the fight.
    expect(BOSS_HIT_DAMAGE_CAP_PCT).toBeGreaterThanOrEqual(0.01);
    expect(BOSS_HIT_DAMAGE_CAP_PCT).toBeLessThanOrEqual(0.05);
  });

  it('BOSS_ENTRY_GRACE_SECONDS is between 4–15 seconds', () => {
    expect(BOSS_ENTRY_GRACE_SECONDS).toBeGreaterThanOrEqual(4);
    expect(BOSS_ENTRY_GRACE_SECONDS).toBeLessThanOrEqual(15);
  });
});
