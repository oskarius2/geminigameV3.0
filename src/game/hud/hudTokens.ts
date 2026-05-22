import { BuffRarity } from '../types';

/** SpaceHero — Tactical Neural Interface HUD design tokens */
export const HUD_COLORS = {
  accent: '#00e5ff',
  gold: '#e8b84a',
  danger: '#ff2244',
  success: '#00ff6a',
  legendary: '#ffc400',
  epic: '#8b2be2',
  rare: '#2563eb',
  common: '#64748b',
  amber: '#ffaa00',
  panelBg: 'rgba(4, 10, 24, 0.88)',
  textPrimary: '#f0f8ff',
  textSecondary: 'rgba(0, 229, 255, 0.72)',
} as const;

export const HUD_RARITY_HEX: Record<BuffRarity, string> = {
  [BuffRarity.COMMON]: HUD_COLORS.common,
  [BuffRarity.RARE]: HUD_COLORS.rare,
  [BuffRarity.EPIC]: HUD_COLORS.epic,
  [BuffRarity.LEGENDARY]: HUD_COLORS.legendary,
  [BuffRarity.EXCLUSIVE]: HUD_COLORS.accent,
  [BuffRarity.MYSTERY]: '#c026d3',
};

export const HUD_TIMING = {
  fadeIn: 0.22,
  hpBar: 0.18,
  threatTier: 0.32,
  buffCardIn: 0.16,
} as const;
