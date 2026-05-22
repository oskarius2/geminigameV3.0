import React from 'react';
import { motion } from 'motion/react';
import { Shield, Radar, HeartPulse, Crosshair, Zap } from 'lucide-react';
import { HudPanel } from '../game/hud/HudPanel';
import { HUD_COLORS } from '../game/hud/hudTokens';
import { getCompanionDef } from '../game/companions/companionDefs';
import type { HudVariant } from '../game/controls/mobileLayout';
import type { CompanionId } from '../game/types';

const COMPANION_COLORS: Record<CompanionId, string> = {
  guardian: '#60a5fa',
  scout: '#c084fc',
  healer: '#4ade80',
  gunner: '#fb923c',
};

function CompanionIcon({ id, size = 16 }: { id: CompanionId; size?: number }) {
  if (id === 'guardian') return <Shield size={size} aria-hidden />;
  if (id === 'scout') return <Radar size={size} aria-hidden />;
  if (id === 'healer') return <HeartPulse size={size} aria-hidden />;
  return <Crosshair size={size} aria-hidden />;
}

export interface CompanionHUDProps {
  companionId: CompanionId;
  level: number;
  health: number;
  maxHealth: number;
  abilityName?: string;
  abilityCooldownRemaining?: number;
  abilityCooldownMax?: number;
  energy?: number;
  hudVariant?: HudVariant;
  className?: string;
}

export function CompanionHUD({
  companionId,
  level,
  health,
  maxHealth,
  abilityName,
  abilityCooldownRemaining = 0,
  abilityCooldownMax = 0,
  energy,
  hudVariant = 'full',
  className = '',
}: CompanionHUDProps) {
  const def = getCompanionDef(companionId);
  if (!def) return null;

  const compact = hudVariant === 'compact' || hudVariant === 'landscape';
  const color = COMPANION_COLORS[companionId];
  const safeMax = Math.max(1, maxHealth);
  const hpPct = Math.max(0, Math.min(100, (health / safeMax) * 100));
  const lowHp = hpPct < 35;
  const abilityLabel = abilityName ?? def.activeAbility?.name;
  const cooldownMax = abilityCooldownMax || def.activeAbility?.cooldown || 1;
  const cooldownPct =
    cooldownMax > 0
      ? Math.max(0, Math.min(100, ((cooldownMax - abilityCooldownRemaining) / cooldownMax) * 100))
      : 100;
  const abilityReady = abilityCooldownRemaining <= 0.05;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`pointer-events-none w-full ${compact ? 'max-w-full' : 'max-w-[320px]'} ${className}`}
      role="status"
      aria-label={`Companion ${def.name}, level ${level}, ${Math.round(hpPct)} percent hull`}
    >
      <HudPanel className={`${compact ? 'p-2' : 'p-3'} border-opacity-40`}>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            style={{
              color,
              backgroundColor: `${color}18`,
              borderColor: `${color}55`,
              boxShadow: `0 0 12px ${color}33`,
            }}
          >
            <CompanionIcon id={companionId} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-white truncate">
              {def.name}
            </p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Lv {level} · {def.role}
            </p>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider mb-0.5">
            <span className="text-slate-400">Drone hull</span>
            <span className={lowHp ? 'text-rose-400 font-bold tabular-nums' : 'text-white tabular-nums'}>
              {Math.round(health)}/{Math.round(safeMax)}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-black/45 border border-white/10">
            <motion.div
              className="h-full rounded-full"
              initial={false}
              animate={{ width: `${hpPct}%` }}
              transition={{ duration: 0.2 }}
              style={{
                background: lowHp
                  ? `linear-gradient(90deg, ${HUD_COLORS.danger}aa, ${HUD_COLORS.danger})`
                  : `linear-gradient(90deg, ${color}99, ${color})`,
                boxShadow: lowHp ? `0 0 8px ${HUD_COLORS.danger}66` : `0 0 8px ${color}44`,
              }}
            />
          </div>
        </div>

        {abilityLabel && (
          <div>
            <div className="flex justify-between items-center gap-2 text-[10px] font-mono uppercase tracking-wider mb-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap size={10} className={abilityReady ? 'text-amber-300' : 'text-slate-500'} />
                {abilityLabel}
              </span>
              <span className={abilityReady ? 'text-emerald-400' : 'text-slate-400 tabular-nums'}>
                {abilityReady ? 'Ready' : `${Math.ceil(abilityCooldownRemaining)}s`}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-black/40 border border-white/5">
              <div
                className="h-full rounded-full transition-[width] duration-150 ease-out"
                style={{
                  width: `${cooldownPct}%`,
                  background: abilityReady
                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                    : 'linear-gradient(90deg, rgba(148,163,184,0.5), rgba(100,116,139,0.8))',
                }}
              />
            </div>
            {energy !== undefined && def.activeAbility?.energyCost && def.activeAbility.energyCost > 0 && (
              <p className="mt-1 text-[9px] font-mono text-slate-500 tabular-nums">
                Energy {Math.round(energy)}
              </p>
            )}
          </div>
        )}
      </HudPanel>
    </motion.div>
  );
}

export default CompanionHUD;
