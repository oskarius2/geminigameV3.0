import { describe, expect, it } from 'vitest';
import {
  getHudVariant,
  getJoystickSize,
  getMobileHudInsets,
  getViewportProfile,
  getViewportSnapshot,
  isNarrowViewport,
  showTouchControls,
  useCornerHudLayout,
  useReducedEffects,
} from './mobileLayout';

describe('getViewportProfile', () => {
  it('returns desktop for fine pointer without coarse', () => {
    expect(getViewportProfile(1920, 1080, { fine: true, coarse: false })).toBe('desktop');
  });

  it('returns desktop for wide non-coarse layout', () => {
    expect(getViewportProfile(1024, 768, { fine: false, coarse: false })).toBe('desktop');
  });

  it('uses mobile profile below 768px even with fine pointer (devtools)', () => {
    expect(getViewportProfile(390, 844, { fine: true, coarse: false })).toBe('phone-portrait');
    expect(getViewportProfile(768, 1024, { fine: true, coarse: false })).toBe('tablet');
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
    expect(getHudVariant('phone-portrait', 390, 844)).toBe('phone-narrow');
    expect(getHudVariant('phone-portrait', 520, 900)).toBe('compact');
    expect(getHudVariant('phone-landscape', 844, 390)).toBe('phone-narrow');
    expect(getHudVariant('phone-landscape', 900, 500)).toBe('landscape');
    expect(getHudVariant('tablet', 768, 1024)).toBe('compact');
    expect(getHudVariant('tablet', 1024, 768)).toBe('tablet-landscape');
  });
});

describe('isNarrowViewport', () => {
  it('treats short side under 480px as narrow', () => {
    expect(isNarrowViewport(360, 640)).toBe(true);
    expect(isNarrowViewport(480, 720)).toBe(true);
    expect(isNarrowViewport(720, 480)).toBe(true);
    expect(isNarrowViewport(520, 900)).toBe(false);
  });
});

describe('getJoystickSize', () => {
  it('uses 80px joystick on narrow phones', () => {
    expect(getJoystickSize('phone-portrait', 360, 640)).toBe(80);
  });

  it('uses 100px joystick when HUD variant is landscape', () => {
    expect(getJoystickSize('phone-landscape', 900, 500)).toBe(100);
  });

  it('uses 80px joystick on narrow landscape (short side <= 480)', () => {
    expect(getJoystickSize('phone-landscape', 640, 360)).toBe(80);
  });
});

describe('responsive HUD breakpoints', () => {
  it('mobile portrait 360x640 uses phone-narrow stacked HUD', () => {
    const snap = getViewportSnapshot(360, 640);
    expect(snap.profile).toBe('phone-portrait');
    expect(snap.hudVariant).toBe('phone-narrow');
    expect(snap.showTouchControls).toBe(true);
  });

  it('mobile landscape 480x720 uses phone-narrow when short side is 480', () => {
    const snap = getViewportSnapshot(480, 720);
    expect(snap.hudVariant).toBe('phone-narrow');
  });

  it('tablet 768x1024 uses compact stacked HUD', () => {
    const snap = getViewportSnapshot(768, 1024);
    expect(snap.profile).toBe('tablet');
    expect(snap.hudVariant).toBe('compact');
  });

  it('uses corner HUD on mobile viewports under 768px', () => {
    expect(useCornerHudLayout('phone-portrait', 360, 640)).toBe(true);
    expect(useCornerHudLayout('tablet', 768, 1024)).toBe(true);
    expect(useCornerHudLayout('phone-landscape', 640, 360)).toBe(true);
    expect(useCornerHudLayout('desktop', 1920, 1080)).toBe(false);
  });

  it('reserves bottom inset above 80px joystick on phone-narrow', () => {
    const insets = getMobileHudInsets('phone-portrait', 'phone-narrow', 80);
    expect(insets.bottom).toBeGreaterThanOrEqual(160);
    expect(insets.left).toBeGreaterThanOrEqual(100);
  });
});
