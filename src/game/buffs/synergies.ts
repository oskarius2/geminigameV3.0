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
    lines.push({ id: 'heat_chain', text: 'HEAT ×' + dmg + ' — next shot spreads fire' });
  } else if (dmg >= 3) {
    lines.push({ id: 'overload', text: 'OVERCHARGE — +' + dmg * 25 + '% chained damage' });
  }

  if (defense >= 2 && state.extraLifeCharges > 0) {
    lines.push({ id: 'bulwark', text: 'BULWARK — extra life ready' });
  }

  if (mobility >= 2) {
    lines.push({ id: 'afterburn', text: 'AFTERBURNER — faster dash recovery' });
  }

  if (economy >= 2) {
    lines.push({ id: 'salvage', text: 'SALVAGE — fler droppar sugs in' });
  }

  if (state.burnOnCrit) {
    lines.push({ id: 'burn_crit', text: 'BURNCRIT — critical hits ignite' });
  }

  if (state.permanentPiercing || state.hasInfinityPierce) {
    lines.push({ id: 'pierce', text: 'PIERCING — shots pass through enemies' });
  }

  if (state.chainCritBonus > 0.1) {
    lines.push({ id: 'chain_crit', text: 'CHAINCRIT — crits breed crits' });
  }

  return lines.slice(0, 2);
}
