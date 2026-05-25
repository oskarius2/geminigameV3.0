import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Vector2 } from '../utils/vector';
import { EntityType, type GameState } from '../types';
import {
  applyCompanionGameStateToApp,
  applyRunSliceToGameState,
  fromGameState,
  sliceRunFromGameState,
  type CompanionGameState,
} from './companionGameState';
import { applyCompanionProgressToGameState, gainXP } from './companionLeveling';

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  });
});

function mockAppState(): GameState {
  return {
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      active: true,
      pos: new Vector2(10, 20),
      radius: 20,
      health: 80,
      maxHealth: 100,
      speed: 120,
      velocity: new Vector2(0, 0),
      color: '#0ff',
    },
    enemies: [
      {
        id: 'e1',
        type: EntityType.ENEMY,
        active: true,
        pos: new Vector2(100, 0),
        radius: 18,
        health: 50,
        maxHealth: 50,
        speed: 40,
        velocity: new Vector2(0, 0),
        color: '#f00',
      },
    ],
    projectiles: [],
    items: [],
    particles: [],
    obstacles: [],
    hazards: [],
    movingHazards: [],
    movingHazardSpawnTimer: 8,
    world: { width: 2000, height: 2000 },
    camera: new Vector2(0, 0),
    activeCompanionId: 'scout',
    companionLevel: 1,
    companionXp: 0,
    companionsUnlocked: ['scout'],
    companionGrantedThisRun: true,
    selectedShip: 'striker',
    baseDamage: 25,
    companionRuntime: null,
    gameMode: 'NORMAL',
    isPaused: false,
  } as unknown as GameState;
}

describe('companionGameState', () => {
  it('fromGameState shares live player and enemy positions', () => {
    const app = mockAppState();
    const gs = fromGameState(app);
    app.player.pos.x = 99;
    expect(gs.player.pos.x).toBe(99);
    app.enemies[0].health = 10;
    expect(gs.enemies[0].health).toBe(10);
  });

  it('applyCompanionGameStateToApp syncs health and run fields', () => {
    const app = mockAppState();
    const gs: CompanionGameState = fromGameState(app);
    gs.player.health = 42;
    gs.player.speed = 200;
    gs.baseDamage = 40;
    gs.companionLevel = 3;
    gs.enemies[0].health = 5;
    applyCompanionGameStateToApp(gs, app);
    expect(app.player.health).toBe(42);
    expect(app.player.speed).toBe(200);
    expect(app.baseDamage).toBe(40);
    expect(app.companionLevel).toBe(3);
    expect(app.enemies[0].health).toBe(5);
  });

  it('fromGameState shares live projectiles array for companion bolts', () => {
    const app = mockAppState();
    const gs = fromGameState(app);
    expect(gs.projectiles).toBe(app.projectiles);
    gs.projectiles.push({
      id: 'bolt-1',
      type: EntityType.PROJECTILE,
      active: true,
      pos: new Vector2(0, 0),
      radius: 3,
      health: 1,
      maxHealth: 1,
      speed: 10,
      velocity: new Vector2(1, 0),
      color: '#fff',
      ownerId: 'companion_scout',
      damage: 10,
    });
    expect(app.projectiles).toHaveLength(1);
    expect(app.projectiles[0].ownerId).toBe('companion_scout');
  });

  it('applyCompanionProgressToGameState loads persisted meta into app state', () => {
    gainXP('scout', 400);
    const app = mockAppState();
    applyCompanionProgressToGameState(app);
    expect(app.companionXp).toBe(400);
    expect(app.companionLevel).toBeGreaterThanOrEqual(2);
  });
});
