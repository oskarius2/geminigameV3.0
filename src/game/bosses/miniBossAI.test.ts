import { describe, expect, it } from 'vitest';
import { INITIAL_STATE } from '../Logic';
import { EntityType, EnemyType } from '../types';
import { Vector2 } from '../utils/vector';
import { fireMiniBossShockwave } from './miniBossAI';

describe('miniBossAI crash guards', () => {
  it('fireMiniBossShockwave does not throw when enemy has no miniBossId (shockwave echo vs normal mob)', () => {
    const state = INITIAL_STATE(800, 600);
    const grunt = {
      id: 'grunt_1',
      type: EntityType.ENEMY,
      pos: new Vector2(100, 100),
      radius: 12,
      health: 50,
      maxHealth: 50,
      speed: 2,
      velocity: new Vector2(0, 0),
      color: '#f87171',
      damage: 10,
      enemyType: EnemyType.CHASER,
    };
    state.player.pos = new Vector2(120, 100);

    expect(() => fireMiniBossShockwave(state, grunt)).not.toThrow();
    expect(state.particles.length).toBeGreaterThan(0);
  });
});
