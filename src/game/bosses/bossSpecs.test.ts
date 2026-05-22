import { describe, expect, it } from 'vitest';
import { BOSS_DEFINITIONS } from '../content/bosses';
import {
  getStageBossPool,
  pickBossForSurvivalStage,
  STAGE_BOSS_SPECS,
} from './bossSpecs';

describe('bossSpecs', () => {
  it('defines primary bosses for stages 3–5', () => {
    const stage3 = STAGE_BOSS_SPECS.find((s) => s.stageMin === 3 && s.stageMax === 3);
    const stage4 = STAGE_BOSS_SPECS.find((s) => s.stageMin === 4 && s.stageMax === 4);
    const stage5 = STAGE_BOSS_SPECS.find((s) => s.stageMin === 5);
    expect(stage3?.bossId).toBe('void_cardinal');
    expect(stage4?.bossId).toBe('crimson_tyrant');
    expect(stage5?.bossId).toBe('colossus');
  });

  it('returns stage-weighted boss pools', () => {
    const pool3 = getStageBossPool(3);
    expect(pool3[0]).toBe('void_cardinal');
    expect(pool3.length).toBeGreaterThan(1);
  });

  it('pickBossForSurvivalStage returns valid boss definitions', () => {
    const boss = pickBossForSurvivalStage(4, null);
    expect(boss.id).toBeTruthy();
    expect(BOSS_DEFINITIONS.some((b) => b.id === boss.id)).toBe(true);
  });
});
