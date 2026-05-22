import { describe, expect, it } from 'vitest';
import { ARTIFACTS } from '../content/artifacts';
import {
  filterArtifactsByTier,
  getArtifactPowerTier,
  getMaxArtifactTierForBossesDefeated,
  pickArtifact,
} from './artifactTiers';
import { BuffRarity } from '../types';

describe('artifactTiers', () => {
  it('maps rarity to tier gates', () => {
    expect(getArtifactPowerTier(ARTIFACTS.iron_sights)).toBe(1);
    expect(getArtifactPowerTier(ARTIFACTS.vanguard_alpha)).toBe(2);
    expect(getArtifactPowerTier(ARTIFACTS.void_shard)).toBe(4);
    expect(getArtifactPowerTier(ARTIFACTS.doom_splicer)).toBe(4);
  });

  it('unlocks tiers with bosses defeated', () => {
    expect(getMaxArtifactTierForBossesDefeated(0)).toBe(1);
    expect(getMaxArtifactTierForBossesDefeated(1)).toBe(2);
    expect(getMaxArtifactTierForBossesDefeated(2)).toBe(3);
    expect(getMaxArtifactTierForBossesDefeated(3)).toBe(4);
  });

  it('filters OP legendaries before boss 3', () => {
    const pool = Object.values(ARTIFACTS);
    const early = filterArtifactsByTier(pool, 0);
    expect(early.some((a) => a.id === 'doom_splicer')).toBe(false);
    expect(early.some((a) => a.id === 'iron_sights')).toBe(true);

    const late = filterArtifactsByTier(pool, 3);
    expect(late.some((a) => a.id === 'doom_splicer')).toBe(true);
  });

  it('pickArtifact respects tier gate', () => {
    const ids = Object.keys(ARTIFACTS);
    for (let i = 0; i < 40; i++) {
      const art = pickArtifact(ids, 0);
      expect(art).not.toBeNull();
      expect(getArtifactPowerTier(art!)).toBeLessThanOrEqual(1);
    }
  });
});
