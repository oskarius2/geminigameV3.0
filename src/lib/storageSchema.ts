/**
 * Version-aware localStorage schema for cross-run meta state.
 *
 * Why this exists:
 *   When the data shape changes between releases, old saves will either
 *   crash JSON.parse() (rare) or silently produce a half-valid object that
 *   leads to `undefined.foo` runtime errors deep in the game loop. Instead
 *   we tag every blob with a `v` field, and bump it through a chain of
 *   pure migration steps until it reaches `STORAGE_VERSION`.
 *
 * Adding a new schema field:
 *   1. Bump `STORAGE_VERSION`.
 *   2. Extend `StorageData` with the new field.
 *   3. Append a `MigrationStep` to `MIGRATIONS` that adds the field with a
 *      sensible default and increments `data.v`.
 *   4. Add a unit test that feeds the previous version's shape in and
 *      asserts the new field is present.
 */

export const STORAGE_KEY = 'spacehero_meta_v1';
export const STORAGE_VERSION = 1;

/**
 * The current (latest) shape of persisted meta state.
 * Whenever you bump `STORAGE_VERSION`, this interface must reflect the
 * shape that callers get back from `migrateStorageData`.
 */
export interface StorageData {
  /** Schema version. Always equals `STORAGE_VERSION` after migration. */
  v: number;
  /** Lifetime meta scrap (between-run currency). */
  metaScrap: number;
  /** Bosses defeated across all runs (drives global unlocks). */
  totalBossesDefeated: number;
  /** Whether DASH has been unlocked globally. Added in v1. */
  dashUnlocked: boolean;
}

/** A migration step takes a data blob at version N and mutates it to N+1. */
export type MigrationStep = (data: Record<string, unknown>) => void;

/**
 * Ordered list of migrations. `MIGRATIONS[i]` is the step that promotes
 * data from version `i` to version `i + 1`. Index = source version.
 *
 * Steps MUST be idempotent on their input shape and MUST bump `data.v`.
 */
export const MIGRATIONS: MigrationStep[] = [
  // v0 -> v1: introduce dashUnlocked. Older saves never knew about it,
  // so default it to `false` — players will re-earn it via boss kills.
  (data) => {
    data.dashUnlocked = false;
    data.v = 1;
  },
];

export function createDefaultStorageData(): StorageData {
  return {
    v: STORAGE_VERSION,
    metaScrap: 0,
    totalBossesDefeated: 0,
    dashUnlocked: false,
  };
}

/**
 * Best-effort coerce of an arbitrary parsed value into a v0-shaped record.
 * v0 is the *implicit* pre-versioning era where no `v` field existed.
 *
 * `legacyFallback` lets callers seed v0 from sibling localStorage keys that
 * existed before this schema (e.g. the standalone `metaScrap` key).
 */
function coerceToV0(raw: unknown, legacyFallback: Partial<StorageData> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    v: 0,
    metaScrap: clampNonNegInt(legacyFallback.metaScrap ?? 0),
    totalBossesDefeated: clampNonNegInt(legacyFallback.totalBossesDefeated ?? 0),
  };

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.v === 'number') base.v = obj.v;
    if (typeof obj.metaScrap === 'number') base.metaScrap = clampNonNegInt(obj.metaScrap);
    if (typeof obj.totalBossesDefeated === 'number') {
      base.totalBossesDefeated = clampNonNegInt(obj.totalBossesDefeated);
    }
    if (typeof obj.dashUnlocked === 'boolean') base.dashUnlocked = obj.dashUnlocked;
  }

  return base;
}

function clampNonNegInt(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/**
 * Run the migration ladder until `data.v === targetVersion`.
 *
 * @param raw                    The parsed JSON blob (or `null`). Untyped on
 *                               purpose — could be any historical shape.
 * @param targetVersion          The version we want to end up at. Defaults to
 *                               `STORAGE_VERSION`.
 * @param migrations             Optional override of the migration ladder.
 *                               Tests use this to simulate future versions.
 * @param legacyFallback         Defaults used when seeding a fresh v0 blob
 *                               (e.g. reading old standalone localStorage
 *                               keys to populate `metaScrap`).
 */
export function migrateStorageData(
  raw: unknown,
  targetVersion: number = STORAGE_VERSION,
  migrations: MigrationStep[] = MIGRATIONS,
  legacyFallback: Partial<StorageData> = {},
): StorageData {
  const data = coerceToV0(raw, legacyFallback);

  while ((data.v as number) < targetVersion) {
    const fromVersion = data.v as number;
    const step = migrations[fromVersion];
    if (!step) {
      throw new Error(
        `[storageSchema] No migration registered from v${fromVersion} -> v${fromVersion + 1}`,
      );
    }
    step(data);
    if ((data.v as number) <= fromVersion) {
      throw new Error(
        `[storageSchema] Migration step at index ${fromVersion} did not advance the version field`,
      );
    }
  }

  return finalizeShape(data);
}

/**
 * Fill in any missing required fields with defaults. This is the last line of
 * defense against migrations that forgot to set a field, or against truncated
 * blobs that survived JSON.parse() but lack the latest fields.
 *
 * Unknown extra keys are preserved verbatim — this matters for tests that
 * simulate future schema versions, and it future-proofs against partial
 * rollbacks where a newer client writes fields an older client doesn't know
 * about yet.
 */
function finalizeShape(data: Record<string, unknown>): StorageData {
  const defaults = createDefaultStorageData();
  return {
    ...data,
    v: typeof data.v === 'number' ? data.v : defaults.v,
    metaScrap: clampNonNegInt(data.metaScrap ?? defaults.metaScrap),
    totalBossesDefeated: clampNonNegInt(data.totalBossesDefeated ?? defaults.totalBossesDefeated),
    dashUnlocked:
      typeof data.dashUnlocked === 'boolean' ? data.dashUnlocked : defaults.dashUnlocked,
  } as StorageData;
}

function storageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

/**
 * Load + migrate the persisted blob. Never throws — corrupt data degrades to
 * defaults so the game can still boot. `legacyFallback` lets the caller wire
 * in older, separate keys for the very first migration.
 */
export function loadStorageData(legacyFallback: Partial<StorageData> = {}): StorageData {
  if (!storageAvailable()) return createDefaultStorageData();

  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return createDefaultStorageData();
  }

  if (raw == null) {
    // No new-format blob exists yet. Build a v0 record from legacy keys and
    // migrate it up — this gives existing players a seamless upgrade.
    try {
      return migrateStorageData(null, STORAGE_VERSION, MIGRATIONS, legacyFallback);
    } catch {
      return createDefaultStorageData();
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[storageSchema] Corrupt JSON in localStorage, using defaults');
    return createDefaultStorageData();
  }

  try {
    return migrateStorageData(parsed, STORAGE_VERSION, MIGRATIONS, legacyFallback);
  } catch (err) {
    console.warn('[storageSchema] Migration failed, using defaults:', err);
    return createDefaultStorageData();
  }
}

/** Persist the blob, always tagging it with the current `STORAGE_VERSION`. */
export function saveStorageData(data: StorageData): boolean {
  if (!storageAvailable()) return false;
  const payload: StorageData = { ...data, v: STORAGE_VERSION };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/** Test-only: wipe the persisted blob so the next load returns defaults. */
export function clearStorageData(): void {
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
