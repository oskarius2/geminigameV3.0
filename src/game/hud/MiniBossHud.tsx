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
        className="ui-miniboss-hud"
        style={{
          borderColor: auraColor,
          backgroundColor: `${auraColor}22`,
          boxShadow: `0 0 28px ${auraColor}44, 0 0 48px ${auraColor}18`,
        }}
      >
        <p className="ui-miniboss-title" style={{ color: auraColor }}>
          Miniboss · {displayName}
        </p>
        <div className="ui-miniboss-hp-track">
          <div
            className="ui-miniboss-hp-fill"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${auraColor}, ${HUD_COLORS.danger})`,
              boxShadow: `0 0 12px ${auraColor}88`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
