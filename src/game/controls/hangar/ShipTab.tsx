import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { GameIcon, getShipIconName } from '../../../components/icons';
import {
  SHIP_DEFINITIONS,
  SHIP_IDS,
  type ShipDef,
} from '../../ships/shipDefs';
import { ShipId } from '../../types';
import { isDashUnlocked } from '../../../lib/metaStore';

const STAT_MAX = {
  hp: 700,
  speed: 20,
  damage: 90,
  fireRate: 1.2,
};

const BASELINE = { hp: 450, speed: 9, damage: 18, fireRate: 1 };

function ShipIcon({ id, size = 32 }: { id: ShipId; size?: number }) {
  const ship = SHIP_DEFINITIONS[id];
  return (
    <GameIcon name={getShipIconName(id)} size={size} color={ship.color} glow />
  );
}

function StatBarInline({
  label,
  value,
  max,
  baseline,
  color,
  suffix = '',
}: {
  label: string;
  value: number;
  max: number;
  baseline: number;
  color: string;
  suffix?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const diff = Math.round(((value / baseline) - 1) * 100);
  const diffLabel = diff === 0 ? '' : diff > 0 ? `+${diff}%` : `${diff}%`;
  const diffColor = diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : '';

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-500 w-8 sm:w-10 shrink-0 text-right">
        {label}
      </span>
      <div className="flex-1 h-[6px] rounded-full bg-white/5 overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          style={{
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
      <span className="text-[10px] font-mono tabular-nums text-white/70 w-10 shrink-0">
        {typeof value === 'number' ? Math.round(value) : value}{suffix}
      </span>
      {diffLabel && (
        <span className="text-[9px] font-mono tabular-nums w-10 shrink-0" style={{ color: diffColor }}>
          {diffLabel}
        </span>
      )}
    </div>
  );
}

interface ShipTabProps {
  selectedId: ShipId | null;
  onSelect: (id: ShipId) => void;
}

export function ShipTab({ selectedId, onSelect }: ShipTabProps) {
  const preview = selectedId ? SHIP_DEFINITIONS[selectedId] : SHIP_DEFINITIONS.interceptor;
  const dashUnlocked = useMemo(() => isDashUnlocked(), []);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0 overflow-hidden">
      {/* Ship list */}
      <div className="flex-1 flex flex-col gap-2.5 min-h-0 overflow-y-auto pr-1">
        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/25 mb-1 shrink-0">
          Select vessel
        </p>
        {SHIP_IDS.map((id) => {
          const ship = SHIP_DEFINITIONS[id];
          const selected = selectedId === id;
          const damage = Math.round(BASELINE.damage * ship.baseDamage);
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left rounded-xl border-2 transition-all duration-200 ${
                selected
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_24px_rgba(0,212,255,0.15)]'
                  : 'border-white/8 bg-black/30 hover:border-cyan-500/30 hover:bg-black/40'
              }`}
              style={{ minHeight: '44px' }}
            >
              <div className="p-3 sm:p-4">
                <div className="flex gap-3 items-start">
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl flex items-center justify-center border"
                    style={{
                      borderColor: `${ship.color}55`,
                      background: `${ship.color}12`,
                      boxShadow: selected ? `0 0 20px ${ship.color}33` : 'none',
                    }}
                  >
                    <ShipIcon id={id} size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold uppercase text-white text-sm sm:text-base tracking-wide">
                        {ship.name}
                      </span>
                      {selected && <Check size={16} className="text-cyan-400 shrink-0" />}
                      {ship.dashDisabled && !dashUnlocked && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-blue-950/60 border border-blue-500/25 text-blue-400/70 shrink-0">
                          DASH: Locked
                        </span>
                      )}
                      {ship.dashDisabled && dashUnlocked && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/25 text-emerald-400/70 shrink-0">
                          DASH: ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono uppercase tracking-wider">
                      {ship.uniquePassive.name}
                    </p>
                  </div>
                </div>

                {/* Inline stat bars — always visible for comparison */}
                <div className="mt-3 space-y-1.5">
                  <StatBarInline label="HP" value={ship.baseHP} max={STAT_MAX.hp} baseline={BASELINE.hp} color={ship.color} />
                  <StatBarInline label="SPD" value={ship.baseSpeed} max={STAT_MAX.speed} baseline={BASELINE.speed} color={ship.color} />
                  <StatBarInline label="DMG" value={damage} max={STAT_MAX.damage} baseline={BASELINE.damage} color={ship.color} />
                  <StatBarInline label="FR" value={ship.fireRateMultiplier} max={STAT_MAX.fireRate} baseline={BASELINE.fireRate} color={ship.color} suffix="x" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected ship detail panel */}
      <div className="lg:w-[340px] xl:w-[380px] shrink-0 rounded-xl border border-white/10 bg-black/40 p-4 sm:p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center border-2"
            style={{
              borderColor: preview.color,
              boxShadow: `0 0 32px ${preview.color}33`,
              background: `${preview.color}10`,
            }}
          >
            <ShipIcon id={preview.id} size={36} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
              {preview.name}
            </h3>
            <p className="text-[10px] font-mono uppercase tracking-widest mt-0.5" style={{ color: preview.color }}>
              {preview.uniquePassive.name}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">{preview.description}</p>

        <div className="rounded-lg border border-white/5 bg-white/5 p-3 mb-4">
          <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-2">Unique passive</p>
          <p className="text-xs text-white/80 leading-relaxed">{preview.uniquePassive.description}</p>
        </div>

        <div className="mt-auto pt-3 border-t border-white/5">
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-500">HP</span>
              <span className="text-white font-bold">{preview.baseHP}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Speed</span>
              <span className="text-white font-bold">{preview.baseSpeed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Damage</span>
              <span className="text-white font-bold">{Math.round(BASELINE.damage * preview.baseDamage)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fire Rate</span>
              <span className="text-white font-bold">{(preview.fireRateMultiplier * 10).toFixed(0)}/s</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-slate-500">Dash</span>
              {preview.dashDisabled && !dashUnlocked ? (
                <span className="text-blue-400/80">Locked — defeat 3 bosses</span>
              ) : (
                <span className="text-emerald-400/80">Available</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
