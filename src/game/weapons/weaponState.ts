import { SWITCH_DURATION } from './ammoConfig';
import {
  DEFAULT_PRIMARY_WEAPON,
  DEFAULT_SECONDARY_WEAPON,
  getWeaponDef,
  type WeaponId,
} from './weaponDefs';

export interface WeaponSlot {
  weaponId: WeaponId;
  ammoLoaded: number;
  ammoReserve: number;
  /** Primary (slot 0): unlimited fire, no reload. */
  isUnlimited: boolean;
  isUnlocked: boolean;
  isDisabledUI: boolean;
}

export interface ReloadState {
  isReloading: boolean;
  progress: number;
  timeRemaining: number;
  weaponId: WeaponId;
}

export interface WeaponSwitchState {
  isSwitching: boolean;
  progress: number;
  timeRemaining: number;
  targetSlot: 0 | 1;
}

export interface WeaponState {
  slots: [WeaponSlot | null, WeaponSlot | null];
  activeSlot: 0 | 1;
  reloadState: ReloadState | null;
  switchState: WeaponSwitchState;
}

const SWITCH_MS = SWITCH_DURATION * 1000;

export function createWeaponSlot(
  weaponId: WeaponId,
  options?: { unlocked?: boolean; unlimited?: boolean }
): WeaponSlot {
  const def = getWeaponDef(weaponId);
  const unlimited = options?.unlimited === true;
  const unlocked = options?.unlocked !== false;
  return {
    weaponId,
    ammoLoaded: unlimited ? def.magazineSize : 0,
    ammoReserve: unlimited ? 9999 : 0,
    isUnlimited: unlimited,
    isUnlocked: unlocked,
    isDisabledUI: !unlocked,
  };
}

/** Weapon 1 always ready; weapon 2 locked until first pickup. */
export function createInitialWeaponState(): WeaponState {
  return {
    slots: [
      {
        weaponId: DEFAULT_PRIMARY_WEAPON,
        ammoLoaded: 9999,
        ammoReserve: 9999,
        isUnlimited: true,
        isUnlocked: true,
        isDisabledUI: false,
      },
      null,
    ],
    activeSlot: 0,
    reloadState: null,
    switchState: {
      isSwitching: false,
      progress: 0,
      timeRemaining: 0,
      targetSlot: 0,
    },
  };
}

export function cloneWeaponState(ws: WeaponState): WeaponState {
  return {
    activeSlot: ws.activeSlot,
    reloadState: ws.reloadState ? { ...ws.reloadState } : null,
    switchState: { ...ws.switchState },
    slots: [
      ws.slots[0] ? { ...ws.slots[0] } : null,
      ws.slots[1] ? { ...ws.slots[1] } : null,
    ],
  };
}

export function artifactSlotToWeaponIndex(
  slot: 'CANNON_A' | 'CANNON_B' | string
): 0 | 1 | null {
  if (slot === 'CANNON_A') return 0;
  if (slot === 'CANNON_B') return 1;
  return null;
}

export function weaponIndexToArtifactSlot(index: 0 | 1): 'CANNON_A' | 'CANNON_B' {
  return index === 0 ? 'CANNON_A' : 'CANNON_B';
}

export function isWeaponSlotUnlocked(ws: WeaponState, slot: 0 | 1): boolean {
  if (slot === 0) return true;
  return ws.slots[1]?.isUnlocked === true;
}

export function setActiveWeaponSlot(ws: WeaponState, slot: 0 | 1): WeaponState {
  if (ws.activeSlot === slot) return ws;
  if (!isWeaponSlotUnlocked(ws, slot)) return ws;

  const next = cloneWeaponState(ws);
  next.reloadState = null;
  next.switchState = {
    isSwitching: true,
    progress: 0,
    timeRemaining: SWITCH_MS,
    targetSlot: slot,
  };
  return next;
}

export function updateWeaponSwitch(ws: WeaponState, deltaMs: number): WeaponState {
  if (!ws.switchState.isSwitching) return ws;
  const next = cloneWeaponState(ws);
  const sw = next.switchState;
  sw.timeRemaining = Math.max(0, sw.timeRemaining - deltaMs);
  sw.progress = SWITCH_MS > 0 ? 1 - sw.timeRemaining / SWITCH_MS : 1;
  if (sw.timeRemaining <= 0) {
    next.activeSlot = sw.targetSlot;
    sw.isSwitching = false;
    sw.progress = 1;
    sw.timeRemaining = 0;
  }
  return next;
}

export function getActiveWeaponSlot(ws: WeaponState): WeaponSlot | null {
  return ws.slots[ws.activeSlot];
}

export function unlockSecondarySlot(ws: WeaponState): WeaponState {
  const next = cloneWeaponState(ws);
  if (!next.slots[1]) {
    next.slots = [
      next.slots[0],
      createWeaponSlot(DEFAULT_SECONDARY_WEAPON, { unlocked: true, unlimited: false }),
    ];
  } else {
    const sec = { ...next.slots[1]!, isUnlocked: true, isDisabledUI: false };
    next.slots = [next.slots[0], sec] as WeaponState['slots'];
  }
  return next;
}
