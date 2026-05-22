import { describe, expect, it } from 'vitest';
import { applyRailsPlayerHit } from './railsDamage';
import { createRailsRunState } from './types';
import { EntityType, GameState } from '../types';
import { Vector2 } from '../utils/vector';

const stubLevel = {
  id: 'tunnel_01',
  name: 'T',
  targetSeconds: 60,
  scrollSpeed: 140,
  corridorHalfWidth: 80,
  railLength: 1000,
  centerline: [{ x: 0, y: 0 }, { x: 0, y: 1000 }],
  obstacles: [],
  spawns: [],
  ambientSpawnInterval: 0,
  ambientEnemyType: 'RANGED' as never,
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

describe('railsDamage', () => {
  it('drops one HP per hit until game over', () => {
    const rails = createRailsRunState(stubLevel);
    const state = {
      survivalTime: 1,
      player: {
        id: 'p',
        type: EntityType.PLAYER,
        pos: new Vector2(0, 0),
        radius: 10,
        health: 3,
        maxHealth: 3,
        speed: 0,
        velocity: new Vector2(0, 0),
        color: '#fff',
      },
      rails,
      playerIFrameTimer: 0,
      isGameOver: false,
      screenFlash: 0,
      screenshake: 0,
    } as GameState;

    expect(applyRailsPlayerHit(state, 1)).toBe(false);
    expect(state.player.health).toBe(2);
    expect(state.screenFlash).toBeGreaterThanOrEqual(10);
    expect(state.player.hitTimer).toBeGreaterThanOrEqual(12);
    state.playerIFrameTimer = 0;
    expect(applyRailsPlayerHit(state, 2)).toBe(false);
    expect(state.player.health).toBe(1);
    state.playerIFrameTimer = 0;
    expect(applyRailsPlayerHit(state, 3)).toBe(true);
    expect(state.rails?.outcome).toBe('failed');
  });
});
