import React from 'react';
import { clsx } from 'clsx';

type FrameSize = 'xs' | 'sm' | 'md' | 'lg' | 'card';

interface TacticalFrameProps {
  children: React.ReactNode;
  className?: string;
  size?: FrameSize;
  glow?: boolean;
  gold?: boolean;
  corners?: boolean;
  scanlines?: boolean;
  as?: 'div' | 'section' | 'article';
}

const SIZE_CLASS: Record<FrameSize, string> = {
  xs: 'tactical-frame--xs',
  sm: 'tactical-frame--sm',
  md: 'tactical-frame--md',
  lg: 'tactical-frame--lg',
  card: 'tactical-frame--card',
};

export const TacticalFrame: React.FC<TacticalFrameProps> = ({
  children,
  className,
  size = 'md',
  glow = false,
  gold = false,
  corners = true,
  scanlines = false,
  as: Tag = 'div',
}) => (
  <Tag
    className={clsx(
      'tactical-frame',
      SIZE_CLASS[size],
      glow && 'tactical-frame--glow',
      gold && 'tactical-frame--gold',
      corners && (gold ? 'tactical-corners tactical-corners--gold' : 'tactical-corners'),
      className,
    )}
  >
    {scanlines && <span className="scanline-overlay" aria-hidden />}
    {children}
  </Tag>
);
