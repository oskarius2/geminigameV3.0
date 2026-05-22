import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SynergyLine } from '../buffs/synergies';
import type { HudVariant } from './mobileLayout';

interface SynergyBarProps {
  lines: SynergyLine[];
  layout?: HudVariant;
  /** @deprecated use layout */
  compact?: boolean;
  /** Inside stacked GameHUD header — no absolute positioning */
  embedded?: boolean;
}

const TOP_BY_LAYOUT: Record<HudVariant, string> = {
  full: 'top-[10.5rem] left-3 right-3 md:left-6 md:right-auto md:max-w-md',
  compact: 'top-[max(5.25rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 right-auto w-[min(92vw,20rem)]',
  landscape: 'top-[max(3.25rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 right-auto w-[min(88vw,18rem)]',
  'tablet-landscape': 'top-[5.5rem] left-3 right-3 md:left-6 md:right-auto md:max-w-md',
  'phone-narrow': 'top-[max(5.25rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 right-auto w-[min(92vw,18rem)]',
};

const CLIP = 'polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)';

export const SynergyBar: React.FC<SynergyBarProps> = ({
  lines, layout, compact = false, embedded = false,
}) => {
  if (lines.length === 0) return null;

  const resolvedLayout: HudVariant = layout ?? (compact ? 'compact' : 'full');
  const topClass = TOP_BY_LAYOUT[resolvedLayout];

  return (
    <motion.div
      className={
        embedded
          ? 'relative flex flex-col gap-1 pointer-events-none w-full'
          : `absolute flex flex-col gap-1 pointer-events-none z-20 ${topClass}`
      }
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence mode="popLayout">
        {lines.map((line) => (
          <motion.div
            key={line.id}
            layout
            initial={{ opacity: 0, x: -10, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="backdrop-blur-xl px-3 py-1.5 flex items-center gap-2"
            style={{
              background: 'rgba(10, 14, 28, 0.82)',
              border: '1px solid rgba(255,170,0,0.35)',
              clipPath: CLIP,
              boxShadow: '0 0 16px rgba(255,170,0,0.1), inset 0 0 12px rgba(255,170,0,0.04)',
            }}
          >
            <span
              className="shrink-0 w-1 h-4"
              style={{ background: '#ffaa00', boxShadow: '0 0 6px rgba(255,170,0,0.8)' }}
            />
            <span
              className="font-mono font-bold uppercase tracking-[0.2em]"
              style={{ fontSize: 10, color: 'rgba(251,191,36,0.92)' }}
            >
              {line.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
