import { ARTIFACTS } from '../content/artifacts';
import { GameState, ShipId } from '../types';

export interface ShipDef {
  id: ShipId;
  name: string;
  description: string;
  baseHP: number;
  baseSpeed: number;
  /** Multiplier applied to default base damage (18). */
  baseDamage: number;
  /** 1 = baseline. Higher = faster fire. */
  fireRateMultiplier: number;
  uniquePassive: {
    id: string;
    name: string;
    description: string;
  };
  startingArtifact?: string;
  color: string;
}

export const SHIP_DEFINITIONS: Record<ShipId, ShipDef> = {
  interceptor: {
    id: 'interceptor',
    name: 'Swift Falcon',
    description: 'A nimble craft designed for quick strikes and evasive maneuvers.',
    baseHP: 200,
    baseSpeed: 18, // Fast - 180 scaled down by 10x
    baseDamage: 2.78, // 50/18 = 2.78 to get 50 damage
    fireRateMultiplier: 1.0, // 10/s is baseline, so 1.0
    uniquePassive: {
      id: 'ship_evasion',
      name: 'Evasion',
      description: '+15% dodge chance. Speed burst on kill (doubles speed for 5 seconds).',
    },
    startingArtifact: 'basic_thrusters',
    color: '#3b82f6', // Bright blue
  },
  gunship: {
    id: 'gunship',
    name: 'Heavy Sentinel',
    description: 'A powerful warship designed for long engagements and heavy firepower.',
    baseHP: 600,
    baseSpeed: 12, // Slow - 120 scaled down by 10x
    baseDamage: 4.44, // 80/18 = 4.44 to get 80 damage
    fireRateMultiplier: 0.5, // 5/s is half of baseline 10/s
    uniquePassive: {
      id: 'ship_armored_hull',
      name: 'Armored Hull',
      description: 'Reduces incoming damage by 30%. Regenerates 1% health per second.',
    },
    startingArtifact: 'basic_hull',
    color: '#991b1b', // Dark red
  },
  drone: {
    id: 'drone',
    name: 'Swarm Vessel',
    description: 'A versatile craft designed for support and orbital assistance.',
    baseHP: 150,
    baseSpeed: 15, // Medium - 150 scaled down by 10x
    baseDamage: 1.11, // 20/18 = 1.11 to get 20 damage
    fireRateMultiplier: 0.8, // 8/s compared to baseline 10/s
    uniquePassive: {
      id: 'ship_autonomous_swarm',
      name: 'Autonomous Swarm',
      description: 'Spawns up to 3 orbital drones providing support and additional firepower.',
    },
    startingArtifact: 'iron_sights',
    color: '#f5f5f5', // White
  },
};

export const SHIP_IDS = Object.keys(SHIP_DEFINITIONS) as ShipId[];

const DEFAULT_BASE_DAMAGE = 18;

export function getShipDef(shipId: string): ShipDef | null {
  return SHIP_DEFINITIONS[shipId as ShipId] ?? null;
}

export function applyShipStats(state: GameState, ship: ShipDef): void {
  state.selectedShip = ship.id;
  state.player.maxHealth = ship.baseHP;
  state.player.health = ship.baseHP;
  state.player.speed = ship.baseSpeed;
  state.baseDamage = DEFAULT_BASE_DAMAGE * ship.baseDamage;
  state.fireRateMultiplier = ship.fireRateMultiplier;
  state.player.color = ship.color;

  if (!state.passives.includes(ship.uniquePassive.id)) {
    state.passives.push(ship.uniquePassive.id);
  }

  if (ship.startingArtifact && ARTIFACTS[ship.startingArtifact]) {
    const art = ARTIFACTS[ship.startingArtifact];
    state.equippedArtifacts[art.slot] = ship.startingArtifact;
  }
}
