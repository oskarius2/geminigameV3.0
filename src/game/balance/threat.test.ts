import { describe, expect, it } from 'vitest';
import { getThreatTier, getThreatVisualConfig } from './threat';

describe('getThreatTier', () => {
  it('maps threat bands to tiers', () => {
    expect(getThreatTier(0)).toBe('calm');
    expect(getThreatTier(25)).toBe('calm');
    expect(getThreatTier(26)).toBe('pressure');
    expect(getThreatTier(50)).toBe('pressure');
    expect(getThreatTier(51)).toBe('danger');
    expect(getThreatTier(75)).toBe('danger');
    expect(getThreatTier(76)).toBe('critical');
    expect(getThreatTier(100)).toBe('critical');
  });

  it('clamps out-of-range values', () => {
    expect(getThreatTier(-10)).toBe('calm');
    expect(getThreatTier(150)).toBe('critical');
  });
});

describe('getThreatVisualConfig', () => {
  it('returns tier-specific visual settings', () => {
    const calm = getThreatVisualConfig('calm');
    const critical = getThreatVisualConfig('critical');

    expect(calm.hudColor).toBe('#3b82f6');
    expect(critical.hudColor).toBe('#991b1b');
    expect(calm.musicTempo).toBeGreaterThanOrEqual(0.8);
    expect(critical.musicTempo).toBeLessThanOrEqual(1.5);
    expect(critical.particleMultiplier).toBeGreaterThan(calm.particleMultiplier);
    expect(critical.screenVignette).toBeGreaterThan(calm.screenVignette);
  });

  it('falls back to calm for unknown tier strings', () => {
    expect(getThreatVisualConfig('unknown')).toEqual(getThreatVisualConfig('calm'));
  });
});
