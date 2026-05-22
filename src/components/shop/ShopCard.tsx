import React from 'react';
import { clsx } from 'clsx';
import type { ShopItemDef } from '../../game/shop/shopTypes';
import { GameIconFromKey } from '../icons';

interface ShopCardProps {
  item: ShopItemDef;
  selected: boolean;
  /** Can add to cart (or already selected — always clickable to toggle off) */
  canToggle: boolean;
  onToggle: (id: ShopItemDef['id']) => void;
}

export function ShopCard({ item, selected, canToggle, onToggle }: ShopCardProps) {
  const disabled = !canToggle && !selected;

  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${item.name}, ${item.costScrap} scrap${selected ? ', selected' : ''}`}
      className={clsx(
        'shop-card ui-menu-card text-left p-4 min-h-[120px] flex flex-col relative',
        selected && 'ui-menu-card--selected shop-card--selected',
        disabled && 'ui-menu-card--disabled',
      )}
    >
      {selected && (
        <span className="shop-card__badge" aria-hidden>
          <span className="shop-card__check">✓</span>
          In cart
        </span>
      )}

      <div className="flex items-start gap-3 flex-1">
        <div
          className={clsx(
            'shrink-0 w-11 h-11 rounded-lg flex items-center justify-center border transition-colors',
            selected ? 'border-cyan-400/50 bg-cyan-500/15' : 'border-white/10',
          )}
          style={selected ? undefined : { background: 'rgba(0,229,255,0.08)' }}
        >
          <GameIconFromKey iconKey={item.icon} size={22} color={selected ? '#7df9ff' : '#67e8f9'} glow={selected} />
        </div>
        <div className="min-w-0 flex-1 pr-1">
          <p
            className={clsx(
              'font-display font-bold text-sm uppercase tracking-wide',
              selected ? 'text-cyan-100' : 'text-white',
            )}
          >
            {item.name}
          </p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
        </div>
      </div>
      <p
        className={clsx(
          'mt-3 text-sm font-mono',
          selected ? 'text-cyan-200' : 'text-cyan-300',
        )}
      >
        {item.costScrap.toLocaleString()} scrap
      </p>
    </button>
  );
}
