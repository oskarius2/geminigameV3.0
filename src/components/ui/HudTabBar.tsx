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
      className={clsx('flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1', className)}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className="hud-tab-btn"
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
