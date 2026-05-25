import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { SpaceBackground } from './ui/SpaceBackground';
import { GhostButton } from './ui/GhostButton';
import { ShopCard } from './shop/ShopCard';
import { ShopCart } from './shop/ShopCart';
import { ShopCategoryTabs, type ShopTab } from './shop/ShopCategoryTabs';
import { getShopItemsByCategory } from '../game/shop/shopDefs';
import { buildCart, cartTotalScrap, validatePurchase } from '../game/shop/shopLogic';
import type { ShopItemId } from '../game/shop/shopTypes';
import type { CompanionId, ShipId } from '../game/types';
import { getCompanionDef } from '../game/companions/companionDefs';

interface PreRunShopProps {
  metaScrap: number;
  shipId: ShipId;
  companionId: CompanionId;
  onConfirm: (purchasedIds: ShopItemId[], totalSpent: number) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function PreRunShop({
  metaScrap,
  shipId,
  companionId,
  onConfirm,
  onSkip,
  onBack,
}: PreRunShopProps) {
  const [tab, setTab] = useState<ShopTab>('ALL');
  const [selected, setSelected] = useState<ShopItemId[]>([]);

  const items = useMemo(() => getShopItemsByCategory(tab), [tab]);
  const cart = useMemo(() => buildCart(selected), [selected]);
  const cartTotal = cartTotalScrap(cart);
  const validation = validatePurchase(metaScrap, selected);
  const companionName = getCompanionDef(companionId)?.name ?? companionId;

  const toggle = (id: ShopItemId) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const def = getShopItemsByCategory('ALL').find((i) => i.id === id);
      if (!def) return prev;
      const next = [...prev, id];
      const total = cartTotalScrap(buildCart(next));
      if (total > metaScrap) return prev;
      return next;
    });
  };

  const handleConfirm = () => {
    if (!validation.ok && selected.length > 0) return;
    onConfirm(
      cart.map((l) => l.itemId),
      cartTotal,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 overflow-hidden flex flex-col pointer-events-auto"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 70%), #020617',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <SpaceBackground scanlines />
      <div className="relative z-10 flex flex-col flex-1 max-w-7xl mx-auto w-full min-h-0 p-4 sm:p-6">
        <header className="shrink-0 mb-4">
          <h1
            className="font-display font-bold tracking-[0.12em] text-white uppercase"
            style={{
              fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
              textShadow: '0 0 32px rgba(0,212,255,0.35)',
            }}
          >
            Pre-run loadout shop
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/60 mt-1">
            {shipId} · {companionName}
          </p>
        </header>

        <ShopCategoryTabs active={tab} onChange={setTab} />

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 mt-4">
          <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start pr-1">
            {items.map((item) => {
              const isSelected = selected.includes(item.id);
              const canAdd = cartTotal + item.costScrap <= metaScrap;
              return (
                <ShopCard
                  key={item.id}
                  item={item}
                  selected={isSelected}
                  canToggle={isSelected || canAdd}
                  onToggle={toggle}
                />
              );
            })}
          </div>
          <ShopCart
            metaScrap={metaScrap}
            cart={cart}
            cartTotal={cartTotal}
            canConfirm={validation.ok}
            onConfirm={handleConfirm}
            onSkip={onSkip}
            onBack={onBack}
          />
        </div>

        <footer className="shrink-0 pt-3 lg:hidden">
          <GhostButton onClick={onBack} className="w-full">
            Back to companion
          </GhostButton>
        </footer>
      </div>
    </motion.div>
  );
}

export default PreRunShop;
