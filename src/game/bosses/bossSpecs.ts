import { BOSS_DEFINITIONS, type BossDefinition } from '../content/bosses';

export type BossAttackPattern =
  | 'standard'
  | 'gravity_pulse'
  | 'enforcer_barrage'
  | 'colossus_slam'
  | 'swarm_crown'
  | 'wraith_blink';

export interface StageBossSpec {
  bossId: string;
  stageMin: number;
  stageMax: number;
  visualId: string;
  attackPattern: BossAttackPattern;
  introLine: string;
  tauntLine: string;
  victoryLine: string;
  /** Extra guaranteed loot roll weight on boss kill (0–1). */
  lootBonusChance: number;
  /** Also eligible when this stage's boss is picked. */
  alternateBossIds?: string[];
}

/** Primary stage bosses (3–5) plus early-stage anchors. */
export const STAGE_BOSS_SPECS: StageBossSpec[] = [
  {
    bossId: 'salvage_hauler',
    stageMin: 1,
    stageMax: 2,
    visualId: 'salvage_hauler',
    attackPattern: 'standard',
    introLine: 'Salvage Hauler on intercept vector.',
    tauntLine: 'Your hull is worth more scrap than you think.',
    victoryLine: 'Hauler disabled. Lane clear.',
    lootBonusChance: 0.35,
    alternateBossIds: ['hive_regent'],
  },
  {
    bossId: 'void_cardinal',
    stageMin: 3,
    stageMax: 3,
    visualId: 'void_cardinal',
    attackPattern: 'gravity_pulse',
    introLine: 'Void Cardinal bends the corridor.',
    tauntLine: 'Gravity does not negotiate.',
    victoryLine: 'Cardinal shattered. Variation stage secured.',
    lootBonusChance: 0.55,
    alternateBossIds: ['hive_regent', 'wraith_lord'],
  },
  {
    bossId: 'crimson_tyrant',
    stageMin: 4,
    stageMax: 4,
    visualId: 'crimson_tyrant',
    attackPattern: 'enforcer_barrage',
    introLine: 'Crimson Tyrant — sector enforcer.',
    tauntLine: 'Sector command wants your wreckage on file.',
    victoryLine: 'Tyrant down. Escalation contained.',
    lootBonusChance: 0.65,
    alternateBossIds: ['void_cardinal', 'hive_queen'],
  },
  {
    bossId: 'colossus',
    stageMin: 5,
    stageMax: 99,
    visualId: 'colossus',
    attackPattern: 'colossus_slam',
    introLine: 'Colossus — endless chaos anchor.',
    tauntLine: 'The sector shudders. You will too.',
    victoryLine: 'Colossus silenced. For now.',
    lootBonusChance: 0.8,
    alternateBossIds: ['wraith_lord', 'hive_queen'],
  },
];

const SPEC_BY_ID = new Map(STAGE_BOSS_SPECS.map((s) => [s.bossId, s]));

export function getBossSpec(bossId: string | null | undefined): StageBossSpec | undefined {
  if (!bossId) return undefined;
  return SPEC_BY_ID.get(bossId);
}

/** Boss ids weighted for a survival stage (primary first). */
export function getStageBossPool(stage: number): string[] {
  const primary = STAGE_BOSS_SPECS.filter((s) => stage >= s.stageMin && stage <= s.stageMax);
  const ids: string[] = [];
  for (const spec of primary) {
    ids.push(spec.bossId);
    if (spec.alternateBossIds) ids.push(...spec.alternateBossIds);
  }
  if (ids.length === 0) {
    return BOSS_DEFINITIONS.map((b) => b.id);
  }
  return [...new Set(ids)];
}

export function pickBossForSurvivalStage(
  stage: number,
  excludeId?: string | null,
): BossDefinition {
  let poolIds = getStageBossPool(stage);
  const defs = BOSS_DEFINITIONS.filter((b) => poolIds.includes(b.id));
  let pool = defs.length > 0 ? defs : [...BOSS_DEFINITIONS];
  if (excludeId) {
    const filtered = pool.filter((b) => b.id !== excludeId);
    if (filtered.length > 0) pool = filtered;
  }
  const primarySpec = STAGE_BOSS_SPECS.find((s) => stage >= s.stageMin && stage <= s.stageMax);
  if (primarySpec && pool.some((b) => b.id === primarySpec.bossId)) {
    if (Math.random() < 0.55) {
      return pool.find((b) => b.id === primarySpec.bossId) ?? pool[0];
    }
  }
  const weights = pool.map((b, i) => {
    const spec = getBossSpec(b.id);
    const primaryBoost = spec && stage >= spec.stageMin && stage <= spec.stageMax ? 2.5 : 1;
    return primaryBoost * (1.2 + stage * 0.15 + i * 0.35);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function getBossIntroLine(bossId: string | null | undefined): string | undefined {
  return getBossSpec(bossId)?.introLine;
}

export function getBossTauntLine(bossId: string | null | undefined): string | undefined {
  return getBossSpec(bossId)?.tauntLine;
}

export function getBossVictoryLine(bossId: string | null | undefined): string | undefined {
  return getBossSpec(bossId)?.victoryLine;
}

export function getBossAttackPattern(bossId: string | null | undefined): BossAttackPattern {
  return getBossSpec(bossId)?.attackPattern ?? 'standard';
}
