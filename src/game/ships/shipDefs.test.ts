import { describe, expect, it } from 'vitest';
import { INITIAL_STATE } from '../Logic';
import { applyShipStats, getShipDef, SHIP_DEFINITIONS } from './shipDefs';

describe('shipDefs', () => {
  it('returns ship definitions by id', () => {
    expect(getShipDef('interceptor')).toEqual(SHIP_DEFINITIONS.interceptor);
    expect(getShipDef('unknown')).toBeNull();
  });

  it('applies ship stats to game state', () => {
    const state = INITIAL_STATE(800, 600, 'interceptor');
    state.activeTraits = [];
    applyShipStats(state, SHIP_DEFINITIONS.gunship);

    expect(state.selectedShip).toBe('gunship');
    expect(state.player.maxHealth).toBe(600); // Updated to reference design
    expect(state.player.speed).toBe(12); // Updated to reference design (120 scaled down)
    expect(state.baseDamage).toBeCloseTo(18 * 4.44); // Updated to reference design (80 damage)
    expect(state.fireRateMultiplier).toBe(0.5); // Updated to reference design (5/s)
    expect(state.passives).toContain('ship_armored_hull'); // Updated passive name
    expect(state.player.color).toBe('#991b1b'); // Updated to dark red
  });

  it('applyShipStats is idempotent for passives', () => {
    const state = INITIAL_STATE(800, 600, 'drone');
    const before = state.passives.length;
    applyShipStats(state, SHIP_DEFINITIONS.drone);
    expect(state.passives.length).toBe(before);
  });
});
