import { PASSIVE_BUFFS } from '../content/buffs';
import { GameState } from '../types';

export interface SynergyLine {
  id: string;
  text: string;
}

export function countTag(state: GameState, tag: string): number {
  let n = 0;
  for (const id of state.passives) {
    const def = PASSIVE_BUFFS[id];
    if (def?.tags?.includes(tag)) n += 1;
  }
  return n;
}

export function getActiveSynergies(state: GameState): SynergyLine[] {
  const lines: SynergyLine[] = [];
  const dmg = countTag(state, 'damage');
  const fire = countTag(state, 'fire');
  const defense = countTag(state, 'defense');
  const mobility = countTag(state, 'mobility');
  const economy = countTag(state, 'economy');

  if (dmg >= 2 && fire >= 1) {
    lines.push({ id: 'heat_chain', text: 'VÄRME ×' + dmg + ' — nästa skott sprider eld' });
  } else if (dmg >= 3) {
    lines.push({ id: 'overload', text: 'ÖVERLADDNING — +' + dmg * 25 + '% skada i kedja' });
  }

  if (defense >= 2 && state.buffs.shield > 0) {
    lines.push({ id: 'bulwark', text: 'BÅLVERK — skölden håller längre' });
  }

  if (mobility >= 2) {
    lines.push({ id: 'afterburn', text: 'EFTERBRÄNNARE — snabbare dash-återhämtning' });
  }

  if (economy >= 2) {
    lines.push({ id: 'salvage', text: 'SALVAGE — fler droppar sugs in' });
  }

  if (state.burnOnCrit) {
    lines.push({ id: 'burn_crit', text: 'BRÄNNKRIT — kritiska träffar eldar' });
  }

  if (state.permanentPiercing || state.hasInfinityPierce) {
    lines.push({ id: 'pierce', text: 'GENOMBORRNING — skott passerar fiender' });
  }

  if (state.chainCritBonus > 0.1) {
    lines.push({ id: 'chain_crit', text: 'KEDJEKRIT — krit föder krit' });
  }

  return lines.slice(0, 2);
}
