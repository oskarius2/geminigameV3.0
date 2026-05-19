import type { HitKind } from '../juice/hitFeedback';

export type CombatDensityTier = 'low' | 'medium' | 'high' | 'extreme';

export function getCombatDensityTier(enemyCount: number): CombatDensityTier {
  if (enemyCount < 25) return 'low';
  if (enemyCount < 50) return 'medium';
  if (enemyCount < 80) return 'high';
  return 'extreme';
}

export function shouldApplyKnockback(
  tier: CombatDensityTier,
  isCrit: boolean,
  isKill: boolean,
  isBoss: boolean
): boolean {
  if (tier === 'low') return true;
  if (tier === 'medium') return isCrit || isKill || isBoss;
  if (tier === 'high') return isCrit || isKill || isBoss;
  return false;
}

export function shouldApplyHitTimer(
  tier: CombatDensityTier,
  isCrit: boolean,
  isKill: boolean
): boolean {
  if (tier === 'low' || tier === 'medium') return true;
  return isCrit || isKill;
}

export function shouldTriggerHitFeedback(
  tier: CombatDensityTier,
  kind: HitKind
): boolean {
  if (kind === 'crit' || kind === 'boss' || kind === 'shield') return true;
  if (tier === 'low') return true;
  if (tier === 'medium') return kind === 'normal' ? Math.random() < 0.33 : true;
  return false;
}

export function shouldDrawEnemyTrails(tier: CombatDensityTier): boolean {
  return tier === 'low' || tier === 'medium';
}

export function shouldDrawPlexusLinks(enemyCount: number, tier: CombatDensityTier): boolean {
  return enemyCount < 80 && (tier === 'low' || tier === 'medium');
}

export function shouldForceLowQuality(tier: CombatDensityTier): boolean {
  return tier === 'extreme';
}
