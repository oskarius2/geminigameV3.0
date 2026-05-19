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

function buildCandidatePicks(threatLevel: number): number[] {
  const t = threatLevel;
  return [
    9, 9,
    10, 10,
    7, 7,
    ...(t >= 15 ? [6] : []),
    ...(t >= 25 ? [2] : []),
    ...(t >= 35 ? [3] : []),
    ...(t >= 45 ? [4] : []),
    ...(t >= 55 ? [5] : []),
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
  if (state.bossActive) return null;

  const counts = countEnemiesByType(state.enemies);
  const candidates = buildCandidatePicks(state.threatLevel);

  const weighted: number[] = [];
  for (const pick of candidates) {
    if (isPickAtCap(pick, counts, levelProgress)) continue;
    const type = PICK_TO_TYPE[pick];
    if (!type) continue;
    const cap = getEffectiveTypeCap(type, levelProgress);
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
