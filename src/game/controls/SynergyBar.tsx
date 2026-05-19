import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SynergyLine } from '../buffs/synergies';
import type { HudVariant } from './mobileLayout';

interface SynergyBarProps {
  lines: SynergyLine[];
  layout?: HudVariant;
  /** @deprecated use layout */
  compact?: boolean;
}

const TOP_BY_LAYOUT: Record<HudVariant, string> = {
  full: 'top-[11.5rem]',
  compact: 'top-[4.75rem]',
  landscape: 'top-11',
  'tablet-landscape': 'top-[4.5rem]',
};

export const SynergyBar: React.FC<SynergyBarProps> = ({ lines, layout, compact = false }) => {
  if (lines.length === 0) return null;

  const resolvedLayout: HudVariant = layout ?? (compact ? 'compact' : 'full');
  const topClass = TOP_BY_LAYOUT[resolvedLayout];

  return (
    <motion.div
      className={`absolute left-3 right-3 md:left-6 md:right-auto md:max-w-md flex flex-col gap-1 pointer-events-none z-20 ${topClass}`}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence mode="popLayout">
        {lines.map((line) => (
          <motion.div
            key={line.id}
            layout
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="backdrop-blur-xl px-3 py-1.5 rounded-lg"
          style={{
            background: 'rgba(15,23,42,0.65)',
            border: '1px solid rgba(245,158,11,0.3)',
            boxShadow: 'inset 0 0 12px rgba(245,158,11,0.04)',
          }}
          >
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-amber-300/90">{line.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
