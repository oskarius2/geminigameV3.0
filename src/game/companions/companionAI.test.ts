import { describe, expect, it } from 'vitest';
import { Vector2 } from '../utils/vector';
import { EntityType, EnemyType, type Entity, type GameState } from '../types';
import {
  TargetSelectionStrategy,
  ensureCompanionRuntime,
  getCompanionHudSnapshot,
  getTargetSelectionStrategy,
  selectClosestEnemy,
  selectHighestThreat,
  selectTarget,
  updateCompanionPosition,
  shouldUseActiveAbility,
} from './companionAI';
import { CompanionType, createCompanionInstance, getCompanionDef } from './companionDefs';
import { CompanionAIState } from './companionTypes';

function mockEnemy(id: string, x: number, y: number, opts: Partial<Entity> = {}): Entity {
  return {
    id,
    type: EntityType.ENEMY,
    pos: new Vector2(x, y),
    radius: 20,
    health: 100,
    maxHealth: 100,
    speed: 50,
    velocity: new Vector2(0, 0),
    color: '#f00',
    enemyType: EnemyType.CHASER,
    damage: 10,
    ...opts,
  };
}

function mockState(partial: Partial<GameState> = {}): GameState {
  return {
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      pos: new Vector2(0, 0),
      radius: 20,
      health: 50,
      maxHealth: 100,
      speed: 100,
      velocity: new Vector2(0, 0),
      color: '#0ff',
      aimDir: new Vector2(1, 0),
    },
    enemies: [],
    projectiles: [],
    items: [],
    particles: [],
    obstacles: [],
    hazards: [],
    world: { width: 2000, height: 2000 },
    camera: new Vector2(0, 0),
    activeCompanionId: 'guardian',
    companionLevel: 1,
    companionXp: 0,
    companionRuntime: null,
    gameMode: 'NORMAL',
    isPaused: false,
    ...partial,
  } as GameState;
}

describe('companionAI', () => {
  it('maps companion types to target strategies', () => {
    expect(getTargetSelectionStrategy(CompanionType.GUARDIAN)).toBe(
      TargetSelectionStrategy.CLOSEST_ENEMY,
    );
    expect(getTargetSelectionStrategy(CompanionType.SCOUT)).toBe(
      TargetSelectionStrategy.HIGHEST_THREAT,
    );
    expect(getTargetSelectionStrategy(CompanionType.GUNNER)).toBe(
      TargetSelectionStrategy.PLAYER_AIM,
    );
  });

  it('selectClosestEnemy picks nearest', () => {
    const enemies = [
      mockEnemy('a', 100, 0),
      mockEnemy('b', 30, 0),
      mockEnemy('c', 200, 0),
    ];
    expect(selectClosestEnemy(enemies, new Vector2(0, 0))?.id).toBe('b');
  });

  it('selectHighestThreat prefers dangerous nearby enemies', () => {
    const enemies = [
      mockEnemy('far', 400, 0, { damage: 50 }),
      mockEnemy('boss', 80, 0, { enemyType: EnemyType.BOSS, damage: 20 }),
    ];
    expect(selectHighestThreat(enemies, new Vector2(0, 0))?.id).toBe('boss');
  });

  it('updateCompanionPosition moves runtime pos toward orbit', () => {
    const state = mockState({
      enemies: [mockEnemy('e1', 120, 0)],
    companionRuntime: {
      pos: new Vector2(0, 0),
      velocity: new Vector2(0, 0),
      moveVelocity: new Vector2(0, 0),
      orbitAngle: 0,
      targetEnemyId: null,
      markedEnemyId: null,
      fireCooldown: 0,
      health: 100,
      maxHealth: 100,
      abilityCooldownRemaining: 0,
      energy: 100,
      playerStats: {},
      aiState: CompanionAIState.IDLE,
      stateTimer: 0,
      orbitRadiusOffset: 0,
      facingAngle: 0,
      hitFlashTimer: 0,
      abilityPulseTimer: 0,
      attackPulseTimer: 0,
      levelUpPulseTimer: 0,
      isAttacking: false,
      visualTime: 0,
      playerHitBurstTimer: 0,
      playerHitsInBurst: 0,
    },
    });
    const instance = createCompanionInstance('guardian', 1);
    const def = getCompanionDef(CompanionType.GUARDIAN)!;
    const before = state.companionRuntime!.pos.clone();
    updateCompanionPosition(instance, state.companionRuntime!, state, def, 0.1);
    const after = state.companionRuntime!.pos;
    expect(after.distanceTo(before)).toBeGreaterThan(0);
    expect(state.companionRuntime!.targetEnemyId).toBe('e1');
  });

  it('shouldUseActiveAbility triggers guardian taunt with multiple nearby enemies', () => {
    const state = mockState({
      enemies: [mockEnemy('e1', 50, 0), mockEnemy('e2', -40, 30)],
    });
    ensureCompanionRuntime(state);
    const instance = createCompanionInstance('guardian', 1);
    expect(shouldUseActiveAbility(instance, state)).toBe(true);
  });

  it('getCompanionHudSnapshot exposes HUD fields', () => {
    const state = mockState({ companionLevel: 3 });
    ensureCompanionRuntime(state);
    const snap = getCompanionHudSnapshot(state);
    expect(snap?.companionId).toBe('guardian');
    expect(snap?.level).toBe(3);
    expect(snap?.maxHealth).toBeGreaterThan(0);
    expect(snap?.abilityCooldownMax).toBeGreaterThan(0);
  });

  it('selectTarget returns null for healer orbit strategy', () => {
    const state = mockState({ enemies: [mockEnemy('e1', 50, 0)], activeCompanionId: 'healer' });
    const instance = createCompanionInstance('healer', 1);
    const def = getCompanionDef(CompanionType.HEALER)!;
    expect(selectTarget(instance, state, def)).toBeNull();
  });
});
