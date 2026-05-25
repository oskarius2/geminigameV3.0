import { EnemyType } from '../types';

/**
 * Enemy spawn diversity — archetype classification, per-stage weighted pools,
 * and the `selectMixedEnemies()` helper that guarantees varied combat.
 *
 * Used by waveCompositions.ts to ensure no single enemy type dominates a wave
 * and by waveSpawnController.ts to vary per-type spawn cadence (tanks slower).
 *
 * Does NOT alter the spawn pipeline — types still flow through
 * `spawnFromPick → spawnEnemyFromWave` exactly as before.
 */

export type EnemyArchetype = 'melee' | 'tank' | 'ranged' | 'swarm' | 'special';

/** Archetype classification for every enemy type in the roster. */
export const ENEMY_ARCHETYPE: Record<EnemyType, EnemyArchetype> = {
  [EnemyType.CHASER]: 'melee',
  [EnemyType.FAST]: 'melee',
  [EnemyType.DASHER]: 'melee',
  [EnemyType.CHARGER]: 'melee',
  [EnemyType.STRIKER]: 'melee',

  [EnemyType.TANK]: 'tank',
  [EnemyType.PHALANX]: 'tank',
  [EnemyType.FORTIFIED]: 'tank',
  [EnemyType.SHIELDED]: 'tank',
  [EnemyType.BLOCKER]: 'tank',
  [EnemyType.REGENERATING]: 'tank',

  [EnemyType.RANGED]: 'ranged',
  [EnemyType.SNIPER]: 'ranged',
  [EnemyType.ZAPPER]: 'ranged',
  [EnemyType.NOVA]: 'ranged',

  [EnemyType.SWARMER]: 'swarm',
  [EnemyType.SWARM_V2]: 'swarm',
  [EnemyType.SPLINTER]: 'swarm',

  [EnemyType.ELITE]: 'special',
  [EnemyType.WRAITH]: 'special',
  [EnemyType.PHANTOM]: 'special',
  [EnemyType.TRACKER]: 'special',
  [EnemyType.BOSS]: 'special',
};

/**
 * Per-type spawn cadence multiplier applied on top of the wave's base spawnDelay.
 * Tanks / specials spawn less frequently → fewer "wall of tanks" moments,
 * keeps fast types as the rhythmic baseline.
 */
export const ENEMY_SPAWN_DELAY_MULT: Partial<Record<EnemyType, number>> = {
  [EnemyType.TANK]: 1.5,
  [EnemyType.PHALANX]: 1.4,
  [EnemyType.FORTIFIED]: 1.5,
  [EnemyType.SHIELDED]: 1.3,
  [EnemyType.REGENERATING]: 1.4,
  [EnemyType.BLOCKER]: 1.4,
  [EnemyType.ELITE]: 1.3,
  [EnemyType.WRAITH]: 1.2,
  [EnemyType.PHANTOM]: 1.2,
  [EnemyType.SNIPER]: 1.2,
  [EnemyType.NOVA]: 1.15,
};

export function getEnemyArchetype(type: EnemyType): EnemyArchetype {
  return ENEMY_ARCHETYPE[type] ?? 'special';
}

export function getEnemySpawnDelayMult(type: EnemyType): number {
  return ENEMY_SPAWN_DELAY_MULT[type] ?? 1;
}

export interface EnemyPoolEntry {
  type: EnemyType;
  weight: number;
}

/**
 * Per-stage spawn pool with weights. Higher weight = more frequent.
 * Stage 1 stays gentle (melee + swarm only), stage 2 introduces ranged + tank,
 * stage 3+ unlocks full roster with rising weight on harder types.
 */
export const STAGE_ENEMY_POOLS: Record<number, EnemyPoolEntry[]> = {
  1: [
    { type: EnemyType.CHASER, weight: 5 },
    { type: EnemyType.FAST, weight: 3 },
    { type: EnemyType.SWARMER, weight: 3 },
  ],
  2: [
    { type: EnemyType.CHASER, weight: 4 },
    { type: EnemyType.FAST, weight: 3 },
    { type: EnemyType.RANGED, weight: 3 },
    { type: EnemyType.SWARMER, weight: 2 },
    { type: EnemyType.TANK, weight: 1 },
  ],
  3: [
    { type: EnemyType.CHASER, weight: 3 },
    { type: EnemyType.FAST, weight: 3 },
    { type: EnemyType.RANGED, weight: 3 },
    { type: EnemyType.SWARMER, weight: 3 },
    { type: EnemyType.SWARM_V2, weight: 2 },
    { type: EnemyType.TANK, weight: 2 },
    { type: EnemyType.DASHER, weight: 2 },
    { type: EnemyType.ELITE, weight: 1 },
  ],
  4: [
    { type: EnemyType.CHASER, weight: 2 },
    { type: EnemyType.RANGED, weight: 3 },
    { type: EnemyType.SWARM_V2, weight: 3 },
    { type: EnemyType.TANK, weight: 2 },
    { type: EnemyType.ELITE, weight: 2 },
    { type: EnemyType.NOVA, weight: 2 },
    { type: EnemyType.WRAITH, weight: 2 },
    { type: EnemyType.DASHER, weight: 2 },
    { type: EnemyType.SPLINTER, weight: 2 },
    { type: EnemyType.SHIELDED, weight: 1 },
    { type: EnemyType.PHANTOM, weight: 1 },
  ],
  5: [
    { type: EnemyType.CHASER, weight: 2 },
    { type: EnemyType.FAST, weight: 2 },
    { type: EnemyType.RANGED, weight: 2 },
    { type: EnemyType.SWARM_V2, weight: 3 },
    { type: EnemyType.TANK, weight: 2 },
    { type: EnemyType.ELITE, weight: 2 },
    { type: EnemyType.NOVA, weight: 2 },
    { type: EnemyType.WRAITH, weight: 2 },
    { type: EnemyType.DASHER, weight: 2 },
    { type: EnemyType.SPLINTER, weight: 2 },
    { type: EnemyType.SHIELDED, weight: 2 },
    { type: EnemyType.PHANTOM, weight: 2 },
    { type: EnemyType.TRACKER, weight: 2 },
    { type: EnemyType.FORTIFIED, weight: 1 },
    { type: EnemyType.SNIPER, weight: 1 },
    { type: EnemyType.PHALANX, weight: 1 },
    { type: EnemyType.STRIKER, weight: 2 },
    { type: EnemyType.ZAPPER, weight: 2 },
    { type: EnemyType.REGENERATING, weight: 1 },
  ],
};

export function getStageEnemyPool(stage: number): EnemyPoolEntry[] {
  if (stage <= 0) return STAGE_ENEMY_POOLS[1];
  return STAGE_ENEMY_POOLS[stage] ?? STAGE_ENEMY_POOLS[5];
}

export interface SelectMixedOptions {
  stage: number;
  count: number;
  /** Minimum number of unique enemy types in the result (capped by pool size). */
  minVariety?: number;
  /** No single type may exceed this fraction of `count` (default 0.5). */
  maxPerTypeRatio?: number;
  /** Optional injected RNG for deterministic tests. */
  rng?: () => number;
}

/**
 * Returns a mixed array of `count` enemy types drawn from the stage's pool.
 *
 * Guarantees:
 *  - At least `minVariety` distinct types when the pool has enough entries
 *  - No single type exceeds `maxPerTypeRatio * count` (prevents 5x-same-enemy)
 *  - Selection is weighted by pool weights for remaining slots
 *
 * Example:
 *   selectMixedEnemies({ stage: 1, count: 8 })
 *   → [CHASER, FAST, SWARMER, CHASER, FAST, SWARMER, CHASER, FAST]
 */
export function selectMixedEnemies(opts: SelectMixedOptions): EnemyType[] {
  const { stage, count, minVariety = 3, maxPerTypeRatio = 0.5, rng = Math.random } = opts;
  if (count <= 0) return [];

  const pool = getStageEnemyPool(stage);
  if (pool.length === 0) return [];

  const effectiveMinVariety = Math.max(1, Math.min(minVariety, pool.length, count));
  const maxPerType = Math.max(1, Math.ceil(count * maxPerTypeRatio));

  const result: EnemyType[] = [];
  const counts = new Map<EnemyType, number>();

  const sortedByWeight = [...pool].sort((a, b) => b.weight - a.weight);
  for (let i = 0; i < effectiveMinVariety; i++) {
    const type = sortedByWeight[i].type;
    result.push(type);
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }

  while (result.length < count) {
    let totalWeight = 0;
    const available: EnemyPoolEntry[] = [];
    for (const entry of pool) {
      const used = counts.get(entry.type) ?? 0;
      if (used >= maxPerType) continue;
      available.push(entry);
      totalWeight += entry.weight;
    }
    if (available.length === 0 || totalWeight <= 0) break;

    let r = rng() * totalWeight;
    let chosen: EnemyType = available[0].type;
    for (const entry of available) {
      r -= entry.weight;
      if (r <= 0) {
        chosen = entry.type;
        break;
      }
    }
    result.push(chosen);
    counts.set(chosen, (counts.get(chosen) ?? 0) + 1);
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Compresses a flat `EnemyType[]` into `WaveEnemySlot[]`-shaped pairs.
 * Helper for building wave templates from selectMixedEnemies output.
 */
export function toSlotList(types: EnemyType[]): { type: EnemyType; count: number }[] {
  const order: EnemyType[] = [];
  const counts = new Map<EnemyType, number>();
  for (const t of types) {
    if (!counts.has(t)) order.push(t);
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return order.map((type) => ({ type, count: counts.get(type) ?? 0 }));
}
