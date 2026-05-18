import { ARTIFACTS, artifactPowerScore } from '../content/artifacts';
import { PASSIVE_BUFFS } from '../content/buffs';
import { ArtifactSlot, BuffRarity, EnemyType, GameState } from '../types';

// Max simultaneous enemies per type (soft cap — skipped if at limit, not hard-killed)
const TYPE_CAPS: Partial<Record<EnemyType, number>> = {
  [EnemyType.CHASER]:    8,
  [EnemyType.FAST]:     10,
  [EnemyType.SWARMER]:   8,
  [EnemyType.RANGED]:    8,
  [EnemyType.WRAITH]:    5,
  [EnemyType.ELITE]:     5,
  [EnemyType.SPLINTER]:  4,
  [EnemyType.NOVA]:      4,
  [EnemyType.SNIPER]:    3,
  [EnemyType.PHALANX]:   3,
  [EnemyType.TANK]:      2,
};

const EXCLUSIVE_IDS = new Set(
  Object.values(PASSIVE_BUFFS)
    .filter((b) => b.exclusive || b.rarity === BuffRarity.EXCLUSIVE)
    .map((b) => b.id)
);

const STACK_WEIGHTS: Record<string, number> = {
  multishot_up: 4,
  multishot_apocalypse: 8,
  dmg_up: 2,
  crit_up: 2,
  orbital: 3,
  orbital_legion: 6,
  lifesteal_up: 2,
  explosive: 2,
  bullet_storm: 5,
  infinity_pierce: 4,
  chain_god: 4,
  glass_cannon_omega: 4,
  kill_satellite: 3,
  void_rift: 3,
};

export function computeThreatLevel(state: GameState): number {
  let score = 0;

  for (const id of state.passives) {
    const def = PASSIVE_BUFFS[id];
    const w = STACK_WEIGHTS[id] ?? (def?.exclusive ? 3 : 1);
    const mult = EXCLUSIVE_IDS.has(id) ? 1.5 : 1;
    score += w * mult;
  }

  score += Math.min(25, state.multiShot * 1.5);
  score += Math.min(20, (state.baseDamage / 12 - 1) * 8);
  score += state.critChance * 30;
  score += state.orbitalCount * 4;

  if (state.permanentOverdrive) score += 5;
  if (state.permanentRapidFire) score += 5;
  if (state.permanentPiercing) score += 4;
  if (state.permanentTimeSlow) score += 6;
  if (state.hasLighting) score += 4;
  if (state.hasGravityWell || state.hasVoidRift) score += 4;
  if (state.bulletStormMult > 1) score += 6;

  const slots = Object.keys(state.equippedArtifacts) as ArtifactSlot[];
  for (const slot of slots) {
    const artId = state.equippedArtifacts[slot];
    if (artId && ARTIFACTS[artId]) {
      score += artifactPowerScore(ARTIFACTS[artId]) * 0.1;
    }
  }

  score += state.augmentCount * 1.5;
  score += state.stage * 2.0;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getThreatMult(state: GameState): number {
  return 0.75 + (state.threatLevel / 100) * 1.5;
}

// Maps pick-number → EnemyType (must match spawnEnemy switch in Logic.ts)
const PICK_TO_TYPE: Record<number, EnemyType> = {
  0: EnemyType.CHASER,   // case 0: heavy chaser
  1: EnemyType.PHALANX,
  2: EnemyType.WRAITH,
  3: EnemyType.ELITE,
  4: EnemyType.SPLINTER,
  5: EnemyType.NOVA,
  6: EnemyType.RANGED,
  7: EnemyType.CHASER,
  8: EnemyType.CHASER,   // case 8: armored chaser variant
  9: EnemyType.FAST,
  10: EnemyType.SWARMER,
  11: EnemyType.SNIPER,
};

export function pickEnemyTypeForThreat(state: GameState, stage: number): number {
  if (state.bossActive) return -1;

  const t = state.threatLevel; // 0–100, driven by buffs

  // Count active enemies per type
  const counts: Partial<Record<EnemyType, number>> = {};
  for (const e of state.enemies) {
    if (e.enemyType) counts[e.enemyType] = (counts[e.enemyType] ?? 0) + 1;
  }

  const isCapped = (pick: number): boolean => {
    const type = PICK_TO_TYPE[pick];
    const cap = type ? TYPE_CAPS[type] : undefined;
    return cap !== undefined && (counts[type!] ?? 0) >= cap;
  };

  // All types available from the start — threat gates probability, not availability
  // Low threat: basics dominate. High threat: dangerous types appear more.
  const candidates: number[] = [
    9, 9,                          // FAST — always common
    10, 10,                        // SWARMER — always common
    7, 7,                          // CHASER — always common
    ...(t >= 15 ? [6] : []),       // RANGED unlocks early
    ...(t >= 25 ? [2] : []),       // WRAITH
    ...(t >= 35 ? [3] : []),       // ELITE
    ...(t >= 45 ? [4] : []),       // SPLINTER
    ...(t >= 55 ? [5] : []),       // NOVA
    ...(t >= 65 ? [11] : []),      // SNIPER
    ...(t >= 75 ? [1] : []),       // PHALANX
    ...(t >= 88 ? [0] : []),       // heavy CHASER variant
  ];

  const available = candidates.filter(c => !isCapped(c));
  const pool = available.length > 0 ? available : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}
