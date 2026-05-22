import React from 'react';
import {
  ArrowUpCircle,
  Bot,
  Cloud,
  Crosshair,
  Gauge,
  HeartPulse,
  Package,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { ShopItemDef } from '../../game/shop/shopTypes';

const ICONS: Record<string, LucideIcon> = {
  Zap,
  Gauge,
  Shield,
  Crosshair,
  HeartPulse,
  Package,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Wind,
  Cloud,
  ArrowUpCircle,
  Bot,
};

interface ShopCardProps {
  item: ShopItemDef;
  selected: boolean;
  affordable: boolean;
  onToggle: (id: ShopItemDef['id']) => void;
}

export function ShopCard({ item, selected, affordable, onToggle }: ShopCardProps) {
  const Icon = ICONS[item.icon] ?? Package;
  const disabled = !affordable && !selected;

  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      disabled={disabled}
      aria-pressed={selected}
      className={`text-left rounded-xl p-4 border transition-all min-h-[120px] flex flex-col ${
        selected
          ? 'border-cyan-400/70 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,212,255,0.2)] scale-[1.02]'
          : disabled
            ? 'border-white/10 bg-black/30 opacity-50 cursor-not-allowed'
            : 'border-white/15 bg-black/40 hover:border-cyan-400/50 hover:scale-[1.02]'
      }`}
    >
      <div className="flex gap-3 items-start">
        <div
          className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
            selected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-white/60'
          }`}
        >
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-white leading-tight">{item.name}</p>
          <p className="text-xs text-white/55 mt-1 line-clamp-2">{item.description}</p>
        </div>
      </div>
      <p className="mt-3 text-lg font-mono font-bold text-cyan-400">{item.costScrap} scrap</p>
    </button>
  );
}
