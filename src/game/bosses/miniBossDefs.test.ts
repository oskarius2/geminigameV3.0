import { describe, expect, it } from 'vitest';
import { BuffRarity } from '../types';
import { getMiniBossDef, MINI_BOSS_DEFINITIONS, pickRotatingMiniBossId } from './miniBossDefs';
import { rollMiniBossArtifact } from './miniBossLoot';
import { STAGE_2_WAVES, STAGE_3_WAVES } from '../balance/waveCompositions';

describe('miniBossDefs', () => {
  it('defines shockwave sentinel for stage 2', () => {
    const def = getMiniBossDef('shockwave_sentinel');
    expect(def.baseHP).toBe(150);
    expect(def.stages).toContain(2);
    expect(def.lootTiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rarity: BuffRarity.COMMON }),
        expect.objectContaining({ rarity: BuffRarity.RARE }),
      ]),
    );
  });

  it('stage 2 wave 3 includes shockwave sentinel mini-boss', () => {
    const wave = STAGE_2_WAVES.find((w) => w.waveIndex === 2);
    expect(wave?.miniBosses?.[0]?.id).toBe('shockwave_sentinel');
  });

  it('rolls guaranteed artifact from loot tiers', () => {
    const art = rollMiniBossArtifact('shockwave_sentinel', []);
    expect(art).not.toBeNull();
    expect([BuffRarity.COMMON, BuffRarity.RARE]).toContain(art!.rarity);
  });

  it('has all mini-boss ids in registry', () => {
    expect(Object.keys(MINI_BOSS_DEFINITIONS).length).toBeGreaterThanOrEqual(3);
  });

  it('stage 3 wave 2 includes eclipse dasher', () => {
    const wave = STAGE_3_WAVES.find((w) => w.waveIndex === 1);
    expect(wave?.miniBosses?.[0]?.id).toBe('eclipse_dasher');
  });

  it('stage 5+ rotation includes phase 3 mini-boss types', () => {
    const ids = new Set(
      [0, 1, 2, 3, 4, 5].map((w) => pickRotatingMiniBossId(5, w)),
    );
    expect(ids.has('plasma_splitter')).toBe(true);
    expect(ids.has('chronos_guardian')).toBe(true);
    expect(ids.has('swarm_overlord')).toBe(true);
  });
});
