import { describe, expect, it } from 'vitest';
import { Vector2 } from '../utils/vector';
import { EntityType } from '../types';
import { createCompanionInstance } from './companionDefs';
import { fromGameState } from './companionGameState';
import { applyScoutCombat } from './companionCombat';
import type { CompanionRuntime } from './companionTypes';
import { CompanionAIState } from './companionTypes';

function mockRuntime(): CompanionRuntime {
  return {
    pos: new Vector2(100, 100),
    velocity: new Vector2(0, 0),
    orbitAngle: 0,
    targetEnemyId: 'e1',
    markedEnemyId: 'e1',
    fireCooldown: 0,
    health: 80,
    maxHealth: 80,
    abilityCooldownRemaining: 0,
    energy: 100,
    playerStats: {},
    aiState: CompanionAIState.COMBAT,
    stateTimer: 0,
    moveVelocity: new Vector2(0, 0),
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
  };
}

describe('companionCombat', () => {
  it('applyScoutCombat adds bolts to app projectiles', () => {
    const app = {
      player: {
        id: 'player',
        type: EntityType.PLAYER,
        pos: new Vector2(100, 100),
        radius: 20,
        health: 100,
        maxHealth: 100,
        speed: 9,
        velocity: new Vector2(0, 0),
        color: '#0ff',
      },
      enemies: [
        {
          id: 'e1',
          type: EntityType.ENEMY,
          pos: new Vector2(140, 100),
          radius: 18,
          health: 50,
          maxHealth: 50,
          speed: 40,
          velocity: new Vector2(0, 0),
          color: '#f00',
        },
      ],
      projectiles: [],
      gameMode: 'NORMAL',
      isPaused: false,
      activeCompanionId: 'scout',
      companionLevel: 1,
      baseDamage: 30,
    } as import('../types').GameState;

    const gs = fromGameState(app);
    const instance = createCompanionInstance('scout', 1);
    const runtime = mockRuntime();
    gs.companionRuntime = runtime;

    applyScoutCombat(instance, runtime, gs, 1 / 60);

    expect(app.projectiles.length).toBeGreaterThan(0);
    expect(app.projectiles[0].ownerId).toBe('companion_scout');
    expect(app.projectiles[0].health).toBe(Number.POSITIVE_INFINITY);
  });

  it('companion bolts survive projectile health filter', () => {
    const bolt = {
      id: 'bolt-filter',
      type: EntityType.PROJECTILE,
      pos: new Vector2(50, 50),
      radius: 3,
      health: Number.POSITIVE_INFINITY,
      maxHealth: Number.POSITIVE_INFINITY,
      speed: 15,
      velocity: new Vector2(1, 0),
      color: '#67e8f9',
      ownerId: 'companion_scout',
      damage: 10,
    };
    const kept = [bolt].filter((p) => {
      if (!p?.pos) return false;
      if (p.ownerId?.startsWith('companion_')) {
        return p.health == null || p.health > 0;
      }
      return p.health > 0;
    });
    expect(kept).toHaveLength(1);
  });
});
