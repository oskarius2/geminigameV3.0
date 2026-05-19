import { describe, expect, it, beforeEach, vi } from 'vitest';
import { addMetaScrap, getMetaScrap, spendMetaScrap } from './metaStore';

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

describe('metaStore', () => {
  it('starts at zero', () => {
    expect(getMetaScrap()).toBe(0);
  });

  it('adds and spends scrap', () => {
    addMetaScrap(100);
    expect(getMetaScrap()).toBe(100);
    expect(spendMetaScrap(40)).toBe(true);
    expect(getMetaScrap()).toBe(60);
    expect(spendMetaScrap(80)).toBe(false);
    expect(getMetaScrap()).toBe(60);
  });
});
