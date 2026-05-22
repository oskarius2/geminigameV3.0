import { BuffRarity } from '../types';
import { ARTIFACTS } from '../content/artifacts';
import type { CompanionId } from '../types';
import {
  getMetaProgress,
  getUnlockedArtifactIds,
  unlockArtifact,
  unlockCompanion,
  type MetaProgress,
} from './metaProgress';

const STAGE_MILESTONE_COUNTS: Record<number, { rarity: BuffRarity; count: number }[]> = {
  1: [{ rarity: BuffRarity.COMMON, count: 3 }],
  2: [{ rarity: BuffRarity.RARE, count: 5 }],
  3: [{ rarity: BuffRarity.EPIC, count: 8 }],
  4: [{ rarity: BuffRarity.LEGENDARY, count: 4 }],
  5: [{ rarity: BuffRarity.EXCLUSIVE, count: 2 }],
};

function pickLockedByRarity(
  rarity: BuffRarity,
  unlockedIds: string[],
  count: number,
  rng = Math.random,
): string[] {
  const pool = Object.values(ARTIFACTS).filter(
    (a) => a.rarity === rarity && !unlockedIds.includes(a.id),
  );
  const picked: string[] = [];
  const remaining = [...pool];
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const idx = Math.floor(rng() * remaining.length);
    const art = remaining.splice(idx, 1)[0];
    picked.push(art.id);
    unlockedIds.push(art.id);
  }
  return picked;
}

/** Grant stage-clear milestone artifact unlocks (run-only meta). */
export function grantStageMilestoneUnlocks(
  clearedStage: number,
  progress = getMetaProgress(),
  rng = Math.random,
): string[] {
  const tiers = STAGE_MILESTONE_COUNTS[clearedStage];
  if (!tiers) return [];

  const unlockedIds = getUnlockedArtifactIds(progress);
  const granted: string[] = [];

  for (const tier of tiers) {
    const ids = pickLockedByRarity(tier.rarity, unlockedIds, tier.count, rng);
    for (const id of ids) {
      const result = unlockArtifact(id, progress);
      if (result.newlyUnlocked) granted.push(id);
    }
  }

  return granted;
}

export function pickRandomLockedArtifact(
  unlockedIds: string[],
  preferredRarity?: BuffRarity,
  rng = Math.random,
): string | null {
  let pool = Object.values(ARTIFACTS).filter((a) => !unlockedIds.includes(a.id));
  if (preferredRarity) {
    const byRarity = pool.filter((a) => a.rarity === preferredRarity);
    if (byRarity.length > 0) pool = byRarity;
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)].id;
}

/** Meta unlock from any in-run artifact acquisition path. */
export function metaUnlockArtifactFromRun(artifactId: string): {
  newlyUnlocked: boolean;
  artifactId: string;
} {
  return unlockArtifact(artifactId);
}

export function metaUnlockCompanionFromRun(companionId: CompanionId): {
  newlyUnlocked: boolean;
  companionId: CompanionId;
} {
  return unlockCompanion(companionId);
}

export function syncUnlockedArtifactIdsToProgress(
  ids: string[],
  progress = getMetaProgress(),
): string[] {
  return getUnlockedArtifactIds(progress);
}

export function getStageMilestoneLabel(stage: number): string {
  const labels: Record<number, string> = {
    1: 'Stage 1 — Common relics',
    2: 'Stage 2 — Rare relics + first companion',
    3: 'Stage 3 — Epic relics',
    4: 'Stage 4 — Legendary relics',
    5: 'Stage 5+ — Exclusive relics',
  };
  return labels[stage] ?? `Stage ${stage}`;
}

export function estimateStageMilestoneProgress(
  progress: MetaProgress,
): { stage: number; label: string; percent: number }[] {
  const result: { stage: number; label: string; percent: number }[] = [];
  for (const stage of [1, 2, 3, 4, 5]) {
    const tiers = STAGE_MILESTONE_COUNTS[stage];
    if (!tiers) continue;
    let total = 0;
    let unlocked = 0;
    for (const tier of tiers) {
      const pool = Object.values(ARTIFACTS).filter((a) => a.rarity === tier.rarity);
      total += Math.min(tier.count, pool.length);
      for (const art of pool.slice(0, tier.count)) {
        if (progress.unlockedArtifacts[art.id]) unlocked++;
      }
    }
    const percent = total > 0 ? Math.round((unlocked / total) * 100) : 100;
    result.push({ stage, label: getStageMilestoneLabel(stage), percent });
  }
  return result;
}
