export const MIN_TOUCH_PX = 48;
export const PHONE_SHORT_SIDE_PX = 600;
export const DESKTOP_MIN_WIDTH_PX = 768;
export const MOBILE_NARROW_SHORT_SIDE_PX = 480;
export const PHONE_JOYSTICK_PX = 80;

export type ViewportProfile = 'desktop' | 'tablet' | 'phone-portrait' | 'phone-landscape';
export type HudVariant = 'full' | 'compact' | 'landscape' | 'tablet-landscape' | 'phone-narrow';

export interface HudInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function isNarrowViewport(w: number, h: number): boolean {
  return Math.min(w, h) <= MOBILE_NARROW_SHORT_SIDE_PX;
}

export function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export function isFinePointer(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(pointer: fine)').matches;
}

export function isPortraitViewport(w = window.innerWidth, h = window.innerHeight): boolean {
  return h > w;
}

export function getViewportProfile(
  w: number,
  h: number,
  opts?: { coarse?: boolean; fine?: boolean },
): ViewportProfile {
  const shortSide = Math.min(w, h);
  const coarse = opts?.coarse ?? isCoarsePointer();
  const fine = opts?.fine ?? isFinePointer();

  // Width-first: DevTools device mode still has a fine pointer — use mobile HUD at ≤768px.
  if (w <= DESKTOP_MIN_WIDTH_PX) {
    if (shortSide >= PHONE_SHORT_SIDE_PX) {
      return 'tablet';
    }
    return isPortraitViewport(w, h) ? 'phone-portrait' : 'phone-landscape';
  }

  if (fine && !coarse) {
    return 'desktop';
  }

  if (!coarse) {
    return 'desktop';
  }

  if (shortSide >= PHONE_SHORT_SIDE_PX) {
    return 'tablet';
  }

  return isPortraitViewport(w, h) ? 'phone-portrait' : 'phone-landscape';
}

export function showTouchControls(profile: ViewportProfile): boolean {
  return profile !== 'desktop';
}

export function useReducedEffects(profile: ViewportProfile): boolean {
  return profile !== 'desktop';
}

/** Mobile/tablet portrait + phone landscape: absolute corner HUD (not center stack). */
export function useCornerHudLayout(profile: ViewportProfile, w: number, h: number): boolean {
  if (profile === 'desktop') return false;
  const variant = getHudVariant(profile, w, h);
  return variant === 'phone-narrow' || variant === 'compact' || variant === 'landscape';
}

export function getHudVariant(profile: ViewportProfile, w: number, h: number): HudVariant {
  if (profile !== 'desktop' && isNarrowViewport(w, h)) {
    return 'phone-narrow';
  }
  switch (profile) {
    case 'desktop':
      return 'full';
    case 'phone-portrait':
      return 'compact';
    case 'phone-landscape':
      return 'landscape';
    case 'tablet':
      return isPortraitViewport(w, h) ? 'compact' : 'tablet-landscape';
  }
}

export function getJoystickSize(profile: ViewportProfile, w?: number, h?: number): number {
  const width = w ?? (typeof window !== 'undefined' ? window.innerWidth : 390);
  const height = h ?? (typeof window !== 'undefined' ? window.innerHeight : 844);
  const variant = getHudVariant(profile, width, height);
  if (variant === 'phone-narrow') return PHONE_JOYSTICK_PX;
  if (variant === 'landscape') return 100;
  switch (profile) {
    case 'phone-portrait':
      return 100;
    case 'phone-landscape':
      return PHONE_JOYSTICK_PX;
    case 'tablet':
      return 88;
    default:
      return 128;
  }
}

/** Reserve space so HUD does not overlap move/aim joysticks. */
export function getMobileHudInsets(
  profile: ViewportProfile,
  hudVariant: HudVariant,
  joystickSize: number,
  leftHanded = false,
): HudInsets {
  const joyPad = joystickSize + 20;
  const aimPad = joystickSize + 12;
  const moveSide = leftHanded ? 'right' : 'left';
  const aimSide = leftHanded ? 'left' : 'right';

  const base: HudInsets = {
    top: 4,
    bottom: joystickSize + 56,
    left: moveSide === 'left' ? joyPad : aimPad,
    right: moveSide === 'left' ? aimPad : joyPad,
  };

  if (hudVariant === 'phone-narrow') {
    return {
      top: 4,
      bottom: joystickSize + 96,
      left: moveSide === 'left' ? joyPad : 12,
      right: moveSide === 'left' ? 12 : joyPad,
    };
  }
  if (hudVariant === 'landscape') {
    return {
      top: 4,
      bottom: joystickSize + 56,
      left: moveSide === 'left' ? joyPad : 12,
      right: moveSide === 'left' ? 12 : joyPad,
    };
  }
  if (hudVariant === 'compact') {
    return {
      top: 8,
      bottom: joystickSize + 92,
      left: moveSide === 'left' ? joyPad : 16,
      right: moveSide === 'left' ? 16 : joyPad,
    };
  }
  if (hudVariant === 'tablet-landscape') {
    return { top: 8, bottom: 24, left: 16, right: 16 };
  }
  return { top: 16, bottom: 88, left: 24, right: 24 };
}

export type TouchActionSize = 'compact' | 'medium' | 'large';

export interface ViewportSnapshot {
  profile: ViewportProfile;
  hudVariant: HudVariant;
  compactHud: boolean;
  landscapeHud: boolean;
  showTouchControls: boolean;
  reducedEffects: boolean;
}

export function getViewportSnapshot(w: number, h: number): ViewportSnapshot {
  const profile = getViewportProfile(w, h);
  const hudVariant = getHudVariant(profile, w, h);
  return {
    profile,
    hudVariant,
    compactHud: hudVariant === 'compact' || hudVariant === 'phone-narrow',
    landscapeHud: hudVariant === 'landscape',
    showTouchControls: showTouchControls(profile),
    reducedEffects: useReducedEffects(profile),
  };
}

export function getTouchActionSize(profile: ViewportProfile): TouchActionSize {
  switch (profile) {
    case 'phone-portrait':
    case 'phone-landscape':
      return 'compact';
    case 'tablet':
      return 'medium';
    default:
      return 'large';
  }
}

export function getBuffChipsTopClass(profile: ViewportProfile, w?: number, h?: number): string {
  const width = w ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const height = h ?? (typeof window !== 'undefined' ? window.innerHeight : 768);
  const variant = getHudVariant(profile, width, height);
  if (variant === 'phone-narrow') return 'top-[6.5rem]';
  if (variant === 'landscape') return 'top-12';
  if (variant === 'compact') return 'top-[4.75rem]';
  if (variant === 'tablet-landscape') return 'top-[4.5rem]';
  return 'top-16';
}

export function getSynergyBarLayout(profile: ViewportProfile, w?: number, h?: number): HudVariant {
  const width = w ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const height = h ?? (typeof window !== 'undefined' ? window.innerHeight : 768);
  return getHudVariant(profile, width, height);
}

/** @deprecated Use getViewportProfile !== 'desktop' */
export function detectMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return getViewportProfile(window.innerWidth, window.innerHeight) !== 'desktop';
}

/** @deprecated Use getHudVariant */
export function isCompactGameHud(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const variant = getHudVariant(getViewportProfile(w, h), w, h);
  return variant === 'compact';
}

export function subscribeViewport(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const update = () => onChange();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  const vv = window.visualViewport;
  vv?.addEventListener('resize', update);
  return () => {
    window.removeEventListener('resize', update);
    window.removeEventListener('orientationchange', update);
    vv?.removeEventListener('resize', update);
  };
}

export const safeAreaStyle = {
  paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
  paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
  paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
  paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
} as const;
