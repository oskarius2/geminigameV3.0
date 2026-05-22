import React from 'react';
import { clsx } from 'clsx';
import type { IconProps } from './IconProps';
import { ICON_STROKE, ICON_VIEW } from './IconProps';

interface IconShellProps extends IconProps {
  children: React.ReactNode;
  /** Extra paths with fill (accent layers) */
  accent?: React.ReactNode;
}

export function IconShell({
  size = 24,
  color = 'currentColor',
  className,
  variant = 'default',
  glow = false,
  children,
  accent,
}: IconShellProps) {
  const opacity = variant === 'muted' ? 0.55 : 1;
  return (
    <span
      className={clsx('game-icon', glow && 'game-icon--glow', className)}
      style={{ color, width: size, height: size, opacity }}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox={ICON_VIEW}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <g stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
          {children}
        </g>
        {accent}
      </svg>
    </span>
  );
}
