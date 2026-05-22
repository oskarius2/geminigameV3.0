import { describe, expect, it } from 'vitest';
import { LOOT_VARIANT_COUNTS, getArtifactDropChance, getCompanionDropChance } from './dropLogic';
import { SHOP_LOOT_CATALOG } from '../shop/shopDefs';

describe('dropLogic', () => {
  it('exposes catalog counts aligned with shop defs', () => {
    expect(SHOP_LOOT_CATALOG).toBe(LOOT_VARIANT_COUNTS);
    expect(LOOT_VARIANT_COUNTS.companions).toBeGreaterThanOrEqual(4);
    expect(LOOT_VARIANT_COUNTS.vaultArtifacts).toBeGreaterThan(5);
    expect(LOOT_VARIANT_COUNTS.shipExclusivePerShip).toBe(8);
  });

  it('scales artifact and companion drop rates by stage', () => {
    expect(getArtifactDropChance(1)).toBeLessThan(getArtifactDropChance(5));
    expect(getCompanionDropChance(2)).toBe(0);
    expect(getCompanionDropChance(5)).toBeGreaterThan(getCompanionDropChance(3));
  });
});
