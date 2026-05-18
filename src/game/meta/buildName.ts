import { PASSIVE_BUFFS } from '../content/buffs';
import { GameState } from '../types';

export function getBuildName(state: GameState): string {
  const counts: Record<string, number> = {};
  for (const id of state.passives) {
    const def = PASSIVE_BUFFS[id];
    for (const tag of def?.tags ?? []) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }

  if ((counts.damage ?? 0) >= 3 && (counts.fire ?? 0) >= 1) return 'Overheat Chain';
  if ((counts.damage ?? 0) >= 4) return 'Kinetic Storm';
  if ((counts.defense ?? 0) >= 3) return 'Iron Bastion';
  if ((counts.mobility ?? 0) >= 3) return 'Ghost Runner';
  if (state.burnOnCrit && (counts.damage ?? 0) >= 2) return 'Inferno Rig';
  if (state.hasInfinityPierce || state.permanentPiercing) return 'Rail Phantom';
  if (state.passives.length >= 8) return 'Swiss Army Mech';
  if (state.passives.length <= 2) return 'Stock Loadout';
  return 'Field Prototype';
}

export function getTopPassives(state: GameState, limit = 5): { id: string; name: string; stacks: number }[] {
  const stackMap: Record<string, number> = {};
  for (const id of state.passives) {
    stackMap[id] = (stackMap[id] ?? 0) + 1;
  }
  return Object.entries(stackMap)
    .map(([id, stacks]) => ({
      id,
      stacks,
      name: PASSIVE_BUFFS[id]?.name ?? id,
    }))
    .sort((a, b) => b.stacks - a.stacks)
    .slice(0, limit);
}
