import React, { useMemo } from 'react';
import { RAILS_POWERUP_DEFS, RailsPowerupKind } from '../onRails/powerups';
import { RAILS_BOSS_DEFS, RailsBossId } from '../onRails/bosses';

interface RailsHUDProps {
  survivalTime: number;
  targetSeconds: number;
  outcome: 'active' | 'cleared' | 'failed';
  killCount: number;
  score: number;
  health: number;
  maxHealth: number;
  hitTimer?: number;
  bossSpawned?: boolean;
  bossCombatActive?: boolean;
  bossDefeated?: boolean;
  bossId?: string | null;
  bossHealth?: number;
  bossMaxHealth?: number;
  weakPointOpen?: boolean;
  rapidFireUntil?: number;
  slowTimeUntil?: number;
  scoreMultUntil?: number;
  invincibleUntil?: number;
  shieldBubbleHits?: number;
  megaBlastCharges?: number;
}

function HeartIcon({ filled, dim }: { filled: boolean; dim?: boolean }) {
  return (
    <span
      className="inline-block text-2xl leading-none"
      style={{
        color: filled ? (dim ? '#fbbf24' : '#4ade80') : 'rgba(255,255,255,0.18)',
        textShadow: filled ? '0 0 14px rgba(74, 222, 128, 0.75)' : 'none',
      }}
      aria-hidden
    >
      &#9829;
    </span>
  );
}

function PowerupChip({
  label,
  color,
  detail,
}: {
  label: string;
  color: string;
  detail: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider"
      style={{
        borderColor: `${color}55`,
        color,
        textShadow: `0 0 10px ${color}88`,
        background: 'rgba(0,0,0,0.45)',
      }}
    >
      <span className="font-bold">{label}</span>
      <span className="tabular-nums opacity-80">{detail}</span>
    </div>
  );
}

export const RailsHUD: React.FC<RailsHUDProps> = ({
  survivalTime,
  targetSeconds,
  outcome,
  killCount,
  score,
  health,
  maxHealth,
  hitTimer = 0,
  bossSpawned = false,
  bossCombatActive = false,
  bossDefeated = false,
  bossId = null,
  bossHealth = 0,
  bossMaxHealth = 1,
  weakPointOpen = false,
  rapidFireUntil = 0,
  slowTimeUntil = 0,
  scoreMultUntil = 0,
  invincibleUntil = 0,
  shieldBubbleHits = 0,
  megaBlastCharges = 0,
}) => {
  const remaining = Math.max(0, Math.ceil(targetSeconds - survivalTime));
  const lowTime = remaining > 0 && remaining <= 10;
  const hp = Math.max(0, Math.min(maxHealth, Math.round(health)));
  const hitFlash = hitTimer > 0;

  const hpColor =
    hp <= 1 ? '#f87171' : hp <= 2 ? '#fbbf24' : '#4ade80';

  const bossDef = bossId ? RAILS_BOSS_DEFS[bossId as RailsBossId] : null;
  const bossRatio =
    bossMaxHealth > 0 ? Math.max(0, Math.min(1, bossHealth / bossMaxHealth)) : 0;
  const showBossBlock =
    bossSpawned && !bossDefeated && bossCombatActive && bossDef && outcome === 'active';

  const activePowerups = useMemo(() => {
    const chips: { kind: RailsPowerupKind; remaining: number }[] = [];
    const t = survivalTime;
    if (rapidFireUntil > t) {
      chips.push({ kind: 'RAPID_FIRE', remaining: rapidFireUntil - t });
    }
    if (slowTimeUntil > t) {
      chips.push({ kind: 'SLOW_TIME', remaining: slowTimeUntil - t });
    }
    if (scoreMultUntil > t) {
      chips.push({ kind: 'SCORE_MULTIPLIER', remaining: scoreMultUntil - t });
    }
    if (invincibleUntil > t) {
      chips.push({ kind: 'INVINCIBILITY', remaining: invincibleUntil - t });
    }
    if (shieldBubbleHits > 0) {
      chips.push({ kind: 'SHIELD_BUBBLE', remaining: 0 });
    }
    if (megaBlastCharges > 0) {
      chips.push({ kind: 'MEGA_BLAST', remaining: megaBlastCharges });
    }
    return chips;
  }, [
    survivalTime,
    rapidFireUntil,
    slowTimeUntil,
    scoreMultUntil,
    invincibleUntil,
    shieldBubbleHits,
    megaBlastCharges,
  ]);

  const scoreMultActive = scoreMultUntil > survivalTime;
  const scoreMultLeft = Math.max(0, Math.ceil(scoreMultUntil - survivalTime));

  return (
    <div className="absolute inset-0 z-30 pointer-events-none font-mono">
      <div className="absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))]">
        <p
          className="font-bold tabular-nums"
          style={{
            fontSize: '2rem',
            color: lowTime ? '#22d3ee' : '#ffffff',
            textShadow: lowTime
              ? '0 0 24px rgba(34, 211, 238, 0.95), 0 0 48px rgba(34, 211, 238, 0.35)'
              : '0 2px 10px rgba(0,0,0,0.7)',
          }}
        >
          {remaining}s
        </p>
      </div>

      <div
        className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] text-right transition-colors duration-75"
        style={{
          color: hitFlash ? '#ef4444' : hpColor,
          textShadow: hitFlash
            ? '0 0 20px rgba(239, 68, 68, 0.95)'
            : `0 0 16px ${hpColor}66`,
        }}
        aria-label={`HP ${hp} av ${maxHealth}`}
      >
        <div className="flex items-center justify-end gap-1">
          {Array.from({ length: maxHealth }, (_, i) => (
            <HeartIcon key={i} filled={i < hp} dim={hp <= 2 && i < hp} />
          ))}
        </div>
        <p className="mt-0.5 text-sm font-bold tabular-nums" style={{ fontSize: '1.5rem' }}>
          HP {hp}/{maxHealth}
        </p>
      </div>

      {showBossBlock && bossDef && (
        <div className="absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] w-[min(80vw,14rem)] -translate-x-1/2 text-center">
          <div className="boss-hp-hud boss-hp-hud--rails w-full">
            <p
              className="boss-hp-hud__label"
              style={{ textShadow: '0 0 10px rgba(248, 113, 113, 0.6)' }}
            >
              Boss fight
            </p>
            <p className="boss-hp-hud__subtitle">{bossDef.name}</p>
            <div className="boss-hp-hud__track relative">
              <div
                className="boss-hp-hud__fill"
                style={{
                  width: `${bossRatio * 100}%`,
                  background: `linear-gradient(90deg, ${bossDef.colors[0]}, ${bossDef.colors[1]})`,
                  boxShadow: `0 0 8px ${bossDef.colors[0]}66`,
                }}
              />
              {weakPointOpen && (
                <span
                  className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-red-500"
                  style={{
                    left: `${bossRatio * 42}%`,
                    boxShadow: '0 0 8px #ef4444',
                  }}
                  aria-hidden
                />
              )}
            </div>
            {weakPointOpen && (
              <p className="mt-1 text-[8px] uppercase tracking-widest text-red-300/90">
                Svag punkt öppen
              </p>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-[max(4.5rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))]">
        <p
          className="text-sm font-bold uppercase tracking-widest text-cyan-300"
          style={{ textShadow: '0 0 14px rgba(34, 211, 238, 0.65)' }}
        >
          Score {Math.floor(score).toLocaleString('sv-SE')}
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/55">
          Kills {killCount}
        </p>
      </div>

      {scoreMultActive && (
        <div
          className="absolute bottom-[max(4.5rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] text-right"
          style={{
            color: '#fcd34d',
            textShadow: '0 0 18px rgba(252, 211, 77, 0.85)',
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest">2x score aktiv</p>
          <p className="mt-0.5 text-[11px] tabular-nums opacity-90">{scoreMultLeft}s</p>
        </div>
      )}

      {activePowerups.length > 0 && (
        <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 flex max-w-[95vw] -translate-x-1/2 flex-wrap justify-center gap-1.5">
          {activePowerups.map((chip) => {
            const def = RAILS_POWERUP_DEFS[chip.kind];
            const detail =
              chip.kind === 'SHIELD_BUBBLE'
                ? `${shieldBubbleHits} träff`
                : chip.kind === 'MEGA_BLAST'
                  ? `x${megaBlastCharges}`
                  : `${Math.ceil(chip.remaining)}s`;
            return (
              <PowerupChip
                key={chip.kind}
                label={def.label}
                color={def.color}
                detail={detail}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
