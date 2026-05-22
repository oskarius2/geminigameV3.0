import { Vector2 } from '../utils/vector';
import { EntityType, ItemType, type GameState } from '../types';
import {
  AMMO_PICKUP_AMOUNT,
  MINIBOSS_AMMO_AMOUNT,
  getDropRatesForStage,
} from './ammoConfig';
import {
  BONUS_WEAPON_POOL,
  DEFAULT_SECONDARY_WEAPON,
  getWeaponDef,
  type WeaponId,
} from './weaponDefs';
import {
  cloneWeaponState,
  unlockSecondarySlot,
  type WeaponState,
} from './weaponState';

export function checkAmmoDropOnKill(stage: number): 'ammo' | 'weapon' | null {
  const config = getDropRatesForStage(stage);
  const roll = Math.random();

  if (roll < config.weaponDropRate) {
    return 'weapon';
  }

  if (roll < config.weaponDropRate + config.ammoDropRate) {
    return 'ammo';
  }

  return null;
}

function pickBonusWeapon(ws: WeaponState): WeaponId {
  const owned = new Set(
    ws.slots
      .filter((s): s is NonNullable<typeof s> => s != null)
      .map((s) => s.weaponId)
  );
  const pool = BONUS_WEAPON_POOL.filter((id) => !owned.has(id));
  const pickFrom = pool.length > 0 ? pool : BONUS_WEAPON_POOL;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)];
}

export function applyAmmoPickupToWeaponState(
  weaponState: WeaponState,
  dropType: 'ammo' | 'weapon',
  amount: number = AMMO_PICKUP_AMOUNT
): WeaponState {
  let next = cloneWeaponState(weaponState);

  if (dropType === 'weapon') {
    next = unlockSecondarySlot(next);
    const weaponId = pickBonusWeapon(next);
    const def = getWeaponDef(weaponId);
    const reserve = (next.slots[1]?.ammoReserve ?? 0) + amount;
    next.slots = [
      next.slots[0],
      {
        weaponId,
        ammoLoaded: Math.min(def.magazineSize, reserve),
        ammoReserve: Math.max(0, reserve - def.magazineSize),
        isUnlimited: false,
        isUnlocked: true,
        isDisabledUI: false,
      },
    ];
    return next;
  }

  next = unlockSecondarySlot(next);
  const sec = next.slots[1]!;
  const newReserve = Math.min(sec.ammoReserve + amount, 999);
  next.slots = [
    next.slots[0],
    {
      ...sec,
      ammoReserve: newReserve,
      isDisabledUI: sec.ammoLoaded === 0 && newReserve === 0,
    },
  ];
  return next;
}

export function spawnAmmoPickupEntity(
  state: GameState,
  pos: Vector2,
  dropType: 'ammo' | 'weapon',
  ammoAmount: number = AMMO_PICKUP_AMOUNT
): GameState {
  return {
    ...state,
    items: [
      ...state.items,
      {
        id: Math.random().toString(36).slice(2, 11),
        type: EntityType.ITEM,
        pos: pos.clone(),
        radius: 14,
        health: 1,
        maxHealth: 1,
        speed: 0,
        velocity: new Vector2(0, 0),
        color: dropType === 'ammo' ? '#fbbf24' : '#a78bfa',
        itemType:
          dropType === 'ammo' ? ItemType.AMMO_PACK : ItemType.WEAPON_CRATE,
        ammoPickupAmount: dropType === 'ammo' ? ammoAmount : undefined,
      },
    ],
  };
}

export function dropAmmo(
  state: GameState,
  dropType: 'ammo' | 'weapon',
  pos: Vector2,
  ammoAmount: number = AMMO_PICKUP_AMOUNT
): GameState {
  return spawnAmmoPickupEntity(state, pos, dropType, ammoAmount);
}

export function collectAmmoPickup(
  state: GameState,
  dropType: 'ammo' | 'weapon',
  amount: number = AMMO_PICKUP_AMOUNT
): GameState {
  if (!state.weaponState) return state;
  return {
    ...state,
    weaponState: applyAmmoPickupToWeaponState(state.weaponState, dropType, amount),
  };
}

/** Guaranteed ammo pickup entity (50 rounds when collected). */
export function onMiniBossDefeatedAmmo(state: GameState, pos: Vector2): GameState {
  return dropAmmo(state, 'ammo', pos, MINIBOSS_AMMO_AMOUNT);
}

export function tryRollAmmoDropOnKill(
  state: GameState,
  pos: Vector2
): GameState {
  if (!state.weaponState) return state;
  const dropType = checkAmmoDropOnKill(state.stage);
  if (!dropType) return state;
  return dropAmmo(state, dropType, pos);
}
