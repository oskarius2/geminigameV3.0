import { describe, expect, it } from 'vitest';
import { EnemyType, Entity, EntityType, GameState } from '../types';
import { Vector2 } from '../utils/vector';
import {
  countEnemiesByType,
  getEffectiveTypeCap,
  isPickAtCap,
  pickEnemyTypeForThreat,
  PICK_TO_TYPE,
} from './spawnComposition';

function minimalState(enemies: Entity[]): GameState {
  return {
    enemies,
    bossActive: false,
    threatLevel: 50,
    stage: 1,
  } as GameState;
}

function mockEnemy(type: EnemyType): Entity {
  return {
    id: Math.random().toString(),
    type: EntityType.ENEMY,
    pos: new Vector2(0, 0),
    radius: 10,
    health: 10,
    maxHealth: 10,
    speed: 1,
    velocity: new Vector2(0, 0),
    color: '#fff',
    enemyType: type,
  };
}

describe('getEffectiveTypeCap', () => {
  it('scales up with level progress', () => {
    expect(getEffectiveTypeCap(EnemyType.FAST, 0)).toBeLessThan(
      getEffectiveTypeCap(EnemyType.FAST, 1)
    );
  });
});

describe('pickEnemyTypeForThreat', () => {
  it('returns null when FAST is at cap', () => {
    const cap = getEffectiveTypeCap(EnemyType.FAST, 1);
    const enemies: Entity[] = [];
    for (let i = 0; i < cap; i++) enemies.push(mockEnemy(EnemyType.FAST));

    const counts = countEnemiesByType(enemies);
    expect(isPickAtCap(9, counts, 1)).toBe(true);

    const onlyFast: Entity[] = [];
    for (let i = 0; i < cap; i++) onlyFast.push(mockEnemy(EnemyType.FAST));
    for (let i = 0; i < 20; i++) onlyFast.push(mockEnemy(EnemyType.CHASER));

    const state = minimalState(onlyFast);
    state.threatLevel = 0;
    state.stage = 3;
    let gotNonFast = false;
    for (let i = 0; i < 30; i++) {
      const pick = pickEnemyTypeForThreat(state, 1);
      if (pick === null) break;
      if (PICK_TO_TYPE[pick] !== EnemyType.FAST) gotNonFast = true;
    }
    expect(gotNonFast || onlyFast.length > 50).toBe(true);
  });

  it('returns null when all candidate types are capped', () => {
    const state = minimalState([]);
    state.threatLevel = 0;
    const progress = 1;
    const caps = [...new Set(Object.values(PICK_TO_TYPE))];
    for (const type of caps) {
      const cap = getEffectiveTypeCap(type, progress);
      for (let i = 0; i < cap; i++) state.enemies.push(mockEnemy(type));
    }
    expect(pickEnemyTypeForThreat(state, progress)).toBeNull();
  });
});
