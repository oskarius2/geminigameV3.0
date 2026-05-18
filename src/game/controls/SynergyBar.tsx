import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SynergyLine } from '../buffs/synergies';

interface SynergyBarProps {
  lines: SynergyLine[];
  compact?: boolean;
}

export const SynergyBar: React.FC<SynergyBarProps> = ({ lines, compact = false }) => {
  if (lines.length === 0) return null;

  return (
    <motion.div
      className={`absolute left-3 right-3 md:left-6 md:right-auto md:max-w-md flex flex-col gap-1 pointer-events-none z-20 ${
        compact ? 'top-[4.75rem]' : 'top-[11.5rem]'
      }`}
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
            className="bg-amber-500/15 border border-amber-400/40 backdrop-blur-md px-3 py-1.5 rounded-lg"
          >
            <span className="text-[11px] font-bold text-amber-200/90 tracking-wide">{line.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
