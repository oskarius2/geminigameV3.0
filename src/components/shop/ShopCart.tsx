import React from 'react';
import { PrimaryButton } from '../ui/PrimaryButton';
import { GhostButton } from '../ui/GhostButton';

interface ShopCartProps {
  metaScrap: number;
  cartTotal: number;
  canConfirm: boolean;
  onConfirm: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function ShopCart({
  metaScrap,
  cartTotal,
  canConfirm,
  onConfirm,
  onSkip,
  onBack,
}: ShopCartProps) {
  const remaining = metaScrap - cartTotal;

  return (
    <aside className="shrink-0 flex flex-col gap-3 p-4 rounded-xl border border-white/10 bg-black/50 backdrop-blur-md">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400/70">Scrap</p>
        <p className="text-2xl font-bold text-cyan-300 font-mono">{metaScrap.toLocaleString()}</p>
      </div>
      <div className="text-sm font-mono space-y-1 border-t border-white/10 pt-3">
        <p className="text-white/60">
          Cart: <span className="text-white">{cartTotal.toLocaleString()}</span>
        </p>
        <p className={remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
          Remaining: {remaining.toLocaleString()}
        </p>
      </div>
      <PrimaryButton onClick={onConfirm} disabled={!canConfirm} className="mt-2">
        Confirm & start survival
      </PrimaryButton>
      <GhostButton onClick={onSkip}>Skip shop</GhostButton>
      <GhostButton onClick={onBack}>Back</GhostButton>
    </aside>
  );
}
