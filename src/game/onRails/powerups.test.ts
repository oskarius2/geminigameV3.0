import { describe, expect, it } from 'vitest';
import {
  RAILS_POWERUP_DEFS,
  applyRailsPowerup,
  railsFireIntervalMult,
  railsScoreMult,
  consumeRailsShield,
  pickWeightedRailsPowerupOnKill,
} from './powerups';
import { createRailsRunState } from './types';
import { Vector2 } from '../utils/vector';
import { EntityType } from '../types';

describe('rails powerups', () => {
  it('defines all seven kinds', () => {
    expect(Object.keys(RAILS_POWERUP_DEFS)).toHaveLength(7);
    expect(RAILS_POWERUP_DEFS.SHIELD_BUBBLE.color).toBe('#00FFFF');
  });

  it('weighted kill drop returns valid kind', () => {
    let hits = 0;
    for (let i = 0; i < 200; i++) {
      if (pickWeightedRailsPowerupOnKill()) hits++;
    }
    expect(hits).toBeGreaterThan(50);
  });

  it('applies shield and rapid fire timers', () => {
    const rails = createRailsRunState({
      id: 'tunnel_01',
      name: 'T',
      targetSeconds: 60,
      scrollSpeed: 100,
      corridorHalfWidth: 320,
      railLength: 1000,
      centerline: [{ x: 0, y: 0 }, { x: 0, y: 1000 }],
      obstacles: [],
      spawns: [],
      ambientSpawnInterval: 0,
      ambientEnemyType: 'RANGED' as never,
      ui: {
        style: 'digital',
        palette: 'cyberpunk',
        rules: [],
        difficulty: 'Easy',
        gradientFrom: '#000',
        gradientTo: '#111',
        accentText: '#fff',
        clearedTitle: 'OK',
        icon: 'tunnel',
      },
    });
    const player = {
      id: 'p',
      type: EntityType.PLAYER,
      pos: new Vector2(0, 0),
      radius: 10,
      health: 50,
      maxHealth: 100,
      speed: 0,
      velocity: new Vector2(0, 0),
      color: '#fff',
    };
    applyRailsPowerup(rails, 'SHIELD_BUBBLE', player, 0);
    expect(rails.shieldBubbleHits).toBe(1);
    expect(consumeRailsShield(rails)).toBe(true);
    expect(consumeRailsShield(rails)).toBe(false);

    applyRailsPowerup(rails, 'RAPID_FIRE', player, 10);
    expect(railsFireIntervalMult(rails, 12)).toBeCloseTo(1 / 3);
    expect(railsFireIntervalMult(rails, 20)).toBe(1);

    applyRailsPowerup(rails, 'SCORE_MULTIPLIER', player, 5);
    expect(railsScoreMult(rails, 10)).toBe(2);
    expect(railsScoreMult(rails, 20)).toBe(1);
  });
});
