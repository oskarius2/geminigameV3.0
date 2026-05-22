import { ARTIFACTS } from '../content/artifacts';
import { BuffRarity, type Artifact } from '../types';

/** Maps stage pool tags → vault artifact filter. */
const POOL_TAG_MATCHERS: Record<string, (art: Artifact) => boolean> = {
  utility: (a) =>
    a.slot === 'MOBILITY' ||
    a.slot === 'ULTIMATE' ||
    Boolean(a.stats.energyMod) ||
    Boolean(a.stats.specialType),
  defense: (a) =>
    a.slot === 'ARMOR' ||
    Boolean(a.stats.healthMod) ||
    a.rarity === BuffRarity.COMMON,
  companion_basic: () => false,
  offense_basic: (a) =>
    (a.slot === 'CANNON_A' || a.slot === 'CANNON_B') &&
    (a.rarity === BuffRarity.COMMON || a.rarity === BuffRarity.RARE),
  companion_mid: () => false,
  offense_crit: (a) =>
    (a.slot === 'CANNON_A' || a.slot === 'CANNON_B') &&
    (a.rarity === BuffRarity.RARE ||
      a.rarity === BuffRarity.EPIC ||
      Boolean(a.stats.critMod)),
  companion_advanced: () => false,
  synergy: (a) =>
    a.rarity === BuffRarity.EPIC ||
    Boolean(a.stats.multiShot) ||
    Boolean(a.stats.specialType),
  legendary_basic: (a) => a.rarity === BuffRarity.LEGENDARY,
  legendary_advanced: (a) =>
    a.rarity === BuffRarity.LEGENDARY || a.rarity === BuffRarity.EXCLUSIVE,
  corrupted: (a) =>
    a.rarity === BuffRarity.EXCLUSIVE ||
    Boolean(a.stats.specialType === 'corrupted'),
};

export function artifactMatchesPoolTag(art: Artifact, tag: string): boolean {
  const matcher = POOL_TAG_MATCHERS[tag];
  return matcher ? matcher(art) : false;
}

export function filterArtifactsByPoolTags(
  artifactIds: string[],
  poolTags: string[],
): string[] {
  if (poolTags.length === 0) return artifactIds;
  return artifactIds.filter((id) => {
    const art = ARTIFACTS[id];
    if (!art) return false;
    return poolTags.some((tag) => artifactMatchesPoolTag(art, tag));
  });
}

export function pickRandomPoolTag(poolTags: string[], rng = Math.random()): string {
  return poolTags[Math.floor(rng * poolTags.length)] ?? poolTags[0];
}
