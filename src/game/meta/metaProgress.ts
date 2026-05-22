import { COMPANION_IDS } from '../companions/companionDefs';
import { loadCompanionProgress } from '../companions/companionLeveling';
import { ARTIFACTS } from '../content/artifacts';
import type { CompanionId } from '../types';

export const META_PROGRESS_KEY = 'spaceheroMetaProgress';
const CURRENT_VERSION = 1;

const STARTER_ARTIFACTS = [
  'iron_sights',
  'backup_cannon',
  'basic_hull',
  'basic_thrusters',
];

export interface MetaStats {
  totalKills: number;
  totalScrapEarned: number;
  longestRunSeconds: number;
  highScore: number;
  totalTimePlayed: number;
  totalMiniBossKills: number;
}

export interface RunUnlocksSnapshot {
  artifacts: string[];
  companions: CompanionId[];
}

export interface MetaProgress {
  version: number;
  unlockedArtifacts: Record<string, boolean>;
  unlockedCompanions: Record<CompanionId, boolean>;
  companionLevels: Record<CompanionId, number>;
  stats: MetaStats;
  pendingNewArtifacts: string[];
  pendingNewCompanions: CompanionId[];
  runUnlocksSnapshot: RunUnlocksSnapshot;
  lastUpdated: number;
}

export interface PersonalBestResult {
  newHighScore: boolean;
  newLongestRun: boolean;
}

export interface UnlockArtifactResult {
  newlyUnlocked: boolean;
  artifactId: string;
}

export interface UnlockCompanionResult {
  newlyUnlocked: boolean;
  companionId: CompanionId;
}

let cached: MetaProgress | null = null;

function storageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

function defaultStats(): MetaStats {
  return {
    totalKills: 0,
    totalScrapEarned: 0,
    longestRunSeconds: 0,
    highScore: 0,
    totalTimePlayed: 0,
    totalMiniBossKills: 0,
  };
}

function defaultCompanionLevels(): Record<CompanionId, number> {
  return {
    guardian: 1,
    scout: 1,
    healer: 1,
    gunner: 1,
  };
}

export function createDefaultMetaProgress(): MetaProgress {
  const unlockedArtifacts: Record<string, boolean> = {};
  for (const id of STARTER_ARTIFACTS) {
    unlockedArtifacts[id] = true;
  }
  const unlockedCompanions: Record<CompanionId, boolean> = {
    guardian: false,
    scout: false,
    healer: false,
    gunner: false,
  };
  return {
    version: CURRENT_VERSION,
    unlockedArtifacts,
    unlockedCompanions,
    companionLevels: defaultCompanionLevels(),
    stats: defaultStats(),
    pendingNewArtifacts: [],
    pendingNewCompanions: [],
    runUnlocksSnapshot: { artifacts: [], companions: [] },
    lastUpdated: Date.now(),
  };
}

function syncCompanionLevelsFromLegacy(progress: MetaProgress): void {
  const legacy = loadCompanionProgress();
  for (const id of COMPANION_IDS) {
    const entry = legacy[id];
    if (entry?.level) {
      progress.companionLevels[id] = entry.level;
    }
  }
}

function parseUnlockedArtifactsMap(
  raw: unknown,
  fallbackIds: string[],
): Record<string, boolean> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...(raw as Record<string, boolean>) };
  }
  const map: Record<string, boolean> = {};
  for (const id of STARTER_ARTIFACTS) {
    map[id] = true;
  }
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (typeof id === 'string') map[id] = true;
    }
    return map;
  }
  for (const id of fallbackIds) {
    map[id] = true;
  }
  return map;
}

function parseUnlockedCompanionsMap(raw: unknown): Record<CompanionId, boolean> {
  const base: Record<CompanionId, boolean> = {
    guardian: false,
    scout: false,
    healer: false,
    gunner: false,
  };
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const id of COMPANION_IDS) {
      if ((raw as Record<string, boolean>)[id]) base[id] = true;
    }
    return base;
  }
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (COMPANION_IDS.includes(id as CompanionId)) {
        base[id as CompanionId] = true;
      }
    }
  }
  return base;
}

/** One-time migration from legacy localStorage keys. */
export function migrateFromLegacyStorage(): MetaProgress {
  const progress = createDefaultMetaProgress();

  if (!storageAvailable()) {
    cached = progress;
    return progress;
  }

  try {
    const existing = localStorage.getItem(META_PROGRESS_KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as Partial<MetaProgress>;
      if (parsed && typeof parsed === 'object' && parsed.version === CURRENT_VERSION) {
        cached = normalizeProgress(parsed);
        return cached;
      }
    }
  } catch {
    /* fall through to legacy migration */
  }

  let legacyArtifactIds: string[] = [];
  try {
    const saved = localStorage.getItem('unlockedArtifacts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) legacyArtifactIds = parsed;
    }
  } catch {
    /* ignore */
  }

  progress.unlockedArtifacts = parseUnlockedArtifactsMap(null, legacyArtifactIds);

  try {
    const high = localStorage.getItem('survivalHighScore');
    if (high) progress.stats.highScore = Math.max(0, parseInt(high, 10) || 0);
    const longest = localStorage.getItem('survivalLongestSeconds');
    if (longest) progress.stats.longestRunSeconds = Math.max(0, parseFloat(longest) || 0);
  } catch {
    /* ignore */
  }

  try {
    const companions = localStorage.getItem('companionsUnlocked_v1');
    if (companions) {
      progress.unlockedCompanions = parseUnlockedCompanionsMap(JSON.parse(companions));
    }
  } catch {
    /* ignore */
  }

  syncCompanionLevelsFromLegacy(progress);
  saveMetaProgress(progress);
  return progress;
}

function normalizeProgress(partial: Partial<MetaProgress>): MetaProgress {
  const base = createDefaultMetaProgress();
  const stats = { ...base.stats, ...(partial.stats ?? {}) };
  return {
    version: CURRENT_VERSION,
    unlockedArtifacts: parseUnlockedArtifactsMap(
      partial.unlockedArtifacts,
      Object.keys(partial.unlockedArtifacts ?? {}).filter((k) => partial.unlockedArtifacts![k]),
    ),
    unlockedCompanions: parseUnlockedCompanionsMap(partial.unlockedCompanions),
    companionLevels: { ...base.companionLevels, ...(partial.companionLevels ?? {}) },
    stats,
    pendingNewArtifacts: Array.isArray(partial.pendingNewArtifacts)
      ? [...partial.pendingNewArtifacts]
      : [],
    pendingNewCompanions: Array.isArray(partial.pendingNewCompanions)
      ? (partial.pendingNewCompanions.filter((id) =>
          COMPANION_IDS.includes(id as CompanionId),
        ) as CompanionId[])
      : [],
    runUnlocksSnapshot: {
      artifacts: partial.runUnlocksSnapshot?.artifacts ?? [],
      companions: partial.runUnlocksSnapshot?.companions ?? [],
    },
    lastUpdated: partial.lastUpdated ?? Date.now(),
  };
}

export function getMetaProgress(): MetaProgress {
  if (cached) return cached;
  return migrateFromLegacyStorage();
}

export function saveMetaProgress(progress: MetaProgress): void {
  progress.lastUpdated = Date.now();
  progress.version = CURRENT_VERSION;
  cached = progress;
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(META_PROGRESS_KEY, JSON.stringify(progress));
    const artifactList = getUnlockedArtifactIds(progress);
    localStorage.setItem('unlockedArtifacts', JSON.stringify(artifactList));
    localStorage.setItem('survivalHighScore', String(progress.stats.highScore));
    localStorage.setItem('survivalLongestSeconds', String(progress.stats.longestRunSeconds));
    const companionList = COMPANION_IDS.filter((id) => progress.unlockedCompanions[id]);
    localStorage.setItem('companionsUnlocked_v1', JSON.stringify(companionList));
  } catch {
    /* ignore quota */
  }
}

export function resetMetaProgress(): MetaProgress {
  cached = createDefaultMetaProgress();
  saveMetaProgress(cached);
  return cached;
}

export function invalidateMetaProgressCache(): void {
  cached = null;
}

export function getUnlockedArtifactIds(progress = getMetaProgress()): string[] {
  return Object.keys(progress.unlockedArtifacts).filter((id) => progress.unlockedArtifacts[id]);
}

export function isArtifactUnlocked(artifactId: string, progress = getMetaProgress()): boolean {
  return !!progress.unlockedArtifacts[artifactId];
}

export function isCompanionUnlocked(
  companionId: CompanionId,
  progress = getMetaProgress(),
): boolean {
  return !!progress.unlockedCompanions[companionId];
}

export function getMetaUnlockedCompanionIds(progress = getMetaProgress()): CompanionId[] {
  return COMPANION_IDS.filter((id) => progress.unlockedCompanions[id]);
}

export function unlockArtifact(
  artifactId: string,
  progress = getMetaProgress(),
): UnlockArtifactResult {
  if (!ARTIFACTS[artifactId]) {
    return { newlyUnlocked: false, artifactId };
  }
  const wasUnlocked = !!progress.unlockedArtifacts[artifactId];
  progress.unlockedArtifacts[artifactId] = true;
  let newlyUnlocked = false;
  if (!wasUnlocked) {
    newlyUnlocked = true;
    if (!progress.pendingNewArtifacts.includes(artifactId)) {
      progress.pendingNewArtifacts.push(artifactId);
    }
    if (!progress.runUnlocksSnapshot.artifacts.includes(artifactId)) {
      progress.runUnlocksSnapshot.artifacts.push(artifactId);
    }
  }
  saveMetaProgress(progress);
  return { newlyUnlocked, artifactId };
}

export function unlockCompanion(
  companionId: CompanionId,
  progress = getMetaProgress(),
): UnlockCompanionResult {
  const wasUnlocked = !!progress.unlockedCompanions[companionId];
  progress.unlockedCompanions[companionId] = true;
  let newlyUnlocked = false;
  if (!wasUnlocked) {
    newlyUnlocked = true;
    if (!progress.pendingNewCompanions.includes(companionId)) {
      progress.pendingNewCompanions.push(companionId);
    }
    if (!progress.runUnlocksSnapshot.companions.includes(companionId)) {
      progress.runUnlocksSnapshot.companions.push(companionId);
    }
  }
  saveMetaProgress(progress);
  return { newlyUnlocked, companionId };
}

export function recordStatDelta(
  delta: Partial<{
    kills: number;
    scrap: number;
    playtimeSeconds: number;
    miniBossKills: number;
  }>,
  progress = getMetaProgress(),
): void {
  if (delta.kills) progress.stats.totalKills += Math.max(0, Math.floor(delta.kills));
  if (delta.scrap) progress.stats.totalScrapEarned += Math.max(0, Math.floor(delta.scrap));
  if (delta.playtimeSeconds) {
    progress.stats.totalTimePlayed += Math.max(0, delta.playtimeSeconds);
  }
  if (delta.miniBossKills) {
    progress.stats.totalMiniBossKills += Math.max(0, Math.floor(delta.miniBossKills));
  }
  saveMetaProgress(progress);
}

export function recordPersonalBest(
  score: number,
  survivalSeconds: number,
  progress = getMetaProgress(),
): PersonalBestResult {
  let newHighScore = false;
  let newLongestRun = false;
  const s = Math.floor(score);
  if (s > progress.stats.highScore) {
    progress.stats.highScore = s;
    newHighScore = true;
  }
  if (survivalSeconds > progress.stats.longestRunSeconds) {
    progress.stats.longestRunSeconds = survivalSeconds;
    newLongestRun = true;
  }
  saveMetaProgress(progress);
  return { newHighScore, newLongestRun };
}

export function startRunTracking(progress = getMetaProgress()): void {
  progress.runUnlocksSnapshot = { artifacts: [], companions: [] };
  saveMetaProgress(progress);
}

export function getRunUnlocks(progress = getMetaProgress()): RunUnlocksSnapshot {
  return {
    artifacts: [...progress.runUnlocksSnapshot.artifacts],
    companions: [...progress.runUnlocksSnapshot.companions],
  };
}

export function clearNewUnlockBadges(
  opts: { artifacts?: boolean; companions?: boolean } = {},
  progress = getMetaProgress(),
): void {
  if (opts.artifacts !== false) progress.pendingNewArtifacts = [];
  if (opts.companions !== false) progress.pendingNewCompanions = [];
  saveMetaProgress(progress);
}

export function getPendingNewCount(progress = getMetaProgress()): number {
  return progress.pendingNewArtifacts.length + progress.pendingNewCompanions.length;
}

/** Rarity unlock counts for progress UI. */
export function getArtifactCollectionStats(progress = getMetaProgress()): {
  total: number;
  unlocked: number;
  byRarity: Record<string, { total: number; unlocked: number }>;
} {
  const all = Object.values(ARTIFACTS);
  const byRarity: Record<string, { total: number; unlocked: number }> = {};
  let unlocked = 0;
  for (const art of all) {
    if (!byRarity[art.rarity]) byRarity[art.rarity] = { total: 0, unlocked: 0 };
    byRarity[art.rarity].total++;
    if (isArtifactUnlocked(art.id, progress)) {
      unlocked++;
      byRarity[art.rarity].unlocked++;
    }
  }
  return { total: all.length, unlocked, byRarity };
}
