import React from 'react';
import { DEV_CHEAT_CONTROLS_HINT } from '../dev/cheats';

interface DevCheatsHudProps {
  toast: string | null;
  compact?: boolean;
}

export const DevCheatsHud: React.FC<DevCheatsHudProps> = ({ toast, compact = false }) => (
  <div
    className={`pointer-events-none fixed z-[90] max-w-[min(100vw-1rem,22rem)] font-mono text-[10px] leading-snug text-amber-200/90 ${
      compact
        ? 'top-[max(0.35rem,env(safe-area-inset-top))] right-[max(0.35rem,env(safe-area-inset-right))] left-auto'
        : 'bottom-2 left-2'
    }`}
    aria-live="polite"
  >
    {toast ? (
      <p className="mb-1 rounded bg-amber-950/90 px-2 py-1 text-amber-100 ring-1 ring-amber-500/40">
        {toast}
      </p>
    ) : null}
    {!compact && (
      <p className="rounded bg-black/50 px-2 py-1 text-amber-200/70">{DEV_CHEAT_CONTROLS_HINT}</p>
    )}
  </div>
);
