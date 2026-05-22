import { describe, expect, it } from 'vitest';
import { getThreatTier } from '../balance/threat';
import {
  mapBossIdToTheme,
  threatToMusicRatio,
  threatToRootFrequency,
  THREAT_MUSIC_MAX,
} from './survivalMusic';

describe('survivalMusic', () => {
  it('maps threat levels to four tiers', () => {
    expect(getThreatTier(0)).toBe('calm');
    expect(getThreatTier(25)).toBe('calm');
    expect(getThreatTier(26)).toBe('pressure');
    expect(getThreatTier(50)).toBe('pressure');
    expect(getThreatTier(51)).toBe('danger');
    expect(getThreatTier(75)).toBe('danger');
    expect(getThreatTier(76)).toBe('critical');
  });

  it('maps threat level to smooth frequency curve', () => {
    expect(threatToMusicRatio(0)).toBe(0);
    expect(threatToMusicRatio(THREAT_MUSIC_MAX)).toBe(1);
    expect(threatToRootFrequency(0)).toBe(80);
    expect(threatToRootFrequency(50)).toBe(160);
    expect(threatToRootFrequency(100)).toBe(240);
  });

  it('maps survival boss ids to music themes', () => {
    expect(mapBossIdToTheme('salvage_hauler', 1)).toBe('mechanical_hunter');
    expect(mapBossIdToTheme('void_cardinal', 3)).toBe('void_whisper');
    expect(mapBossIdToTheme('colossus', 4)).toBe('titan_strike');
    expect(mapBossIdToTheme('unknown_boss', 5)).toBe('reality_break');
  });
});
