import React from 'react';
import type { BossAttackPattern } from '../game/bosses/bossSpecs';

interface BossVisualsProps {
  visualId: string;
  attackPattern?: BossAttackPattern;
  className?: string;
  size?: number;
}

const PALETTE: Record<string, { core: string; ring: string; accent: string; glow: string }> = {
  salvage_hauler: { core: '#94a3b8', ring: '#475569', accent: '#fbbf24', glow: 'rgba(251,191,36,0.35)' },
  void_cardinal:  { core: '#6366f1', ring: '#1e1b4b', accent: '#a5b4fc', glow: 'rgba(139,92,246,0.45)' },
  crimson_tyrant: { core: '#dc2626', ring: '#7f1d1d', accent: '#fca5a5', glow: 'rgba(220,38,38,0.4)' },
  colossus:       { core: '#78716c', ring: '#292524', accent: '#f97316', glow: 'rgba(249,115,22,0.35)' },
  hive_regent:    { core: '#22c55e', ring: '#14532d', accent: '#86efac', glow: 'rgba(34,197,94,0.35)' },
  hive_queen:     { core: '#16a34a', ring: '#14532d', accent: '#86efac', glow: 'rgba(22,163,74,0.4)' },
  wraith_lord:    { core: '#a855f7', ring: '#3b0764', accent: '#e9d5ff', glow: 'rgba(168,85,247,0.45)' },
  default:        { core: '#22d3ee', ring: '#0e7490', accent: '#67e8f9', glow: 'rgba(34,211,238,0.35)' },
};

function pulseClass(attackPattern: BossAttackPattern): string {
  switch (attackPattern) {
    case 'gravity_pulse':    return 'boss-visual-pulse-gravity';
    case 'enforcer_barrage': return 'boss-visual-pulse-barrage';
    case 'colossus_slam':    return 'boss-visual-pulse-colossus';
    case 'swarm_crown':      return 'boss-visual-pulse-swarm';
    case 'wraith_blink':     return 'boss-visual-pulse-wraith';
    default: return '';
  }
}

/* ── Helper: regular polygon points string ── */
function polyPoints(cx: number, cy: number, r: number, sides: number, offsetDeg = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = ((i / sides) * Math.PI * 2) + (offsetDeg * Math.PI) / 180;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

/* ── Helper: star polygon ── */
function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number, offsetDeg = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = ((i / (points * 2)) * Math.PI * 2) + (offsetDeg * Math.PI) / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

/* ── Boss-specific inner detail layers ── */
function BossDetail({ visualId, c }: { visualId: string; c: typeof PALETTE[string] }) {
  switch (visualId) {
    case 'salvage_hauler':
      // Industrial: cargo pods around ring + cross braces
      return (
        <>
          {[0, 90, 180, 270].map((deg) => {
            const a = (deg * Math.PI) / 180;
            const px = 60 + Math.cos(a) * 41;
            const py = 60 + Math.sin(a) * 41;
            return (
              <rect
                key={deg}
                x={px - 6}
                y={py - 8}
                width={12}
                height={16}
                rx={2}
                fill={c.accent}
                opacity={0.8}
                transform={`rotate(${deg}, ${px}, ${py})`}
              />
            );
          })}
          <line x1="60" y1="34" x2="60" y2="86" stroke={c.ring} strokeWidth="3" opacity="0.5" />
          <line x1="34" y1="60" x2="86" y2="60" stroke={c.ring} strokeWidth="3" opacity="0.5" />
          <polygon points={starPoints(60, 60, 18, 9, 6)} fill={c.core} opacity="0.9" />
        </>
      );

    case 'void_cardinal':
      // Mystic: two counter-rotating rings of orbs + inner eye
      return (
        <>
          <circle cx="60" cy="60" r="36" fill="none" stroke={c.accent} strokeWidth="1.5" strokeDasharray="4 6" opacity="0.55" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const a = (deg * Math.PI) / 180;
            return (
              <circle
                key={deg}
                cx={60 + Math.cos(a) * 36}
                cy={60 + Math.sin(a) * 36}
                r={4}
                fill={c.accent}
                opacity={0.75}
              />
            );
          })}
          <polygon points={starPoints(60, 60, 22, 10, 8)} fill={c.core} opacity="0.9" />
          <circle cx="60" cy="60" r="9" fill={c.accent} opacity="0.95" />
          <circle cx="60" cy="60" r="4" fill="#ffffff" opacity="0.7" />
        </>
      );

    case 'crimson_tyrant':
      // Military: 12-point star + 3 gun barrel ports
      return (
        <>
          <polygon points={starPoints(60, 60, 30, 14, 12)} fill={c.ring} opacity="0.85" />
          {[270, 30, 150].map((deg) => {
            const a = (deg * Math.PI) / 180;
            const bx = 60 + Math.cos(a) * 42;
            const by = 60 + Math.sin(a) * 42;
            return (
              <g key={deg} transform={`rotate(${deg + 90}, ${bx}, ${by})`}>
                <rect x={bx - 4} y={by - 10} width={8} height={18} rx={2} fill={c.core} opacity={0.9} />
                <circle cx={bx} cy={by - 10} r={4} fill={c.accent} opacity={0.85} />
              </g>
            );
          })}
          <circle cx="60" cy="60" r="12" fill={c.core} opacity="0.95" />
          <circle cx="60" cy="60" r="5" fill={c.accent} opacity="1" />
        </>
      );

    case 'colossus':
      // Massive gear: blunt thick cogs + square core
      return (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const a = (deg * Math.PI) / 180;
            const px = 60 + Math.cos(a) * 38;
            const py = 60 + Math.sin(a) * 38;
            return (
              <rect
                key={deg}
                x={px - 6}
                y={py - 9}
                width={12}
                height={18}
                rx={1}
                fill={c.ring}
                opacity={0.9}
                transform={`rotate(${deg}, ${px}, ${py})`}
              />
            );
          })}
          <rect x="42" y="42" width="36" height="36" rx="4" fill={c.core} opacity="0.92" />
          <rect x="50" y="50" width="20" height="20" rx="2" fill={c.accent} opacity="0.8" />
        </>
      );

    case 'hive_queen':
    case 'hive_regent':
      // Organic: hexagonal cells + antennae
      return (
        <>
          <polygon points={polyPoints(60, 60, 32, 6, -30)} fill={c.ring} opacity="0.85" />
          <polygon points={polyPoints(60, 60, 22, 6, -30)} fill={c.core} opacity="0.9" />
          {[330, 30, 90, 150, 210, 270].map((deg) => {
            const a = (deg * Math.PI) / 180;
            const ax = 60 + Math.cos(a) * 14;
            const ay = 60 + Math.sin(a) * 14;
            const bx = 60 + Math.cos(a) * 46;
            const by = 60 + Math.sin(a) * 46;
            return (
              <line key={deg} x1={ax} y1={ay} x2={bx} y2={by}
                stroke={c.accent} strokeWidth="1.5" opacity="0.6" />
            );
          })}
          <circle cx="60" cy="60" r="10" fill={c.accent} opacity="0.9" />
          <circle cx="60" cy="60" r="4" fill="#052e16" opacity="0.8" />
        </>
      );

    case 'wraith_lord':
      // Ghost: jagged asymmetric 10-point + dashed ghost ring
      return (
        <>
          <polygon points={starPoints(60, 60, 34, 12, 10, -18)} fill={c.ring} opacity="0.7" />
          <circle cx="60" cy="60" r="38" fill="none" stroke={c.accent}
            strokeWidth="1.5" strokeDasharray="3 7" opacity="0.45" />
          <polygon points={starPoints(60, 60, 22, 10, 10, 0)} fill={c.core} opacity="0.75" />
          <circle cx="60" cy="60" r="10" fill={c.accent} opacity="0.7" />
          <ellipse cx="60" cy="60" rx="5" ry="7" fill="#ffffff" opacity="0.5" />
        </>
      );

    default:
      return (
        <>
          <polygon points={starPoints(60, 60, 26, 12, 8)} fill={c.core} opacity="0.9" />
          <circle cx="60" cy="60" r="10" fill={c.accent} opacity="0.9" />
        </>
      );
  }
}

/* ── Attack pattern overlay ── */
function AttackOverlay({ pattern, c }: { pattern: BossAttackPattern; c: typeof PALETTE[string] }) {
  switch (pattern) {
    case 'gravity_pulse':
      return (
        <>
          <ellipse cx="60" cy="60" rx="52" ry="20" fill="none"
            stroke={c.accent} strokeWidth="2" opacity="0.55" />
          <ellipse cx="60" cy="60" rx="20" ry="52" fill="none"
            stroke={c.accent} strokeWidth="2" opacity="0.55" />
          <circle cx="60" cy="60" r="52" fill="none"
            stroke={c.accent} strokeWidth="1" strokeDasharray="4 8" opacity="0.35" />
        </>
      );

    case 'enforcer_barrage':
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <rect x={20 + i * 16} y={86} width={8} height={16} rx={2}
                fill={c.accent} opacity={0.8} />
              <circle cx={24 + i * 16} cy={84} r={3} fill={c.core} opacity={0.9} />
            </g>
          ))}
        </>
      );

    case 'colossus_slam':
      return (
        <>
          <polygon points="60,18 96,98 24,98" fill={c.ring} opacity="0.4" />
          <polygon points="60,30 86,90 34,90" fill={c.accent} opacity="0.25" />
        </>
      );

    case 'swarm_crown':
      // 6 small hexagons orbiting the boss
      return (
        <>
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const a = (deg * Math.PI) / 180;
            const hx = 60 + Math.cos(a) * 46;
            const hy = 60 + Math.sin(a) * 46;
            return (
              <polygon key={deg}
                points={polyPoints(hx, hy, 9, 6)}
                fill={c.accent} opacity={0.7} />
            );
          })}
          <circle cx="60" cy="60" r="46" fill="none"
            stroke={c.accent} strokeWidth="1" strokeDasharray="5 10" opacity="0.4" />
        </>
      );

    case 'wraith_blink':
      // Ghost afterimage rings
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="none"
            stroke={c.accent} strokeWidth="2" strokeDasharray="3 9" opacity="0.4" />
          <circle cx="60" cy="60" r="40" fill="none"
            stroke={c.accent} strokeWidth="1.5" strokeDasharray="2 8" opacity="0.3" />
          <circle cx="60" cy="60" r="30" fill="none"
            stroke={c.accent} strokeWidth="1" strokeDasharray="2 6" opacity="0.25" />
        </>
      );

    default:
      return null;
  }
}

export const BossVisuals: React.FC<BossVisualsProps> = ({
  visualId,
  attackPattern = 'standard',
  className = '',
  size = 120,
}) => {
  const colors = PALETTE[visualId] ?? PALETTE.default;
  const id = `bvg-${visualId}`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`${className} ${pulseClass(attackPattern)}`.trim()}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.95" />
          <stop offset="55%" stopColor={colors.core} stopOpacity="0.4" />
          <stop offset="100%" stopColor={colors.core} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.5" />
          <stop offset="100%" stopColor={colors.core} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Outer glow aura */}
      <circle cx="60" cy="60" r="54" fill={`url(#${id}-glow)`} opacity="0.45" />

      {/* Attack pattern underlay */}
      <AttackOverlay pattern={attackPattern} c={colors} />

      {/* Ring outline */}
      <circle cx="60" cy="60" r="46" fill="none"
        stroke={colors.ring} strokeWidth="2.5" opacity="0.8" />
      <circle cx="60" cy="60" r="43" fill="none"
        stroke={colors.accent} strokeWidth="0.75" opacity="0.35" />

      {/* Boss-specific detail layer */}
      <BossDetail visualId={visualId} c={colors} />

      {/* Core highlight */}
      <circle cx="60" cy="60" r="54" fill={`url(#${id}-core)`} opacity="0.25" />
    </svg>
  );
};
