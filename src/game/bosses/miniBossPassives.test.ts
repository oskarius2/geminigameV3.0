import { describe, expect, it } from 'vitest';
import { EntityType, GameState } from '../types';
import { Vector2 } from '../utils/vector';
import {
  grantMiniBossPassive,
  rollLegendaryMiniBossPassive,
  tryTemporalAnchor,
  getMiniBossOutgoingDamageMult,
} from './miniBossPassives';
import { rollMiniBossPassive } from './miniBossLoot';

function minimalState(): GameState {
  return {
    player: {
      id: 'p',
      type: EntityType.PLAYER,
      pos: new Vector2(100, 100),
      radius: 20,
      health: 50,
      maxHealth: 100,
      speed: 5,
      velocity: new Vector2(0, 0),
      color: '#fff',
    },
    passives: [],
    survivalTime: 10,
    stage: 5,
    isGameOver: false,
  } as GameState;
}

describe('miniBossPassives', () => {
  it('rolls legendary passives at low rate', () => {
    let legendary = 0;
    for (let i = 0; i < 500; i++) {
      if (rollLegendaryMiniBossPassive(i / 500)) legendary++;
    }
    expect(legendary).toBeGreaterThan(5);
    expect(legendary).toBeLessThan(80);
  });

  it('apex predator boosts outgoing damage while active', () => {
    const state = minimalState();
    grantMiniBossPassive(state, 'mb_apex_predator');
    expect(getMiniBossOutgoingDamageMult(state)).toBe(1.5);
  });

  it('temporal anchor prevents death once', () => {
    const state = minimalState();
    state.player.health = 0;
    state.healthSnapshot = { survivalTime: 8, health: 80 };
    grantMiniBossPassive(state, 'mb_temporal_anchor');
    const saved = tryTemporalAnchor(state, state.player);
    expect(saved).toBe(true);
    expect(state.player.health).toBeGreaterThan(0);
    expect(tryTemporalAnchor(state, state.player)).toBe(false);
  });

  it('stage 5 roll can return legendary passive id', () => {
    let found = false;
    for (let i = 0; i < 200; i++) {
      const id = rollMiniBossPassive('plasma_splitter', 5, 0.01);
      if (id === 'mb_apex_predator' || id === 'mb_temporal_anchor') found = true;
    }
    expect(found).toBe(true);
  });
});
