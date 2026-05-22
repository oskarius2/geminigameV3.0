import { describe, expect, it } from 'vitest';
import { getStageIntroLabel } from './survivalStages';

describe('getStageIntroLabel', () => {
  it('returns named stage label for stage 1', () => {
    expect(getStageIntroLabel(1)).toBe('STAGE 1: AWAKENING');
  });

  it('falls back for unknown stages', () => {
    expect(getStageIntroLabel(99)).toBe('STAGE 99');
  });
});
