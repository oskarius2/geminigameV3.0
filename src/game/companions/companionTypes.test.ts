import { describe, expect, it } from 'vitest';
import {
  CompanionType,
  companionIdToType,
  companionTypeToId,
  isCompanionType,
} from './companionTypes';

describe('companionTypes', () => {
  it('maps between CompanionType and CompanionId', () => {
    expect(companionTypeToId(CompanionType.SCOUT)).toBe('scout');
    expect(companionIdToType('healer')).toBe(CompanionType.HEALER);
  });

  it('isCompanionType guards valid values', () => {
    expect(isCompanionType('gunner')).toBe(true);
    expect(isCompanionType('invalid')).toBe(false);
  });
});
