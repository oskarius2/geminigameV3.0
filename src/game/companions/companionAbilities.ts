import type { CompanionGameState } from './companionGameState';
import { CompanionType, type CompanionInstance } from './companionTypes';

function countNearbyEnemies(state: CompanionGameState, radius: number): number {
  return state.enemies.filter(
    (e) => e.type === 'ENEMY' && e.health > 0 && e.pos.distanceTo(state.player.pos) <= radius,
  ).length;
}

function countIncomingProjectiles(state: CompanionGameState, radius: number): number {
  return state.projectiles.filter(
    (p) =>
      p.ownerId !== state.player.id &&
      p.type === 'PROJECTILE' &&
      p.pos.distanceTo(state.player.pos) <= radius,
  ).length;
}

/** Context-aware ability triggers (replaces simple proximity checks). */
export function shouldTriggerCompanionAbility(
  instance: CompanionInstance,
  state: CompanionGameState,
  runtime: {
    targetEnemyId: string | null;
    playerHitsInBurst: number;
    playerHitBurstTimer: number;
  },
): boolean {
  const def = instance.type;
  if (instance.abilityCooldownRemaining && instance.abilityCooldownRemaining > 0) {
    return false;
  }

  const playerHp = state.player.health / Math.max(state.player.maxHealth, 1);
  const nearby = countNearbyEnemies(state, 220);
  const hasBoss = state.enemies.some(
    (e) => e.health > 0 && (e.miniBossId || e.enemyType === 'BOSS'),
  );

  switch (def) {
    case CompanionType.GUARDIAN:
      return (
        (playerHp < 0.4 && nearby >= 1) ||
        (hasBoss && nearby >= 1) ||
        nearby >= 2
      );
    case CompanionType.SCOUT:
      return (
        state.isPlayerDashing ||
        playerHp < 0.45 ||
        countIncomingProjectiles(state, 180) >= 3 ||
        (runtime.playerHitBurstTimer > 0 && runtime.playerHitsInBurst >= 2) ||
        state.threatLevel > 50
      );
    case CompanionType.HEALER:
      return playerHp < 0.2 || (playerHp < 0.35 && (instance.energy ?? 0) >= 30);
    case CompanionType.GUNNER:
      return (
        Boolean(runtime.targetEnemyId) &&
        (hasBoss || nearby >= 2 || nearby >= 1)
      );
    default:
      return false;
  }
}
