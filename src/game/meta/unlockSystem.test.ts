import { describe, expect, it, beforeEach, vi } from 'vitest';
import { BuffRarity } from '../types';
import { ARTIFACTS } from '../content/artifacts';
import {
  META_PROGRESS_KEY,
  createDefaultMetaProgress,
  getUnlockedArtifactIds,
  invalidateMetaProgressCache,
  saveMetaProgress,
} from './metaProgress';
import {
  grantStageMilestoneUnlocks,
  pickRandomLockedArtifact,
  estimateStageMilestoneProgress,
} from './unlockSystem';

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
  saveMetaProgress(createDefaultMetaProgress());
});

describe('unlockSystem', () => {
  it('grants stage 1 common milestone unlocks', () => {
    const before = getUnlockedArtifactIds().length;
    const granted = grantStageMilestoneUnlocks(1, undefined, () => 0);
    expect(granted.length).toBeGreaterThan(0);
    expect(getUnlockedArtifactIds().length).toBeGreaterThanOrEqual(before + granted.length);
    for (const id of granted) {
      expect(ARTIFACTS[id].rarity).toBe(BuffRarity.COMMON);
    }
  });

  it('pickRandomLockedArtifact skips unlocked ids', () => {
    const progress = createDefaultMetaProgress();
    const unlocked = getUnlockedArtifactIds(progress);
    const picked = pickRandomLockedArtifact(unlocked, BuffRarity.RARE, () => 0);
    expect(picked).toBeTruthy();
    expect(unlocked).not.toContain(picked);
  });

  it('estimateStageMilestoneProgress returns stages 1-5', () => {
    const progress = createDefaultMetaProgress();
    const rows = estimateStageMilestoneProgress(progress);
    expect(rows.map((r) => r.stage)).toEqual([1, 2, 3, 4, 5]);
    expect(rows.every((r) => r.percent >= 0 && r.percent <= 100)).toBe(true);
  });

  it('persists grants to meta storage', () => {
    grantStageMilestoneUnlocks(1, undefined, () => 0.5);
    const raw = store[META_PROGRESS_KEY];
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(Object.keys(parsed.unlockedArtifacts).length).toBeGreaterThan(4);
  });
});
