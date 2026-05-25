/**
 * Survival difficulty affects mini-boss frequency, HP, and passive drop rates.
 * Stored in localStorage; override via ?difficulty=easy|normal|hard
 */

export type SurvivalDifficulty = 'easy' | 'normal' | 'hard';

const STORAGE_KEY = 'geminigame-survival-difficulty';

/** In-memory cache (tests + immediate reads after set). */
let cachedDifficulty: SurvivalDifficulty | null = null;

export const SURVIVAL_DIFFICULTY_LABELS: Record<SurvivalDifficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
};

export function getSurvivalDifficulty(): SurvivalDifficulty {
  if (cachedDifficulty) return cachedDifficulty;
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('difficulty');
    if (param === 'easy' || param === 'normal' || param === 'hard') {
      cachedDifficulty = param;
      return param;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'easy' || stored === 'normal' || stored === 'hard') {
        cachedDifficulty = stored;
        return stored;
      }
    } catch {
      /* ignore */
    }
  }
  return 'normal';
}

export function setSurvivalDifficulty(value: SurvivalDifficulty): void {
  cachedDifficulty = value;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    /* ignore */
  }
}

/** Test helper — clears in-memory cache so localStorage is re-read. */
export function resetSurvivalDifficultyCache(): void {
  cachedDifficulty = null;
}

/** Whether scripted mini-boss slots fire on this wave. */
export function shouldSpawnMiniBossesOnWave(
  stage: number,
  waveIndex: number,
  hasWaveSlots: boolean,
): boolean {
  const difficulty = getSurvivalDifficulty();
  if (difficulty === 'hard' && stage >= 2) return true;
  if (!hasWaveSlots) return false;
  if (difficulty === 'easy') {
    return (waveIndex + 1) % 3 === 0;
  }
  return true;
}

export function getMiniBossHpMultiplier(): number {
  switch (getSurvivalDifficulty()) {
    case 'easy':
      return 0.82;
    case 'hard':
      return 1.28;
    default:
      return 1;
  }
}

export function getMiniBossPassiveChanceMultiplier(): number {
  switch (getSurvivalDifficulty()) {
    case 'easy':
      return 0.6;
    case 'hard':
      return 1.35;
    default:
      return 1;
  }
}

export interface SurvivalSpawnModifiers {
  spawnChanceMult: number;
  maxEnemiesMult: number;
  waveSpawnDelayMult: number;
  threatOffset: number;
}

export function getSurvivalSpawnModifiers(): SurvivalSpawnModifiers {
  switch (getSurvivalDifficulty()) {
    case 'easy':
      return {
        spawnChanceMult: 0.78,
        maxEnemiesMult: 0.85,
        waveSpawnDelayMult: 1.12,
        threatOffset: -12,
      };
    case 'hard':
      return {
        spawnChanceMult: 1.22,
        maxEnemiesMult: 1.15,
        waveSpawnDelayMult: 0.9,
        threatOffset: 10,
      };
    default:
      return {
        spawnChanceMult: 1,
        maxEnemiesMult: 1,
        waveSpawnDelayMult: 1,
        threatOffset: 0,
      };
  }
}

/** Apply difficulty bias on top of augment-driven threat score. */
export function applySurvivalDifficultyToThreat(baseThreat: number): number {
  const { threatOffset } = getSurvivalSpawnModifiers();
  return Math.min(100, Math.max(0, baseThreat + threatOffset));
}

export function getSurvivalDifficultyLabel(): string {
  return SURVIVAL_DIFFICULTY_LABELS[getSurvivalDifficulty()];
}

/** @deprecated Use getSurvivalDifficultyLabel() */
export const getSurvivalDifficultyLabelSv = getSurvivalDifficultyLabel;
