import {
  COMPANION_IDS,
  COMPANION_MAX_LEVEL,
  getCompanionDef,
  getRecommendedCompanion,
} from './companionDefs';
import type {
  CompanionProgressEntry,
  CompanionProgressSave,
  GainXpResult,
} from './companionTypes';
import { CompanionType } from './companionTypes';
import { getMetaUnlockedCompanionIds, unlockCompanion as metaUnlockCompanion } from '../meta/metaProgress';
import type { CompanionId } from '../types';
import type { GameState } from '../types';
import {
  applyRunSliceToGameState,
  sliceRunFromGameState,
  type CompanionRunSlice,
} from './companionGameState';

export type { CompanionProgressEntry, CompanionProgressSave, GainXpResult } from './companionTypes';

const STORAGE_KEY = 'companionProgress_v1';
const SELECTED_KEY = 'companionSelected_v1';
const UNLOCKED_KEY = 'companionsUnlocked_v1';

/**
 * Cumulative XP required to reach each level (index 0 = level 1).
 * Persisted under localStorage key `companionProgress_v1` as JSON.
 */
export const COMPANION_LEVEL_XP_THRESHOLDS: Record<CompanionId, number[]> = {
  guardian: [0, 100, 250, 450, 700],
  scout: [0, 150, 300, 500, 800],
  healer: [0, 200, 400, 600, 900],
  gunner: [0, 250, 500, 750, 1000],
};

/** Alias for design-doc naming (`guardianDrone` keys map to `guardian` ids). */
export const CompanionLevels: Record<CompanionId, number[]> = COMPANION_LEVEL_XP_THRESHOLDS;

function storageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

export function getLevelFromXp(xp: number, companionId: CompanionId): number {
  const thresholds = COMPANION_LEVEL_XP_THRESHOLDS[companionId];
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(COMPANION_MAX_LEVEL, level);
}

export function loadCompanionProgress(): CompanionProgressSave {
  if (!storageAvailable()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CompanionProgressSave;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCompanionProgress(progress: CompanionProgressSave): void {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* ignore quota / private mode */
  }
}

function defaultEntry(): CompanionProgressEntry {
  return { xp: 0, level: 1 };
}

export function getCompanionProgress(companionId: CompanionId): CompanionProgressEntry {
  const all = loadCompanionProgress();
  const entry = all[companionId] ?? defaultEntry();
  const level = getLevelFromXp(entry.xp, companionId);
  return { xp: entry.xp, level };
}

/** Meta XP total for a companion type (persisted). */
export function getCompanionXp(companionId: CompanionId): number {
  return getCompanionProgress(companionId).xp;
}

/** Meta level for a companion (persisted, derived from XP). */
export function getCompanionLevel(companionId: CompanionId): number;
export function getCompanionLevel(type: CompanionType): number;
export function getCompanionLevel(idOrType: CompanionId | CompanionType): number {
  const id = resolveCompanionId(idOrType);
  return getCompanionProgress(id).level;
}

/** Meta XP for a companion type. */
export function getCompanionXpByType(type: CompanionType): number {
  return getCompanionXp(getCompanionDef(type)!.id);
}

function resolveCompanionId(idOrType: CompanionId | CompanionType): CompanionId {
  if (COMPANION_IDS.includes(idOrType as CompanionId)) {
    return idOrType as CompanionId;
  }
  const def = getCompanionDef(idOrType as CompanionType);
  if (!def) throw new Error(`Unknown companion: ${idOrType}`);
  return def.id;
}

/**
 * Add XP for a companion type and persist to localStorage.
 * Returns whether a new level was reached.
 */
export function gainXP(companionId: CompanionId, amount: number): GainXpResult;
export function gainXP(type: CompanionType, amount: number): GainXpResult;
export function gainXP(idOrType: CompanionId | CompanionType, amount: number): GainXpResult {
  const companionId = resolveCompanionId(idOrType);
  const safeAmount = Math.max(0, Math.floor(amount));
  const all = loadCompanionProgress();
  const entry = all[companionId] ?? defaultEntry();
  const previousLevel = getLevelFromXp(entry.xp, companionId);

  entry.xp += safeAmount;
  const newLevel = getLevelFromXp(entry.xp, companionId);
  entry.level = newLevel;
  all[companionId] = entry;
  saveCompanionProgress(all);

  return {
    leveledUp: newLevel > previousLevel,
    previousLevel,
    newLevel,
    totalXp: entry.xp,
    xpGained: safeAmount,
  };
}

/**
 * Reconcile stored level with XP thresholds (e.g. after loading old saves).
 * Returns true if level increased.
 */
export function checkLevelUp(companionId: CompanionId): boolean;
export function checkLevelUp(type: CompanionType): boolean;
export function checkLevelUp(idOrType: CompanionId | CompanionType): boolean {
  const companionId = resolveCompanionId(idOrType);
  const all = loadCompanionProgress();
  const entry = all[companionId] ?? defaultEntry();
  const computed = getLevelFromXp(entry.xp, companionId);
  if (computed <= entry.level) return false;
  entry.level = computed;
  all[companionId] = entry;
  saveCompanionProgress(all);
  return true;
}

/** Reconcile every companion's stored level with its XP (call on boot). */
export function reconcileAllCompanionProgress(): void {
  const all = loadCompanionProgress();
  let changed = false;
  for (const id of COMPANION_IDS) {
    const entry = all[id] ?? defaultEntry();
    const level = getLevelFromXp(entry.xp, id);
    if (entry.level !== level) {
      entry.level = level;
      all[id] = entry;
      changed = true;
    }
  }
  if (changed) saveCompanionProgress(all);
}

/**
 * Write the active run's companion XP/level into localStorage.
 * Call on game over so progress survives between runs.
 */
export function persistCompanionRunProgress(state: GameState): void {
  if (!state.activeCompanionId) return;
  const id = state.activeCompanionId;
  const all = loadCompanionProgress();
  const entry = all[id] ?? defaultEntry();
  entry.xp = Math.max(entry.xp, Math.floor(state.companionXp));
  entry.level = getLevelFromXp(entry.xp, id);
  all[id] = entry;
  saveCompanionProgress(all);
}

/** Copy persisted meta progress into a run slice (standalone, no full GameState). */
export function applyCompanionProgressToRun(slice: CompanionRunSlice): void {
  if (!slice.activeCompanionId) return;
  const entry = getCompanionProgress(slice.activeCompanionId);
  slice.companionXp = entry.xp;
  slice.companionLevel = entry.level;
}

/** Copy persisted meta progress into the active run. */
export function applyCompanionProgressToGameState(state: GameState): void {
  const slice = sliceRunFromGameState(state);
  applyCompanionProgressToRun(slice);
  applyRunSliceToGameState(slice, state);
}

/** XP from kills — scales with stage; persists per companion type. */
export function grantCompanionKillXp(
  state: GameState | CompanionRunSlice,
  amount = 1,
  stage = 1,
): GainXpResult | null {
  const companionId = state.activeCompanionId;
  if (!companionId) return null;
  const stageNum = 'stage' in state ? state.stage : stage;
  const bonus = Math.max(1, Math.floor(amount) + Math.floor(stageNum * 0.5));
  const result = gainXP(companionId, bonus);
  state.companionXp = result.totalXp;
  state.companionLevel = result.newLevel;
  return result;
}

export function companionTypeFromId(id: CompanionId): CompanionType {
  return id as CompanionType;
}

/** @deprecated Use gainXP(CompanionType, amount) */
export const gainXPByType = gainXP;

/** @deprecated Use checkLevelUp(CompanionType) */
export const checkLevelUpByType = checkLevelUp;

/** @deprecated Use getCompanionLevel(CompanionType) */
export const getCompanionLevelByType = getCompanionLevel;

/** XP needed for next level, or 0 if maxed. */
export function getXpToNextLevel(companionId: CompanionId): number {
  const entry = getCompanionProgress(companionId);
  const thresholds = COMPANION_LEVEL_XP_THRESHOLDS[companionId];
  if (entry.level >= COMPANION_MAX_LEVEL) return 0;
  const nextThreshold = thresholds[entry.level];
  return Math.max(0, nextThreshold - entry.xp);
}

/** Progress toward next level as 0..1. */
export function getCompanionLevelProgress(companionId: CompanionId): number {
  const entry = getCompanionProgress(companionId);
  const thresholds = COMPANION_LEVEL_XP_THRESHOLDS[companionId];
  if (entry.level >= COMPANION_MAX_LEVEL) return 1;
  const prev = thresholds[entry.level - 1] ?? 0;
  const next = thresholds[entry.level];
  const span = next - prev;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (entry.xp - prev) / span));
}

export function getSelectedCompanion(): CompanionId {
  if (!storageAvailable()) return 'guardian';
  try {
    const raw = localStorage.getItem(SELECTED_KEY);
    if (raw && COMPANION_IDS.includes(raw as CompanionId)) {
      return raw as CompanionId;
    }
  } catch {
    /* ignore */
  }
  return 'guardian';
}

export function setSelectedCompanion(companionId: CompanionId): void {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(SELECTED_KEY, companionId);
  } catch {
    /* ignore */
  }
}

export function getMetaUnlockedCompanions(): CompanionId[] {
  return getMetaUnlockedCompanionIds();
}

export function unlockCompanionMeta(companionId: CompanionId): void {
  metaUnlockCompanion(companionId);
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(getMetaUnlockedCompanionIds()));
  } catch {
    /* ignore */
  }
}

export function isCompanionUnlocked(companionId: CompanionId): boolean {
  return getMetaUnlockedCompanionIds().includes(companionId);
}

/** Hangar loadout: equip companion for the run with persisted level/XP. */
export function applyCompanionLoadout(state: GameState, companionId: CompanionId): void {
  unlockCompanionMeta(companionId);
  setSelectedCompanion(companionId);
  if (!state.companionsUnlocked.includes(companionId)) {
    state.companionsUnlocked.push(companionId);
  }
  state.activeCompanionId = companionId;
  state.companionGrantedThisRun = true;
  applyCompanionProgressToGameState(state);
}

/** Preferred hangar companion when the run grants the first drone drop. */
export function resolveFirstCompanionGrant(state: GameState): CompanionId {
  const preferred = getSelectedCompanion();
  if (state.companionsUnlocked.includes(preferred) || isCompanionUnlocked(preferred)) {
    return preferred;
  }
  return getRecommendedCompanion(state.selectedShip);
}
