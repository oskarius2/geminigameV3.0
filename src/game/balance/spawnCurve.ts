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
}

export function getMaxAliveEnemies(params: MaxAliveParams): number {
  const { levelProgress, threatFactor, isRamping, mobile } = params;
  const earlyCap = isRamping ? 4 : 8;
  const lateCap = mobile ? 50 : 120;
  return Math.floor(
    earlyCap +
      levelProgress * levelProgress * (lateCap - earlyCap) +
      threatFactor * (mobile ? 15 : 25)
  );
}

export interface SpawnChanceParams {
  levelProgress: number;
  threatFactor: number;
  survivalTime: number;
  mobile: boolean;
}

export function getSpawnChance(params: SpawnChanceParams): number {
  const { levelProgress, threatFactor, survivalTime, mobile } = params;
  const startGrace = survivalTime < 30 ? 0.35 : 1;
  const raw = 0.01 + levelProgress * 0.4 + threatFactor * 0.2;
  const capped = Math.min(mobile ? 0.35 : 0.85, raw);
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
