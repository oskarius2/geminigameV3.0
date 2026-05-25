import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MIGRATIONS,
  STORAGE_KEY,
  STORAGE_VERSION,
  createDefaultStorageData,
  loadStorageData,
  migrateStorageData,
  saveStorageData,
  type MigrationStep,
  type StorageData,
} from './storageSchema';

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  });
});

describe('storageSchema.migrateStorageData', () => {
  it('migrates a v0 blob (no `v` field) up to v1 and adds dashUnlocked=false', () => {
    const legacyBlob = { metaScrap: 42, totalBossesDefeated: 1 };

    const migrated = migrateStorageData(legacyBlob);

    expect(migrated.v).toBe(STORAGE_VERSION);
    expect(migrated.dashUnlocked).toBe(false);
    expect(migrated.metaScrap).toBe(42);
    expect(migrated.totalBossesDefeated).toBe(1);
  });

  it('preserves an already-current v1 blob without changes', () => {
    const current: StorageData = {
      v: 1,
      metaScrap: 7,
      totalBossesDefeated: 5,
      dashUnlocked: true,
    };

    const migrated = migrateStorageData(current);

    expect(migrated).toEqual(current);
  });

  it('coerces null / garbage into defaults instead of throwing', () => {
    expect(migrateStorageData(null)).toEqual(createDefaultStorageData());
    expect(migrateStorageData(undefined)).toEqual(createDefaultStorageData());
    expect(migrateStorageData('not an object')).toEqual(createDefaultStorageData());
    expect(migrateStorageData(12345)).toEqual(createDefaultStorageData());
  });

  it('seeds defaults from legacy sibling keys when no `v` field is present', () => {
    const migrated = migrateStorageData(
      null,
      STORAGE_VERSION,
      MIGRATIONS,
      { metaScrap: 250, totalBossesDefeated: 4 },
    );

    expect(migrated.metaScrap).toBe(250);
    expect(migrated.totalBossesDefeated).toBe(4);
    expect(migrated.dashUnlocked).toBe(false);
  });

  it('clamps negative / NaN numeric fields to zero', () => {
    const migrated = migrateStorageData({
      v: 1,
      metaScrap: -100,
      totalBossesDefeated: Number.NaN,
      dashUnlocked: false,
    });

    expect(migrated.metaScrap).toBe(0);
    expect(migrated.totalBossesDefeated).toBe(0);
  });

  it('throws a clear error when no migration step exists for the gap', () => {
    expect(() => migrateStorageData({ v: 99 }, STORAGE_VERSION)).not.toThrow();
    expect(() => migrateStorageData({ v: 0 }, 99)).toThrow(/No migration registered from v/);
  });

  /**
   * Future-proofing: simulate the next schema bump (v1 -> v2) by injecting a
   * custom migration ladder. This proves the migrator drives data forward
   * through arbitrary numbers of steps, and that an old v0 blob still ends
   * up with BOTH the v1 field (`dashUnlocked`) AND the v2 field.
   */
  it('chains multiple migrations: v0 -> v1 -> v2 adds every new field', () => {
    const futureMigrations: MigrationStep[] = [
      ...MIGRATIONS,
      // v1 -> v2: hypothetical new "tutorialCompleted" field
      (data) => {
        data.tutorialCompleted = false;
        data.v = 2;
      },
    ];

    const ancientBlob = { metaScrap: 10, totalBossesDefeated: 2 };

    const migrated = migrateStorageData(ancientBlob, 2, futureMigrations) as StorageData & {
      tutorialCompleted: boolean;
    };

    expect(migrated.v).toBe(2);
    expect(migrated.dashUnlocked).toBe(false); // injected by the v0->v1 step
    expect(migrated.tutorialCompleted).toBe(false); // injected by the v1->v2 step
    expect(migrated.metaScrap).toBe(10);
    expect(migrated.totalBossesDefeated).toBe(2);
  });

  it('detects buggy migration steps that fail to bump the version field', () => {
    const buggyMigrations: MigrationStep[] = [
      (data) => {
        // forgot to set data.v = 1
        data.dashUnlocked = false;
      },
    ];
    expect(() => migrateStorageData({ v: 0 }, 1, buggyMigrations)).toThrow(
      /did not advance the version field/,
    );
  });
});

describe('storageSchema.loadStorageData / saveStorageData', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadStorageData()).toEqual(createDefaultStorageData());
  });

  it('round-trips through save -> load', () => {
    const data: StorageData = {
      v: STORAGE_VERSION,
      metaScrap: 99,
      totalBossesDefeated: 3,
      dashUnlocked: true,
    };
    expect(saveStorageData(data)).toBe(true);
    expect(loadStorageData()).toEqual(data);
  });

  it('always stamps STORAGE_VERSION on save even if caller passes a stale `v`', () => {
    saveStorageData({
      v: 0 as unknown as number,
      metaScrap: 1,
      totalBossesDefeated: 0,
      dashUnlocked: false,
    });
    const parsed = JSON.parse(store[STORAGE_KEY]);
    expect(parsed.v).toBe(STORAGE_VERSION);
  });

  it('falls back to defaults when the stored JSON is corrupt', () => {
    store[STORAGE_KEY] = '{not valid json';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const loaded = loadStorageData();

    expect(loaded).toEqual(createDefaultStorageData());
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('migrates a v0-shaped blob found in localStorage on load', () => {
    store[STORAGE_KEY] = JSON.stringify({ metaScrap: 25, totalBossesDefeated: 1 });

    const loaded = loadStorageData();

    expect(loaded.v).toBe(STORAGE_VERSION);
    expect(loaded.dashUnlocked).toBe(false);
    expect(loaded.metaScrap).toBe(25);
  });

  it('seeds first-time saves from legacy sibling keys when no blob exists', () => {
    // No new-format blob, but legacy keys provided via fallback.
    const loaded = loadStorageData({ metaScrap: 500, totalBossesDefeated: 2 });

    expect(loaded.metaScrap).toBe(500);
    expect(loaded.totalBossesDefeated).toBe(2);
    expect(loaded.v).toBe(STORAGE_VERSION);
  });
});
