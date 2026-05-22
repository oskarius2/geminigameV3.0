import { describe, expect, it } from 'vitest';
import {
  RAILS_ENEMY_DEFS,
  RAILS_WAVES_TUNNEL_01,
  RAILS_WAVES_ASTEROID,
  processRailsWaves,
} from './enemies';
import { EnemyType, GameState } from '../types';
import { createRailsRunState } from './types';
import { buildCumulativeLengths } from './geometry';

const stubLevel = {
  id: 'tunnel_01',
  name: 'Tunnel',
  targetSeconds: 60,
  scrollSpeed: 100,
  corridorHalfWidth: 320,
  railLength: 5000,
  centerline: [
    { x: 100, y: 0 },
    { x: 100, y: 5000 },
  ],
  obstacles: [],
  spawns: [],
  ambientSpawnInterval: 0,
  ambientEnemyType: EnemyType.RANGED,
  ui: {
    style: 'digital' as const,
    palette: 'cyberpunk' as const,
    rules: [],
    difficulty: 'Easy' as const,
    gradientFrom: '#000',
    gradientTo: '#111',
    accentText: '#fff',
    clearedTitle: 'OK',
    icon: 'tunnel' as const,
  },
};

describe('rails enemies', () => {
  it('has stats for all six archetypes', () => {
    expect(RAILS_ENEMY_DEFS[EnemyType.RANGED]?.health).toBe(20);
    expect(RAILS_ENEMY_DEFS[EnemyType.DASHER]?.collisionDamage).toBe(20);
    expect(RAILS_ENEMY_DEFS[EnemyType.BLOCKER]?.health).toBe(50);
    expect(RAILS_ENEMY_DEFS[EnemyType.CHARGER]?.collisionDamage).toBe(30);
  });

  it('tunnel wave schedule matches spec timing', () => {
    expect(RAILS_WAVES_TUNNEL_01[0].startSec).toBe(0);
    expect(RAILS_WAVES_TUNNEL_01[1].startSec).toBe(20);
    expect(RAILS_WAVES_TUNNEL_01[2].startSec).toBe(40);
    expect(RAILS_WAVES_ASTEROID.length).toBe(4);
  });

  it('spawns first wave when survival time reached', () => {
    const cumulative = buildCumulativeLengths(stubLevel.centerline);
    const rails = {
      ...createRailsRunState(stubLevel),
      cumulativeLengths: cumulative,
      centerline: [...stubLevel.centerline],
      distance: 100,
    };
    const state = {
      survivalTime: 1,
      enemies: [],
      items: [],
      player: { pos: { x: 100, y: 0 } },
      rails,
    } as Pick<GameState, 'survivalTime' | 'enemies' | 'items' | 'player' | 'rails'>;

    processRailsWaves(state as GameState);
    expect(rails.triggeredWaveIds).toContain('t1_intro');
    expect(state.enemies.length).toBeGreaterThan(0);
  });
});
