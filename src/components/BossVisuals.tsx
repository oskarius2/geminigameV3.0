import React from 'react';
import type { BossAttackPattern } from '../game/bosses/bossSpecs';

interface BossVisualsProps {
  visualId: string;
  attackPattern?: BossAttackPattern;
  className?: string;
  size?: number;
}

const PALETTE: Record<string, { core: string; ring: string; accent: string }> = {
  salvage_hauler: { core: '#94a3b8', ring: '#64748b', accent: '#fbbf24' },
  void_cardinal: { core: '#6366f1', ring: '#312e81', accent: '#a5b4fc' },
  crimson_tyrant: { core: '#dc2626', ring: '#7f1d1d', accent: '#fca5a5' },
  colossus: { core: '#78716c', ring: '#44403c', accent: '#f97316' },
  hive_regent: { core: '#22c55e', ring: '#14532d', accent: '#86efac' },
  wraith_lord: { core: '#a855f7', ring: '#581c87', accent: '#e9d5ff' },
  default: { core: '#22d3ee', ring: '#0e7490', accent: '#67e8f9' },
};

export const BossVisuals: React.FC<BossVisualsProps> = ({
  visualId,
  attackPattern = 'standard',
  className = '',
  size = 120,
}) => {
  const colors = PALETTE[visualId] ?? PALETTE.default;
  const pulse =
    attackPattern === 'gravity_pulse'
      ? 'boss-visual-pulse-gravity'
      : attackPattern === 'enforcer_barrage'
        ? 'boss-visual-pulse-barrage'
        : attackPattern === 'colossus_slam'
          ? 'boss-visual-pulse-colossus'
          : '';

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`${className} ${pulse}`.trim()}
      aria-hidden
    >
      <defs>
        <radialGradient id={`boss-glow-${visualId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colors.core} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill={`url(#boss-glow-${visualId})`} opacity="0.35" />
      <circle cx="60" cy="60" r="44" fill="none" stroke={colors.ring} strokeWidth="3" opacity="0.7" />
      <circle cx="60" cy="60" r="28" fill={colors.core} opacity="0.85" />
      {attackPattern === 'gravity_pulse' && (
        <>
          <ellipse cx="60" cy="60" rx="50" ry="18" fill="none" stroke={colors.accent} strokeWidth="2" opacity="0.6" />
          <ellipse cx="60" cy="60" rx="18" ry="50" fill="none" stroke={colors.accent} strokeWidth="2" opacity="0.6" />
        </>
      )}
      {attackPattern === 'enforcer_barrage' && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={20 + i * 16}
              y={88}
              width="8"
              height="14"
              rx="2"
              fill={colors.accent}
              opacity="0.75"
            />
          ))}
        </>
      )}
      {attackPattern === 'colossus_slam' && (
        <polygon points="60,18 95,95 25,95" fill={colors.ring} opacity="0.5" />
      )}
      <circle cx="60" cy="60" r="10" fill={colors.accent} />
    </svg>
  );
};
