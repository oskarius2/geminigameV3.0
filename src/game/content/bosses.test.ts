import { describe, expect, it } from 'vitest';
import { BOSS_DEFINITIONS, pickBossForStage } from './bosses';

describe('pickBossForStage', () => {
  it('returns salvage hauler for early stages', () => {
    expect(pickBossForStage(1).id).toBe('salvage_hauler');
  });

  it('cycles bosses as stage increases', () => {
    expect(pickBossForStage(7).id).toBe('crimson_tyrant');
    expect(BOSS_DEFINITIONS.map((b) => pickBossForStage(1).id)).toContain('salvage_hauler');
  });
});
