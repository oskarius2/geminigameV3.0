import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GameIcon } from './icons';
import { UnlockToastStack, type UnlockToast } from '../game/meta/unlockNotifications';

interface AchievementStackProps {
  toasts: UnlockToast[];
  visible: boolean;
  onToggleVisible: () => void;
  onDismiss: (index: number) => void;
}

/** In-run unlock / achievement toasts — toggle with H or Esc to see the canvas. */
export function AchievementStack({
  toasts,
  visible,
  onToggleVisible,
  onDismiss,
}: AchievementStackProps) {
  const count = toasts.length;
  if (count === 0) return null;

  return (
    <div className="ui-achievement-anchor">
      <AnimatePresence mode="wait">
        {visible ? (
          <motion.div
            key="achievement-stack"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pointer-events-auto w-full"
          >
            <UnlockToastStack toasts={toasts} onDismiss={onDismiss} />
            <p
              className="text-left text-[8px] font-mono uppercase tracking-wider mt-1 pointer-events-none"
              style={{ color: 'rgba(167, 139, 250, 0.45)' }}
            >
              H or Esc to hide
            </p>
          </motion.div>
        ) : (
          <motion.button
            key="achievement-badge"
            type="button"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onToggleVisible}
            className="ui-achievement-badge-btn"
            aria-label={`Show ${count} achievement notifications`}
          >
            <GameIcon name="ui.trophy" size={14} color="#fbbf24" glow className="shrink-0" />
            <span className="text-[11px] font-bold tabular-nums" style={{ textShadow: 'var(--ui-text-gold-neon)' }}>
              {count} unlocked
            </span>
            <span className="text-[9px] font-mono hidden min-[400px]:inline" style={{ color: 'rgba(167, 139, 250, 0.5)' }}>
              (H)
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
