import { BuffRarity, ShipId } from '../types';

export type LootPool = 'ship_exclusive' | 'universal' | 'cross_ship';

export interface ShipLootDef {
  id: string;
  name: string;
  description: string;
  shipId: ShipId;
  rarity: BuffRarity;
  /** Future gameplay hook — wired in applyLoot / passives later. */
  effectId: string;
}

/** Swift Falcon (interceptor) exclusive drops. */
export const INTERCEPTOR_LOOT: ShipLootDef[] = [
  {
    id: 'loot_phase_shift',
    name: 'Phase Shift',
    description: 'Brief invulnerability after dodge.',
    shipId: 'interceptor',
    rarity: BuffRarity.RARE,
    effectId: 'loot_phase_shift',
  },
  {
    id: 'loot_velocity_core',
    name: 'Velocity Core',
    description: '+30% projectile speed.',
    shipId: 'interceptor',
    rarity: BuffRarity.COMMON,
    effectId: 'loot_velocity_core',
  },
  {
    id: 'loot_afterburner',
    name: 'Afterburner',
    description: 'Dash cooldown reduced by 50%.',
    shipId: 'interceptor',
    rarity: BuffRarity.RARE,
    effectId: 'loot_afterburner',
  },
  {
    id: 'loot_quickstep',
    name: 'Quickstep',
    description: 'Automatically dodge every Nth hit.',
    shipId: 'interceptor',
    rarity: BuffRarity.EPIC,
    effectId: 'loot_quickstep',
  },
  {
    id: 'loot_ricochet_rounds',
    name: 'Ricochet Rounds',
    description: 'Projectiles bounce off walls 3x.',
    shipId: 'interceptor',
    rarity: BuffRarity.RARE,
    effectId: 'loot_ricochet_rounds',
  },
  {
    id: 'loot_speed_demon',
    name: 'Speed Demon',
    description: 'Kill grants 10s speed boost.',
    shipId: 'interceptor',
    rarity: BuffRarity.COMMON,
    effectId: 'loot_speed_demon',
  },
  {
    id: 'loot_evasion_field',
    name: 'Evasion Field',
    description: 'Reduces all incoming damage by 15%.',
    shipId: 'interceptor',
    rarity: BuffRarity.EPIC,
    effectId: 'loot_evasion_field',
  },
  {
    id: 'loot_temporal_blink',
    name: 'Temporal Blink',
    description: 'Dodge teleports you forward.',
    shipId: 'interceptor',
    rarity: BuffRarity.LEGENDARY,
    effectId: 'loot_temporal_blink',
  },
];

/** Heavy Sentinel (gunship) exclusive drops. */
export const GUNSHIP_LOOT: ShipLootDef[] = [
  {
    id: 'loot_iron_fortress',
    name: 'Iron Fortress',
    description: 'Damage reduction increases by 5% per passive.',
    shipId: 'gunship',
    rarity: BuffRarity.RARE,
    effectId: 'loot_iron_fortress',
  },
  {
    id: 'loot_counter_plating',
    name: 'Counter Plating',
    description: 'Reflect 20% damage back to attackers.',
    shipId: 'gunship',
    rarity: BuffRarity.RARE,
    effectId: 'loot_counter_plating',
  },
  {
    id: 'loot_reactionary_shield',
    name: 'Reactionary Shield',
    description: 'Shield triggers on nearby enemy spawn.',
    shipId: 'gunship',
    rarity: BuffRarity.EPIC,
    effectId: 'loot_reactionary_shield',
  },
  {
    id: 'loot_slow_burn',
    name: 'Slow Burn',
    description: 'Projectiles deal 50% more damage but fire 30% slower.',
    shipId: 'gunship',
    rarity: BuffRarity.COMMON,
    effectId: 'loot_slow_burn',
  },
  {
    id: 'loot_heavy_impact',
    name: 'Heavy Impact',
    description: 'Explosions push enemies away.',
    shipId: 'gunship',
    rarity: BuffRarity.COMMON,
    effectId: 'loot_heavy_impact',
  },
  {
    id: 'loot_rampart',
    name: 'Rampart',
    description: 'Stationary defensive barrier blocks projectiles.',
    shipId: 'gunship',
    rarity: BuffRarity.LEGENDARY,
    effectId: 'loot_rampart',
  },
  {
    id: 'loot_second_wind',
    name: 'Second Wind',
    description: 'Heal 25% when below 30% HP.',
    shipId: 'gunship',
    rarity: BuffRarity.RARE,
    effectId: 'loot_second_wind',
  },
  {
    id: 'loot_juggernaut',
    name: 'Juggernaut',
    description: 'Gain +2% HP per second while not moving.',
    shipId: 'gunship',
    rarity: BuffRarity.EPIC,
    effectId: 'loot_juggernaut',
  },
];

/** Swarm Vessel (drone) exclusive drops. */
export const DRONE_LOOT: ShipLootDef[] = [
  {
    id: 'loot_drone_swarm_plus',
    name: 'Drone Swarm +1',
    description: 'Spawns an additional helper drone.',
    shipId: 'drone',
    rarity: BuffRarity.RARE,
    effectId: 'loot_drone_swarm_plus',
  },
  {
    id: 'loot_orbital_shield',
    name: 'Orbital Shield',
    description: 'Drones create a protective barrier.',
    shipId: 'drone',
    rarity: BuffRarity.RARE,
    effectId: 'loot_orbital_shield',
  },
  {
    id: 'loot_hivemind',
    name: 'Hivemind',
    description: 'All drones fire synchronized.',
    shipId: 'drone',
    rarity: BuffRarity.EPIC,
    effectId: 'loot_hivemind',
  },
  {
    id: 'loot_support_beacon',
    name: 'Support Beacon',
    description: 'Drones heal the player periodically.',
    shipId: 'drone',
    rarity: BuffRarity.COMMON,
    effectId: 'loot_support_beacon',
  },
  {
    id: 'loot_distributed_fire',
    name: 'Distributed Fire',
    description: 'Drones split projectile fire.',
    shipId: 'drone',
    rarity: BuffRarity.COMMON,
    effectId: 'loot_distributed_fire',
  },
  {
    id: 'loot_adaptive_protocol',
    name: 'Adaptive Protocol',
    description: 'Drones gain buffs when the player gains buffs.',
    shipId: 'drone',
    rarity: BuffRarity.RARE,
    effectId: 'loot_adaptive_protocol',
  },
  {
    id: 'loot_swarm_amplifier',
    name: 'Swarm Amplifier',
    description: 'Each drone adds +10% damage.',
    shipId: 'drone',
    rarity: BuffRarity.EPIC,
    effectId: 'loot_swarm_amplifier',
  },
  {
    id: 'loot_harmonic_resonance',
    name: 'Harmonic Resonance',
    description: 'Drones strengthen each other when near.',
    shipId: 'drone',
    rarity: BuffRarity.LEGENDARY,
    effectId: 'loot_harmonic_resonance',
  },
];

/** Situational utility — any ship, 10% loot pool. */
export const CROSS_SHIP_LOOT: ShipLootDef[] = [
  {
    id: 'loot_emergency_battery',
    name: 'Emergency Battery',
    description: 'Instant full energy restore.',
    shipId: 'interceptor',
    rarity: BuffRarity.COMMON,
    effectId: 'loot_emergency_battery',
  },
  {
    id: 'loot_scrap_magnet',
    name: 'Scrap Magnet',
    description: 'Pulls scrap orbs from a wide radius for 20s.',
    shipId: 'gunship',
    rarity: BuffRarity.COMMON,
    effectId: 'loot_scrap_magnet',
  },
  {
    id: 'loot_threat_scanner',
    name: 'Threat Scanner',
    description: 'Highlights elite enemies and reduces threat gain briefly.',
    shipId: 'drone',
    rarity: BuffRarity.RARE,
    effectId: 'loot_threat_scanner',
  },
];

export const UNIVERSAL_LOOT_IDS = ['health_pickup', 'xp_orb', 'scrap_bundle'] as const;
export type UniversalLootId = (typeof UNIVERSAL_LOOT_IDS)[number];

const SHIP_LOOT_TABLE: Record<ShipId, ShipLootDef[]> = {
  interceptor: INTERCEPTOR_LOOT,
  gunship: GUNSHIP_LOOT,
  drone: DRONE_LOOT,
};

const ALL_SHIP_LOOT: ShipLootDef[] = [
  ...INTERCEPTOR_LOOT,
  ...GUNSHIP_LOOT,
  ...DRONE_LOOT,
  ...CROSS_SHIP_LOOT,
];

export function getShipLootPool(shipId: ShipId): ShipLootDef[] {
  return SHIP_LOOT_TABLE[shipId] ?? [];
}

export function getShipLootDef(lootId: string): ShipLootDef | null {
  return ALL_SHIP_LOOT.find((l) => l.id === lootId) ?? null;
}

export function getAllShipExclusiveLoot(shipId: ShipId): ShipLootDef[] {
  return SHIP_LOOT_TABLE[shipId] ?? [];
}
