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

  const chance = artifactOfferChance(state);
  const luckyPick = consumeLuckyArtifactPick(state);
  const rarePlus = pool.filter(
    (a) =>
      a.rarity === BuffRarity.RARE ||
      a.rarity === BuffRarity.EPIC ||
      a.rarity === BuffRarity.LEGENDARY ||
      a.rarity === BuffRarity.EXCLUSIVE,
  );
  const artifactPool = luckyPick && rarePlus.length > 0 ? rarePlus : pool;

  for (let i = 0; i < choices.length; i++) {
    const forceRare = luckyPick && i === 0;
    if (forceRare || Math.random() < chance) {
      choices[i] = {
        kind: 'artifact',
        artifact: artifactPool[Math.floor(Math.random() * artifactPool.length)],
      };
    }
  }

  return choices;
}

export function isArtifactChoiceId(choiceId: string): boolean {
  return !!ARTIFACTS[choiceId];
}
