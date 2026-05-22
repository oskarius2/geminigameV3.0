import React from 'react';
import { motion } from 'motion/react';
import { ShipDef } from '../game/ships/shipDefs';
import { HudPanel } from '../game/hud/HudPanel';
import { HUD_COLORS } from '../game/hud/hudTokens';
import type { HudVariant } from '../game/controls/mobileLayout';

interface ShipHudWidgetProps {
  ship: ShipDef;
  playerHP: number;
  playerMaxHP: number;
  stage?: number;
  wave?: number;
  isPaused?: boolean;
  hudVariant?: HudVariant;
}

export function ShipHudWidget({
  ship,
  playerHP,
  playerMaxHP,
  stage = 1,
  wave = 1,
  isPaused = false,
  hudVariant = 'full',
}: ShipHudWidgetProps): JSX.Element | null {
  if (isPaused) return null;

  const phoneNarrow = hudVariant === 'phone-narrow';
  const phoneCompact = hudVariant === 'compact' || phoneNarrow;
  const landscape = hudVariant === 'landscape';
  const hpPct = playerMaxHP > 0 ? Math.max(0, Math.min(100, (playerHP / playerMaxHP) * 100)) : 0;
  const lowHp = hpPct < 25;

  const speedDisplay = Math.round(ship.baseSpeed * 10);
  const fireRateDisplay = Math.round(ship.fireRateMultiplier * 10);
  const damageDisplay = Math.round(18 * ship.baseDamage);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`pointer-events-none w-full ${phoneNarrow ? 'max-w-[9.5rem]' : phoneCompact ? 'max-w-full' : 'max-w-[320px]'}`}
    >
      <HudPanel className={`${phoneNarrow ? 'p-1.5' : phoneCompact ? 'p-2' : 'p-3 md:p-4'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border"
            style={{
              backgroundColor: `${ship.color}22`,
              borderColor: `${ship.color}66`,
              boxShadow: `0 0 12px ${ship.color}33`,
            }}
            aria-hidden
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ship.color }} />
          </div>
          <div className="min-w-0">
            <p
              className={`font-bold uppercase tracking-wide text-white truncate ${phoneNarrow ? 'text-xs' : 'text-sm'}`}
            >
              {ship.name}
            </p>
            {!phoneCompact && !landscape && (
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/60">
                Stage {stage} · Wave {wave}
              </p>
            )}
          </div>
        </div>

        <div className="mb-1 flex justify-between text-[10px] font-mono uppercase tracking-wider">
          <span className="text-slate-400">Hull</span>
          <span className={lowHp ? 'text-red-400 font-bold' : 'text-white tabular-nums'}>
            {Math.round(playerHP)}/{Math.round(playerMaxHP)}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-black/40 border border-white/10">
          <motion.div
            className="h-full rounded-full"
            initial={false}
            animate={{ width: `${hpPct}%` }}
            transition={{ duration: 0.2 }}
            style={{
              background: lowHp
                ? `linear-gradient(90deg, ${HUD_COLORS.danger}, #f97316)`
                : `linear-gradient(90deg, ${HUD_COLORS.success}, ${HUD_COLORS.accent})`,
              boxShadow: lowHp ? `0 0 10px ${HUD_COLORS.danger}88` : undefined,
            }}
          />
        </div>

        {!phoneCompact && (
          <div className="mt-3 grid grid-cols-3 gap-1 text-center border-t border-cyan-500/15 pt-2">
            <div>
              <p className="text-[9px] font-mono uppercase text-slate-500">Spd</p>
              <p className="text-sm font-bold font-mono text-white tabular-nums">{speedDisplay}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase text-slate-500">Dmg</p>
              <p className="text-sm font-bold font-mono text-white tabular-nums">{damageDisplay}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase text-slate-500">FR</p>
              <p className="text-sm font-bold font-mono text-white tabular-nums">{fireRateDisplay}/s</p>
            </div>
          </div>
        )}

        {!phoneCompact && !landscape && (
          <p className="mt-2 text-[11px] leading-snug text-slate-400 line-clamp-2">
            <span className="font-semibold" style={{ color: ship.color }}>
              {ship.uniquePassive.name}
            </span>
            {' — '}
            {ship.uniquePassive.description}
          </p>
        )}
      </HudPanel>
    </motion.div>
  );
}
