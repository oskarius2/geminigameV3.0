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

export function getMaxAliveEnemies(params: MaxAliveParams): number {
  const { levelProgress, threatFactor, isRamping, mobile, stage = 99 } = params;
  let earlyCap = isRamping ? 6 : 12;
  const lateCap = mobile ? 45 : 70;
  if (stage === 1) {
    earlyCap += isRamping ? 2 : 4;
  }
  return Math.floor(
    earlyCap +
      levelProgress * levelProgress * (lateCap - earlyCap) +
      threatFactor * (mobile ? 20 : 35)
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
  const startGrace = survivalTime < 15 ? 0.6 : 1; // Shorter grace period, higher start chance
  // Dampen spawn scaling in the last 30% of a stage (avoids late-stage mob flood)
  const progressForSpawn =
    levelProgress <= 0.7
      ? levelProgress
      : 0.7 + (levelProgress - 0.7) * 0.4; // Less dampening in late stage
  const raw = 0.02 + progressForSpawn * 0.6 + threatFactor * 0.15; // Higher base and multipliers
  const capped = Math.min(mobile ? 0.5 : 1.0, raw); // Higher caps
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
