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

const VARIANT_CLASS: Record<NonNullable<StatBarProps['variant']>, string> = {
  health: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
  energy: 'bg-gradient-to-l from-amber-400 to-amber-500',
  ultimate: 'bg-gradient-to-r from-fuchsia-500 to-purple-400',
  neutral: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
};

const VARIANT_GLOW: Record<NonNullable<StatBarProps['variant']>, string> = {
  health: '0 0 8px rgba(52,211,153,0.5)',
  energy: '0 0 8px rgba(251,191,36,0.4)',
  ultimate: '0 0 8px rgba(217,70,239,0.5)',
  neutral: '0 0 8px rgba(6,182,212,0.4)',
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

  return (
    <div className={clsx('flex flex-col', align === 'right' && 'items-end')}>
      {(label || align === 'right') && (
        <div
          className={clsx(
            'flex w-full justify-between mb-1 text-[9px] font-mono uppercase tracking-[0.25em] text-cyan-400/50',
            compact && 'text-[8px]'
          )}
        >
          {align === 'left' && label && <span>{label}</span>}
          <span className="tabular-nums font-mono text-white/80">{pct.toFixed(0)}%</span>
          {align === 'right' && label && <span>{label}</span>}
        </div>
      )}
      <div
        className={clsx(
          'w-full rounded-full overflow-hidden',
          compact ? 'h-1.5' : 'h-2'
        )}
        style={{
          background: 'rgba(15,23,42,0.7)',
          border: '1px solid rgba(6,182,212,0.08)',
        }}
      >
        <motion.div
          className={clsx('h-full rounded-full', VARIANT_CLASS[variant], align === 'right' && 'ml-auto')}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          style={{ boxShadow: VARIANT_GLOW[variant] }}
        />
      </div>
    </div>
  );
};
