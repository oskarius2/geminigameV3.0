import { GameState } from '../types';

export function scrapMultiplier(state: GameState): number {
  let mult = state.activeTraits.includes('scavenger') ? 1.5 : 1;
  if (state.activeTraits.includes('efficient')) mult *= 1.2;
  if (state.activeTraits.includes('fuel_leak')) mult *= 0.85;
  return mult;
}

export function computeRunEndScrap(state: GameState): number {
  const base = Math.floor(state.stage * 10 + state.score / 1000);
  return Math.max(0, Math.floor(base * scrapMultiplier(state)));
}

export function computeBossScrapBonus(stage: number): number {
  return Math.floor((15 + stage * 5) * 1);
}

export function computeStageClearScrap(stage: number): number {
  return 8 + stage * 4;
}

/** Small in-run tally from kills (banked to meta at run end with rest). */
export function scrapFromKill(state: GameState): number {
  if (Math.random() >= 0.12) return 0;
  const stageMult = 1 + (Math.min(5, state.stage) - 1) * 0.15;
  return Math.max(1, Math.floor(scrapMultiplier(state) * stageMult));
}
