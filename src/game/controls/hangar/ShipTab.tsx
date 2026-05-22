import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { GameIcon, getShipIconName } from '../../../components/icons';
import {
  SHIP_DEFINITIONS,
  SHIP_IDS,
  type ShipDef,
} from '../../ships/shipDefs';
import { ShipId } from '../../types';

const BASELINE = { hp: 450, speed: 9, damage: 18, fireRate: 1 };

function ShipIcon({ id, size = 32 }: { id: ShipId; size?: number }) {
  const ship = SHIP_DEFINITIONS[id];
  return (
    <GameIcon name={getShipIconName(id)} size={size} color={ship.color} glow />
  );
}

function rarityStars(ship: ShipDef): number {
  if (ship.id === 'gunship') return 5;
  if (ship.id === 'interceptor') return 3;
  return 4;
}

interface ShipTabProps {
  selectedId: ShipId | null;
  onSelect: (id: ShipId) => void;
}

export function ShipTab({ selectedId, onSelect }: ShipTabProps) {
  const preview = selectedId ? SHIP_DEFINITIONS[selectedId] : SHIP_DEFINITIONS.interceptor;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 min-h-0 overflow-hidden">
      <div className="lg:w-[500px] shrink-0 flex flex-col items-center text-center lg:text-left lg:items-start p-4 rounded-xl border border-[var(--hud-accent)]/20 bg-black/40">
        <div
          className="w-32 h-32 sm:w-64 sm:h-64 rounded-2xl flex items-center justify-center border-2 mb-4"
          style={{
            borderColor: preview.color,
            boxShadow: `0 0 40px ${preview.color}44`,
            background: `${preview.color}12`,
          }}
        >
          <ShipIcon id={preview.id} size={80} />
        </div>
        <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
          {preview.name}
        </h3>
        <div className="flex gap-0.5 mt-2 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < rarityStars(preview) ? 'opacity-100' : 'opacity-25'}>
              *
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-400 max-w-md leading-relaxed">{preview.description}</p>
        <p className="mt-4 text-xs font-mono uppercase text-cyan-400/80">{preview.uniquePassive.name}</p>
        <p className="text-xs text-slate-500 mt-1">{preview.uniquePassive.description}</p>
      </div>

      <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
        {SHIP_IDS.map((id) => {
          const ship = SHIP_DEFINITIONS[id];
          const selected = selectedId === id;
          const damage = Math.round(BASELINE.damage * ship.baseDamage);
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-4 rounded-xl border-2 flex gap-4 items-center transition-colors ${
                selected
                  ? 'border-[var(--hud-accent)] bg-cyan-950/30 shadow-[0_0_24px_rgba(0,212,255,0.15)]'
                  : 'border-white/10 bg-black/30 hover:border-cyan-500/40'
              }`}
            >
              <div
                className="w-16 h-16 shrink-0 rounded-xl flex items-center justify-center border"
                style={{ borderColor: `${ship.color}66`, background: `${ship.color}18` }}
              >
                <ShipIcon id={id} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold uppercase text-white text-lg">{ship.name}</span>
                  {selected && <Check size={18} className="text-[var(--hud-accent)] shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{ship.uniquePassive.name}</p>
              </div>
              <div className="hidden sm:grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-300 shrink-0">
                <span>HP {ship.baseHP}</span>
                <span>SPD {ship.baseSpeed}</span>
                <span>DMG {damage}</span>
                <span>FR {(ship.fireRateMultiplier * 10).toFixed(0)}/s</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
