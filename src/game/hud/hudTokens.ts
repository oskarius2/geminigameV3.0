import { BuffRarity } from '../types';

/** SpaceHero survival HUD design tokens */
export const HUD_COLORS = {
  accent: '#00d4ff',
  danger: '#ff3333',
  success: '#33ff88',
  legendary: '#ffd700',
  epic: '#9d4edd',
  rare: '#3b82f6',
  common: '#888888',
  panelBg: 'rgba(10, 14, 39, 0.8)',
  textPrimary: '#ffffff',
  textSecondary: '#00d4ff',
} as const;

export const HUD_RARITY_HEX: Record<BuffRarity, string> = {
  [BuffRarity.COMMON]: HUD_COLORS.common,
  [BuffRarity.RARE]: HUD_COLORS.rare,
  [BuffRarity.EPIC]: HUD_COLORS.epic,
  [BuffRarity.LEGENDARY]: HUD_COLORS.legendary,
  [BuffRarity.EXCLUSIVE]: HUD_COLORS.accent,
  [BuffRarity.MYSTERY]: '#e879f9',
};

export const HUD_TIMING = {
  fadeIn: 0.3,
  hpBar: 0.2,
  threatTier: 0.4,
  buffCardIn: 0.2,
} as const;
