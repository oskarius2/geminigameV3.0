/** Kill quota for a survival stage (matches INITIAL_STATE + stage transitions in App.tsx). */
export function getStageQuota(stage: number): number {
  if (stage === 1) return 50;
  return 35 + 25 * stage;
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
  if (stage === 2) return 6;
  if (stage === 3) return 14;
  if (stage === 4) return 26;
  return 40;
}

export function getMaxAliveEnemies(params: MaxAliveParams): number {
  const { levelProgress, threatFactor, isRamping, mobile, stage = 99 } = params;
  let earlyCap = isRamping ? 6 : 12;
  const lateCap = mobile ? 55 : 85;
  if (stage === 1) {
    earlyCap += isRamping ? 2 : 4;
  }
  return Math.floor(
    earlyCap +
      levelProgress * levelProgress * (lateCap - earlyCap) +
      threatFactor * (mobile ? 20 : 35) +
      getStageMaxAliveBonus(stage)
  );
}

export interface SpawnChanceParams {
  levelProgress: number;
  threatFactor: number;
  survivalTime: number;
  mobile: boolean;
  stage?: number;
}

function getStageSpawnChanceMult(stage = 99): number {
  if (stage <= 1) return 1;
  if (stage === 2) return 1.08;
  if (stage === 3) return 1.15;
  if (stage === 4) return 1.25;
  return 1.38;
}

export function getSpawnChance(params: SpawnChanceParams): number {
  const { levelProgress, threatFactor, survivalTime, mobile, stage } = params;
  const startGrace = survivalTime < 15 ? 0.6 : 1;
  const dampenLate = (stage ?? 99) < 4;
  const progressForSpawn =
    dampenLate && levelProgress > 0.7
      ? 0.7 + (levelProgress - 0.7) * 0.4
      : levelProgress;
  const raw = 0.02 + progressForSpawn * 0.6 + threatFactor * 0.15;
  const capped = Math.min(mobile ? 0.55 : 1.0, raw * getStageSpawnChanceMult(stage));
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
