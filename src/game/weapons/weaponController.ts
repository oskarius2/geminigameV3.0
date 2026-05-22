import type { GameState } from '../types';
import { isReloading, startReload, updateReload } from './reloadController';
import {
  artifactSlotToWeaponIndex,
  getActiveWeaponSlot,
  isWeaponSlotUnlocked,
  setActiveWeaponSlot,
  updateWeaponSwitch,
  weaponIndexToArtifactSlot,
  type WeaponState,
} from './weaponState';

export function isAmmoSystemEnabled(state: GameState): boolean {
  return state.gameMode === 'NORMAL' || state.gameMode === 'SURVIVAL';
}

export function tickWeaponSystems(
  weaponState: WeaponState,
  deltaMs: number
): WeaponState {
  return updateReload(updateWeaponSwitch(weaponState, deltaMs), deltaMs);
}

export function syncGameStateWeaponSlot(state: GameState): GameState {
  if (!state.weaponState || !isAmmoSystemEnabled(state)) return state;
  const artifactSlot = weaponIndexToArtifactSlot(state.weaponState.activeSlot);
  if (state.activeWeaponSlot === artifactSlot) return state;
  return { ...state, activeWeaponSlot: artifactSlot };
}

export function setGameWeaponSlot(
  state: GameState,
  artifactSlot: 'CANNON_A' | 'CANNON_B'
): GameState {
  if (!state.weaponState || !isAmmoSystemEnabled(state)) {
    return { ...state, activeWeaponSlot: artifactSlot };
  }
  const idx = artifactSlotToWeaponIndex(artifactSlot);
  if (idx == null) return { ...state, activeWeaponSlot: artifactSlot };
  if (!isWeaponSlotUnlocked(state.weaponState, idx)) {
    return state;
  }
  return {
    ...state,
    activeWeaponSlot: artifactSlot,
    weaponState: setActiveWeaponSlot(state.weaponState, idx),
  };
}

/**
 * Gate player firing: primary unlimited; secondary consumes magazine + auto-reload.
 */
export function tryConsumeAmmoForShot(state: GameState): {
  state: GameState;
  didFire: boolean;
} {
  if (!isAmmoSystemEnabled(state) || !state.weaponState) {
    return { state, didFire: true };
  }

  let ws = state.weaponState;

  if (ws.switchState.isSwitching || isReloading(ws)) {
    return { state, didFire: false };
  }

  const slot = getActiveWeaponSlot(ws);
  if (!slot || !slot.isUnlocked) {
    return { state, didFire: false };
  }

  if (slot.isUnlimited) {
    return {
      state: syncGameStateWeaponSlot({ ...state, weaponState: ws }),
      didFire: true,
    };
  }

  if (slot.ammoLoaded <= 0) {
    if (slot.ammoReserve > 0) {
      ws = startReload(ws, slot.weaponId);
      return { state: { ...state, weaponState: ws }, didFire: false };
    }
    const slots = [...ws.slots] as WeaponState['slots'];
    slots[ws.activeSlot] = { ...slot, isDisabledUI: true };
    return { state: { ...state, weaponState: { ...ws, slots } }, didFire: false };
  }

  const slots = [...ws.slots] as WeaponState['slots'];
  const newLoaded = slot.ammoLoaded - 1;
  slots[ws.activeSlot] = {
    ...slot,
    ammoLoaded: newLoaded,
    isDisabledUI: newLoaded === 0 && slot.ammoReserve === 0,
  };
  ws = { ...ws, slots };

  if (newLoaded === 0 && slot.ammoReserve > 0) {
    ws = startReload(ws, slot.weaponId);
  }

  return {
    state: syncGameStateWeaponSlot({ ...state, weaponState: ws }),
    didFire: true,
  };
}

export function tickAmmoOnFrame(state: GameState, deltaMs: number): GameState {
  if (!state.weaponState || !isAmmoSystemEnabled(state)) return state;
  const weaponState = tickWeaponSystems(state.weaponState, deltaMs);
  return syncGameStateWeaponSlot({ ...state, weaponState });
}
