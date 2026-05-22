import { describe, expect, it } from 'vitest';
import { INITIAL_STATE, spawnEnemy } from './Logic';
import { EnemyType } from './types';

describe('spawnEnemy pick mapping', () => {
  it('maps numeric spawn pick 6 to RANGED, not default CHASER', () => {
    const state = INITIAL_STATE(800, 600);
    state.bossActive = false;
    state.inBossArena = false;
    const entity = spawnEnemy(state, 6);
    expect(entity).not.toBeNull();
    expect(entity!.enemyType).toBe(EnemyType.RANGED);
    expect(entity!.color).toBe('#c084fc');
  });

  it('maps numeric spawn pick 9 to FAST', () => {
    const state = INITIAL_STATE(800, 600);
    state.bossActive = false;
    const entity = spawnEnemy(state, 9);
    expect(entity?.enemyType).toBe(EnemyType.FAST);
  });

  it('accepts EnemyType string directly', () => {
    const state = INITIAL_STATE(800, 600);
    state.bossActive = false;
    const entity = spawnEnemy(state, EnemyType.PHANTOM);
    expect(entity?.enemyType).toBe(EnemyType.PHANTOM);
    expect(entity?.color).toBe('#00d4ff');
  });
});
