import { describe, it, expect } from 'vitest';
import { Vector2 } from '../utils/vector';
import { EntityType, ItemType, type Entity } from '../types';
import {
  CAP_EXEMPT_ITEM_TYPES,
  MAX_GROUND_ITEMS,
  applyGroundItemCap,
  isCapEligible,
} from './groundItemCap';

/**
 * Build a minimal ground-item Entity — only the fields touched by the cap
 * are populated, and the id encodes spawn order (`a` < `b` < `c` < …) so
 * we can assert on which got dropped.
 */
function makeItem(id: string, itemType: ItemType): Entity {
  return {
    id,
    type: EntityType.ITEM,
    active: true,
    pos: new Vector2(0, 0),
    velocity: new Vector2(0, 0),
    radius: 12,
    health: 1,
    maxHealth: 1,
    speed: 0,
    color: '#fff',
    itemType,
  } as Entity;
}

describe('isCapEligible', () => {
  it('treats HEALTH / ENERGY / SHIELD / ARTIFACT as loot (capped)', () => {
    expect(isCapEligible(makeItem('a', ItemType.HEALTH))).toBe(true);
    expect(isCapEligible(makeItem('a', ItemType.ENERGY))).toBe(true);
    expect(isCapEligible(makeItem('a', ItemType.SHIELD))).toBe(true);
    expect(isCapEligible(makeItem('a', ItemType.ARTIFACT))).toBe(true);
    expect(isCapEligible(makeItem('a', ItemType.OVERDRIVE))).toBe(true);
  });

  it('exempts XP / AMMO_PACK / WEAPON_CRATE', () => {
    expect(isCapEligible(makeItem('a', ItemType.XP))).toBe(false);
    expect(isCapEligible(makeItem('a', ItemType.AMMO_PACK))).toBe(false);
    expect(isCapEligible(makeItem('a', ItemType.WEAPON_CRATE))).toBe(false);
  });

  it('exempts DEBUFF — danger pickup must always be visible', () => {
    expect(isCapEligible(makeItem('a', ItemType.DEBUFF))).toBe(false);
  });

  it('exempts BOMB — boss reward must never auto-disappear', () => {
    expect(isCapEligible(makeItem('a', ItemType.BOMB))).toBe(false);
  });
});

describe('applyGroundItemCap', () => {
  it('passes through unchanged when under the cap', () => {
    const items = [
      makeItem('a', ItemType.HEALTH),
      makeItem('b', ItemType.ENERGY),
    ];
    expect(applyGroundItemCap(items)).toEqual(items);
  });

  it('returns a new array (does not mutate input)', () => {
    const items = [makeItem('a', ItemType.HEALTH)];
    const out = applyGroundItemCap(items);
    expect(out).not.toBe(items);
    expect(items).toHaveLength(1); // unchanged
  });

  it('drops oldest loot when over the cap (FIFO by spawn order)', () => {
    const items = [
      makeItem('a', ItemType.HEALTH),    // oldest
      makeItem('b', ItemType.ENERGY),
      makeItem('c', ItemType.SHIELD),
      makeItem('d', ItemType.ARTIFACT),  // newest — should survive
    ];
    const out = applyGroundItemCap(items, 3);
    const ids = out.map(i => i.id);
    expect(ids).not.toContain('a');
    expect(ids).toContain('b');
    expect(ids).toContain('c');
    expect(ids).toContain('d');
  });

  // ── Regression scenarios (the actual bug being fixed) ───────────────

  it('SCENARIO: 5 debuff orbs → all 5 visible (debuffs never capped)', () => {
    const items = [
      makeItem('d1', ItemType.DEBUFF),
      makeItem('d2', ItemType.DEBUFF),
      makeItem('d3', ItemType.DEBUFF),
      makeItem('d4', ItemType.DEBUFF),
      makeItem('d5', ItemType.DEBUFF),
    ];
    const out = applyGroundItemCap(items);
    expect(out).toHaveLength(5);
    expect(out.map(i => i.id)).toEqual(['d1', 'd2', 'd3', 'd4', 'd5']);
  });

  it('SCENARIO: 3 health + 1 debuff → all 4 stay (cap not hit on loot)', () => {
    const items = [
      makeItem('h1', ItemType.HEALTH),
      makeItem('h2', ItemType.HEALTH),
      makeItem('h3', ItemType.HEALTH),
      makeItem('debuff', ItemType.DEBUFF),
    ];
    const out = applyGroundItemCap(items);
    expect(out).toHaveLength(4);
    expect(out.find(i => i.id === 'debuff')).toBeDefined();
  });

  it('SCENARIO: 4 health + 1 debuff → debuff stays, oldest health dropped', () => {
    const items = [
      makeItem('h1', ItemType.HEALTH),  // oldest loot
      makeItem('h2', ItemType.HEALTH),
      makeItem('h3', ItemType.HEALTH),
      makeItem('h4', ItemType.HEALTH),
      makeItem('debuff', ItemType.DEBUFF),
    ];
    const out = applyGroundItemCap(items, 3);
    const ids = out.map(i => i.id);
    expect(ids).not.toContain('h1');     // oldest loot dropped
    expect(ids).toContain('h2');
    expect(ids).toContain('h3');
    expect(ids).toContain('h4');
    expect(ids).toContain('debuff');     // exempt — survived
  });

  it('SCENARIO: boss drops bomb + 3 health → bomb always visible', () => {
    const items = [
      makeItem('h1', ItemType.HEALTH),
      makeItem('h2', ItemType.HEALTH),
      makeItem('h3', ItemType.HEALTH),
      makeItem('bomb', ItemType.BOMB),    // boss reward
    ];
    const out = applyGroundItemCap(items, 3);
    expect(out.find(i => i.id === 'bomb')).toBeDefined();
    expect(out).toHaveLength(4); // bomb is exempt, doesn't count toward cap
  });

  it('SCENARIO: 5 health + bomb + debuff → cap loot, keep bomb + debuff', () => {
    const items = [
      makeItem('h1', ItemType.HEALTH),  // oldest
      makeItem('h2', ItemType.HEALTH),
      makeItem('bomb', ItemType.BOMB),
      makeItem('h3', ItemType.HEALTH),
      makeItem('debuff', ItemType.DEBUFF),
      makeItem('h4', ItemType.HEALTH),
      makeItem('h5', ItemType.HEALTH),
    ];
    const out = applyGroundItemCap(items, 3);
    const ids = out.map(i => i.id);
    expect(ids).not.toContain('h1');
    expect(ids).not.toContain('h2');
    expect(ids).toContain('h3');
    expect(ids).toContain('h4');
    expect(ids).toContain('h5');
    expect(ids).toContain('bomb');
    expect(ids).toContain('debuff');
  });

  it('SCENARIO: 100 XP + 5 loot → only oldest 2 loot dropped, all XP kept', () => {
    const items: Entity[] = [];
    for (let i = 0; i < 100; i++) items.push(makeItem(`xp${i}`, ItemType.XP));
    items.push(makeItem('loot1', ItemType.HEALTH));
    items.push(makeItem('loot2', ItemType.ENERGY));
    items.push(makeItem('loot3', ItemType.SHIELD));
    items.push(makeItem('loot4', ItemType.ARTIFACT));
    items.push(makeItem('loot5', ItemType.OVERDRIVE));

    const out = applyGroundItemCap(items, 3);
    const ids = out.map(i => i.id);
    // All 100 XP kept
    for (let i = 0; i < 100; i++) expect(ids).toContain(`xp${i}`);
    // Only newest 3 loot kept
    expect(ids).not.toContain('loot1');
    expect(ids).not.toContain('loot2');
    expect(ids).toContain('loot3');
    expect(ids).toContain('loot4');
    expect(ids).toContain('loot5');
  });

  it('preserves original ordering of survivors', () => {
    const items = [
      makeItem('a', ItemType.HEALTH),
      makeItem('xp1', ItemType.XP),
      makeItem('b', ItemType.HEALTH),
      makeItem('xp2', ItemType.XP),
      makeItem('c', ItemType.HEALTH),
      makeItem('d', ItemType.HEALTH),
    ];
    const out = applyGroundItemCap(items, 3);
    expect(out.map(i => i.id)).toEqual(['xp1', 'b', 'xp2', 'c', 'd']);
  });
});

describe('design constants', () => {
  it('exempt set contains the documented item types', () => {
    expect(CAP_EXEMPT_ITEM_TYPES.has(ItemType.XP)).toBe(true);
    expect(CAP_EXEMPT_ITEM_TYPES.has(ItemType.AMMO_PACK)).toBe(true);
    expect(CAP_EXEMPT_ITEM_TYPES.has(ItemType.WEAPON_CRATE)).toBe(true);
    expect(CAP_EXEMPT_ITEM_TYPES.has(ItemType.DEBUFF)).toBe(true);
    expect(CAP_EXEMPT_ITEM_TYPES.has(ItemType.BOMB)).toBe(true);
  });

  it('does NOT exempt loot pickups (sanity fence)', () => {
    expect(CAP_EXEMPT_ITEM_TYPES.has(ItemType.HEALTH)).toBe(false);
    expect(CAP_EXEMPT_ITEM_TYPES.has(ItemType.ENERGY)).toBe(false);
    expect(CAP_EXEMPT_ITEM_TYPES.has(ItemType.SHIELD)).toBe(false);
    expect(CAP_EXEMPT_ITEM_TYPES.has(ItemType.ARTIFACT)).toBe(false);
  });

  it('default cap is 3', () => {
    expect(MAX_GROUND_ITEMS).toBe(3);
  });
});
