import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { ArtifactAcquiredEvent } from './artifactPopup';

interface ArtifactAcquireOverlayProps {
  event: ArtifactAcquiredEvent | null;
}

export function ArtifactAcquireOverlay({ event }: ArtifactAcquireOverlayProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.artifactId}
          initial={{ opacity: 0, scale: 0.88, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -12 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center px-4"
          aria-live="assertive"
          role="status"
        >
          <div
            className={`relative max-w-md w-full rounded-2xl border-2 px-6 py-5 backdrop-blur-xl bg-slate-950/85 ${event.borderClass} ${event.glowClass} ${event.particleClass ?? ''}`}
            style={{
              boxShadow: `0 0 40px ${event.rarityColor}44, inset 0 0 24px ${event.rarityColor}12`,
            }}
          >
            {event.rarity === 'LEGENDARY' || event.rarity === 'EXCLUSIVE' ? (
              <>
                <span
                  className="absolute -top-1 -left-1 h-2 w-2 rounded-full opacity-80"
                  style={{ background: event.rarityColor }}
                />
                <span
                  className="absolute -top-2 right-4 h-1.5 w-1.5 rounded-full opacity-60"
                  style={{ background: event.rarityColor }}
                />
                <span
                  className="absolute bottom-2 -right-1 h-2 w-2 rounded-full opacity-70"
                  style={{ background: event.rarityColor }}
                />
              </>
            ) : null}

            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15"
                style={{ background: `${event.rarityColor}22` }}
              >
                <Sparkles size={28} style={{ color: event.rarityColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  className={`font-display text-base md:text-lg font-black uppercase tracking-wide leading-tight ${event.textClass}`}
                >
                  {event.title}
                </h2>
                {event.statChanges.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {event.statChanges.map((line) => (
                      <li
                        key={line}
                        className={`text-sm font-mono font-bold tracking-wide ${event.textClass}`}
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-300 leading-snug">{event.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
