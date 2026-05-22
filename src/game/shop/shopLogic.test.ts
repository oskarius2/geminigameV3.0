import { describe, expect, it } from 'vitest';
import { buildCart, cartTotalScrap, validatePurchase } from './shopLogic';
import type { ShopItemId } from './shopTypes';

describe('shopLogic', () => {
  it('builds cart without duplicates', () => {
    const cart = buildCart(['shop_fortified', 'shop_fortified', 'shop_overdrive']);
    expect(cart).toHaveLength(2);
    expect(cartTotalScrap(cart)).toBe(300);
  });

  it('rejects overspend', () => {
    const ids: ShopItemId[] = ['shop_overdrive', 'shop_lucky_streak'];
    const result = validatePurchase(400, ids);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('insufficient_scrap');
  });

  it('allows empty cart', () => {
    const result = validatePurchase(0, []);
    expect(result.ok).toBe(true);
    expect(result.totalScrap).toBe(0);
  });
});
