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
    name: 'Laser',
    damage: 15,
    fireRate: 5,
    magazineSize: 15,
    reloadTime: 0.5,
    speed: 10,
  },
  rockets: {
    id: 'rockets',
    name: 'Rockets',
    damage: 50,
    fireRate: 1,
    magazineSize: 15,
    reloadTime: 0.5,
    speed: 7.5,
    spread: 0.1,
  },
  plasma: {
    id: 'plasma',
    name: 'Plasma',
    damage: 25,
    fireRate: 3,
    magazineSize: 12,
    reloadTime: 0.8,
    speed: 9,
  },
  railgun: {
    id: 'railgun',
    name: 'Railgun',
    damage: 80,
    fireRate: 0.5,
    magazineSize: 4,
    reloadTime: 1.5,
    speed: 14,
  },
  flamethrower: {
    id: 'flamethrower',
    name: 'Flamethrower',
    damage: 8,
    fireRate: 8,
    magazineSize: 30,
    reloadTime: 0.6,
    speed: 8,
    spread: 0.25,
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    damage: 12,
    fireRate: 2,
    magazineSize: 10,
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

export const AMMO_RESERVE_PER_WEAPON = 60;

export function getWeaponDef(id: WeaponId): WeaponDef {
  return WEAPON_DEFS[id];
}
