import React from 'react';
import { motion } from 'motion/react';
import { Crosshair, Rocket, Bot, Zap, Heart, Gauge } from 'lucide-react';
import { Panel } from './ui/Panel';
import {
  SHIP_DEFINITIONS,
  SHIP_IDS,
  type ShipDef,
} from '../game/ships/shipDefs';
import { ShipId } from '../game/types';

interface ShipSelectProps {
  onSelect: (shipId: ShipId) => void;
  onBack?: () => void;
}

const BASELINE = {
  hp: 450,
  speed: 9,
  damage: 18,
  fireRate: 1,
};

function ShipIcon({ id }: { id: ShipId }) {
  const size = 24;
  if (id === 'interceptor') return <Rocket size={size} className="text-blue-400" />;
  if (id === 'gunship') return <Crosshair size={size} className="text-red-600" />;
  return <Bot size={size} className="text-gray-200" />;
}

function StatRow({
  label,
  value,
  baseline,
  suffix = '',
  higherIsBetter = true,
}: {
  label: string;
  value: number;
  baseline: number;
  suffix?: string;
  higherIsBetter?: boolean;
}) {
  const ratio = value / baseline;
  const pct = Math.round((ratio - 1) * 100);
  const positive = higherIsBetter ? pct >= 0 : pct <= 0;
  const display =
    pct === 0 ? '—' : `${pct > 0 ? '+' : ''}${pct}%`;

  return (
    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
      <span className="text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-slate-200 tabular-nums text-right">
        <span className="font-semibold">
          {typeof value === 'number' && suffix === '' ? Math.round(value) : value}
          {suffix}
        </span>
        <span
          className={`ml-1.5 sm:ml-2 text-[9px] sm:text-[10px] ${positive ? 'text-emerald-400' : 'text-rose-400'}`}
        >
          {display}
        </span>
      </span>
    </div>
  );
}

function ShipCard({
  ship,
  onSelect,
}: {
  ship: ShipDef;
  onSelect: (id: ShipId) => void;
}) {
  const damage = Math.round(BASELINE.damage * ship.baseDamage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="h-full rounded-2xl border-t-2 overflow-hidden" style={{ borderTopColor: ship.color }}>
        <Panel className="h-full p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 rounded-none border-0">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border border-white/10"
            style={{ background: `${ship.color}18`, boxShadow: `0 0 20px ${ship.color}33` }}
          >
            <ShipIcon id={ship.id} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base sm:text-lg font-bold uppercase tracking-[0.12em] text-white leading-tight">
              {ship.name}
            </h2>
            <p className="mt-1 text-[10px] sm:text-xs leading-relaxed text-slate-400 line-clamp-2">
              {ship.description}
            </p>
          </div>
        </div>

        {/* Stats - More compact */}
        <div className="space-y-1.5 sm:space-y-2 rounded-xl bg-black/30 p-2.5 sm:p-3 border border-white/5">
          <StatRow label="HP" value={ship.baseHP} baseline={BASELINE.hp} />
          <StatRow label="Speed" value={ship.baseSpeed} baseline={BASELINE.speed} />
          <StatRow label="Damage" value={damage} baseline={BASELINE.damage} />
          <StatRow
            label="Fire Rate"
            value={ship.fireRateMultiplier}
            baseline={BASELINE.fireRate}
            suffix="x"
          />
        </div>

        {/* Passive - Compact */}
        <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 sm:px-3 py-2 flex-1">
          <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Passive
          </p>
          <p className="text-xs sm:text-sm font-semibold text-white mt-0.5" style={{ color: ship.color }}>
            {ship.uniquePassive.name}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 line-clamp-3">
            {ship.uniquePassive.description}
          </p>
        </div>

        {/* Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(ship.id)}
          className="w-full min-h-10 sm:min-h-12 rounded-xl font-display font-bold uppercase tracking-[0.15em] text-xs sm:text-sm text-white transition-shadow mt-auto"
          style={{
            background: `linear-gradient(135deg, ${ship.color}cc, ${ship.color}88)`,
            boxShadow: `0 0 24px ${ship.color}44`,
          }}
        >
          Fly {ship.name}
        </motion.button>
        </Panel>
      </div>
    </motion.div>
  );
}

export function ShipSelect({ onSelect, onBack }: ShipSelectProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto p-2 sm:p-4 md:p-6"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(14,116,178,0.15) 0%, #0c0c0e 55%)',
      }}
    >
      {/* Header - Compact */}
      <div className="mb-4 sm:mb-6 text-center max-w-lg">
        <div className="flex items-center justify-center gap-2 text-cyan-400/70 mb-2">
          <Gauge size={14} />
          <Heart size={14} />
          <Zap size={14} />
        </div>
        <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-[0.18em] text-white">
          Select Your Vessel
        </h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-400">
          Choose your ship. Stats show exact values.
        </p>
      </div>

      {/* Ship Cards Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 w-full max-w-7xl">
        {SHIP_IDS.map((id) => (
          <ShipCard key={id} ship={SHIP_DEFINITIONS[id]} onSelect={onSelect} />
        ))}
      </div>

      {/* Back Button - Compact */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-4 sm:mt-6 text-xs font-mono uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
        >
          Back to menu
        </button>
      )}
    </motion.div>
  );
}
