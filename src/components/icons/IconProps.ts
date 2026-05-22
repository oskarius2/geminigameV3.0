export type IconVariant = 'default' | 'muted';

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  variant?: IconVariant;
  /** Adds drop-shadow glow via .game-icon--glow */
  glow?: boolean;
}

export const ICON_STROKE = 1.75;
export const ICON_VIEW = '0 0 24 24';
