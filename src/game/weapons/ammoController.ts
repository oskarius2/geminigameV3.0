import type { WeaponState } from './weaponState';
import { getActiveWeaponSlot } from './weaponState';

export function getReloadProgress(weaponState: WeaponState): number {
  const reload = weaponState.reloadState;
  if (!reload?.isReloading) return 0;
  return Math.max(0, Math.min(1, reload.progress));
}

export function getSwitchProgress(weaponState: WeaponState): number {
  const sw = weaponState.switchState;
  if (!sw.isSwitching) return 0;
  return Math.max(0, Math.min(1, sw.progress));
}

/** Returns true if a shot is allowed (does not mutate state). */
export function canFireWeapon(weaponState: WeaponState): boolean {
  if (weaponState.switchState.isSwitching) return false;
  if (weaponState.reloadState?.isReloading) return false;

  const slot = getActiveWeaponSlot(weaponState);
  if (!slot) return false;
  if (slot.isUnlimited) return true;
  if (!slot.isUnlocked) return false;
  if (slot.ammoLoaded > 0) return true;
  return slot.ammoReserve > 0;
}

export function isSecondaryUnlocked(weaponState: WeaponState): boolean {
  return weaponState.slots[1]?.isUnlocked === true;
}

export function isSecondaryDisabled(weaponState: WeaponState): boolean {
  const sec = weaponState.slots[1];
  if (!sec?.isUnlocked) return true;
  return sec.isDisabledUI === true;
}
