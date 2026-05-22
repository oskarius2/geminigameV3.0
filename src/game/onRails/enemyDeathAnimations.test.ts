import { describe, expect, it } from 'vitest';
import { beginRailsEnemyDeath, getEnemyDeathDef } from './enemyDeathAnimations';
import { EnemyType, EntityType } from '../types';
import { Vector2 } from '../utils/vector';
import { createRailsRunState } from './types';

const stubLevel = {
  id: 'tunnel_01',
  name: 'T',
  targetSeconds: 60,
  scrollSpeed: 100,
  corridorHalfWidth: 320,
  railLength: 5000,
  centerline: [{ x: 0, y: 0 }, { x: 0, y: 5000 }],
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

describe('enemy death animations', () => {
  it('has per-type durations', () => {
    expect(getEnemyDeathDef(EnemyType.SWARM_V2).durationMs).toBe(200);
    expect(getEnemyDeathDef(EnemyType.BLOCKER).durationMs).toBe(600);
  });

  it('marks dying and awards score once', () => {
    const rails = createRailsRunState(stubLevel);
    const enemy = {
      id: 'e1',
      type: EntityType.ENEMY,
      enemyType: EnemyType.RANGED,
      pos: new Vector2(10, 20),
      radius: 20,
      health: 0,
      maxHealth: 20,
      speed: 0,
      velocity: new Vector2(0, 0),
      color: '#0f0',
    };
    rails.cumulativeLengths = [0, 5000];
    const state = {
      score: 0,
      survivalTime: 5,
      particles: [],
      items: [],
      enemies: [enemy],
      rails,
    } as never;

    beginRailsEnemyDeath(state, enemy);
    expect(enemy.railsDying).toBe(true);
    expect(rails.killCount).toBe(1);
    expect(state.score).toBeGreaterThan(0);
    beginRailsEnemyDeath(state, enemy);
    expect(rails.killCount).toBe(1);
  });
});
