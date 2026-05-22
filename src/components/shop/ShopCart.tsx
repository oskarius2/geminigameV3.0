import React from 'react';
import { PrimaryButton } from '../ui/PrimaryButton';
import { GhostButton } from '../ui/GhostButton';
import type { ShopCartLine } from '../../game/shop/shopTypes';
import { getShopItem } from '../../game/shop/shopDefs';

interface ShopCartProps {
  metaScrap: number;
  cart: ShopCartLine[];
  cartTotal: number;
  canConfirm: boolean;
  onConfirm: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function ShopCart({
  metaScrap,
  cart,
  cartTotal,
  canConfirm,
  onConfirm,
  onSkip,
  onBack,
}: ShopCartProps) {
  const remaining = metaScrap - cartTotal;
  const itemCount = cart.length;

  return (
    <aside className="shop-cart shrink-0 flex flex-col gap-3 p-4 rounded-xl border border-white/10 bg-black/50 backdrop-blur-md lg:w-[280px]">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400/70">Scrap</p>
        <p className="text-2xl font-bold text-cyan-300 font-mono tabular-nums">
          {metaScrap.toLocaleString()}
        </p>
      </div>

      <div className="text-sm font-mono space-y-1 border-t border-white/10 pt-3">
        <p className="text-white/60">
          Cart ({itemCount}):{' '}
          <span className="text-white tabular-nums">{cartTotal.toLocaleString()}</span>
        </p>
        <p className={remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
          Remaining: <span className="tabular-nums">{remaining.toLocaleString()}</span>
        </p>
      </div>

      {itemCount > 0 ? (
        <ul className="shop-cart__lines border-t border-white/10 pt-3 space-y-1.5 max-h-[200px] overflow-y-auto">
          {cart.map((line) => {
            const def = getShopItem(line.itemId);
            return (
              <li
                key={line.itemId}
                className="flex items-center justify-between gap-2 text-[11px] font-mono text-cyan-200/90"
              >
                <span className="truncate uppercase tracking-wide">{def?.name ?? line.itemId}</span>
                <span className="shrink-0 text-cyan-400/80 tabular-nums">{line.costScrap}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider border-t border-white/10 pt-3">
          No upgrades selected — tap cards to add
        </p>
      )}

      <PrimaryButton
        onClick={onConfirm}
        disabled={!canConfirm}
        className="mt-1"
        aria-label={
          itemCount > 0
            ? `Confirm ${itemCount} purchases and start survival`
            : 'Start survival without shop purchases'
        }
      >
        {itemCount > 0 ? `Confirm (${itemCount}) & start` : 'Start survival'}
      </PrimaryButton>
      <GhostButton type="button" onClick={onSkip}>
        Skip shop
      </GhostButton>
      <GhostButton type="button" onClick={onBack} className="hidden lg:flex">
        Back
      </GhostButton>
    </aside>
  );
}
