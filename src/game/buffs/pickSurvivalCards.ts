import {
  filterArtifactsByTier,
  getRunBossesDefeated,
  pickArtifact,
} from '../balance/artifactTiers';
import { ARTIFACTS } from '../content/artifacts';
import { pickBuffs } from './pickBuffs';
import { consumeLuckyArtifactPick } from '../shop/shopEffects';
import { Artifact, BuffRarity, GameState, PassiveBuff } from '../types';

export type SurvivalCardChoice =
  | { kind: 'buff'; buff: PassiveBuff }
  | { kind: 'artifact'; artifact: Artifact };

function artifactOfferChance(state: GameState): number {
  if (state.postBossBuffPick) return 0.4;
  if (state.stage >= 5) return 0.32;
  if (state.stage >= 3) return 0.24;
  if (state.stage === 2) return 0.18;
  return 0.08;
}

export function pickSurvivalCardChoices(
  state: GameState,
  unlockedArtifactIds: string[],
  count = 3,
): SurvivalCardChoice[] {
  const buffs = pickBuffs(state, count);
  const choices: SurvivalCardChoice[] = buffs.map((buff) => ({ kind: 'buff', buff }));

  const pool = unlockedArtifactIds
    .map((id) => ARTIFACTS[id])
    .filter((a): a is Artifact => !!a);

  if (pool.length === 0) return choices;

  const bossesDefeated = getRunBossesDefeated(state);
  const tierPool = filterArtifactsByTier(pool, bossesDefeated);
  const chance = artifactOfferChance(state);
  const luckyPick = consumeLuckyArtifactPick(state);
  const rarePlus = tierPool.filter(
    (a) =>
      a.rarity === BuffRarity.RARE ||
      a.rarity === BuffRarity.EPIC ||
      a.rarity === BuffRarity.LEGENDARY ||
      a.rarity === BuffRarity.EXCLUSIVE,
  );
  const artifactPool = luckyPick && rarePlus.length > 0 ? rarePlus : tierPool;

  for (let i = 0; i < choices.length; i++) {
    const forceRare = luckyPick && i === 0;
    if (forceRare || Math.random() < chance) {
      const minRarity =
        forceRare && bossesDefeated >= 1 ? BuffRarity.RARE : undefined;
      const picked =
        pickArtifact(unlockedArtifactIds, bossesDefeated, minRarity) ??
        artifactPool[Math.floor(Math.random() * artifactPool.length)];
      choices[i] = { kind: 'artifact', artifact: picked };
    }
  }

  return choices;
}

export function isArtifactChoiceId(choiceId: string): boolean {
  return !!ARTIFACTS[choiceId];
}
