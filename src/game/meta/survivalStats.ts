import {
  getMetaProgress,
  recordPersonalBest,
  type PersonalBestResult,
} from './metaProgress';

export function getSurvivalHighScore(): number {
  return getMetaProgress().stats.highScore;
}

export function getLongestSurvivalSeconds(): number {
  return getMetaProgress().stats.longestRunSeconds;
}

export function formatSurvivalTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Persist best score and longest survival after a NORMAL survival run ends. */
export function recordSurvivalRun(score: number, survivalSeconds: number): PersonalBestResult {
  return recordPersonalBest(score, survivalSeconds);
}

export function getTotalMiniBossKills(): number {
  return getMetaProgress().stats.totalMiniBossKills ?? 0;
}
