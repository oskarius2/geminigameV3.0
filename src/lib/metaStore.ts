import {
  loadStorageData,
  saveStorageData,
  type StorageData,
} from './storageSchema';

// Legacy keys are still read on first load so existing players don't lose
// their progress when the versioned schema lands. New writes go through
// `storageSchema` only.
const LEGACY_META_SCRAP_KEY = 'metaScrap';
const LEGACY_TOTAL_BOSSES_KEY = 'totalBossesDefeated';

/** Bosses that need to be defeated globally (across all runs) to unlock DASH. */
export const DASH_UNLOCK_BOSS_THRESHOLD = 3;

function readLegacyInt(key: string): number {
  if (typeof localStorage === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

function legacyFallback(): Partial<StorageData> {
  return {
    metaScrap: readLegacyInt(LEGACY_META_SCRAP_KEY),
    totalBossesDefeated: readLegacyInt(LEGACY_TOTAL_BOSSES_KEY),
  };
}

/**
 * Load + mutate + save in one shot. Always uses the latest schema version,
 * and is safe against corrupt blobs (falls back to defaults).
 */
function update(mutate: (data: StorageData) => void): StorageData {
  const data = loadStorageData(legacyFallback());
  mutate(data);
  saveStorageData(data);
  return data;
}

export function getTotalBossesDefeated(): number {
  return loadStorageData(legacyFallback()).totalBossesDefeated;
}

/** Increments the global boss kill counter and returns the new total. */
export function addGlobalBossKill(): number {
  const next = update((data) => {
    data.totalBossesDefeated += 1;
    if (data.totalBossesDefeated >= DASH_UNLOCK_BOSS_THRESHOLD) {
      data.dashUnlocked = true;
    }
  });
  return next.totalBossesDefeated;
}

/**
 * Returns true when DASH is unlocked globally. The persisted `dashUnlocked`
 * flag is authoritative — once earned it sticks even if the threshold
 * changes — but we also honor the threshold as a defensive fallback so the
 * unlock survives saves that pre-date the flag.
 */
export function isDashUnlocked(): boolean {
  const data = loadStorageData(legacyFallback());
  return data.dashUnlocked || data.totalBossesDefeated >= DASH_UNLOCK_BOSS_THRESHOLD;
}

export function getMetaScrap(): number {
  return loadStorageData(legacyFallback()).metaScrap;
}

export function addMetaScrap(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return getMetaScrap();
  return update((data) => {
    data.metaScrap += Math.floor(amount);
  }).metaScrap;
}

export function spendMetaScrap(amount: number): boolean {
  const cost = Math.floor(amount);
  if (!Number.isFinite(cost) || cost <= 0) return true;
  const data = loadStorageData(legacyFallback());
  if (data.metaScrap < cost) return false;
  data.metaScrap -= cost;
  saveStorageData(data);
  return true;
}
