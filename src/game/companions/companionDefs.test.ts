import { describe, expect, it } from 'vitest';
import {
  COMPANION_DEFINITIONS,
  CompanionType,
  createCompanionInstance,
  getCompanionDef,
  getCompanionLevelFromXp,
  getCompanionScaling,
  getRecommendedCompanion,
  getScaledCompanionStats,
  useCompanionAbility,
} from './companionDefs';
import { computeCompanionPassiveStats } from './companionPassives';
import { EntityType, type GameState } from '../types';
import { Vector2 } from '../utils/vector';

describe('companionDefs', () => {
  it('recommends ship-synergistic companions', () => {
    expect(getRecommendedCompanion('interceptor')).toBe('scout');
    expect(getRecommendedCompanion('gunship')).toBe('guardian');
    expect(getRecommendedCompanion('drone')).toBe('healer');
  });

  it('levels from XP thresholds', () => {
    expect(getCompanionLevelFromXp(0)).toBe(1);
    expect(getCompanionLevelFromXp(50)).toBe(2);
    expect(getCompanionLevelFromXp(700)).toBe(5);
  });

  it('exposes scaling per level with level 5 bonus', () => {
    const scaling = getCompanionScaling('guardian', 5);
    expect(scaling?.damageAbsorbPct).toBe(0.25);
    expect(scaling?.bonusPassive).toBeTruthy();
  });

  it('defines all four companion types', () => {
    expect(Object.keys(COMPANION_DEFINITIONS)).toHaveLength(4);
  });

  it('getCompanionDef returns rich defs by type and id', () => {
    const byType = getCompanionDef(CompanionType.GUARDIAN);
    const byId = getCompanionDef('guardian');
    expect(byType?.id).toBe('guardian');
    expect(byId?.passives).toHaveLength(3);
    expect(byId?.activeAbility?.name).toBe('Taunt');
  });

  it('getScaledCompanionStats merges base and level scaling', () => {
    const stats = getScaledCompanionStats('gunner', 3);
    expect(stats?.attackDamage).toBe(35);
    expect(stats?.fireRate).toBe(8);
  });

  it('computeCompanionPassiveStats mutates player stats', () => {
    const instance = createCompanionInstance('guardian', 5);
    const state = {
      player: {
        id: 'p',
        type: EntityType.PLAYER,
        pos: new Vector2(0, 0),
        radius: 20,
        health: 100,
        maxHealth: 100,
        speed: 100,
        velocity: new Vector2(0, 0),
        color: '#0ff',
      },
      companionLevel: 5,
    } as GameState;
    const stats = computeCompanionPassiveStats(state, instance);
    expect(stats.projectileInterceptPct).toBeGreaterThan(0);
    expect(stats.damageReflectPct).toBe(0.2);
    expect(stats.auraDamageReductionPct).toBe(0.1);
  });

  it('useCompanionAbility applies taunt and starts cooldown', () => {
    const instance = createCompanionInstance('guardian', 1);
    const playerStats: Record<string, number> = {};
    const fired = useCompanionAbility(instance, playerStats);
    expect(fired).toBe(true);
    expect(playerStats.tauntActive).toBe(1);
    expect(instance.abilityCooldownRemaining).toBe(12);
    expect(useCompanionAbility(instance, playerStats)).toBe(false);
  });
});
