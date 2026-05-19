import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { SpaceBackground, HudCorner } from '../../components/ui/SpaceBackground';
import { GameState } from '../types';
import { ARTIFACTS } from '../content/artifacts';
import { getBuildName, getTopPassives } from '../meta/buildName';
import { getNextUnlockGoal } from '../meta/artifactGoals';

interface RunSummaryProps {
  state: GameState;
  unlockedCount: number;
  totalArtifacts: number;
  lockedIds: string[];
  scrapEarned: number;
  metaScrapTotal: number;
  onRestart: () => void;
  onVault: () => void;
  victory?: boolean;
}

export const RunSummary: React.FC<RunSummaryProps> = ({
  state,
  unlockedCount,
  totalArtifacts,
  lockedIds,
  scrapEarned,
  metaScrapTotal,
  onRestart,
  onVault,
  victory = false,
}) => {
  const buildName = getBuildName(state);
  const topBuffs = getTopPassives(state);
  const runArts = state.runArtifactsUnlockedThisRun
    .map((id) => ARTIFACTS[id]?.name)
    .filter(Boolean);
  const goal = getNextUnlockGoal(lockedIds);
  const mins = Math.floor(state.survivalTime / 60);
  const secs = String(Math.floor(state.survivalTime % 60)).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] overflow-hidden flex flex-col items-center justify-center p-6 overflow-y-auto"
      style={{
        background: victory
          ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(6,182,212,0.1) 0%, transparent 70%), #020617'
          : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(217,70,239,0.08) 0%, transparent 70%), #020617',
      }}
    >
      <SpaceBackground />

      <div className="relative z-10 flex flex-col items-center w-full">
      <h2
        className="font-display font-bold tracking-[0.1em] text-white uppercase mb-2 text-center"
        style={{
          fontSize: 'clamp(2rem, 8vw, 4rem)',
          textShadow: victory
            ? '0 0 40px rgba(6,182,212,0.6), 0 0 80px rgba(6,182,212,0.2)'
            : '0 0 40px rgba(217,70,239,0.6), 0 0 80px rgba(217,70,239,0.2)',
        }}
      >
        {victory ? 'SECTOR CLEARED' : 'SIGNAL LOST'}
      </h2>
      <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-cyan-400/70 mb-6">{buildName}</p>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md rounded-xl p-6 mb-8 space-y-4"
        style={{
          background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(6,182,212,0.15)',
          boxShadow: 'inset 0 0 20px rgba(6,182,212,0.04), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <HudCorner position="tl" />
        <HudCorner position="tr" />
        <HudCorner position="bl" />
        <HudCorner position="br" />
        <div className="text-center">
          <p className="text-4xl font-black text-white">{state.score.toLocaleString()}</p>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Score</p>
        </div>

        <motion.div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-white/5 p-3 rounded-xl">
            <p className="text-white/40 text-[10px] uppercase font-bold">Time</p>
            <p className="text-white font-mono font-bold">{mins}:{secs}</p>
          </div>
          <motion.div className="bg-white/5 p-3 rounded-xl">
            <p className="text-white/40 text-[10px] uppercase font-bold">Sector</p>
            <p className="text-amber-400 font-black">{state.stage}</p>
          </motion.div>
          <motion.div className="bg-white/5 p-3 rounded-xl">
            <p className="text-white/40 text-[10px] uppercase font-bold">Wave</p>
            <p className="text-white font-black">{state.wave}</p>
          </motion.div>
          <motion.div className="bg-white/5 p-3 rounded-xl">
            <p className="text-white/40 text-[10px] uppercase font-bold">Peak Heat</p>
            <p className="text-rose-400 font-black">{state.threatPeak}%</p>
          </motion.div>
        </motion.div>

        {topBuffs.length > 0 && (
          <motion.div>
            <p className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-2">Top Augments</p>
            <ul className="space-y-1">
              {topBuffs.map((b) => (
                <li key={b.id} className="text-xs text-white/80 flex justify-between">
                  <span>{b.name}</span>
                  {b.stacks > 1 && <span className="text-cyan-400 font-mono">×{b.stacks}</span>}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {runArts.length > 0 && (
          <motion.div>
            <p className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-2 flex items-center gap-1">
              <Sparkles size={12} className="text-fuchsia-400" /> Relics this run
            </p>
            <ul className="text-xs text-fuchsia-200/90 space-y-0.5">
              {runArts.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl col-span-2 text-center">
            <p className="text-amber-300 text-2xl font-black">+{scrapEarned}</p>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">scrap this run</p>
            <p className="text-white/50 text-xs mt-1">Total in hangar: {metaScrapTotal}</p>
          </div>
        </motion.div>

        <motion.div className="text-center pt-2 border-t border-white/10">
          <p className="text-lg font-black text-white">
            {unlockedCount} / {totalArtifacts}
          </p>
          <p className="text-white/40 text-[10px] uppercase">in collection</p>
          {goal && (
            <p className="text-cyan-400/90 text-xs mt-2 font-bold">
              {goal.label} → {goal.name}
            </p>
          )}
        </motion.div>
      </motion.div>

      <motion.div className="flex flex-col gap-3 w-full max-w-sm px-4">
        <motion.button
          type="button"
          onClick={onRestart}
          className="relative overflow-hidden min-h-[3rem] w-full rounded-xl font-display font-bold uppercase tracking-[0.2em] text-sm text-white pointer-events-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.9) 0%, rgba(14,165,233,0.8) 100%)',
            boxShadow: '0 0 32px rgba(6,182,212,0.4), 0 0 64px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
            border: '1px solid rgba(6,182,212,0.5)',
          }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 48px rgba(6,182,212,0.6), 0 0 80px rgba(6,182,212,0.2)' }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          <span className="flex items-center justify-center gap-2.5">
            <RotateCcw size={16} />
            New Run
          </span>
          <motion.span
            className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
            animate={{ left: ['-20%', '120%'] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          />
        </motion.button>
        <motion.button
          type="button"
          onClick={onVault}
          className="relative min-h-[3rem] w-full rounded-xl font-display font-semibold uppercase tracking-[0.15em] text-sm text-fuchsia-300 pointer-events-auto"
          style={{
            background: 'rgba(217,70,239,0.06)',
            border: '1px solid rgba(217,70,239,0.25)',
            backdropFilter: 'blur(12px)',
          }}
          whileHover={{
            background: 'rgba(217,70,239,0.12)',
            borderColor: 'rgba(217,70,239,0.5)',
          }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          <span className="flex items-center justify-center gap-2.5">
            <Sparkles size={14} />
            Relic Vault
          </span>
        </motion.button>
      </motion.div>
      </div>
    </motion.div>
  );
};
