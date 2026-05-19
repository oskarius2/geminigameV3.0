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
  energy: 'bg-gradient-to-l from-amber-400 to-amber-600',
  ultimate: 'bg-white',
  neutral: 'bg-cyan-500',
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
            'flex w-full justify-between mb-1 text-[9px] uppercase tracking-widest text-white/50 font-sans font-bold',
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
          'w-full bg-black/60 rounded-full border border-white/10 overflow-hidden',
          compact ? 'h-1.5' : 'h-2'
        )}
      >
        <motion.div
          className={clsx('h-full rounded-full', VARIANT_CLASS[variant], align === 'right' && 'ml-auto')}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        />
      </div>
    </div>
  );
};
