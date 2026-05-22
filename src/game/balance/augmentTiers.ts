export interface TierModifiers {
  threatFactor: number;
  enemyHpMult: number;
  enemySpeedMult: number;
  spawnChanceMult: number;
}

const TIER_TABLE: TierModifiers[] = [
  { threatFactor: 0.1, enemyHpMult: 1.0, enemySpeedMult: 1.0, spawnChanceMult: 0.92 },
  { threatFactor: 0.25, enemyHpMult: 1.1, enemySpeedMult: 1.03, spawnChanceMult: 0.96 },
  { threatFactor: 0.45, enemyHpMult: 1.25, enemySpeedMult: 1.06, spawnChanceMult: 1.0 },
  { threatFactor: 0.65, enemyHpMult: 1.4, enemySpeedMult: 1.1, spawnChanceMult: 1.03 },
  { threatFactor: 0.85, enemyHpMult: 1.55, enemySpeedMult: 1.14, spawnChanceMult: 1.06 },
];

/** Discrete difficulty step from number of augments picked this run. */
export function getAugmentTier(passiveCount: number): number {
  if (passiveCount <= 1) return 0;
  if (passiveCount <= 3) return 1;
  if (passiveCount <= 6) return 2;
  if (passiveCount <= 9) return 3;
  return 4;
}

export function getTierModifiers(tier: number): TierModifiers {
  const idx = Math.max(0, Math.min(TIER_TABLE.length - 1, tier));
  return TIER_TABLE[idx];
}

export function getTierThreatFactor(passiveCount: number): number {
  return getTierModifiers(getAugmentTier(passiveCount)).threatFactor;
}
