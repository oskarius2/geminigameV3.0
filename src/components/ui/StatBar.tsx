import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface StatBarProps {
  value: number;
  max: number;
  label?: string;
  align?: 'left' | 'right';
  variant?: 'health' | 'energy' | 'ultimate' | 'neutral';
  compact?: boolean;
}

const VARIANT: Record<NonNullable<StatBarProps['variant']>, { fill: string; glow: string; track: string }> = {
  health: {
    fill: 'linear-gradient(90deg, #008a3a, #00ff6a)',
    glow: '0 0 10px rgba(0,255,106,0.65), 0 0 20px rgba(0,255,106,0.25)',
    track: 'rgba(0,255,106,0.05)',
  },
  energy: {
    fill: 'linear-gradient(90deg, #cc8000, #ffaa00)',
    glow: '0 0 10px rgba(255,170,0,0.6), 0 0 20px rgba(255,170,0,0.2)',
    track: 'rgba(255,170,0,0.05)',
  },
  ultimate: {
    fill: 'linear-gradient(90deg, #6d1aaa, #c026d3)',
    glow: '0 0 10px rgba(192,38,211,0.65), 0 0 20px rgba(192,38,211,0.25)',
    track: 'rgba(192,38,211,0.05)',
  },
  neutral: {
    fill: 'linear-gradient(90deg, #0090a8, #00e5ff)',
    glow: '0 0 10px rgba(0,229,255,0.55), 0 0 20px rgba(0,229,255,0.2)',
    track: 'rgba(0,229,255,0.05)',
  },
};

export const StatBar: React.FC<StatBarProps> = ({
  value,
  max,
  label,
  align = 'left',
  variant = 'neutral',
  compact = false,
}) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const c = VARIANT[variant];

  return (
    <div className={clsx('flex flex-col', align === 'right' && 'items-end')}>
      {(label || align === 'right') && (
        <div
          className={clsx(
            'flex w-full justify-between mb-1 font-mono uppercase',
            compact ? 'text-[8px] tracking-[0.25em]' : 'text-[9px] tracking-[0.3em]',
          )}
          style={{ color: 'rgba(0,229,255,0.42)' }}
        >
          {align === 'left' && label && <span>{label}</span>}
          <span className="tabular-nums" style={{ color: 'rgba(240,248,255,0.65)' }}>
            {pct.toFixed(0)}%
          </span>
          {align === 'right' && label && <span>{label}</span>}
        </div>
      )}
      <div
        className={clsx('w-full overflow-hidden relative', compact ? 'h-[3px]' : 'h-[5px]')}
        style={{
          background: c.track,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <motion.div
          className={clsx('h-full', align === 'right' && 'ml-auto')}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
          style={{ background: c.fill, boxShadow: c.glow }}
        />
      </div>
    </div>
  );
};
