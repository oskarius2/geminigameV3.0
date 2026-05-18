import { Artifact, BuffRarity } from '../types';
import { ARTIFACTS_EXTRA } from './artifactsExtra';

const BASE_ARTIFACTS: Record<string, Artifact> = {
  iron_sights: {
    id: 'iron_sights',
    name: 'Iron Sights',
    description: 'Standard targeting optics. Damage +4',
    rarity: BuffRarity.COMMON,
    slot: 'CANNON_A',
    stats: { damageMod: 4 },
  },
  vanguard_alpha: {
    id: 'vanguard_alpha',
    name: 'Vanguard Alpha',
    description: 'Aggressive prototype. Damage +25%, Crit +5%',
    rarity: BuffRarity.RARE,
    slot: 'CANNON_A',
    stats: { damageMod: 1.25, critMod: 0.05 },
  },
  void_shard: {
    id: 'void_shard',
    name: 'Void Shard',
    description: 'Mysterious artifact. Damage +45%, Speed -10%',
    rarity: BuffRarity.EPIC,
    slot: 'CANNON_A',
    stats: { damageMod: 1.45, speedMod: 0.9 },
  },
  pulse_gatling: {
    id: 'pulse_gatling',
    name: 'Pulse Gatling',
    description: 'High-speed battery. Damage +15, Energy +20',
    rarity: BuffRarity.RARE,
    slot: 'CANNON_A',
    stats: { damageMod: 15, energyMod: 20 },
  },
  eternal_star: {
    id: 'eternal_star',
    name: 'Eternal Star',
    description: 'God-tier relic. Damage +60%, Health +150',
    rarity: BuffRarity.LEGENDARY,
    slot: 'CANNON_A',
    stats: { damageMod: 1.6, healthMod: 150, specialType: 'eternal' },
  },
  backup_cannon: {
    id: 'backup_cannon',
    name: 'Backup Cannon',
    description: 'Emergency yield gun. Damage +3',
    rarity: BuffRarity.COMMON,
    slot: 'CANNON_B',
    stats: { damageMod: 3 },
  },
  plasma_repeater: {
    id: 'plasma_repeater',
    name: 'Plasma Repeater',
    description: 'Cycling plasma rounds. Damage +20%',
    rarity: BuffRarity.RARE,
    slot: 'CANNON_B',
    stats: { damageMod: 1.2, multiShot: 1 },
  },
  storm_bringer: {
    id: 'storm_bringer',
    name: 'Storm Bringer',
    description: 'Electrical discharge unit. Crit +15%, Damage +10%',
    rarity: BuffRarity.EPIC,
    slot: 'CANNON_B',
    stats: { critMod: 0.15, damageMod: 1.1 },
  },
  basic_hull: {
    id: 'basic_hull',
    name: 'Reinforced Hull',
    description: 'Extra plating. Max Health +30',
    rarity: BuffRarity.COMMON,
    slot: 'ARMOR',
    stats: { healthMod: 30 },
  },
  nanocarbon_shell: {
    id: 'nanocarbon_shell',
    name: 'Nanocarbon Shell',
    description: 'Lightweight protection. Health +50, Speed +5%',
    rarity: BuffRarity.RARE,
    slot: 'ARMOR',
    stats: { healthMod: 50, speedMod: 1.05 },
  },
  titan_plate: {
    id: 'titan_plate',
    name: 'Titan Plate',
    description: 'Heavy duty armor. Max Health +150, Speed -5%',
    rarity: BuffRarity.EPIC,
    slot: 'ARMOR',
    stats: { healthMod: 150, speedMod: 0.95 },
  },
  singularity_core: {
    id: 'singularity_core',
    name: 'Singularity Core',
    description: 'Self-repairing tech. Health +300, Damage +20%',
    rarity: BuffRarity.LEGENDARY,
    slot: 'ARMOR',
    stats: { healthMod: 300, damageMod: 1.2 },
  },
  basic_thrusters: {
    id: 'basic_thrusters',
    name: 'Basic Thrusters',
    description: 'Standard propulsion. Speed +10%',
    rarity: BuffRarity.COMMON,
    slot: 'MOBILITY',
    stats: { speedMod: 1.1 },
  },
  kinetic_boosters: {
    id: 'kinetic_boosters',
    name: 'Kinetic Boosters',
    description: 'Improved thrust. Speed +15%, Energy +30',
    rarity: BuffRarity.RARE,
    slot: 'MOBILITY',
    stats: { speedMod: 1.15, energyMod: 30 },
  },
  warp_drive: {
    id: 'warp_drive',
    name: 'Warp Drive',
    description: 'Folding engine. Speed +35%, Crit +5%',
    rarity: BuffRarity.EPIC,
    slot: 'MOBILITY',
    stats: { speedMod: 1.35, critMod: 0.05 },
  },
  chronos_drive: {
    id: 'chronos_drive',
    name: 'Chronos Drive',
    description: 'Time-bending engine. Speed +50%, Energy +100',
    rarity: BuffRarity.LEGENDARY,
    slot: 'MOBILITY',
    stats: { speedMod: 1.5, energyMod: 100 },
  },
};

export const ARTIFACTS: Record<string, Artifact> = { ...BASE_ARTIFACTS, ...ARTIFACTS_EXTRA };

export function artifactPowerScore(art: Artifact): number {
  const s = art.stats;
  let score = 0;
  if (s.damageMod) score += typeof s.damageMod === 'number' && s.damageMod < 10 ? s.damageMod * 5 : s.damageMod * 20;
  if (s.healthMod) score += s.healthMod;
  if (s.speedMod) score += (s.speedMod - 1) * 100;
  if (s.energyMod) score += s.energyMod * 0.5;
  if (s.critMod) score += s.critMod * 200;
  const rarityBonus = { COMMON: 0, RARE: 15, EPIC: 35, LEGENDARY: 60 };
  score += rarityBonus[art.rarity];
  return score;
}
