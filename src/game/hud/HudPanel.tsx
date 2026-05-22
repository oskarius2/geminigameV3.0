import React from 'react';
import { HUD_COLORS } from './hudTokens';

interface HudPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function HudPanel({ children, className = '', glow = false }: HudPanelProps) {
  return (
    <div
      className={`rounded-lg backdrop-blur-xl pointer-events-auto ${className}`}
      style={{
        background: HUD_COLORS.panelBg,
        border: `1px solid ${HUD_COLORS.accent}40`,
        boxShadow: glow
          ? `0 2px 8px rgba(0,0,0,0.35), 0 0 16px ${HUD_COLORS.accent}30`
          : '0 2px 8px rgba(0,0,0,0.35), inset 0 0 12px rgba(0,212,255,0.04)',
      }}
    >
      {children}
    </div>
  );
}
