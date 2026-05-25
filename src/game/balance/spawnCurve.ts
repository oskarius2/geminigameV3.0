/** Kill quota for a survival stage (matches INITIAL_STATE + stage transitions in App.tsx). */
export function getStageQuota(stage: number): number {
  if (stage === 1) return 40;
  if (stage <= 4) return 30 + stage * 15;
  return Math.min(120, 75 + stage * 8);
}

/** 0 at stage start, 1 when kill quota is cleared. */
export function getLevelProgress(enemiesRemaining: number, totalToKill: number): number {
  if (totalToKill <= 0) return 1;
  const killsDone = totalToKill - enemiesRemaining;
  return Math.max(0, Math.min(1, killsDone / totalToKill));
}

export interface MaxAliveParams {
  levelProgress: number;
  threatFactor: number;
  isRamping: boolean;
  mobile: boolean;
  /** Survival stage — stage 1 gets a modest on-field bump only. */
  stage?: number;
}

function getStageMaxAliveBonus(stage: number): number {
  if (stage <= 1) return 0;
  if (stage === 2) return 4;
  if (stage === 3) return 8;
  if (stage === 4) return 12;
  return Math.min(18, 12 + (stage - 4) * 2);
}

export function getMaxAliveEnemies(params: MaxAliveParams): number {
  const { levelProgress, threatFactor, isRamping, mobile, stage = 99 } = params;
  const earlyCap = isRamping ? 5 : 8;
  const lateCap = mobile ? 28 : 45;
  const cap = Math.floor(
    earlyCap +
      levelProgress * (lateCap - earlyCap) +
      threatFactor * (mobile ? 6 : 12) +
      getStageMaxAliveBonus(stage)
  );
  return Math.min(mobile ? 35 : 55, cap);
}

export interface SpawnChanceParams {
  levelProgress: number;
  threatFactor: number;
  survivalTime: number;
  mobile: boolean;
  stage?: number;
}

function getStageSpawnChanceMult(stage = 99): number {
  if (stage <= 1) return 0.9;
  if (stage === 2) return 1.0;
  if (stage === 3) return 1.08;
  if (stage === 4) return 1.15;
  return Math.min(1.25, 1.15 + (stage - 4) * 0.02);
}

export function getSpawnChance(params: SpawnChanceParams): number {
  const { levelProgress, threatFactor, survivalTime, mobile, stage } = params;
  const startGrace = survivalTime < 20 ? 0.5 : survivalTime < 40 ? 0.75 : 1;
  const progressForSpawn =
    levelProgress > 0.7
      ? 0.7 + (levelProgress - 0.7) * 0.5
      : levelProgress;
  const raw = 0.02 + progressForSpawn * 0.5 + threatFactor * 0.12;
  const capped = Math.min(mobile ? 0.45 : 0.8, raw * getStageSpawnChanceMult(stage));
  return capped * startGrace;
}

/** Resolves kill quota for spawn scaling (campaign level vs survival stage). */
export function getKillQuotaForSpawn(
  gameMode: 'NORMAL' | 'CAMPAIGN' | 'AIM_TRAINER' | 'SURVIVAL',
  stage: number,
  campaignTotal: number | null
): number {
  if (gameMode === 'CAMPAIGN' && campaignTotal != null) return campaignTotal;
  return getStageQuota(stage);
}
