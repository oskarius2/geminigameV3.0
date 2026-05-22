import React from 'react';
import { clsx } from 'clsx';
import { TacticalFrame } from './TacticalFrame';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  gold?: boolean;
}

export const Panel: React.FC<PanelProps> = ({ children, className, glow, gold }) => (
  <TacticalFrame size="md" glow={glow} gold={gold} scanlines className={clsx('p-4 sm:p-5', className)}>
    {children}
  </TacticalFrame>
);
