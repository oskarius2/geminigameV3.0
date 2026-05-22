import { GameState } from '../types';
import { getMiniBossDef, type MiniBossId } from './miniBossDefs';

/** Announce mini-boss entry (spawn popup + light flash). */
export function applyMiniBossSpawnJuice(state: GameState, miniBossId: MiniBossId): void {
  const def = getMiniBossDef(miniBossId);
  state.miniBossSpawnPopupTimer = 2.5;
  state.miniBossSpawnPopupText = def.displayName.toUpperCase();
  state.miniBossSpawnPopupSubtext = 'Miniboss';
  state.miniBossSpawnPopupColor = def.auraColor;
  state.screenFlash = Math.max(state.screenFlash, 4);
  state.screenFlashColor = def.auraColor;
  state.screenshake = Math.min(state.screenshake + 5, 12);
}

export function clearMiniBossHudState(state: GameState): void {
  state.miniBossPopupTimer = 0;
  state.miniBossSpawnPopupTimer = 0;
  state.miniBossIncomingTimer = 0;
  state.miniBossPopupText = undefined;
  state.miniBossPopupSubtext = undefined;
  state.miniBossSpawnPopupText = undefined;
  state.miniBossIncomingText = undefined;
}
