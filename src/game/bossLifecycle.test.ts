import { describe, expect, it } from 'vitest';
import { Vector2 } from './utils/vector';
import { EnemyType, EntityType } from './types';
import { INITIAL_STATE } from './Logic';
import {
  applyBossDefeatState,
  hasLiveBoss,
  isBossTransitioning,
} from './bossLifecycle';

describe('bossLifecycle', () => {
  it('isBossTransitioning when restore or stage warp pending', () => {
    const s = INITIAL_STATE(800, 600);
    expect(isBossTransitioning(s)).toBe(false);
    s.pendingArenaRestore = true;
    expect(isBossTransitioning(s)).toBe(true);
    s.pendingArenaRestore = false;
    s.stageTransition = 10;
    expect(isBossTransitioning(s)).toBe(true);
  });

  it('applyBossDefeatState clears boss flags and dead boss entities', () => {
    const s = INITIAL_STATE(800, 600);
    s.bossActive = true;
    s.activeBossId = 'hive_queen';
    s.inBossArena = true;
    s.enemies.push({
      id: 'b1',
      type: EntityType.ENEMY,
      active: true,
      pos: new Vector2(100, 100),
      radius: 50,
      health: 0,
      maxHealth: 100,
      speed: 0,
      velocity: new Vector2(0, 0),
      color: '#fff',
      enemyType: EnemyType.BOSS,
    });

    applyBossDefeatState(s);
    expect(s.runBossesDefeated).toBe(1);
    expect(s.bossActive).toBe(false);
    expect(s.activeBossId).toBeNull();
    expect(s.inBossArena).toBe(false);
    expect(s.pendingArenaRestore).toBe(true);
    expect(s.stageTransition).toBe(90);
    expect(hasLiveBoss(s)).toBe(false);
    // Pooling: boss slot stays in the array but is marked inactive (not removed)
    expect(s.enemies.some((e) => e.enemyType === EnemyType.BOSS && e.active !== false)).toBe(false);
  });
});
