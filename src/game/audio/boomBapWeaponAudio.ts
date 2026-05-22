import type { GameState } from '../types';
import { AudioManager } from './AudioManager';
import { playShipShootSfx } from './sfx';
import { shootSfxForSlot } from '../juice/hitFeedback';

/** Boom-bap weapon one-shots; procedural fallback when WAVs missing. */
export function playPlayerWeaponAudio(
  state: GameState,
  screenX?: number,
  viewWidth?: number
): void {
  if (AudioManager.isWeaponPackReady()) {
    if (state.activeWeaponSlot === 'CANNON_B') {
      AudioManager.playWeapon2();
    } else {
      AudioManager.playWeapon1();
    }
    return;
  }
  shootSfxForSlot(state.activeWeaponSlot, state.selectedShip, screenX, viewWidth);
}

export function playWeaponDryFire(): void {
  if (AudioManager.isWeaponPackReady()) {
    AudioManager.playEmpty();
  }
}

export function playWeaponReload(): void {
  if (AudioManager.isWeaponPackReady()) {
    AudioManager.playReload();
  }
}
