import { EnemyType, Entity, GameState } from '../types';

/** Max simultaneous enemies per type at full level progress. */
export const BASE_TYPE_CAPS: Partial<Record<EnemyType, number>> = {
  [EnemyType.CHASER]: 8,
  [EnemyType.FAST]: 10,
  [EnemyType.SWARMER]: 8,
  [EnemyType.RANGED]: 8,
  [EnemyType.WRAITH]: 5,
  [EnemyType.ELITE]: 5,
  [EnemyType.SPLINTER]: 4,
  [EnemyType.NOVA]: 4,
  [EnemyType.SNIPER]: 3,
  [EnemyType.PHALANX]: 3,
  [EnemyType.TANK]: 2,
  // New variants
  [EnemyType.DASHER]: 8,
  [EnemyType.PHANTOM]: 4,
  [EnemyType.ZAPPER]: 6,
  [EnemyType.STRIKER]: 5,
  [EnemyType.SWARM_V2]: 10,
  [EnemyType.TRACKER]: 3,
  [EnemyType.FORTIFIED]: 2,
  [EnemyType.SHIELDED]: 4,
  [EnemyType.REGENERATING]: 3,
};

/** Maps spawnEnemy switch index → EnemyType (must match Logic.ts). */
export const PICK_TO_TYPE: Record<number, EnemyType> = {
  0: EnemyType.CHASER,
  1: EnemyType.PHALANX,
  2: EnemyType.WRAITH,
  3: EnemyType.ELITE,
  4: EnemyType.SPLINTER,
  5: EnemyType.NOVA,
  6: EnemyType.RANGED,
  7: EnemyType.CHASER,
  8: EnemyType.CHASER,
  9: EnemyType.FAST,
  10: EnemyType.SWARMER,
  11: EnemyType.SNIPER,
  // New variants
  12: EnemyType.DASHER,
  13: EnemyType.PHANTOM,
  14: EnemyType.ZAPPER,
  15: EnemyType.STRIKER,
  16: EnemyType.SWARM_V2,
  17: EnemyType.TRACKER,
  18: EnemyType.FORTIFIED,
  19: EnemyType.SHIELDED,
  20: EnemyType.REGENERATING,
};

export function getEffectiveTypeCap(type: EnemyType, levelProgress: number): number {
  const base = BASE_TYPE_CAPS[type];
  if (base === undefined) return 999;
  const scale = 0.25 + 0.75 * Math.max(0, Math.min(1, levelProgress));
  return Math.max(1, Math.ceil(base * scale));
}

export function countEnemiesByType(enemies: Entity[]): Partial<Record<EnemyType, number>> {
  const counts: Partial<Record<EnemyType, number>> = {};
  for (const e of enemies) {
    if (e.enemyType) counts[e.enemyType] = (counts[e.enemyType] ?? 0) + 1;
  }
  return counts;
}

export function isPickAtCap(
  pick: number,
  counts: Partial<Record<EnemyType, number>>,
  levelProgress: number
): boolean {
  const type = PICK_TO_TYPE[pick];
  if (!type) return false;
  const cap = getEffectiveTypeCap(type, levelProgress);
  return (counts[type] ?? 0) >= cap;
}

function buildCandidatePicks(threatLevel: number, stage = 1): number[] {
  const t = threatLevel;
  if (stage <= 1) {
    return [7, 7, 7, 7];
  }
  if (stage === 2) {
    return [7, 7, 6, 6, 9, 9];
  }
  return [
    9, 9,
    10, 10,
    7, 7,
    12, 12,   // DASHER — available from the start
    16, 16,   // SWARM_V2 — always present
    ...(t >= 15 ? [6] : []),
    ...(t >= 15 ? [14] : []),  // ZAPPER
    ...(t >= 25 ? [2] : []),
    ...(t >= 30 ? [19] : []),  // SHIELDED
    ...(t >= 35 ? [3] : []),
    ...(t >= 35 ? [13] : []),  // PHANTOM
    ...(t >= 40 ? [15] : []),  // STRIKER
    ...(t >= 45 ? [4] : []),
    ...(t >= 50 ? [17] : []),  // TRACKER
    ...(t >= 55 ? [5] : []),
    ...(t >= 55 ? [20] : []),  // REGENERATING
    ...(t >= 60 ? [18] : []),  // FORTIFIED
    ...(t >= 65 ? [11] : []),
    ...(t >= 75 ? [1] : []),
    ...(t >= 88 ? [0] : []),
  ];
}

/**
 * Weighted pick for survival spawns. Returns null when every type is at cap.
 */
export function pickEnemyTypeForThreat(
  state: GameState,
  levelProgress: number
): number | null {
  if (state.bossActive && !state.inBossArena) return null;

  const counts = countEnemiesByType(state.enemies);
  const candidates = buildCandidatePicks(state.threatLevel, state.stage);

  const weighted: number[] = [];
  for (const pick of candidates) {
    if (isPickAtCap(pick, counts, levelProgress)) continue;
    const type = PICK_TO_TYPE[pick];
    if (!type) continue;
    const stageCapMult =
      state.stage >= 5 ? 1.55 : state.stage >= 4 ? 1.35 : state.stage >= 3 ? 1.2 : 1;
    const cap = Math.ceil(getEffectiveTypeCap(type, levelProgress) * stageCapMult);
    const current = counts[type] ?? 0;
    const slotsLeft = Math.max(1, cap - current);
    for (let w = 0; w < slotsLeft; w++) weighted.push(pick);
  }

  if (weighted.length === 0) return null;
  return weighted[Math.floor(Math.random() * weighted.length)];
}

export function getEnemyTypeForPick(pick: number): EnemyType | undefined {
  return PICK_TO_TYPE[pick];
}

export function isTypeAtCap(
  type: EnemyType,
  enemies: Entity[],
  levelProgress: number
): boolean {
  const counts = countEnemiesByType(enemies);
  const cap = getEffectiveTypeCap(type, levelProgress);
  return (counts[type] ?? 0) >= cap;
}
