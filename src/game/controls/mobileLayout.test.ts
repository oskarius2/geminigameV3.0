import { describe, expect, it } from 'vitest';
import {
  getHudVariant,
  getViewportProfile,
  showTouchControls,
  useReducedEffects,
} from './mobileLayout';

describe('getViewportProfile', () => {
  it('returns desktop for fine pointer without coarse', () => {
    expect(getViewportProfile(1920, 1080, { fine: true, coarse: false })).toBe('desktop');
  });

  it('returns desktop for wide non-coarse layout', () => {
    expect(getViewportProfile(1024, 768, { fine: false, coarse: false })).toBe('desktop');
  });

  it('returns tablet when coarse and short side >= 600', () => {
    expect(getViewportProfile(1024, 768, { fine: false, coarse: true })).toBe('tablet');
    expect(getViewportProfile(768, 1024, { fine: false, coarse: true })).toBe('tablet');
  });

  it('returns phone-portrait for narrow coarse portrait', () => {
    expect(getViewportProfile(390, 844, { fine: false, coarse: true })).toBe('phone-portrait');
  });

  it('returns phone-landscape for narrow coarse landscape', () => {
    expect(getViewportProfile(844, 390, { fine: false, coarse: true })).toBe('phone-landscape');
  });
});

describe('touch and effects flags', () => {
  it('desktop hides touch controls and keeps full effects', () => {
    expect(showTouchControls('desktop')).toBe(false);
    expect(useReducedEffects('desktop')).toBe(false);
  });

  it('phone profiles use touch and reduced effects', () => {
    expect(showTouchControls('phone-portrait')).toBe(true);
    expect(useReducedEffects('phone-landscape')).toBe(true);
  });
});

describe('getHudVariant', () => {
  it('maps profiles to HUD layouts', () => {
    expect(getHudVariant('desktop', 1920, 1080)).toBe('full');
    expect(getHudVariant('phone-portrait', 390, 844)).toBe('compact');
    expect(getHudVariant('phone-landscape', 844, 390)).toBe('landscape');
    expect(getHudVariant('tablet', 768, 1024)).toBe('compact');
    expect(getHudVariant('tablet', 1024, 768)).toBe('tablet-landscape');
  });
});
