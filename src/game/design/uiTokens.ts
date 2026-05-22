import { HUD_COLORS, HUD_RARITY_HEX, HUD_TIMING } from '../hud/hudTokens';

/**
 * SpaceHero global UI design tokens (menus, hangar, HUD).
 * Relic Vault uses CSS variables in `src/styles/design-tokens.css`.
 */
export const UI_COLORS = {
  ...HUD_COLORS,
  primary: '#00d4ff',
  primaryGlow: 'rgba(0, 212, 255, 0.35)',
  background: '#020617',
  surface: '#0f172a',
  panelBorder: 'rgba(255, 255, 255, 0.08)',
  textMuted: '#94a3b8',
} as const;

export { HUD_RARITY_HEX, HUD_TIMING };

export const UI_SPACING = {
  micro: 4,
  small: 8,
  medium: 16,
  large: 32,
  xLarge: 64,
} as const;

export const UI_RADIUS = {
  input: 6,
  button: 8,
  card: 12,
} as const;

export const UI_SHADOW = {
  light: '2px 4px 8px rgba(0, 0, 0, 0.2)',
  medium: '4px 8px 12px rgba(0, 0, 0, 0.3)',
  deep: '8px 16px 20px rgba(0, 0, 0, 0.4)',
  glowCyan: '0 0 24px rgba(0, 212, 255, 0.35)',
} as const;

export const UI_ANIMATION = {
  fadeIn: '0.3s ease-out',
  fadeOut: '0.2s ease-in',
  scale: '0.2s ease-out',
  slide: '0.4s ease-out',
  glowPulse: '1.5s ease-in-out infinite',
  colorTransition: '0.4s ease',
  hpBarFill: '0.3s ease',
  buttonStagger: 0.2,
  logoPulse: '2s ease-in-out infinite',
} as const;

export const UI_BREAKPOINTS = {
  mobileSmall: 480,
  tablet: 768,
  desktop: 1366,
} as const;

export const UI_TYPOGRAPHY = {
  logo: 'clamp(3rem, 8vw, 5.5rem)',
  title: 'clamp(1.25rem, 3vw, 2rem)',
  label: '0.875rem',
  body: '0.8125rem',
  mono: '0.75rem',
} as const;

export const APP_VERSION = '3.0.0';
