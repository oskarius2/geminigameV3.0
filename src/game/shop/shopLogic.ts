import { getShopItem, isValidShopItemId } from './shopDefs';
import type {
  ShopCartLine,
  ShopItemId,
  ShopPurchaseResult,
  RunShopLoadout,
} from './shopTypes';

export function buildCart(selectedIds: ShopItemId[]): ShopCartLine[] {
  const seen = new Set<ShopItemId>();
  const lines: ShopCartLine[] = [];
  for (const id of selectedIds) {
    if (seen.has(id)) continue;
    const def = getShopItem(id);
    if (!def) continue;
    seen.add(id);
    lines.push({ itemId: id, costScrap: def.costScrap });
  }
  return lines;
}

export function cartTotalScrap(cart: ShopCartLine[]): number {
  return cart.reduce((sum, line) => sum + line.costScrap, 0);
}

export function validatePurchase(
  metaScrap: number,
  selectedIds: ShopItemId[],
): ShopPurchaseResult {
  const cart = buildCart(selectedIds);
  const totalScrap = cartTotalScrap(cart);

  if (cart.length === 0) {
    return {
      ok: true,
      cart: [],
      totalScrap: 0,
      remainingScrap: metaScrap,
    };
  }

  for (const id of selectedIds) {
    if (!isValidShopItemId(id)) {
      return {
        ok: false,
        error: 'invalid_item',
        cart,
        totalScrap,
        remainingScrap: metaScrap,
      };
    }
  }

  const unique = new Set(selectedIds);
  if (unique.size !== selectedIds.length) {
    return {
      ok: false,
      error: 'duplicate_item',
      cart,
      totalScrap,
      remainingScrap: metaScrap,
    };
  }

  if (metaScrap < totalScrap) {
    return {
      ok: false,
      error: 'insufficient_scrap',
      cart,
      totalScrap,
      remainingScrap: metaScrap - totalScrap,
    };
  }

  return {
    ok: true,
    cart,
    totalScrap,
    remainingScrap: metaScrap - totalScrap,
  };
}

export function createLoadout(selectedIds: ShopItemId[]): RunShopLoadout {
  const cart = buildCart(selectedIds);
  return {
    purchasedIds: cart.map((l) => l.itemId),
    totalSpent: cartTotalScrap(cart),
  };
}
