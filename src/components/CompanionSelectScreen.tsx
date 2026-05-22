import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Radar, HeartPulse, Crosshair, Lock, Sparkles } from 'lucide-react';
import { Panel } from './ui/Panel';
import { SpaceBackground } from './ui/SpaceBackground';
import { PrimaryButton } from './ui/PrimaryButton';
import { GhostButton } from './ui/GhostButton';
import {
  COMPANION_IDS,
  COMPANION_MAX_LEVEL,
  getCompanionDef,
} from '../game/companions/companionDefs';
import {
  getCompanionLevelProgress,
  getCompanionProgress,
  getMetaUnlockedCompanions,
  getSelectedCompanion,
  getXpToNextLevel,
  isCompanionUnlocked,
  setSelectedCompanion,
} from '../game/companions/companionLeveling';
import type { CompanionDef } from '../game/companions/companionTypes';
import type { CompanionId } from '../game/types';
import { clearNewUnlockBadges, getMetaProgress } from '../game/meta/metaProgress';
import { getCompanionUnlockHint } from '../game/meta/unlockHints';

const COMPANION_COLORS: Record<CompanionId, string> = {
  guardian: '#60a5fa',
  scout: '#c084fc',
  healer: '#4ade80',
  gunner: '#fb923c',
};

const ROLE_LABELS: Record<CompanionDef['role'], string> = {
  tank: 'Tank',
  scout: 'Scout',
  healer: 'Support',
  offense: 'Offense',
};

function CompanionIcon({ id }: { id: CompanionId }) {
  const size = 22;
  if (id === 'guardian') return <Shield size={size} />;
  if (id === 'scout') return <Radar size={size} />;
  if (id === 'healer') return <HeartPulse size={size} />;
  return <Crosshair size={size} />;
}

interface CompanionCardProps {
  def: CompanionDef;
  selected: boolean;
  unlocked: boolean;
  isNew?: boolean;
  unlockHint?: string;
  level: number;
  xp: number;
  levelProgress: number;
  xpToNext: number;
  onSelect: (id: CompanionId) => void;
}

function CompanionCard({
  def,
  selected,
  unlocked,
  isNew = false,
  unlockHint,
  level,
  xp,
  levelProgress,
  xpToNext,
  onSelect,
}: CompanionCardProps) {
  const color = COMPANION_COLORS[def.id];

  return (
    <motion.button
      type="button"
      disabled={!unlocked}
      onClick={() => onSelect(def.id)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={unlocked ? { scale: 1.02 } : undefined}
      whileTap={unlocked ? { scale: 0.98 } : undefined}
      className={`text-left w-full h-full rounded-2xl border-2 transition-shadow ${
        selected ? 'ring-2 ring-offset-2 ring-offset-slate-950' : 'border-transparent'
      } ${!unlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        borderTopColor: color,
        ringColor: selected ? color : undefined,
      }}
    >
      <Panel
        className={`h-full p-4 flex flex-col gap-3 rounded-2xl ${
          selected ? 'bg-slate-900/90' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10"
            style={{ background: `${color}22`, color, boxShadow: `0 0 16px ${color}33` }}
          >
            {unlocked ? <CompanionIcon id={def.id} /> : <Lock size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-base font-bold uppercase tracking-[0.12em] text-white">
                {unlocked ? def.name : 'Locked'}
              </h2>
              {isNew && unlocked && (
                <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-300">
                  <Sparkles size={9} /> NEW
                </span>
              )}
              <span
                className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border"
                style={{ color, borderColor: `${color}55`, background: `${color}12` }}
              >
                {ROLE_LABELS[def.role]}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
              {unlocked ? def.description : unlockHint ?? 'Unlock in run'}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-black/35 border border-white/5 p-2.5 space-y-2">
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500">
            <span>Level {level}</span>
            <span className="text-slate-400 tabular-nums">{xp} XP</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.round(levelProgress * 100)}%`,
                background: `linear-gradient(90deg, ${color}99, ${color})`,
              }}
            />
          </div>
          {level < COMPANION_MAX_LEVEL && (
            <p className="text-[9px] font-mono text-slate-500">
              {xpToNext > 0 ? `${xpToNext} XP to next level` : 'Max level soon'}
            </p>
          )}
          {level >= COMPANION_MAX_LEVEL && (
            <p className="text-[9px] font-mono text-amber-400/80">Max level</p>
          )}
        </div>

        <ul className="space-y-1 flex-1">
          {def.passivesSummary.map((line) => (
            <li key={line} className="text-[10px] text-slate-300 flex gap-1.5">
              <span style={{ color }} aria-hidden>
                ·
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <p className="text-[10px] font-mono text-cyan-400/70 border-t border-white/5 pt-2">
          Active: {def.abilitySummary}
        </p>
      </Panel>
    </motion.button>
  );
}

export interface CompanionSelectScreenProps {
  onConfirm: (companionId: CompanionId) => void;
  onBack: () => void;
}

export function CompanionSelectScreen({ onConfirm, onBack }: CompanionSelectScreenProps) {
  const pendingNew = useMemo(
    () => new Set(getMetaProgress().pendingNewCompanions),
    [],
  );

  useEffect(() => {
    clearNewUnlockBadges({ companions: true });
  }, []);

  const unlockedSet = useMemo(() => new Set(getMetaUnlockedCompanions()), []);
  const [selected, setSelected] = useState<CompanionId>(() => {
    const saved = getSelectedCompanion();
    return unlockedSet.has(saved) ? saved : unlockedSet.values().next().value ?? 'guardian';
  });

  const selectedDef = getCompanionDef(selected);

  const handleSelect = (id: CompanionId) => {
    if (!isCompanionUnlocked(id)) return;
    setSelected(id);
    setSelectedCompanion(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[600] flex flex-col overflow-hidden pointer-events-auto"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 65%), #020617',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <SpaceBackground />
      <div className="relative z-10 flex flex-col flex-1 max-w-7xl mx-auto w-full min-h-0 p-4 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-4 shrink-0 mb-4">
          <div>
            <h1
              className="font-display font-bold tracking-[0.15em] text-white uppercase"
              style={{
                fontSize: 'clamp(1.35rem, 4vw, 2rem)',
                textShadow: '0 0 32px rgba(192,132,252,0.35)',
              }}
            >
              Companion Drone
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-400/60 mt-1">
              Deploy support unit for this run
            </p>
          </div>
          <GhostButton onClick={onBack} className="!w-auto min-h-touch px-6 shrink-0">
            Back
          </GhostButton>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1 min-h-0 overflow-y-auto pb-4">
          {COMPANION_IDS.map((id) => {
            const def = getCompanionDef(id);
            if (!def) return null;
            const progress = getCompanionProgress(id);
            return (
              <CompanionCard
                key={id}
                def={def}
                selected={selected === id}
                unlocked={unlockedSet.has(id)}
                isNew={pendingNew.has(id)}
                unlockHint={getCompanionUnlockHint(id)}
                level={progress.level}
                xp={progress.xp}
                levelProgress={getCompanionLevelProgress(id)}
                xpToNext={getXpToNextLevel(id)}
                onSelect={handleSelect}
              />
            );
          })}
        </div>

        <footer className="shrink-0 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-white/10">
          {selectedDef && (
            <p className="text-xs text-slate-400 font-mono">
              Selected:{' '}
              <span className="text-white font-semibold">{selectedDef.name}</span>
              {' · '}
              Lv {getCompanionProgress(selected).level}
            </p>
          )}
          <PrimaryButton
            className="!w-auto min-w-[200px] px-8 sm:ml-auto"
            onClick={() => onConfirm(selected)}
          >
            Launch with drone
          </PrimaryButton>
        </footer>
      </div>
    </motion.div>
  );
}

export default CompanionSelectScreen;
