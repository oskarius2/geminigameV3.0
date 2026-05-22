import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameIcon } from '../../components/icons';
import type { ArtifactAcquiredEvent } from './artifactPopup';

export type ArtifactAcquirePlacement = 'corner';

interface ArtifactAcquireOverlayProps {
  event: ArtifactAcquiredEvent | null;
  placement?: ArtifactAcquirePlacement;
}

export function ArtifactAcquireOverlay({
  event,
  placement = 'corner',
}: ArtifactAcquireOverlayProps) {
  const compact = placement === 'corner';

  return (
    <AnimatePresence>
      {event && (
        <div className="ui-artifact-acquire-anchor" aria-live="assertive" role="status">
          <motion.div
            key={event.artifactId}
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`ui-artifact-acquire-card relative w-full backdrop-blur-xl bg-slate-950/88 ${event.borderClass} ${event.glowClass} ${event.particleClass ?? ''} ${compact ? 'ui-artifact-acquire-card--compact' : ''}`}
            style={{
              boxShadow: `0 0 32px ${event.rarityColor}44, inset 0 0 20px ${event.rarityColor}10`,
            }}
          >
            {event.rarity === 'LEGENDARY' || event.rarity === 'EXCLUSIVE' ? (
              <>
                <span
                  className="absolute -top-0.5 -left-0.5 h-1.5 w-1.5 rounded-full opacity-80"
                  style={{ background: event.rarityColor }}
                />
                <span
                  className="absolute -top-1 right-3 h-1 w-1 rounded-full opacity-60"
                  style={{ background: event.rarityColor }}
                />
              </>
            ) : null}

            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15"
                style={{ background: `${event.rarityColor}22` }}
              >
                <GameIcon name="ui.artifact" size={22} color={event.rarityColor} glow />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  className={`ui-artifact-acquire-title font-display font-black uppercase tracking-wide leading-tight ${event.textClass}`}
                >
                  {event.title}
                </h2>
                {event.statChanges.length > 0 ? (
                  <ul className="mt-2 space-y-0.5">
                    {event.statChanges.map((line) => (
                      <li
                        key={line}
                        className={`text-xs font-mono font-bold tracking-wide ${event.textClass}`}
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-slate-300 leading-snug line-clamp-2">
                    {event.subtitle}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
