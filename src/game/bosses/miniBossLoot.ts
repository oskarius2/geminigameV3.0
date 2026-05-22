import { playArtifactAcquireSfx } from '../audio/sfx';
import { ARTIFACTS } from '../content/artifacts';
import { Artifact, BuffRarity, GameState } from '../types';
import { getMiniBossDef, type MiniBossDef, type MiniBossId } from './miniBossDefs';
import { getMiniBossPassiveChanceMultiplier } from '../balance/miniBossDifficulty';
import {
  grantMiniBossPassive,
  MINI_BOSS_PASSIVES,
  rollLegendaryMiniBossPassive,
} from './miniBossPassives';
import type { PassiveBuff } from '../types';

export interface MiniBossDefeatRewards {
  artifact: Artifact;
  passive: PassiveBuff | null;
  threatReduced: number;
}

const ARTIFACT_DROP_HEADLINE: Record<BuffRarity, string> = {
  [BuffRarity.COMMON]: 'Artifact found',
  [BuffRarity.RARE]: 'Rare artifact',
  [BuffRarity.EPIC]: 'Epic artifact',
  [BuffRarity.LEGENDARY]: 'Legendary artifact',
  [BuffRarity.EXCLUSIVE]: 'Exclusive artifact',
  [BuffRarity.MYSTERY]: 'Mystery artifact',
};

/** Plays rarity SFX; returns English toast line for HUD. */
export function notifyMiniBossArtifactDrop(artifact: Artifact): string {
  playArtifactAcquireSfx(artifact.rarity);
  const headline = ARTIFACT_DROP_HEADLINE[artifact.rarity] ?? 'Artifact found';
  return `${headline} — ${artifact.name}`;
}

function rollLootRarity(def: MiniBossDef, rng = Math.random()): BuffRarity {
  const total = def.lootTiers.reduce((s, t) => s + t.weight, 0);
  let roll = rng * total;
  for (const tier of def.lootTiers) {
    roll -= tier.weight;
    if (roll <= 0) return tier.rarity;
  }
  return def.lootTiers[def.lootTiers.length - 1].rarity;
}

function pickArtifactByRarity(
  rarity: BuffRarity,
  unlockedIds: string[],
  rng = Math.random(),
): Artifact | null {
  const pool = Object.values(ARTIFACTS).filter(
    (a) => a.rarity === rarity && !unlockedIds.includes(a.id),
  );
  const fallback = Object.values(ARTIFACTS).filter((a) => a.rarity === rarity);
  const source = pool.length > 0 ? pool : fallback.length > 0 ? fallback : Object.values(ARTIFACTS);
  if (source.length === 0) return null;
  return source[Math.floor(rng * source.length)];
}

export function rollMiniBossArtifact(
  miniBossId: MiniBossId,
  unlockedIds: string[],
  rng = Math.random(),
): Artifact | null {
  const def = getMiniBossDef(miniBossId);
  const rarity = rollLootRarity(def, rng);
  return pickArtifactByRarity(rarity, unlockedIds, rng);
}

export function rollMiniBossPassive(
  miniBossId: MiniBossId,
  stage: number,
  rng = Math.random(),
): string | null {
  if (stage >= 5) {
    const legendary = rollLegendaryMiniBossPassive(rng);
    if (legendary) return legendary;
  }

  const def = getMiniBossDef(miniBossId);
  if (def.passiveIds.length === 0) return null;
  const chance = Math.min(0.9, def.passiveDropChance * getMiniBossPassiveChanceMultiplier());
  if (Math.random() >= chance) return null;
  const idx = Math.floor(Math.random() * def.passiveIds.length);
  return def.passiveIds[idx];
}

export function applyMiniBossDefeatRewards(
  state: GameState,
  miniBossId: MiniBossId,
  unlockedArtifactIds: string[],
  rng = Math.random(),
): MiniBossDefeatRewards | null {
  const def = getMiniBossDef(miniBossId);
  const artifact = rollMiniBossArtifact(miniBossId, unlockedArtifactIds, rng);
  if (!artifact) return null;

  state.threatLevel = Math.max(0, state.threatLevel - def.threatReduction);

  let passive: PassiveBuff | null = null;
  const passiveId = rollMiniBossPassive(miniBossId, state.stage, rng);
  if (passiveId && MINI_BOSS_PASSIVES[passiveId]) {
    passive = grantMiniBossPassive(state, passiveId);
  }

  return {
    artifact,
    passive,
    threatReduced: def.threatReduction,
  };
}

export function applyMiniBossDefeatJuice(
  state: GameState,
  miniBossId: MiniBossId,
  rewards: MiniBossDefeatRewards,
): void {
  const def = getMiniBossDef(miniBossId);
  state.miniBossPopupTimer = 2;
  state.miniBossPopupText = 'Miniboss besegrad';
  state.miniBossPopupSubtext = rewards.passive
    ? `Passiv: ${rewards.passive.name}${rewards.passive.rarity === BuffRarity.LEGENDARY ? ' (Legendarisk)' : ''}`
    : 'Artefakt säkrad';
  state.miniBossPopupColor = def.auraColor;
  state.screenFlash = Math.max(state.screenFlash, 6);
  state.screenFlashColor = def.auraColor;
  state.screenshake = Math.min(state.screenshake + 8, 14);
  state.score += 500 * state.stage;
}
