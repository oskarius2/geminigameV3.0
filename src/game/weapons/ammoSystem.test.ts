import { describe, expect, it } from 'vitest';
import { ItemType } from '../types';
import { INITIAL_STATE } from '../Logic';
import { AMMO_PICKUP_AMOUNT } from './ammoConfig';
import {
  checkAmmoDropOnKill,
  collectAmmoPickup,
  spawnAmmoPickupEntity,
} from './ammoDropController';
import { isReloading, startReload, updateReload } from './reloadController';
import {
  createInitialWeaponState,
  getActiveWeaponSlot,
  unlockSecondarySlot,
  weaponIndexToArtifactSlot,
} from './weaponState';
import {
  setGameWeaponSlot,
  tickWeaponSystems,
  tryConsumeAmmoForShot,
} from './weaponController';

function stateWithSecondary(
  loaded: number,
  reserve: number,
  activeSlot: 0 | 1 = 1
) {
  const state = INITIAL_STATE(800, 600);
  let ws = unlockSecondarySlot(createInitialWeaponState());
  ws.activeSlot = activeSlot;
  const sec = ws.slots[1]!;
  ws.slots = [
    ws.slots[0],
    { ...sec, ammoLoaded: loaded, ammoReserve: reserve, isDisabledUI: loaded === 0 && reserve === 0 },
  ];
  state.weaponState = ws;
  state.activeWeaponSlot = weaponIndexToArtifactSlot(activeSlot);
  return state;
}

describe('ammo system', () => {
  it('primary unlimited — does not consume ammo', () => {
    const state = INITIAL_STATE(800, 600);
    const before = getActiveWeaponSlot(state.weaponState)!.ammoLoaded;
    const fired = tryConsumeAmmoForShot(state);
    expect(fired.didFire).toBe(true);
    expect(getActiveWeaponSlot(fired.state.weaponState)!.ammoLoaded).toBe(before);
    expect(isReloading(fired.state.weaponState)).toBe(false);
  });

  it('secondary consumes ammo and starts reload when magazine empties', () => {
    const state = stateWithSecondary(1, 10);
    const fired = tryConsumeAmmoForShot(state);
    expect(fired.didFire).toBe(true);
    expect(getActiveWeaponSlot(fired.state.weaponState)!.ammoLoaded).toBe(0);
    expect(isReloading(fired.state.weaponState)).toBe(true);
  });

  it('blocks fire while reloading', () => {
    const state = stateWithSecondary(0, 10);
    let ws = state.weaponState!;
    ws = startReload(ws, ws.slots[1]!.weaponId);
    state.weaponState = ws;
    const fired = tryConsumeAmmoForShot(state);
    expect(fired.didFire).toBe(false);
  });

  it('completes reload and transfers reserve to magazine', () => {
    let ws = unlockSecondarySlot(createInitialWeaponState());
    ws.activeSlot = 1;
    const sec = ws.slots[1]!;
    ws.slots = [ws.slots[0], { ...sec, ammoLoaded: 0, ammoReserve: 20 }];
    ws = startReload(ws, sec.weaponId);
    ws = updateReload(ws, 600);
    expect(isReloading(ws)).toBe(false);
    expect(getActiveWeaponSlot(ws)!.ammoLoaded).toBe(15);
    expect(getActiveWeaponSlot(ws)!.ammoReserve).toBe(5);
  });

  it('weapon switch completes after 250ms', () => {
    const state = stateWithSecondary(5, 20, 1);
    const switched = setGameWeaponSlot(state, 'CANNON_A');
    expect(switched.weaponState.switchState.isSwitching).toBe(true);
    expect(switched.weaponState.activeSlot).toBe(1);
    const ws = tickWeaponSystems(switched.weaponState, 250);
    expect(ws.activeSlot).toBe(0);
    expect(ws.switchState.isSwitching).toBe(false);
  });

  it('spawns ammo pickup entities', () => {
    const state = INITIAL_STATE(800, 600);
    const dropped = spawnAmmoPickupEntity(state, state.player.pos, 'ammo');
    expect(dropped.items.length).toBe(1);
    expect(dropped.items[0].itemType).toBe(ItemType.AMMO_PACK);
    expect(dropped.items[0].ammoPickupAmount).toBe(AMMO_PICKUP_AMOUNT);
  });

  it('collectAmmoPickup unlocks secondary and adds reserve', () => {
    const state = INITIAL_STATE(800, 600);
    expect(state.weaponState.slots[1]).toBeNull();
    const collected = collectAmmoPickup(state, 'ammo');
    expect(collected.weaponState.slots[1]?.isUnlocked).toBe(true);
    expect(collected.weaponState.slots[1]?.ammoReserve).toBe(AMMO_PICKUP_AMOUNT);
  });

  it('stage drop rates return valid types', () => {
    const s1 = checkAmmoDropOnKill(1);
    const s5 = checkAmmoDropOnKill(5);
    expect(s1 === null || s1 === 'ammo' || s1 === 'weapon').toBe(true);
    expect(s5 === null || s5 === 'ammo' || s5 === 'weapon').toBe(true);
  });
});
