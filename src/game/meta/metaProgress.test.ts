import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  META_PROGRESS_KEY,
  createDefaultMetaProgress,
  getMetaProgress,
  getUnlockedArtifactIds,
  invalidateMetaProgressCache,
  migrateFromLegacyStorage,
  recordPersonalBest,
  isArtifactUnlocked,
  unlockArtifact,
  unlockCompanion,
} from './metaProgress';

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  invalidateMetaProgressCache();
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

describe('metaProgress', () => {
  it('starts with starter artifacts only', () => {
    const p = createDefaultMetaProgress();
    expect(getUnlockedArtifactIds(p)).toContain('iron_sights');
    expect(p.unlockedArtifacts.vanguard_alpha).toBeFalsy();
  });

  it('migrates legacy unlockedArtifacts array', () => {
    store.unlockedArtifacts = JSON.stringify(['iron_sights', 'void_shard']);
    store.survivalHighScore = '900';
    store.survivalLongestSeconds = '120';
    const p = migrateFromLegacyStorage();
    expect(p.unlockedArtifacts.void_shard).toBe(true);
    expect(p.stats.highScore).toBe(900);
    expect(p.stats.longestRunSeconds).toBe(120);
    expect(store[META_PROGRESS_KEY]).toBeDefined();
  });

  it('unlockArtifact is idempotent and sets pending new once', () => {
    const p = createDefaultMetaProgress();
    const r1 = unlockArtifact('vanguard_alpha', p);
    expect(r1.newlyUnlocked).toBe(true);
    expect(p.pendingNewArtifacts).toContain('vanguard_alpha');
    expect(p.runUnlocksSnapshot.artifacts).toContain('vanguard_alpha');

    const r2 = unlockArtifact('vanguard_alpha', p);
    expect(r2.newlyUnlocked).toBe(false);
    expect(p.pendingNewArtifacts.filter((id) => id === 'vanguard_alpha')).toHaveLength(1);
  });

  it('recordPersonalBest only improves', () => {
    invalidateMetaProgressCache();
    migrateFromLegacyStorage();
    const r1 = recordPersonalBest(500, 60);
    expect(r1.newHighScore).toBe(true);
    expect(r1.newLongestRun).toBe(true);

    const r2 = recordPersonalBest(300, 30);
    expect(r2.newHighScore).toBe(false);
    expect(r2.newLongestRun).toBe(false);
    expect(getMetaProgress().stats.highScore).toBe(500);
  });

  it('unlockCompanion tracks pending and run snapshot', () => {
    const p = createDefaultMetaProgress();
    const r = unlockCompanion('scout', p);
    expect(r.newlyUnlocked).toBe(true);
    expect(p.pendingNewCompanions).toContain('scout');
  });
});
