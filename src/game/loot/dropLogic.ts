import { COMPANION_IDS } from '../companions/companionDefs';
import { ARTIFACTS } from '../content/artifacts';
import { getDifficultyForStage } from '../progression/difficultyConfig';
import { CROSS_SHIP_LOOT, getShipLootPool, UNIVERSAL_LOOT_IDS } from './shipLootDefs';

/** Catalog sizes for shop UI / balance docs (not purchasable SKUs). */
export const LOOT_VARIANT_COUNTS = {
  vaultArtifacts: Object.keys(ARTIFACTS).length,
  companions: COMPANION_IDS.length,
  shipExclusivePerShip: getShipLootPool('interceptor').length,
  crossShip: CROSS_SHIP_LOOT.length,
  universal: UNIVERSAL_LOOT_IDS.length,
} as const;

/** Artifact drop chance per kill by survival stage. */
export function getArtifactDropChance(stage: number): number {
  return getDifficultyForStage(stage).artifactDropRate;
}

/** Additional companion unlock chance per kill (stage 2 first grant is guaranteed elsewhere). */
export function getCompanionDropChance(stage: number): number {
  if (stage < 3) return 0;
  if (stage === 3) return 0.05;
  if (stage === 4) return 0.08;
  return 0.1;
}

export function pickLootPool(rng = Math.random()): 'ship_artifact' | 'universal' | 'cross_ship' {
  if (rng < 0.7) return 'ship_artifact';
  if (rng < 0.9) return 'universal';
  return 'cross_ship';
}
