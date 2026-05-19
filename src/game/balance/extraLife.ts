import { Entity, GameState } from '../types';
import { triggerHitFeedback } from '../juice/hitFeedback';
import { playSfx } from '../audio/sfx';

export const MAX_EXTRA_LIFE_CHARGES = 1;

/** Grant one extra-life charge (once per run cap). */
export function grantExtraLife(state: GameState): boolean {
  if (state.extraLifeCharges >= MAX_EXTRA_LIFE_CHARGES) return false;
  state.extraLifeCharges = MAX_EXTRA_LIFE_CHARGES;
  return true;
}

/**
 * When HP would hit 0: consume extra life, restore partial HP, brief invuln.
 * Returns true if death was prevented.
 */
export function tryTriggerExtraLife(state: GameState, player: Entity): boolean {
  if (state.extraLifeCharges <= 0) return false;

  state.extraLifeCharges = 0;
  player.health = Math.max(1, player.maxHealth * 0.25);
  state.playerIFrameTimer = 90;
  state.screenFlash = 12;
  state.screenshake = Math.min(state.screenshake + 8, 12);

  triggerHitFeedback(state, 'shield');
  playSfx('shield');

  return true;
}
