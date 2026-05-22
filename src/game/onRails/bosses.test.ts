import { describe, expect, it } from 'vitest';
import {
  getRailsBossForLevel,
  getBossPhase,
  railsBossDamageMult,
} from './bosses';
import { EnemyType, EntityType } from '../types';
import { Vector2 } from '../utils/vector';

describe('rails bosses', () => {
  it('maps levels to boss ids', () => {
    expect(getRailsBossForLevel('tunnel_01')).toBe('sentinel_core');
    expect(getRailsBossForLevel('asteroid_belt')).toBe('iron_titan');
    expect(getRailsBossForLevel('void_run')).toBe('void_phantom');
  });

  it('uses health phases', () => {
    expect(getBossPhase(250, 300)).toBe(1);
    expect(getBossPhase(150, 300)).toBe(2);
    expect(getBossPhase(50, 300)).toBe(3);
  });

  it('weak point applies 2.5x damage', () => {
    const boss = {
      id: 'b',
      type: EntityType.ENEMY,
      pos: new Vector2(0, 0),
      radius: 80,
      speed: 0,
      velocity: new Vector2(0, 0),
      color: '#22d3ee',
      enemyType: EnemyType.BOSS,
      railsBossId: 'sentinel_core',
      railsWeakPointOpen: true,
      health: 100,
      maxHealth: 300,
    };
    expect(railsBossDamageMult(boss)).toBe(2.5);
    boss.railsWeakPointOpen = false;
    expect(railsBossDamageMult(boss)).toBe(1);
  });
});
