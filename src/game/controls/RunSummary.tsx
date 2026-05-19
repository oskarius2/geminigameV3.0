import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Sparkles } from 'lucide-react';
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
      className={`absolute inset-0 z-[100] ${victory ? 'bg-gradient-to-br from-[#020617] via-[#1e1b4b] to-[#020617]' : 'bg-gradient-to-br from-[#020617] via-[#4c0519] to-[#020617]'} backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-y-auto`}
    >
      <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        {victory ? 'SECTOR CLEARED' : 'SIGNAL LOST'}
      </h2>
      <p className="text-cyan-400/80 font-mono text-xs uppercase tracking-widest mb-6">{buildName}</p>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-slate-950/60 border border-slate-700 rounded-lg p-6 mb-8 space-y-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
      >
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

      <motion.div className="flex flex-col gap-4 w-full max-w-sm px-4">
        <button
          type="button"
          onClick={onRestart}
          className="group relative min-h-16 bg-cyan-900/60 hover:bg-cyan-800/80 border border-cyan-500 hover:border-cyan-400 text-cyan-50 font-black py-5 rounded flex items-center justify-center gap-3 pointer-events-auto shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-[1.02] active:scale-95"
        >
          <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity rounded" />
          <RotateCcw size={24} className="text-cyan-400" /> INITIALIZE NEW RUN
        </button>
        <button
          type="button"
          onClick={onVault}
          className="group relative min-h-16 bg-fuchsia-900/40 hover:bg-fuchsia-800/60 border border-fuchsia-500/50 hover:border-fuchsia-400 text-fuchsia-100 font-bold py-5 rounded flex items-center justify-center gap-2 pointer-events-auto transition-all active:scale-95 hover:shadow-[0_0_15px_rgba(217,70,239,0.4)]"
        >
          <div className="absolute inset-0 bg-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
          <Sparkles size={20} className="text-fuchsia-400" /> RELIC VAULT
        </button>
      </motion.div>
    </motion.div>
  );
};
