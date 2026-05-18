export const MIN_TOUCH_PX = 48;

export function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export function detectMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || isCoarsePointer();
}

export function isPortraitViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
}

/** Phone held upright or narrow touch UI — compact HUD + bottom weapon dock */
export function isCompactGameHud(): boolean {
  if (typeof window === 'undefined') return false;
  return detectMobileViewport() && (isPortraitViewport() || window.innerWidth < 420);
}

export const safeAreaStyle = {
  paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
  paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
  paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
  paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
} as const;
