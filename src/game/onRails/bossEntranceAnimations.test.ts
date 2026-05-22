import { describe, expect, it } from 'vitest';
import {
  SENTINEL_CORE_ENTRANCE,
  IRON_TITAN_ENTRANCE,
  VOID_PHANTOM_ENTRANCE,
  beginBossEntrance,
  getBossEntranceDef,
  getBossEntranceVisuals,
  isBossEntranceActive,
  updateRailsBossEntrance,
} from './bossEntranceAnimations';
import { createRailsRunState } from './types';
import { EnemyType, EntityType } from '../types';
import { Vector2 } from '../utils/vector';

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

describe('boss entrance animations', () => {
  it('defines three entrance cinematics', () => {
    expect(SENTINEL_CORE_ENTRANCE.duration).toBe(2000);
    expect(IRON_TITAN_ENTRANCE.duration).toBe(2500);
    expect(VOID_PHANTOM_ENTRANCE.duration).toBe(3000);
    expect(getBossEntranceDef('sentinel_core').textDisplay).toContain('SENTINEL');
  });

  it('locks combat until duration elapses', () => {
    const rails = createRailsRunState(stubLevel);
    beginBossEntrance(rails, 'sentinel_core');
    expect(isBossEntranceActive(rails)).toBe(true);
    expect(rails.bossCombatActive).toBe(false);

    const state = {
      survivalTime: 0,
      screenFlash: 0,
      screenshake: 0,
      enemies: [
        {
          id: 'b',
          type: EntityType.ENEMY,
          enemyType: EnemyType.BOSS,
          railsBossId: 'sentinel_core',
          pos: new Vector2(0, 0),
          radius: 50,
          health: 300,
          maxHealth: 300,
          speed: 0,
          velocity: new Vector2(0, 0),
          color: '#0ff',
        },
      ],
      rails,
      projectiles: [],
    } as never;

    updateRailsBossEntrance(state, 1.5);
    expect(isBossEntranceActive(rails)).toBe(true);

    updateRailsBossEntrance(state, 1);
    expect(rails.bossCombatActive).toBe(true);
    expect(rails.bossEntrance).toBeNull();
  });

  it('animates sentinel fall from above', () => {
    const rails = createRailsRunState(stubLevel);
    beginBossEntrance(rails, 'sentinel_core');
    rails.bossEntrance!.elapsedMs = 0;
    const start = getBossEntranceVisuals(rails);
    rails.bossEntrance!.elapsedMs = 2000;
    const end = getBossEntranceVisuals(rails);
    expect(start?.offsetScreenY).toBe(-200);
    expect(end?.offsetScreenY).toBeCloseTo(0, 0);
    expect((end?.rotation ?? 0) > 6).toBe(true);
  });
});
