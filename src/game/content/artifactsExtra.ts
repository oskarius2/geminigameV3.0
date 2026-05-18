import { Artifact, ArtifactSlot, BuffRarity } from '../types';

type ArtDef = Omit<Artifact, 'id'> & { id: string };

const defs: ArtDef[] = [
  { id: 'scout_lens', name: 'Scout Lens', description: 'Light optics. Damage +6', rarity: BuffRarity.COMMON, slot: 'CANNON_A', stats: { damageMod: 6 } },
  { id: 'rust_barrel', name: 'Rust Barrel', description: 'Worn but reliable. Damage +8', rarity: BuffRarity.COMMON, slot: 'CANNON_A', stats: { damageMod: 8 } },
  { id: 'marksman_chip', name: 'Marksman Chip', description: 'Crit +8%', rarity: BuffRarity.COMMON, slot: 'CANNON_A', stats: { critMod: 0.08 } },
  { id: 'overclock_a', name: 'Overclock A', description: 'Damage +18%', rarity: BuffRarity.RARE, slot: 'CANNON_A', stats: { damageMod: 1.18 } },
  { id: 'hunter_array', name: 'Hunter Array', description: 'Damage +22%, Crit +8%', rarity: BuffRarity.RARE, slot: 'CANNON_A', stats: { damageMod: 1.22, critMod: 0.08 } },
  { id: 'nova_core_a', name: 'Nova Core A', description: 'Damage +35%, Energy +15', rarity: BuffRarity.EPIC, slot: 'CANNON_A', stats: { damageMod: 1.35, energyMod: 15 } },
  { id: 'apocalypse_lens', name: 'Apocalypse Lens', description: 'Damage +55%, Crit +12%', rarity: BuffRarity.LEGENDARY, slot: 'CANNON_A', stats: { damageMod: 1.55, critMod: 0.12 } },
  { id: 'sidearm_mk1', name: 'Sidearm Mk1', description: 'Damage +5', rarity: BuffRarity.COMMON, slot: 'CANNON_B', stats: { damageMod: 5 } },
  { id: 'flare_launcher', name: 'Flare Launcher', description: 'Damage +12, Crit +5%', rarity: BuffRarity.COMMON, slot: 'CANNON_B', stats: { damageMod: 12, critMod: 0.05 } },
  { id: 'ion_burst', name: 'Ion Burst', description: 'Damage +28%', rarity: BuffRarity.RARE, slot: 'CANNON_B', stats: { damageMod: 1.28 } },
  { id: 'siege_battery', name: 'Siege Battery', description: 'Damage +40', rarity: BuffRarity.RARE, slot: 'CANNON_B', stats: { damageMod: 40 } },
  { id: 'tempest_coil', name: 'Tempest Coil', description: 'Crit +20%, Damage +15%', rarity: BuffRarity.EPIC, slot: 'CANNON_B', stats: { critMod: 0.2, damageMod: 1.15 } },
  { id: 'cataclysm_b', name: 'Cataclysm B', description: 'Damage +80%, Health +40', rarity: BuffRarity.LEGENDARY, slot: 'CANNON_B', stats: { damageMod: 1.8, healthMod: 40 } },
  { id: 'needle_driver', name: 'Needle Driver', description: 'Damage +35', rarity: BuffRarity.COMMON, slot: 'ULTIMATE', stats: { damageMod: 35 } },
  { id: 'phase_lance', name: 'Phase Lance', description: 'Damage +80', rarity: BuffRarity.COMMON, slot: 'ULTIMATE', stats: { damageMod: 80 } },
  { id: 'antimatter_line', name: 'Antimatter Line', description: 'Damage +200%', rarity: BuffRarity.RARE, slot: 'ULTIMATE', stats: { damageMod: 3 } },
  { id: 'starbreaker', name: 'Starbreaker', description: 'Damage +250, Crit +8%', rarity: BuffRarity.EPIC, slot: 'ULTIMATE', stats: { damageMod: 250, critMod: 0.08 } },
  { id: 'event_horizon_c', name: 'Event Horizon C', description: 'Damage +350%, Energy +40', rarity: BuffRarity.LEGENDARY, slot: 'ULTIMATE', stats: { damageMod: 4.5, energyMod: 40 } },
  { id: 'patch_plate', name: 'Patch Plate', description: 'Health +20', rarity: BuffRarity.COMMON, slot: 'ARMOR', stats: { healthMod: 20 } },
  { id: 'ceramic_weave', name: 'Ceramic Weave', description: 'Health +40', rarity: BuffRarity.COMMON, slot: 'ARMOR', stats: { healthMod: 40 } },
  { id: 'ablative_gel', name: 'Ablative Gel', description: 'Health +70, Speed +3%', rarity: BuffRarity.RARE, slot: 'ARMOR', stats: { healthMod: 70, speedMod: 1.03 } },
  { id: 'fortress_mesh', name: 'Fortress Mesh', description: 'Health +120', rarity: BuffRarity.RARE, slot: 'ARMOR', stats: { healthMod: 120 } },
  { id: 'aegis_matrix', name: 'Aegis Matrix', description: 'Health +200, Damage +10%', rarity: BuffRarity.EPIC, slot: 'ARMOR', stats: { healthMod: 200, damageMod: 1.1 } },
  { id: 'immortal_hull', name: 'Immortal Hull', description: 'Health +400, Speed -8%', rarity: BuffRarity.LEGENDARY, slot: 'ARMOR', stats: { healthMod: 400, speedMod: 0.92 } },
  { id: 'micro_jets', name: 'Micro Jets', description: 'Speed +8%', rarity: BuffRarity.COMMON, slot: 'MOBILITY', stats: { speedMod: 1.08 } },
  { id: 'dash_cell', name: 'Dash Cell', description: 'Energy +25', rarity: BuffRarity.COMMON, slot: 'MOBILITY', stats: { energyMod: 25 } },
  { id: 'afterburner_x', name: 'Afterburner X', description: 'Speed +20%, Energy +20', rarity: BuffRarity.RARE, slot: 'MOBILITY', stats: { speedMod: 1.2, energyMod: 20 } },
  { id: 'phase_skid', name: 'Phase Skid', description: 'Speed +28%, Crit +6%', rarity: BuffRarity.RARE, slot: 'MOBILITY', stats: { speedMod: 1.28, critMod: 0.06 } },
  { id: 'quantum_slide', name: 'Quantum Slide', description: 'Speed +40%, Energy +60', rarity: BuffRarity.EPIC, slot: 'MOBILITY', stats: { speedMod: 1.4, energyMod: 60 } },
  { id: 'infinity_drive', name: 'Infinity Drive', description: 'Speed +60%, Energy +120, Crit +8%', rarity: BuffRarity.LEGENDARY, slot: 'MOBILITY', stats: { speedMod: 1.6, energyMod: 120, critMod: 0.08 } },
  { id: 'scrap_cannon', name: 'Scrap Cannon', description: 'Damage +2, Health +10', rarity: BuffRarity.COMMON, slot: 'CANNON_A', stats: { damageMod: 2, healthMod: 10 } },
  { id: 'salvage_b', name: 'Salvage B', description: 'Damage +6, Energy +10', rarity: BuffRarity.COMMON, slot: 'CANNON_B', stats: { damageMod: 6, energyMod: 10 } },
  { id: 'relic_hull', name: 'Relic Hull', description: 'Health +25, Damage +5%', rarity: BuffRarity.RARE, slot: 'ARMOR', stats: { healthMod: 25, damageMod: 1.05 } },
  { id: 'ghost_thruster', name: 'Ghost Thruster', description: 'Speed +25%, Health +20', rarity: BuffRarity.EPIC, slot: 'MOBILITY', stats: { speedMod: 1.25, healthMod: 20 } },
  { id: 'omega_array', name: 'Omega Array', description: 'Damage +70%, Crit +15%, Health +80', rarity: BuffRarity.LEGENDARY, slot: 'CANNON_A', stats: { damageMod: 1.7, critMod: 0.15, healthMod: 80 } },
  { id: 'doom_splicer', name: 'Doom Splicer', description: 'Damage +500, Speed -15%', rarity: BuffRarity.LEGENDARY, slot: 'ULTIMATE', stats: { damageMod: 500, speedMod: 0.85 } },
];

export const ARTIFACTS_EXTRA: Record<string, Artifact> = Object.fromEntries(
  defs.map((d) => [d.id, d as Artifact])
);

export const ALL_ARTIFACT_SLOTS: ArtifactSlot[] = ['CANNON_A', 'CANNON_B', 'ULTIMATE', 'ARMOR', 'MOBILITY'];
