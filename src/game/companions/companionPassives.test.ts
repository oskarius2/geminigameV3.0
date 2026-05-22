import { describe, expect, it, vi } from 'vitest';
import { Vector2 } from '../utils/vector';
import { EntityType, type Entity, type GameState } from '../types';
import { createCompanionInstance } from './companionDefs';
import {
  applyCompanionPassives,
  computeCompanionPassiveStats,
  mergeActiveAbilityBuffs,
  mitigateCompanionIncomingDamage,
} from './companionPassives';

function mockState(partial: Partial<GameState> = {}): GameState {
  return {
    player: {
      id: 'p',
      type: EntityType.PLAYER,
      pos: new Vector2(0, 0),
      radius: 20,
      health: 80,
      maxHealth: 100,
      speed: 120,
      velocity: new Vector2(0, 0),
      color: '#0ff',
    },
    enemies: [],
    projectiles: [],
    activeCompanionId: 'guardian',
    companionLevel: 5,
    companionRuntime: {
      pos: new Vector2(40, 0),
      velocity: new Vector2(0, 0),
      orbitAngle: 0,
      targetEnemyId: null,
      markedEnemyId: null,
      fireCooldown: 0,
      health: 220,
      maxHealth: 220,
      abilityCooldownRemaining: 0,
      energy: 100,
      playerStats: {},
    },
    baseDamage: 20,
    gameMode: 'NORMAL',
    ...partial,
  } as GameState;
}

describe('companionPassives', () => {
  it('computeCompanionPassiveStats applies guardian modifiers', () => {
    const state = mockState();
    const instance = createCompanionInstance('guardian', 5);
    const stats = computeCompanionPassiveStats(state, instance);
    expect(stats.projectileInterceptPct).toBeGreaterThan(0);
    expect(stats.damageReflectPct).toBe(0.2);
    expect(stats.auraDamageReductionPct).toBe(0.1);
  });

  it('applyCompanionPassives heals healer drone over time', () => {
    const state = mockState({
      activeCompanionId: 'healer',
      companionLevel: 3,
    });
    const instance = createCompanionInstance('healer', 3);
    const before = state.player.health;
    applyCompanionPassives(state, instance, 1);
    expect(state.player.health).toBeGreaterThan(before);
  });

  it('mergeActiveAbilityBuffs keeps evasion burst while timer runs', () => {
    const instance = createCompanionInstance('scout', 1);
    instance.evasionBurstTimer = 1.5;
    const stats = computeCompanionPassiveStats(
      mockState({ activeCompanionId: 'scout' }),
      instance,
    );
    expect(stats.evasionBurstActive).toBeUndefined();
    mergeActiveAbilityBuffs(instance, stats);
    expect(stats.evasionBurstActive).toBe(1);
    expect(stats.damageReduction).toBeGreaterThan(0.3);
  });

  it('applyCompanionPassives boosts scout speed without compounding', () => {
    const state = mockState({ activeCompanionId: 'scout', companionLevel: 2 });
    const instance = createCompanionInstance('scout', 2);
    applyCompanionPassives(state, instance, 0.016);
    const speedAfterFirst = state.player.speed;
    applyCompanionPassives(state, instance, 0.016);
    expect(state.player.speed).toBeCloseTo(speedAfterFirst, 5);
    expect(speedAfterFirst).toBeGreaterThan(120);
  });

  it('mitigateCompanionIncomingDamage reduces damage from stat bag', () => {
    const state = mockState();
    const instance = createCompanionInstance('guardian', 5);
    applyCompanionPassives(state, instance, 0);
    const mitigated = mitigateCompanionIncomingDamage(state, 100);
    expect(mitigated).toBeLessThan(100);
  });

  it('applyCompanionPassives can intercept enemy projectiles', () => {
    const state = mockState({
      projectiles: [
        {
          id: 'proj1',
          type: EntityType.PROJECTILE,
          pos: new Vector2(45, 0),
          radius: 6,
          health: 1,
          maxHealth: 1,
          speed: 100,
          velocity: new Vector2(-1, 0),
          color: '#f00',
          damage: 20,
          ownerId: 'enemy',
        } as Entity,
      ],
    });
    const instance = createCompanionInstance('guardian', 5);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    applyCompanionPassives(state, instance, 0.016);
    expect(state.projectiles[0].health).toBe(0);
    vi.mocked(Math.random).mockRestore();
  });
});
