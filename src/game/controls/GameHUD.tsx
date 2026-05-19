import React from 'react';
import { motion } from 'motion/react';
import { Sword, Flame, Menu, Activity, Radar, Terminal, Radio } from 'lucide-react';
import { StatBar } from '../../components/ui/StatBar';
import { getHudVariant, type HudVariant, type ViewportProfile } from './mobileLayout';

function formatSurvival(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface HUDProps {
  health: number;
  maxHealth: number;
  survivalTime?: number;
  threatLevel?: number;
  augmentTier?: number;
  score: number;
  stage?: number;
  enemiesToKill?: number;
  stageTransition?: number;
  gameMode?: 'NORMAL' | 'AIM_TRAINER' | 'CAMPAIGN' | 'SURVIVAL';
  onOpenMenu?: () => void;
  onWeaponSwitch?: (slot: 'CANNON_A' | 'CANNON_B') => void;
  cardTimer?: number;
  cardInterval?: number;
  activeWeaponSlot?: 'CANNON_A' | 'CANNON_B';
  energy: number;
  maxEnergy: number;
  ultimateCharge: number;
  /** @deprecated pass hudVariant */
  isMobile?: boolean;
  /** @deprecated pass hudVariant */
  compactHud?: boolean;
  hudVariant?: HudVariant;
  viewportProfile?: ViewportProfile;
  landscapeHud?: boolean;
  /** Extra padding for iPad portrait compact HUD */
  tabletSpacious?: boolean;
  bossArenaTransition?: number;
  bossActive?: boolean;
}

function CardTimerRing({ cardTimer, cardInterval, size = 'md' }: { cardTimer: number; cardInterval: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 36 : 44;
  const r = size === 'sm' ? 13 : 15;
  const dash = size === 'sm' ? 82 : 94;
  return (
    <motion.div className="relative flex items-center justify-center shrink-0" style={{ width: dim, height: dim }}>
      <svg className={`absolute inset-0 -rotate-90 ${size === 'sm' ? 'w-9 h-9' : 'w-11 h-11'}`} viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="1" />
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(6,182,212,0.9)" strokeWidth="2"
          strokeDasharray={`${Math.max(0, (cardTimer / cardInterval) * dash)} ${dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col items-center leading-none z-10">
        <span className={`${size === 'sm' ? 'text-[5px]' : 'text-[6px]'} text-cyan-400/50 uppercase tracking-widest`}>SYNC</span>
        <span className={`${size === 'sm' ? 'text-[8px]' : 'text-[9px]'} font-mono text-cyan-300 tabular-nums`}>
          {cardTimer > 3 ? `~${Math.ceil(cardTimer)}s` : `${Math.max(0, Math.ceil(cardTimer))}s`}
        </span>
      </div>
    </motion.div>
  );
}

function HudBracket({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-xl backdrop-blur-xl ${className}`}
      style={{
        background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(6,182,212,0.15)',
        boxShadow: 'inset 0 0 16px rgba(6,182,212,0.04)',
      }}
    >
      {children}
    </div>
  );
}

function CompactTopHud(props: {
  threatLevel: number;
  augmentTier: number;
  score: number;
  survivalTime: number;
  stage: number;
  enemiesToKill: number;
  stageTransition: number;
  gameMode: string;
  cardTimer: number;
  cardInterval: number;
  bossArenaTransition: number;
  onOpenMenu?: () => void;
  spacious?: boolean;
}) {
  const {
    threatLevel,
    augmentTier,
    score,
    survivalTime,
    stage,
    enemiesToKill,
    stageTransition,
    gameMode,
    cardTimer,
    cardInterval,
    bossArenaTransition,
    onOpenMenu,
    spacious = false,
  } = props;

  return (
    <div className={`w-full flex justify-between items-start z-20 gap-2 ${spacious ? 'px-3 pt-3' : 'px-2 pt-2'}`}>
      <HudBracket className={`flex flex-col gap-1.5 min-w-0 flex-1 ${spacious ? 'p-3' : 'p-2'}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Pausmeny"
            onClick={(e) => { e.stopPropagation(); onOpenMenu?.(); }}
            className="pointer-events-auto h-8 w-8 flex items-center justify-center rounded-lg text-cyan-300/70"
            style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)' }}
          >
            <Menu size={14} />
          </button>
          <p className="text-sm font-display font-bold text-white tabular-nums truncate">
            {score.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-cyan-400/50">
          <span>{formatSurvival(survivalTime)}</span>
          {(gameMode === 'NORMAL' || gameMode === 'CAMPAIGN') && (
            <>
              <span className="text-cyan-400/20">·</span>
              <span>S{stage}</span>
              <span className="text-cyan-400/20">·</span>
              <span>
                {bossArenaTransition > 0
                  ? 'ARENA'
                  : stageTransition > 0
                    ? 'CLEAR'
                    : enemiesToKill > 0
                      ? `${enemiesToKill}`
                      : 'BOSS'}
              </span>
            </>
          )}
        </div>
      </HudBracket>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <CardTimerRing cardTimer={cardTimer} cardInterval={cardInterval} />
        <span className="text-[9px] font-mono text-rose-400/80 tracking-wider">
          T{augmentTier + 1} · {threatLevel.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function LandscapeTopHud(props: {
  threatLevel: number;
  augmentTier: number;
  score: number;
  survivalTime: number;
  stage: number;
  enemiesToKill: number;
  stageTransition: number;
  gameMode: string;
  cardTimer: number;
  cardInterval: number;
  bossArenaTransition: number;
  onOpenMenu?: () => void;
}) {
  const {
    threatLevel,
    augmentTier,
    score,
    survivalTime,
    stage,
    enemiesToKill,
    stageTransition,
    gameMode,
    cardTimer,
    cardInterval,
    bossArenaTransition,
    onOpenMenu,
  } = props;

  return (
    <motion.div className="w-full flex items-center justify-between gap-2 z-20 px-2 pt-[max(0.25rem,env(safe-area-inset-top))] max-h-12">
      <button
        type="button"
        aria-label="Pausmeny"
        onClick={(e) => { e.stopPropagation(); onOpenMenu?.(); }}
        className="pointer-events-auto h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-cyan-300/70"
        style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(6,182,212,0.15)' }}
      >
        <Menu size={14} />
      </button>
      <p className="text-sm font-display font-bold text-white tabular-nums truncate min-w-0">
        {score.toLocaleString()}
      </p>
      <span className="text-[10px] font-mono text-cyan-400/50 shrink-0">{formatSurvival(survivalTime)}</span>
      {(gameMode === 'NORMAL' || gameMode === 'CAMPAIGN') && (
        <span className="text-[10px] font-mono text-cyan-400/40 shrink-0">
          S{stage}
          {bossArenaTransition > 0
            ? ' · ARENA'
            : stageTransition > 0
              ? ' · CLEAR'
              : enemiesToKill > 0
                ? ` · ${enemiesToKill}`
                : ' · BOSS'}
        </span>
      )}
      <CardTimerRing cardTimer={cardTimer} cardInterval={cardInterval} size="sm" />
      <span className="text-[9px] font-mono text-rose-400/80 shrink-0 tracking-wider">
        T{augmentTier + 1}·{threatLevel.toFixed(0)}%
      </span>
    </motion.div>
  );
}

export const GameHUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  survivalTime = 0,
  threatLevel = 0,
  augmentTier = 0,
  score,
  stage = 1,
  enemiesToKill = 0,
  stageTransition = 0,
  gameMode = 'NORMAL',
  onOpenMenu,
  onWeaponSwitch,
  cardTimer = 60,
  cardInterval = 75,
  activeWeaponSlot = 'CANNON_A',
  energy,
  maxEnergy,
  ultimateCharge,
  compactHud = false,
  isMobile = false,
  hudVariant: hudVariantProp,
  viewportProfile,
  landscapeHud = false,
  tabletSpacious = false,
  bossArenaTransition = 0,
  bossActive = false,
}) => {
  const hudVariant: HudVariant =
    hudVariantProp ??
    (viewportProfile
      ? getHudVariant(viewportProfile, typeof window !== 'undefined' ? window.innerWidth : 390, typeof window !== 'undefined' ? window.innerHeight : 844)
      : landscapeHud
        ? 'landscape'
        : compactHud
          ? 'compact'
          : isMobile
            ? 'compact'
            : 'full');
  const threatPercent = Math.min(100, threatLevel);
  const showDesktopWeapons = hudVariant === 'full';
  const isCompact = hudVariant === 'compact';
  const isLandscape = hudVariant === 'landscape';
  const isTabletLandscape = hudVariant === 'tablet-landscape';

  const topHudProps = {
    threatLevel,
    augmentTier,
    score,
    survivalTime,
    stage,
    enemiesToKill,
    stageTransition,
    gameMode,
    cardTimer,
    cardInterval,
    bossArenaTransition,
    onOpenMenu,
  };

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none flex flex-col font-sans ${
        isLandscape
          ? 'p-1 pt-0'
          : isCompact || isTabletLandscape
            ? isTabletLandscape
              ? 'p-3 pt-[max(0.5rem,env(safe-area-inset-top))]'
              : 'p-2 pt-[max(0.5rem,env(safe-area-inset-top))]'
            : 'p-4 md:p-6'
      }`}
    >
      {isLandscape ? (
        <LandscapeTopHud {...topHudProps} />
      ) : isCompact || isTabletLandscape ? (
        <CompactTopHud {...topHudProps} spacious={tabletSpacious} />
      ) : (
        <div className="w-full flex justify-between items-start z-20 gap-4">
          <HudBracket className="flex flex-col gap-2 p-4 w-72 max-w-[45vw]">
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-cyan-400/50">Score</span>
            <p className="text-3xl md:text-4xl font-display font-bold text-white tabular-nums leading-none"
              style={{ textShadow: '0 0 20px rgba(6,182,212,0.3)' }}>
              {score.toLocaleString()}
            </p>
            <div className="flex items-center gap-3 text-[10px] font-mono text-cyan-400/50">
              <Activity size={10} className="text-cyan-400/60" /> {formatSurvival(survivalTime)}
              {(gameMode === 'NORMAL' || gameMode === 'CAMPAIGN') && (
                <span>
                  Sector {stage}
                  {enemiesToKill > 0 ? ` · ${enemiesToKill} left` : bossActive ? ' · Boss' : ''}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenMenu?.(); }}
              className="pointer-events-auto h-9 flex items-center justify-center gap-2 rounded-lg font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70 transition-colors"
              style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)' }}
            >
              <Terminal size={12} /> Pause
            </button>
          </HudBracket>

          <div className="flex flex-col items-end gap-3">
            <CardTimerRing cardTimer={cardTimer} cardInterval={cardInterval} />
            <HudBracket className="p-3 min-w-[160px]">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-cyan-400/50 flex items-center gap-1">
                <Radar size={10} /> Heat
              </span>
              <p className="text-lg font-display font-bold text-white mt-1">
                Tier {augmentTier + 1} · <span className="text-rose-400">{threatLevel.toFixed(0)}%</span>
              </p>
              <div className="w-full h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                  animate={{ width: `${threatPercent}%` }}
                />
              </div>
            </HudBracket>
          </div>
        </div>
      )}

      {showDesktopWeapons && (
        <div className="mt-auto flex justify-start mb-20 z-20">
          <HudBracket className="flex p-2 gap-2 pointer-events-auto">
            {(['CANNON_A', 'CANNON_B'] as const).map((slot) => {
              const isActive = activeWeaponSlot === slot;
              const Icon = slot === 'CANNON_B' ? Flame : Sword;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onWeaponSwitch?.(slot); }}
                  className="h-14 w-14 rounded-lg flex items-center justify-center transition-all"
                  style={isActive ? {
                    background: 'rgba(6,182,212,0.15)',
                    border: '1px solid rgba(6,182,212,0.5)',
                    boxShadow: '0 0 16px rgba(6,182,212,0.2)',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    opacity: 0.55,
                  }}
                >
                  <Icon size={20} className={isActive ? 'text-cyan-300' : 'text-white/30'} />
                </button>
              );
            })}
          </HudBracket>
        </div>
      )}

      {isLandscape ? (
        <>
          <motion.div className="absolute left-[max(0.5rem,env(safe-area-inset-left))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] w-28 z-20 pointer-events-none">
            <div className="flex items-center gap-1 mb-0.5 text-[8px] font-mono uppercase tracking-[0.25em] text-cyan-400/50">
              <Radio size={9} className="text-emerald-400" /> Skrov
            </div>
            <StatBar value={health} max={maxHealth} variant="health" compact />
          </motion.div>
          <div className="absolute right-[max(0.5rem,env(safe-area-inset-right))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] flex flex-col items-end gap-2 w-24 z-20 pointer-events-none">
            <StatBar value={ultimateCharge} max={100} label="Ultimat" variant="ultimate" compact />
            <StatBar value={energy} max={maxEnergy} label="Energi" align="right" variant="energy" compact />
          </div>
        </>
      ) : (
        <div
          className={`absolute bottom-0 left-0 right-0 flex justify-between items-end pointer-events-none gap-3 z-20 ${
            isCompact ? 'p-4 pb-20' : isTabletLandscape ? 'p-4 pb-16 md:px-8' : 'p-6 md:px-10 md:pb-8'
          }`}
        >
          <div className={isTabletLandscape ? 'w-40 md:w-48' : 'w-36 md:w-56'}>
            <div className="flex items-center gap-1 mb-1 text-[9px] font-mono uppercase tracking-[0.25em] text-cyan-400/50">
              <Radio size={10} className="text-emerald-400" /> Skrov
            </div>
            <StatBar value={health} max={maxHealth} variant="health" compact={isCompact || isTabletLandscape} />
          </div>
          <div className={isCompact ? 'w-28' : isTabletLandscape ? 'w-36 md:w-48' : 'w-40'}>
            <StatBar value={ultimateCharge} max={100} label="Ultimat" variant="ultimate" compact={isCompact || isTabletLandscape} />
          </div>
          <div className={isCompact ? 'w-28' : isTabletLandscape ? 'w-32 md:w-40' : 'w-28 md:w-40'}>
            <StatBar value={energy} max={maxEnergy} label="Energi" align="right" variant="energy" compact={isCompact || isTabletLandscape} />
          </div>
        </div>
      )}
    </motion.div>
  );
};
