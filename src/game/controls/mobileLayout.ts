export const MIN_TOUCH_PX = 48;
export const PHONE_SHORT_SIDE_PX = 600;
export const DESKTOP_MIN_WIDTH_PX = 768;

export type ViewportProfile = 'desktop' | 'tablet' | 'phone-portrait' | 'phone-landscape';
export type HudVariant = 'full' | 'compact' | 'landscape' | 'tablet-landscape';

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

  if ((fine && !coarse) || (!coarse && w >= DESKTOP_MIN_WIDTH_PX)) {
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

export function getHudVariant(profile: ViewportProfile, w: number, h: number): HudVariant {
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

export function getJoystickSize(profile: ViewportProfile): number {
  switch (profile) {
    case 'phone-portrait':
      return 76;
    case 'phone-landscape':
      return 68;
    case 'tablet':
      return 88;
    default:
      return 128;
  }
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
    compactHud: hudVariant === 'compact',
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
