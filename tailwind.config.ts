/**
 * Tailwind v4 uses @theme in index.css as the primary config.
 * This file documents SpaceHero brand tokens for tooling / reference.
 */
export default {
  theme: {
    colors: {
      transparent: 'transparent',
      white: 'var(--primitive-color-white)',
      legendary: 'var(--color-rarity-legendary)',
      epic: 'var(--color-rarity-epic)',
      rare: 'var(--color-rarity-rare)',
      common: 'var(--color-rarity-common)',
      cyan: 'var(--color-primary)',
      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
      'bg-dark': 'var(--bg-base)',
      'bg-card': 'var(--bg-card)',
      'bg-overlay': 'var(--bg-overlay)',
      'bg-hover': 'var(--bg-hover)',
    },
    spacing: {
      xs: 'var(--primitive-space-xs)',
      sm: 'var(--primitive-space-sm)',
      md: 'var(--primitive-space-md)',
      lg: 'var(--primitive-space-lg)',
      xl: 'var(--primitive-space-xl)',
      '2xl': 'var(--primitive-space-2xl)',
      '3xl': 'var(--primitive-space-3xl)',
    },
    borderRadius: {
      sm: 'var(--primitive-radius-sm)',
      md: 'var(--primitive-radius-md)',
      lg: 'var(--primitive-radius-lg)',
    },
    fontFamily: {
      mono: ['var(--primitive-font-mono)'],
      sans: ['var(--primitive-font-sans)'],
    },
    fontSize: {
      xs: ['var(--primitive-size-xs)', '1.2'],
      sm: ['var(--primitive-size-sm)', '1.4'],
      md: ['var(--primitive-size-md)', '1.5'],
      lg: ['var(--primitive-size-lg)', '1.6'],
      xl: ['var(--primitive-size-xl)', '1.7'],
      '2xl': ['var(--primitive-size-2xl)', '1.8'],
    },
    boxShadow: {
      sm: 'var(--primitive-shadow-sm)',
      md: 'var(--primitive-shadow-md)',
      lg: 'var(--primitive-shadow-lg)',
    },
    extend: {
      animation: {
        'spin-badge': 'spin-badge 3s linear infinite',
        'pulse-glow': 'legendary-pulse 2s ease-in-out infinite',
      },
    },
  },
};
