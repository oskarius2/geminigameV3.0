import React from 'react';
import { TacticalFrame } from '../../components/ui/TacticalFrame';

interface HudPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function HudPanel({ children, className = '', glow = false }: HudPanelProps) {
  return (
    <TacticalFrame
      size="sm"
      glow={glow}
      corners
      scanlines
      className={`pointer-events-auto ${className}`}
    >
      {children}
    </TacticalFrame>
  );
}
