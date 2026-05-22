import { getAugmentTier } from './augmentTiers';
import { PASSIVE_BUFFS } from '../content/buffs';
import { BuffRarity, GameState } from '../types';

export {
  pickEnemyTypeForThreat,
  BASE_TYPE_CAPS,
  PICK_TO_TYPE,
  countEnemiesByType,
  getEffectiveTypeCap,
} from './spawnComposition';

const EXCLUSIVE_IDS = new Set(
  Object.values(PASSIVE_BUFFS)
    .filter((b) => b.exclusive || b.rarity === BuffRarity.EXCLUSIVE)
    .map((b) => b.id)
);

export function computeThreatLevel(state: GameState): number {
  const tier = getAugmentTier(state.passives.length);
  let score = tier * 18 + state.passives.length * 2;

  for (const id of state.passives) {
    if (EXCLUSIVE_IDS.has(id)) score += 4;
    else if (PASSIVE_BUFFS[id]?.rarity === BuffRarity.LEGENDARY) score += 2;
  }

  score += state.stage * 2;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getThreatMult(state: GameState): number {
  return 0.75 + (state.threatLevel / 100) * 1.5;
}

export type ThreatTier = 'calm' | 'pressure' | 'danger' | 'critical';

export interface ThreatVisualConfig {
  hudColor: string;
  screenVignette: number;
  particleMultiplier: number;
  musicTempo: number;
}

const THREAT_VISUAL_BY_TIER: Record<ThreatTier, ThreatVisualConfig> = {
  calm: {
    hudColor: '#3b82f6',
    screenVignette: 0.08,
    particleMultiplier: 1,
    musicTempo: 0.85,
  },
  pressure: {
    hudColor: '#f97316',
    screenVignette: 0.18,
    particleMultiplier: 2,
    musicTempo: 1.0,
  },
  danger: {
    hudColor: '#ef4444',
    screenVignette: 0.32,
    particleMultiplier: 4,
    musicTempo: 1.2,
  },
  critical: {
    hudColor: '#991b1b',
    screenVignette: 0.48,
    particleMultiplier: 8,
    musicTempo: 1.45,
  },
};

export function getThreatTier(threatLevel: number): ThreatTier {
  const clamped = Math.min(100, Math.max(0, threatLevel));
  if (clamped <= 25) return 'calm';
  if (clamped <= 50) return 'pressure';
  if (clamped <= 75) return 'danger';
  return 'critical';
}

export function getThreatVisualConfig(tier: ThreatTier | string): ThreatVisualConfig {
  const key = tier as ThreatTier;
  return THREAT_VISUAL_BY_TIER[key] ?? THREAT_VISUAL_BY_TIER.calm;
}
