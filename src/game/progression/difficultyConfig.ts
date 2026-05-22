export interface DifficultyStage {
  stage: number;
  enemyCountMin: number;
  enemyCountMax: number;
  spawnIntervalMs: number;
  enemyDamageMultiplier: number;
  enemyHealthMultiplier: number;
  miniBossDamage: number;
  miniBossHealth: number;
  artifactDropRate: number;
  availableArtifactPool: string[];
  threatBPMBase: number;
  threatBPMMax: number;
}

export const DIFFICULTY_PROGRESSION: DifficultyStage[] = [
  {
    stage: 1,
    enemyCountMin: 3,
    enemyCountMax: 5,
    spawnIntervalMs: 2000,
    enemyDamageMultiplier: 0.8,
    enemyHealthMultiplier: 0.8,
    miniBossDamage: 25,
    miniBossHealth: 100,
    artifactDropRate: 0.15,
    availableArtifactPool: ['utility', 'defense', 'companion_basic'],
    threatBPMBase: 85,
    threatBPMMax: 95,
  },
  {
    stage: 2,
    enemyCountMin: 6,
    enemyCountMax: 10,
    spawnIntervalMs: 1500,
    enemyDamageMultiplier: 1.0,
    enemyHealthMultiplier: 1.0,
    miniBossDamage: 35,
    miniBossHealth: 150,
    artifactDropRate: 0.12,
    availableArtifactPool: ['utility', 'defense', 'companion_basic', 'offense_basic'],
    threatBPMBase: 90,
    threatBPMMax: 105,
  },
  {
    stage: 3,
    enemyCountMin: 10,
    enemyCountMax: 15,
    spawnIntervalMs: 1000,
    enemyDamageMultiplier: 1.3,
    enemyHealthMultiplier: 1.4,
    miniBossDamage: 50,
    miniBossHealth: 220,
    artifactDropRate: 0.1,
    availableArtifactPool: ['defense', 'companion_mid', 'offense_basic', 'offense_crit'],
    threatBPMBase: 95,
    threatBPMMax: 115,
  },
  {
    stage: 4,
    enemyCountMin: 18,
    enemyCountMax: 30,
    spawnIntervalMs: 600,
    enemyDamageMultiplier: 1.7,
    enemyHealthMultiplier: 2.0,
    miniBossDamage: 70,
    miniBossHealth: 320,
    artifactDropRate: 0.08,
    availableArtifactPool: ['offense_crit', 'companion_advanced', 'synergy', 'legendary_basic'],
    threatBPMBase: 105,
    threatBPMMax: 130,
  },
  {
    stage: 5,
    enemyCountMin: 35,
    enemyCountMax: 40,
    spawnIntervalMs: 400,
    enemyDamageMultiplier: 2.2,
    enemyHealthMultiplier: 3.0,
    miniBossDamage: 100,
    miniBossHealth: 450,
    artifactDropRate: 0.08,
    availableArtifactPool: ['synergy', 'legendary_basic', 'legendary_advanced', 'corrupted'],
    threatBPMBase: 115,
    threatBPMMax: 150,
  },
];

export function getDifficultyForStage(stage: number): DifficultyStage {
  if (stage <= DIFFICULTY_PROGRESSION.length) {
    return DIFFICULTY_PROGRESSION[stage - 1];
  }

  const baseEndgame = DIFFICULTY_PROGRESSION[DIFFICULTY_PROGRESSION.length - 1];
  const endlessMultiplier = 1 + (stage - 5) * 0.2;

  return {
    ...baseEndgame,
    stage,
    enemyCountMax: Math.floor(baseEndgame.enemyCountMax * endlessMultiplier),
    enemyCountMin: Math.floor(baseEndgame.enemyCountMin * endlessMultiplier),
    enemyDamageMultiplier: baseEndgame.enemyDamageMultiplier * endlessMultiplier,
    enemyHealthMultiplier: baseEndgame.enemyHealthMultiplier * endlessMultiplier,
    miniBossDamage: Math.floor(baseEndgame.miniBossDamage * endlessMultiplier),
    miniBossHealth: Math.floor(baseEndgame.miniBossHealth * endlessMultiplier),
  };
}
