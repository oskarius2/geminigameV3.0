import type { Entity } from '../types';
import { ItemType } from '../types';

/**
 * Items on the ground are stored as `Entity` instances on the GameState
 * (`state.items: Entity[]`). The cap only inspects `itemType`, so we
 * narrow the parameter for clarity at call sites without introducing a
 * new type alias.
 */
type GroundItem = Entity;

/**
 * GROUND-ITEM CAP — pure helpers used by the main update loop in App.tsx.
 *
 * Why this lives in its own module:
 *   The capping logic was a bare inline `filter` inside a 4000+ LOC file.
 *   When DEBUFF and BOMB drops were added later, nobody updated the
 *   exclusion list, so the cap silently deleted them — debuffs vanished
 *   before the player could see them, and bosses' guaranteed BOMB rewards
 *   disappeared if the floor was already busy. By extracting it to a tiny
 *   pure function we get a place to (a) document the design intent and
 *   (b) pin the behavior with unit tests that stop the regression coming
 *   back the next time we add a new ItemType.
 */

/** Default ceiling on lootable items on the ground at any time. */
export const MAX_GROUND_ITEMS = 3;

/**
 * Item types that the cap should NEVER touch — either because they're
 * trivial to spawn-cycle (XP, AMMO_PACK, WEAPON_CRATE) or because they
 * convey gameplay state the player must see (DEBUFF, BOMB).
 *
 * Treat this list as the source of truth: when a new ItemType is added,
 * the maintainer must consciously decide whether it's *loot* (subject to
 * the cap) or *not loot* (added here).
 */
export const CAP_EXEMPT_ITEM_TYPES: ReadonlySet<ItemType> = new Set<ItemType>([
  ItemType.XP,
  ItemType.AMMO_PACK,
  ItemType.WEAPON_CRATE,
  ItemType.DEBUFF, // danger pickup — must remain visible/avoidable
  ItemType.BOMB,   // boss reward — must not silently disappear
]);

/**
 * True when this item is subject to the on-ground loot cap.
 * Exposed so callers (renderers, debug overlays) can mark cap-eligible
 * items consistently with the cap itself.
 */
export function isCapEligible(item: GroundItem): boolean {
  // Items always carry an itemType; guard for safety since Entity itself
  // marks itemType as optional.
  if (!item.itemType) return true;
  return !CAP_EXEMPT_ITEM_TYPES.has(item.itemType);
}

/**
 * Apply the ground-item cap to a list of items, returning a (possibly
 * shortened) array preserving original order.
 *
 * Algorithm:
 *   1. Partition `items` into capped (loot) and exempt (XP/AMMO/DEBUFF/BOMB).
 *   2. If capped count > maxItems, drop the OLDEST `excess` capped items
 *      (oldest = first in array, which is the order they were spawned in).
 *   3. Reconstruct the result by filtering the original array, so exempt
 *      items keep their original positions.
 *
 * @param items       Current ground items (mutating callers may reassign the result).
 * @param maxItems    Cap ceiling — defaults to {@link MAX_GROUND_ITEMS}.
 * @returns           A new array (does NOT mutate input).
 */
export function applyGroundItemCap(
  items: readonly GroundItem[],
  maxItems: number = MAX_GROUND_ITEMS,
): GroundItem[] {
  const cappedItems = items.filter(isCapEligible);
  if (cappedItems.length <= maxItems) return items.slice();

  const excess = cappedItems.length - maxItems;
  const idsToRemove = new Set(cappedItems.slice(0, excess).map(i => i.id));
  return items.filter(i => !idsToRemove.has(i.id));
}
