import { describe, expect, it } from 'vitest';
import {
  applyThreatCardCooldown,
  getCardIntervalSeconds,
  getEffectiveCardIntervalSeconds,
} from './cardTiming';

describe('getCardIntervalSeconds', () => {
  it('blocks cards in stage 1', () => {
    expect(getCardIntervalSeconds(1, 0, [])).toBe(Infinity);
    expect(getCardIntervalSeconds(1, 300, [])).toBe(Infinity);
  });

  it('uses 90s first card then 60s in stage 2', () => {
    expect(getCardIntervalSeconds(2, 0, [])).toBe(90);
    expect(getCardIntervalSeconds(2, 45, [])).toBe(45);
    expect(getCardIntervalSeconds(2, 90, [])).toBe(60);
    expect(getCardIntervalSeconds(2, 200, [])).toBe(60);
  });

  it('uses fixed intervals for stages 3-5+', () => {
    expect(getCardIntervalSeconds(3, 400, [])).toBe(50);
    expect(getCardIntervalSeconds(4, 600, [])).toBe(40);
    expect(getCardIntervalSeconds(5, 900, [])).toBe(30);
    expect(getCardIntervalSeconds(8, 1200, [])).toBe(30);
  });
});

describe('applyThreatCardCooldown', () => {
  it('reduces interval by threat level with 10s floor', () => {
    expect(applyThreatCardCooldown(60, 0)).toBe(60);
    expect(applyThreatCardCooldown(60, 10)).toBe(40);
    expect(applyThreatCardCooldown(30, 50)).toBe(10);
    expect(applyThreatCardCooldown(Infinity, 50)).toBe(Infinity);
  });
});

describe('getEffectiveCardIntervalSeconds', () => {
  it('combines stage timing with threat reduction', () => {
    expect(getEffectiveCardIntervalSeconds(4, 500, [], 5)).toBe(30);
    expect(getEffectiveCardIntervalSeconds(4, 500, [], 20)).toBe(10);
  });
});
