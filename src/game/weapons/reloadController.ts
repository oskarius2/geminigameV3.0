import { playWeaponReload } from '../audio/boomBapWeaponAudio';
import { getWeaponDef, type WeaponId } from './weaponDefs';
import {
  cloneWeaponState,
  getActiveWeaponSlot,
  type WeaponState,
} from './weaponState';

export function updateReload(
  weaponState: WeaponState,
  deltaMs: number
): WeaponState {
  if (!weaponState.reloadState?.isReloading) return weaponState;

  const next = cloneWeaponState(weaponState);
  const reload = next.reloadState!;
  const def = getWeaponDef(reload.weaponId);
  const totalMs = def.reloadTime * 1000;

  reload.timeRemaining = Math.max(0, reload.timeRemaining - deltaMs);
  reload.progress = totalMs > 0 ? 1 - reload.timeRemaining / totalMs : 1;

  if (reload.timeRemaining <= 0) {
    const slot = next.slots[next.activeSlot];
    if (slot && slot.weaponId === reload.weaponId && !slot.isUnlimited) {
      const ammoToLoad = Math.min(
        def.magazineSize - slot.ammoLoaded,
        slot.ammoReserve
      );
      const updatedSlot = {
        ...slot,
        ammoLoaded: slot.ammoLoaded + ammoToLoad,
        ammoReserve: slot.ammoReserve - ammoToLoad,
        isDisabledUI:
          slot.ammoLoaded + ammoToLoad === 0 && slot.ammoReserve - ammoToLoad <= 0,
      };
      next.slots = [...next.slots] as WeaponState['slots'];
      next.slots[next.activeSlot] = updatedSlot;
    }
    next.reloadState = null;
  }

  return next;
}

export function startReload(
  weaponState: WeaponState,
  weaponId: WeaponId
): WeaponState {
  const slot = getActiveWeaponSlot(weaponState);
  if (!slot || slot.weaponId !== weaponId) return weaponState;
  if (slot.isUnlimited) return weaponState;
  if (weaponState.reloadState?.isReloading) return weaponState;
  if (slot.ammoLoaded >= getWeaponDef(weaponId).magazineSize) return weaponState;
  if (slot.ammoReserve <= 0) return weaponState;

  const def = getWeaponDef(weaponId);
  const next = cloneWeaponState(weaponState);
  next.reloadState = {
    isReloading: true,
    progress: 0,
    timeRemaining: def.reloadTime * 1000,
    weaponId,
  };
  playWeaponReload();
  return next;
}

export function isReloading(weaponState: WeaponState): boolean {
  return weaponState.reloadState?.isReloading === true;
}
