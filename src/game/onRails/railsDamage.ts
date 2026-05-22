import { GameState } from '../types';
import { applyPlayerDamageGlitch } from '../juice/hitFeedback';
import {
  consumeRailsShield,
  isRailsInvincible,
} from './powerups';

/** Apply one hit of damage in ON_RAILS (3-HP system). Returns true if run ended. */
export function applyRailsPlayerHit(state: GameState, nowSec: number): boolean {
  const rails = state.rails;
  if (!rails || rails.outcome !== 'active') return false;

  if (state.playerIFrameTimer > 0) return false;
  if (isRailsInvincible(rails, nowSec)) return false;
  if (consumeRailsShield(rails)) {
    applyPlayerDamageGlitch(state, state.player, 'light');
    return false;
  }

  state.player.health -= 1;
  state.playerIFrameTimer = 55;
  applyPlayerDamageGlitch(state, state.player, 'hit');

  if (state.player.health <= 0) {
    state.player.health = 0;
    rails.outcome = 'failed';
    state.isGameOver = true;
    return true;
  }
  return false;
}
