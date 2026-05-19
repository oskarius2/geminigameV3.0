import { describe, expect, it } from 'vitest';
import { Entity, EntityType, GameState } from '../types';
import { Vector2 } from '../utils/vector';
import { grantExtraLife, tryTriggerExtraLife } from './extraLife';

function minimalState(): GameState {
  return {
    extraLifeCharges: 0,
    player: {
      id: 'p',
      type: EntityType.PLAYER,
      pos: new Vector2(0, 0),
      radius: 10,
      health: 0,
      maxHealth: 100,
      speed: 5,
      velocity: new Vector2(0, 0),
      color: '#fff',
    },
    playerIFrameTimer: 0,
    screenFlash: 0,
    screenshake: 0,
  } as GameState;
}

describe('extraLife', () => {
  it('grants at most one charge', () => {
    const state = minimalState();
    expect(grantExtraLife(state)).toBe(true);
    expect(grantExtraLife(state)).toBe(false);
    expect(state.extraLifeCharges).toBe(1);
  });

  it('revives at 25% hull and consumes charge', () => {
    const state = minimalState();
    grantExtraLife(state);
    const revived = tryTriggerExtraLife(state, state.player);
    expect(revived).toBe(true);
    expect(state.extraLifeCharges).toBe(0);
    expect(state.player.health).toBe(25);
  });

  it('does not revive without charge', () => {
    const state = minimalState();
    expect(tryTriggerExtraLife(state, state.player)).toBe(false);
  });
});
