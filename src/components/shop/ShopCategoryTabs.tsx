import React from 'react';
import { ShopCategory } from '../../game/shop/shopTypes';

export type ShopTab = ShopCategory | 'ALL';

const TABS: { id: ShopTab; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: ShopCategory.STARTING_BUFFS, label: 'Starting' },
  { id: ShopCategory.EARLY_STAGE, label: 'Early' },
  { id: ShopCategory.THREAT, label: 'Threat' },
  { id: ShopCategory.COMPANION, label: 'Drone' },
];

interface ShopCategoryTabsProps {
  active: ShopTab;
  onChange: (tab: ShopTab) => void;
}

export function ShopCategoryTabs({ active, onChange }: ShopCategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide shrink-0 pb-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 min-h-10 px-4 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            active === tab.id
              ? 'bg-cyan-500/20 border-cyan-400/50 text-white'
              : 'bg-white/5 border-white/10 text-white/50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
