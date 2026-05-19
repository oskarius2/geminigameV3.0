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
