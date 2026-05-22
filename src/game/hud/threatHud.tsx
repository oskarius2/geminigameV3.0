import React, { useEffect, useRef, useState } from 'react';
import { getThreatTier, getThreatVisualConfig, type ThreatTier } from '../balance/threat';
import { GameState } from '../types';
import { HUD_COLORS } from './hudTokens';

export interface ThreatHudState {
  threatLevel: number;
  tier: ThreatTier;
  hudColor: string;
  fillPercent: number;
  pulseActive: boolean;
}

export function getThreatHudState(state: GameState): ThreatHudState {
  const threatLevel = state.threatLevel ?? 0;
  const tier = getThreatTier(threatLevel);
  const { hudColor } = getThreatVisualConfig(tier);
  return {
    threatLevel,
    tier,
    hudColor,
    fillPercent: Math.min(100, Math.max(0, threatLevel)),
    pulseActive: tier === 'critical' || tier === 'danger',
  };
}

interface ThreatBarProps {
  state: GameState;
  className?: string;
  /** Desktop ~320px, mobile ~250px */
  size?: 'md' | 'lg';
  /** stacked = tier above bar (phone); inline = compact panel (desktop) */
  layout?: 'stacked' | 'inline';
}

export function ThreatBar({
  state,
  className = '',
  size = 'lg',
  layout = 'stacked',
}: ThreatBarProps) {
  const hud = getThreatHudState(state);
  const prevTierRef = useRef<ThreatTier>(hud.tier);
  const [tierBump, setTierBump] = useState(false);

  useEffect(() => {
    if (prevTierRef.current !== hud.tier) {
      prevTierRef.current = hud.tier;
      setTierBump(true);
      const t = window.setTimeout(() => setTierBump(false), 420);
      return () => window.clearTimeout(t);
    }
  }, [hud.tier]);

  const tierLabel =
    hud.tier === 'calm'
      ? 'CALM'
      : hud.tier === 'pressure'
        ? 'PRESSURE'
        : hud.tier === 'danger'
          ? 'DANGER'
          : 'CRITICAL';

  const barW = size === 'lg' ? 'min(100%, 320px)' : 'min(100%, 260px)';
  const barH = layout === 'inline' ? 40 : size === 'lg' ? 52 : 44;
  const inline = layout === 'inline';

  const panelStyle: React.CSSProperties = {
    background: HUD_COLORS.panelBg,
    border: `1px solid ${hud.hudColor}55`,
    boxShadow: tierBump
      ? `0 0 18px ${hud.hudColor}66, inset 0 0 10px ${hud.hudColor}18`
      : `0 2px 8px rgba(0,0,0,0.35), inset 0 0 10px ${hud.hudColor}14`,
    transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
  };

  const fillTrack = (
    <div
      className="relative w-full rounded-md overflow-hidden"
      style={{
        height: barH,
        background: 'rgba(0,0,0,0.35)',
        border: inline ? undefined : `1px solid ${hud.hudColor}44`,
        ...(inline ? {} : panelStyle),
      }}
    >
      <div
        className="absolute inset-y-0 left-0 transition-[width] duration-[400ms] ease-out rounded-md"
        style={{
          width: `${hud.fillPercent}%`,
          background: `linear-gradient(90deg, ${hud.hudColor}88, ${hud.hudColor})`,
          boxShadow: hud.pulseActive ? `0 0 12px ${hud.hudColor}` : undefined,
          animation: hud.tier === 'critical' ? 'threat-bar-pulse 0.9s ease-in-out infinite' : undefined,
        }}
      />
      {!inline && (
        <div className="relative z-10 flex h-full items-center justify-between px-3 md:px-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/70">Threat</span>
          <span className="text-base font-bold font-mono tabular-nums" style={{ color: hud.hudColor }}>
            {Math.round(hud.fillPercent)}%
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`pointer-events-none select-none w-full flex flex-col ${inline ? 'items-stretch' : 'items-center gap-1.5'} ${className}`}
      style={{ maxWidth: barW }}
      aria-label={`Threat level ${Math.round(hud.fillPercent)} percent, ${tierLabel}`}
      role="meter"
      aria-valuenow={Math.round(hud.fillPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {inline ? (
        <div className="rounded-lg backdrop-blur-xl p-3 w-full" style={panelStyle}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">Threat</span>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-black font-mono uppercase tracking-[0.14em] px-2 py-0.5 rounded"
                style={{
                  color: hud.hudColor,
                  background: `${hud.hudColor}18`,
                  border: `1px solid ${hud.hudColor}44`,
                  textShadow: tierBump ? `0 0 10px ${hud.hudColor}` : undefined,
                  transition: 'color 0.4s ease',
                }}
              >
                {tierLabel}
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-white/90">
                {Math.round(hud.fillPercent)}%
              </span>
            </div>
          </div>
          {fillTrack}
        </div>
      ) : (
        <>
          <span
            className="text-xs font-black font-mono uppercase tracking-[0.18em]"
            style={{
              color: hud.hudColor,
              transition: 'color 0.4s ease',
              textShadow: tierBump ? `0 0 12px ${hud.hudColor}` : undefined,
            }}
          >
            {tierLabel}
          </span>
          {fillTrack}
        </>
      )}
    </div>
  );
}

/** Render-ready threat bar for HUD integration. */
export function renderThreatBar(state: GameState): React.ReactElement {
  return <ThreatBar state={state} />;
}
