import React from 'react';
import { HUD_COLORS } from './hudTokens';

interface MiniBossHudProps {
  displayName: string;
  health: number;
  maxHealth: number;
  auraColor: string;
  /** inline = inside stacked mobile HUD; overlay = desktop absolute */
  placement?: 'inline' | 'overlay';
}

export function MiniBossHud({
  displayName,
  health,
  maxHealth,
  auraColor,
  placement = 'overlay',
}: MiniBossHudProps) {
  const pct = maxHealth > 0 ? Math.max(0, Math.min(100, (health / maxHealth) * 100)) : 0;

  const wrapClass =
    placement === 'inline'
      ? 'w-full pointer-events-none'
      : 'absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-28 w-full max-w-[min(92vw,360px)] px-3 sm:px-4 pointer-events-none';

  return (
    <div className={wrapClass}>
      <div
        className="rounded-lg border bg-black/65 backdrop-blur-md p-2"
        style={{ borderColor: `${auraColor}66`, boxShadow: `0 0 20px ${auraColor}33` }}
      >
        <p
          className="text-[10px] font-mono uppercase tracking-widest mb-1 text-center"
          style={{ color: auraColor }}
        >
          Miniboss · {displayName}
        </p>
        <div className="h-3 rounded-full overflow-hidden bg-black/50 border border-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-200 ease-out"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${auraColor}, ${HUD_COLORS.accent})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
