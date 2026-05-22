import { describe, expect, it } from 'vitest';
import { INITIAL_STATE } from '../Logic';
import {
  applyShopEffects,
  applyShopThreat,
  getExperienceGainMultiplier,
  getLootDropChanceMultiplier,
} from './shopEffects';

describe('shopEffects', () => {
  it('applies starting buffs with caps', () => {
    const state = INITIAL_STATE(800, 600);
    const baseDmg = state.baseDamage;
    applyShopEffects(state, ['shop_overdrive', 'shop_fortified']);
    expect(state.baseDamage).toBeCloseTo(baseDmg * 1.2);
    expect(state.player.maxHealth).toBeGreaterThan(100);
    expect(state.shopPurchasedIds).toHaveLength(2);
  });

  it('swift training only on early stages', () => {
    const state = INITIAL_STATE(800, 600);
    applyShopEffects(state, ['shop_swift_training']);
    state.stage = 1;
    expect(getExperienceGainMultiplier(state)).toBe(1.25);
    state.stage = 3;
    expect(getExperienceGainMultiplier(state)).toBe(1);
  });

  it('abundant ammo doubles loot mult on stage 2', () => {
    const state = INITIAL_STATE(800, 600);
    applyShopEffects(state, ['shop_abundant_ammo']);
    state.stage = 2;
    expect(getLootDropChanceMultiplier(state)).toBe(2);
    state.stage = 3;
    state.shopRunFlags.abundantAmmoStagesLeft = 0;
    expect(getLootDropChanceMultiplier(state)).toBe(1);
  });

  it('calm before storm lowers threat', () => {
    const state = INITIAL_STATE(800, 600);
    applyShopEffects(state, ['shop_calm_before_storm']);
    applyShopThreat(state);
    expect(state.threatLevel).toBeLessThanOrEqual(90);
  });
});
