import { getEffectiveCardIntervalSeconds } from './buffs/cardTiming';
import { ArtifactSlot, GameState } from './types';

/** Copy hangar equipment into run state. Stat modifiers applied via applyEquippedArtifacts. */
export function applyHangarLoadout(
  state: GameState,
  equipped: Record<ArtifactSlot, string | null>
): void {
  const slots = Object.keys(equipped) as ArtifactSlot[];
  slots.forEach((slot) => {
    state.equippedArtifacts[slot] = equipped[slot];
  });
  state.cardTimer = getEffectiveCardIntervalSeconds(
    state.stage,
    state.survivalTime,
    state.passives,
    state.threatLevel,
  );
}
