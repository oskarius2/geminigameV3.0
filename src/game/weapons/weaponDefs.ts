export type WeaponId =
  | 'laser'
  | 'rockets'
  | 'plasma'
  | 'railgun'
  | 'flamethrower'
  | 'shotgun';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  damage: number;
  /** Shots per second. */
  fireRate: number;
  magazineSize: number;
  reloadTime: number;
  speed?: number;
  spread?: number;
}

export const WEAPON_DEFS: Record<WeaponId, WeaponDef> = {
  laser: {
    id: 'laser',
    name: 'Pulse Blaster',
    damage: 1,
    fireRate: 10,
    magazineSize: 12,
    reloadTime: 0.6,
    speed: 10,
  },
  rockets: {
    id: 'rockets',
    name: 'Rockets',
    damage: 5,
    fireRate: 5,
    magazineSize: 5,
    reloadTime: 1.0,
    speed: 7.5,
    spread: 0.1,
  },
  plasma: {
    id: 'plasma',
    name: 'Plasma',
    damage: 4,
    fireRate: 6,
    magazineSize: 8,
    reloadTime: 0.8,
    speed: 9,
  },
  railgun: {
    id: 'railgun',
    name: 'Railgun',
    damage: 10,
    fireRate: 1,
    magazineSize: 3,
    reloadTime: 1.5,
    speed: 14,
  },
  flamethrower: {
    id: 'flamethrower',
    name: 'Flamethrower',
    damage: 2,
    fireRate: 12,
    magazineSize: 20,
    reloadTime: 0.6,
    speed: 8,
    spread: 0.25,
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    damage: 3,
    fireRate: 3,
    magazineSize: 6,
    reloadTime: 0.9,
    speed: 9,
    spread: 0.35,
  },
};

/** Default loadout: slot 0 = primary (maps to CANNON_A), slot 1 = secondary (CANNON_B). */
export const DEFAULT_PRIMARY_WEAPON: WeaponId = 'laser';
export const DEFAULT_SECONDARY_WEAPON: WeaponId = 'rockets';

export const BONUS_WEAPON_POOL: WeaponId[] = [
  'plasma',
  'railgun',
  'flamethrower',
  'shotgun',
];

export const AMMO_RESERVE_PER_WEAPON = 15;

export function getWeaponDef(id: WeaponId): WeaponDef {
  return WEAPON_DEFS[id];
}
