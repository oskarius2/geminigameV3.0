import { describe, expect, it } from 'vitest';
import { getAugmentTier, getTierModifiers } from './augmentTiers';

describe('augmentTiers', () => {
  it('maps passive count to discrete tiers', () => {
    expect(getAugmentTier(0)).toBe(0);
    expect(getAugmentTier(3)).toBe(1);
    expect(getAugmentTier(6)).toBe(2);
    expect(getAugmentTier(9)).toBe(3);
    expect(getAugmentTier(12)).toBe(4);
  });

  it('scales modifiers with tier', () => {
    const low = getTierModifiers(0);
    const high = getTierModifiers(4);
    expect(high.enemyHpMult).toBeGreaterThan(low.enemyHpMult);
    expect(high.threatFactor).toBeGreaterThan(low.threatFactor);
  });
});
