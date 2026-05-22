import { COMPANION_IDS } from '../companions/companionDefs';
import { ARTIFACTS } from '../content/artifacts';
import { CROSS_SHIP_LOOT, getShipLootPool, UNIVERSAL_LOOT_IDS } from './shipLootDefs';

/** Catalog sizes for shop UI / balance docs (not purchasable SKUs). */
export const LOOT_VARIANT_COUNTS = {
  vaultArtifacts: Object.keys(ARTIFACTS).length,
  companions: COMPANION_IDS.length,
  shipExclusivePerShip: getShipLootPool('interceptor').length,
  crossShip: CROSS_SHIP_LOOT.length,
  universal: UNIVERSAL_LOOT_IDS.length,
} as const;

/** Artifact drop chance per kill by survival stage (design doc). */
export function getArtifactDropChance(stage: number): number {
  if (stage <= 1) return 0.05;
  if (stage === 2) return 0.15;
  if (stage === 3) return 0.25;
  if (stage === 4) return 0.4;
  return 0.5;
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
