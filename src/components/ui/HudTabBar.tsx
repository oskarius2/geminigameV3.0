import React from 'react';
import { clsx } from 'clsx';

export type HangarTab = 'ship' | 'vault' | 'loadout' | 'progress';

const TAB_LABELS: Record<HangarTab, string> = {
  ship: 'Ship Select',
  vault: 'Relic Vault',
  loadout: 'Loadout',
  progress: 'Unlocks',
};

interface HudTabBarProps {
  tabs: HangarTab[];
  active: HangarTab;
  onChange: (tab: HangarTab) => void;
  className?: string;
}

export function HudTabBar({ tabs, active, onChange, className }: HudTabBarProps) {
  return (
    <div
      className={clsx(
        'flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide border-b border-white/10 pb-px',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className={clsx(
            'shrink-0 min-h-10 px-3 sm:px-5 font-display text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] transition-colors border-b-2 -mb-px',
            active === tab
              ? 'text-[var(--hud-accent)] border-[var(--hud-accent)]'
              : 'text-slate-500 border-transparent hover:text-slate-300'
          )}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
