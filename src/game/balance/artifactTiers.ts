import { ARTIFACTS } from '../content/artifacts';
import { artifactPowerScore } from '../content/artifacts';
import type { Artifact, GameState } from '../types';
import { BuffRarity } from '../types';

/** 1 = basic, 4 = run-breaking (post boss 3). */
export type ArtifactPowerTier = 1 | 2 | 3 | 4;

/** Always tier 4 — gated until three survival bosses defeated. */
const FORCED_TIER_4_IDS = new Set([
  'eternal_star',
  'doom_splicer',
  'event_horizon_c',
  'omega_array',
  'cataclysm_b',
  'apocalypse_lens',
  'immortal_hull',
  'infinity_drive',
  'singularity_core',
  'chronos_drive',
  'void_shard',
  'antimatter_line',
]);

export function getArtifactPowerTier(artifact: Artifact): ArtifactPowerTier {
  if (FORCED_TIER_4_IDS.has(artifact.id)) return 4;

  const score = artifactPowerScore(artifact);
  if (score >= 95 || artifact.rarity === BuffRarity.LEGENDARY) return 4;
  if (artifact.rarity === BuffRarity.EXCLUSIVE || artifact.rarity === BuffRarity.MYSTERY) {
    return 4;
  }
  if (artifact.rarity === BuffRarity.EPIC || score >= 55) return 3;
  if (artifact.rarity === BuffRarity.RARE || score >= 28) return 2;
  return 1;
}

export function getMaxArtifactTierForBossesDefeated(bossesDefeated: number): ArtifactPowerTier {
  if (bossesDefeated >= 3) return 4;
  if (bossesDefeated >= 2) return 3;
  if (bossesDefeated >= 1) return 2;
  return 1;
}

/** Survival bosses cleared this run (stage 2 ⇒ 1 boss defeated). */
export function getRunBossesDefeated(state: GameState): number {
  if (typeof state.runBossesDefeated === 'number') {
    return Math.max(0, state.runBossesDefeated);
  }
  return Math.max(0, state.stage - 1);
}

export function filterArtifactsByTier(
  artifacts: Artifact[],
  bossesDefeated: number,
): Artifact[] {
  const maxTier = getMaxArtifactTierForBossesDefeated(bossesDefeated);
  const filtered = artifacts.filter((a) => getArtifactPowerTier(a) <= maxTier);
  if (filtered.length > 0) return filtered;
  return artifacts.filter((a) => getArtifactPowerTier(a) === 1);
}

export function pickArtifact(
  unlockedIds: string[],
  bossesDefeated: number,
  preferRarity?: BuffRarity,
  rng = Math.random(),
): Artifact | null {
  const base = unlockedIds
    .map((id) => ARTIFACTS[id])
    .filter((a): a is Artifact => !!a);

  let pool = filterArtifactsByTier(base.length > 0 ? base : Object.values(ARTIFACTS), bossesDefeated);

  if (preferRarity) {
    const byRarity = pool.filter((a) => a.rarity === preferRarity);
    if (byRarity.length > 0) pool = byRarity;
  }

  if (pool.length === 0) return null;
  return pool[Math.floor(rng * pool.length)];
}
