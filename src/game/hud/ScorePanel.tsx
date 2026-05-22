import React from 'react';
import { motion } from 'motion/react';
import { GameIcon } from '../../components/icons';
import { getThreatTier } from '../balance/threat';
import { HudPanel } from './HudPanel';
import { HUD_COLORS } from './hudTokens';
import type { HudVariant } from '../controls/mobileLayout';

function formatSurvival(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function threatTierLabel(level: number): string {
  const tier = getThreatTier(level);
  if (tier === 'calm') return 'CALM';
  if (tier === 'pressure') return 'PRESSURE';
  if (tier === 'danger') return 'DANGER';
  return 'CRITICAL';
}

interface ScorePanelProps {
  score: number;
  survivalTime: number;
  threatLevel: number;
  stage: number;
  enemiesToKill: number;
  stageTransition: number;
  bossArenaTransition: number;
  bossActive: boolean;
  gameMode: string;
  cardTimer: number;
  cardInterval: number;
  augmentTier: number;
  hudVariant: HudVariant;
  onOpenMenu?: () => void;
  className?: string;
  survivalDifficultyLabel?: string;
  miniBossKillsThisRun?: number;
}

export function ScorePanel({
  score,
  survivalTime,
  threatLevel,
  stage,
  enemiesToKill,
  stageTransition,
  bossArenaTransition,
  bossActive,
  gameMode,
  cardTimer,
  cardInterval,
  augmentTier,
  hudVariant,
  onOpenMenu,
  className = '',
  survivalDifficultyLabel,
  miniBossKillsThisRun = 0,
}: ScorePanelProps) {
  const isPhoneNarrow = hudVariant === 'phone-narrow';
  const isStackedMobile = hudVariant === 'phone-narrow' || hudVariant === 'compact';
  const isPhone = isStackedMobile;
  const isLandscape = hudVariant === 'landscape';
  const showInlineThreatHud = hudVariant === 'full' || hudVariant === 'tablet-landscape';
  const scoreSize = isStackedMobile
    ? 'text-xl'
    : isPhone
      ? 'text-2xl'
      : isLandscape
        ? 'text-xl'
        : 'text-[40px] md:text-5xl';

  const stageLine =
    gameMode === 'ON_RAILS'
      ? 'TUNNEL'
      : gameMode === 'NORMAL' || gameMode === 'CAMPAIGN'
        ? `STAGE ${stage}${bossArenaTransition > 0 ? ' · ARENA' : stageTransition > 0 ? ' · CLEAR' : enemiesToKill > 0 ? ` · ${enemiesToKill} LEFT` : bossActive ? ' · BOSS' : ''}`
        : '';

  const cardPct = cardInterval > 0 ? Math.max(0, (cardTimer / cardInterval) * 100) : 0;

  return (
    <HudPanel
      glow
      className={`p-3 md:p-4 min-w-0 ${isPhone ? 'w-full max-w-none' : 'w-full max-w-[320px]'} ${isStackedMobile ? '!p-2' : ''} ${className}`}
    >
      <div
        className={`flex items-start gap-2 ${isPhone ? 'justify-center relative' : 'justify-between'}`}
      >
        <div className={`min-w-0 ${isPhone ? 'flex-1 text-center px-10' : 'flex-1'}`}>
          <p
            className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] mb-1"
            style={{ color: HUD_COLORS.textSecondary }}
          >
            Score
          </p>
          <motion.p
            key={score}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1 }}
            className={`font-display font-bold tabular-nums leading-none text-white ${scoreSize}`}
            style={{ textShadow: `0 0 20px ${HUD_COLORS.accent}44` }}
          >
            {score.toLocaleString()}
          </motion.p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-mono">
            <span className="flex items-center gap-1" style={{ color: HUD_COLORS.textSecondary }}>
              <GameIcon name="ui.activity" size={12} color="#67e8f9" />
              {formatSurvival(survivalTime)}
            </span>
            {stageLine ? (
              <span className="text-white/70 uppercase tracking-wider text-[11px]">{stageLine}</span>
            ) : null}
            {gameMode === 'NORMAL' && survivalDifficultyLabel ? (
              <span className="text-cyan-400/60 uppercase tracking-wider text-[10px]">
                {survivalDifficultyLabel}
              </span>
            ) : null}
            {gameMode === 'NORMAL' && miniBossKillsThisRun > 0 ? (
              <span className="text-violet-300/80 uppercase tracking-wider text-[10px]">
                MB {miniBossKillsThisRun}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          aria-label="Pausmeny"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu?.();
          }}
          className={`pointer-events-auto shrink-0 h-9 w-9 flex items-center justify-center rounded-md text-cyan-300/80 hover:text-cyan-200 transition-colors touch-manipulation ${isPhone ? 'absolute right-0 top-0' : ''}`}
          style={{ border: `1px solid ${HUD_COLORS.accent}35`, background: 'rgba(0,212,255,0.06)' }}
        >
          <GameIcon name="ui.menu" size={16} color="#00e5ff" />
        </button>
      </div>

      {!isStackedMobile && (
        <div className="mt-3 pt-2 border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-2">
          {!showInlineThreatHud && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Threat</span>
              <p className="text-sm font-bold font-mono uppercase" style={{ color: HUD_COLORS.textSecondary }}>
                {threatTierLabel(threatLevel)}
              </p>
            </div>
          )}
          <div className={showInlineThreatHud ? 'ml-auto text-right' : 'text-right'}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Augment</span>
            <p className="text-sm font-mono font-bold text-rose-300/90">T{augmentTier + 1}</p>
          </div>
          {cardInterval > 1 && (
            <div className="w-full sm:w-auto min-w-[100px]">
              <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400/50">Next card</span>
              <div className="h-1.5 mt-0.5 rounded-full overflow-hidden bg-white/10">
                <div
                  className="h-full rounded-full transition-[width] duration-200 ease-out"
                  style={{ width: `${cardPct}%`, background: HUD_COLORS.accent }}
                />
              </div>
              <span className="text-[10px] font-mono text-cyan-300/70 tabular-nums">
                {cardTimer > 3 ? `~${Math.ceil(cardTimer)}s` : `${Math.max(0, Math.ceil(cardTimer))}s`}
              </span>
            </div>
          )}
        </div>
      )}
      {isStackedMobile && (
        <p className="mt-0.5 text-center text-[9px] font-mono uppercase tracking-wider text-rose-300/80">
          T{augmentTier + 1}
        </p>
      )}
    </HudPanel>
  );
}
