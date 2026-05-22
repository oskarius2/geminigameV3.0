import { BuffRarity, EnemyType } from '../types';

export type MiniBossId =
  | 'shockwave_sentinel'
  | 'eclipse_dasher'
  | 'void_harbinger'
  | 'plasma_splitter'
  | 'chronos_guardian'
  | 'swarm_overlord';

export interface MiniBossLootTier {
  rarity: BuffRarity;
  weight: number;
}

export interface MiniBossDef {
  id: MiniBossId;
  /** English id label for logs */
  name: string;
  /** Player-facing name */
  displayName: string;
  baseHP: number;
  /** Movement speed baseline (lower = slower). Sentinel: 100 vs ranged ~120. */
  baseSpeed: number;
  visualScale: number;
  baseRadius: number;
  color: string;
  auraColor: string;
  enemyType: EnemyType;
  baseDamage: number;
  lootTiers: MiniBossLootTier[];
  threatReduction: number;
  passiveDropChance: number;
  passiveIds: string[];
  /** Survival stages this mini-boss is scripted for (Stage 5+ uses rotation). */
  stages: number[];
}

export const MINI_BOSS_DEFINITIONS: Record<MiniBossId, MiniBossDef> = {
  shockwave_sentinel: {
    id: 'shockwave_sentinel',
    name: 'Shockwave Sentinel',
    displayName: 'Chockvågssköld',
    baseHP: 150,
    baseSpeed: 100,
    visualScale: 2,
    baseRadius: 40,
    color: '#7c3aed',
    auraColor: '#c084fc',
    enemyType: EnemyType.RANGED,
    baseDamage: 14,
    lootTiers: [
      { rarity: BuffRarity.COMMON, weight: 70 },
      { rarity: BuffRarity.RARE, weight: 30 },
    ],
    threatReduction: 10,
    passiveDropChance: 0.25,
    passiveIds: ['mb_fortified', 'mb_shockwave_echo'],
    stages: [2],
  },
  eclipse_dasher: {
    id: 'eclipse_dasher',
    name: 'Eclipse Dasher',
    displayName: 'Eklips-slaktare',
    baseHP: 120,
    baseSpeed: 140,
    visualScale: 1.8,
    baseRadius: 22,
    color: '#1e1b4b',
    auraColor: '#ef4444',
    enemyType: EnemyType.DASHER,
    baseDamage: 60,
    lootTiers: [
      { rarity: BuffRarity.RARE, weight: 60 },
      { rarity: BuffRarity.EPIC, weight: 40 },
    ],
    threatReduction: 10,
    passiveDropChance: 0.25,
    passiveIds: ['mb_momentum', 'mb_phantom_strike'],
    stages: [3],
  },
  void_harbinger: {
    id: 'void_harbinger',
    name: 'Void Harbinger',
    displayName: 'Tomhetsbudbärare',
    baseHP: 180,
    baseSpeed: 90,
    visualScale: 1.9,
    baseRadius: 34,
    color: '#1e3a5f',
    auraColor: '#38bdf8',
    enemyType: EnemyType.WRAITH,
    baseDamage: 18,
    lootTiers: [
      { rarity: BuffRarity.EPIC, weight: 70 },
      { rarity: BuffRarity.LEGENDARY, weight: 30 },
    ],
    threatReduction: 10,
    passiveDropChance: 0.25,
    passiveIds: ['mb_void_walker', 'mb_void_drain'],
    stages: [4],
  },
  plasma_splitter: {
    id: 'plasma_splitter',
    name: 'Plasma Splitter',
    displayName: 'Plasma-delare',
    baseHP: 160,
    baseSpeed: 110,
    visualScale: 1.7,
    baseRadius: 28,
    color: '#ea580c',
    auraColor: '#fb923c',
    enemyType: EnemyType.SPLINTER,
    baseDamage: 22,
    lootTiers: [
      { rarity: BuffRarity.EPIC, weight: 50 },
      { rarity: BuffRarity.LEGENDARY, weight: 50 },
    ],
    threatReduction: 10,
    passiveDropChance: 0.25,
    passiveIds: ['mb_fortified', 'mb_momentum', 'mb_void_walker'],
    stages: [5],
  },
  chronos_guardian: {
    id: 'chronos_guardian',
    name: 'Chronos Guardian',
    displayName: 'Kronos-vakt',
    baseHP: 170,
    baseSpeed: 85,
    visualScale: 1.8,
    baseRadius: 32,
    color: '#4c1d95',
    auraColor: '#a78bfa',
    enemyType: EnemyType.NOVA,
    baseDamage: 20,
    lootTiers: [
      { rarity: BuffRarity.EPIC, weight: 50 },
      { rarity: BuffRarity.LEGENDARY, weight: 50 },
    ],
    threatReduction: 10,
    passiveDropChance: 0.25,
    passiveIds: ['mb_fortified', 'mb_phantom_strike', 'mb_void_drain'],
    stages: [5],
  },
  swarm_overlord: {
    id: 'swarm_overlord',
    name: 'Swarm Overlord',
    displayName: 'Svärmherre',
    baseHP: 140,
    baseSpeed: 130,
    visualScale: 1.6,
    baseRadius: 24,
    color: '#b45309',
    auraColor: '#fbbf24',
    enemyType: EnemyType.SWARM_V2,
    baseDamage: 12,
    lootTiers: [
      { rarity: BuffRarity.EPIC, weight: 50 },
      { rarity: BuffRarity.LEGENDARY, weight: 50 },
    ],
    threatReduction: 10,
    passiveDropChance: 0.25,
    passiveIds: ['mb_momentum', 'mb_shockwave_echo', 'mb_void_walker'],
    stages: [5],
  },
};

const MINI_BOSS_IDS = Object.keys(MINI_BOSS_DEFINITIONS) as MiniBossId[];

export function isMiniBossId(id: string | undefined | null): id is MiniBossId {
  return !!id && id in MINI_BOSS_DEFINITIONS;
}

export function getMiniBossDef(id: MiniBossId): MiniBossDef {
  return MINI_BOSS_DEFINITIONS[id];
}

/** Safe lookup — returns undefined for missing/invalid ids (avoids render/combat crashes). */
export function tryGetMiniBossDef(id: string | undefined | null): MiniBossDef | undefined {
  if (!isMiniBossId(id)) return undefined;
  return MINI_BOSS_DEFINITIONS[id];
}

export function getMiniBossDisplayName(id: string | undefined | null): string {
  return tryGetMiniBossDef(id)?.displayName ?? 'Miniboss';
}

export function getMiniBossAuraColor(id: string | undefined | null): string {
  return tryGetMiniBossDef(id)?.auraColor ?? '#c084fc';
}

export { MINI_BOSS_IDS };

/** Stage 5+ cycles through implemented mini-bosses by wave index. */
export function pickRotatingMiniBossId(stage: number, waveIndex: number): MiniBossId {
  const pool: MiniBossId[] = [
    'shockwave_sentinel',
    'eclipse_dasher',
    'void_harbinger',
    'plasma_splitter',
    'chronos_guardian',
    'swarm_overlord',
  ];
  if (stage < 5) {
    return pool.find((id) => MINI_BOSS_DEFINITIONS[id].stages.includes(stage)) ?? 'shockwave_sentinel';
  }
  return pool[waveIndex % pool.length];
}
