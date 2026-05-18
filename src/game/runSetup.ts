import { ARTIFACTS } from './content/artifacts';
import { getCardIntervalSeconds } from './buffs/cardTiming';
import { ArtifactSlot, GameState } from './types';

export function applyHangarLoadout(
  state: GameState,
  equipped: Record<ArtifactSlot, string | null>
): void {
  const slots = Object.keys(equipped) as ArtifactSlot[];
  slots.forEach((slot) => {
    const artId = equipped[slot];
    if (!artId || !ARTIFACTS[artId]) return;
    state.equippedArtifacts[slot] = artId;
    const art = ARTIFACTS[artId];
    if (slot === 'ARMOR' && art.stats.healthMod) {
      state.player.maxHealth += art.stats.healthMod;
    }
    if (slot === 'MOBILITY') {
      if (art.stats.speedMod) state.player.speed *= art.stats.speedMod;
      if (art.stats.energyMod) state.maxEnergy += art.stats.energyMod;
    }
    if (art.stats.critMod) state.critChance += art.stats.critMod;
    if (art.stats.multiShot) state.multiShot += art.stats.multiShot;
  });
  state.player.health = state.player.maxHealth;
  state.cardTimer = getCardIntervalSeconds(state.stage, state.survivalTime, state.passives.length);
}
