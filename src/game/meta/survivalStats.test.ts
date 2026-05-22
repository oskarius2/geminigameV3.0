import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  invalidateMetaProgressCache,
  recordStatDelta,
} from './metaProgress';
import { getTotalMiniBossKills } from './survivalStats';

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

describe('survivalStats mini-boss meta', () => {
  it('tracks career mini-boss kills', () => {
    expect(getTotalMiniBossKills()).toBe(0);
    recordStatDelta({ miniBossKills: 2 });
    expect(getTotalMiniBossKills()).toBe(2);
    recordStatDelta({ miniBossKills: 1 });
    expect(getTotalMiniBossKills()).toBe(3);
  });
});
