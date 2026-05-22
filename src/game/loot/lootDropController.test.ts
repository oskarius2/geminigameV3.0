import { describe, expect, it } from 'vitest';
import { INITIAL_STATE } from '../Logic';
import {
  getArtifactDropChance,
  getCompanionDropChance,
  pickLootPool,
  rollLootOnKill,
  rollBossLoot,
  shouldGrantFirstCompanion,
  applyLootDrop,
} from './lootDropController';
import { getShipLootPool } from './shipLootDefs';
import { getRecommendedCompanion } from '../companions/companionDefs';

describe('lootDropController', () => {
  it('returns stage-scaled companion drop rates', () => {
    expect(getCompanionDropChance(2)).toBe(0);
    expect(getCompanionDropChance(3)).toBe(0.05);
    expect(getCompanionDropChance(4)).toBe(0.08);
    expect(getCompanionDropChance(5)).toBe(0.1);
  });

  it('returns stage-scaled artifact drop rates', () => {
    expect(getArtifactDropChance(1)).toBe(0.05);
    expect(getArtifactDropChance(2)).toBe(0.15);
    expect(getArtifactDropChance(5)).toBe(0.5);
  });

  it('pickLootPool respects 70/20/10 weights over many rolls', () => {
    const counts = { ship_artifact: 0, universal: 0, cross_ship: 0 };
    for (let i = 0; i < 1000; i++) {
      counts[pickLootPool(i / 1000)]++;
    }
    expect(counts.ship_artifact).toBeGreaterThan(counts.universal);
    expect(counts.universal).toBeGreaterThan(counts.cross_ship);
  });

  it('grants first companion at stage 2', () => {
    const state = INITIAL_STATE(800, 600, 'interceptor');
    state.stage = 2;
    expect(shouldGrantFirstCompanion(state)).toBe(true);
    const drop = rollLootOnKill(state, 0.99);
    expect(drop?.kind).toBe('companion');
    expect(drop?.lootId).toBe(getRecommendedCompanion('interceptor'));
  });

  it('ship loot pool only contains ship-exclusive items', () => {
    const pool = getShipLootPool('gunship');
    expect(pool.every((l) => l.shipId === 'gunship')).toBe(true);
    expect(pool).toHaveLength(8);
  });

  it('rollBossLoot can grant bonus drops on guaranteed roll', () => {
    const state = INITIAL_STATE(800, 600, 'interceptor');
    state.stage = 4;
    const drop = rollBossLoot(state, 'crimson_tyrant', () => 0);
    expect(drop).not.toBeNull();
  });

  it('applyLootDrop tracks collected ship loot', () => {
    const state = INITIAL_STATE(800, 600, 'drone');
    applyLootDrop(state, {
      kind: 'ship_artifact',
      lootId: 'loot_hivemind',
      name: 'Hivemind',
    });
    expect(state.collectedShipLoot).toContain('loot_hivemind');
    expect(state.passives).toContain('loot_hivemind');
  });
});
