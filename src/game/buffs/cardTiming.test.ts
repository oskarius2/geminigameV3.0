import { describe, expect, it } from 'vitest';
import { getCardIntervalSeconds } from './cardTiming';

describe('getCardIntervalSeconds', () => {
  it('returns intervals within new bounds', () => {
    for (let i = 0; i < 30; i++) {
      const sec = getCardIntervalSeconds(1, 0, 0);
      expect(sec).toBeGreaterThanOrEqual(12);
      expect(sec).toBeLessThanOrEqual(24);
    }
  });

  it('respects passive discount cap', () => {
    const low = getCardIntervalSeconds(3, 120, 0);
    const high = getCardIntervalSeconds(3, 120, 20);
    expect(high).toBeLessThanOrEqual(low);
    expect(low - high).toBeLessThanOrEqual(8.5);
  });
});
