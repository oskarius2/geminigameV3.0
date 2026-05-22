import React from 'react';
import { clsx } from 'clsx';
import type { ShopItemDef } from '../../game/shop/shopTypes';
import { GameIconFromKey } from '../icons';

interface ShopCardProps {
  item: ShopItemDef;
  selected: boolean;
  affordable: boolean;
  onToggle: (id: ShopItemDef['id']) => void;
}

export function ShopCard({ item, selected, affordable, onToggle }: ShopCardProps) {
  const disabled = !affordable && !selected;

  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        'ui-menu-card text-left p-4 min-h-[120px] flex flex-col',
        selected && 'ring-2 ring-cyan-400/60',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="flex items-start gap-3 flex-1">
        <div
          className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center border border-white/10"
          style={{ background: 'rgba(0,229,255,0.08)' }}
        >
          <GameIconFromKey iconKey={item.icon} size={22} color="#7df9ff" glow />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-white text-sm uppercase tracking-wide">
            {item.name}
          </p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
        </div>
      </div>
      <p className="mt-3 text-sm font-mono text-cyan-300">{item.costScrap.toLocaleString()} scrap</p>
    </button>
  );
}
