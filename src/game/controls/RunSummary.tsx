import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { SpaceBackground } from '../../components/ui/SpaceBackground';
import { TacticalFrame } from '../../components/ui/TacticalFrame';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { GameState } from '../types';
import { ARTIFACTS } from '../content/artifacts';
import { getBuildName, getTopPassives } from '../meta/buildName';
import { getNextUnlockGoal } from '../meta/artifactGoals';
import type { RunUnlocksSnapshot } from '../meta/metaProgress';
import { getCompanionDisplayName } from '../meta/unlockHints';
import { formatSurvivalTime } from '../meta/survivalStats';
import { getSurvivalDifficultyLabelSv } from '../balance/miniBossDifficulty';
import { getTotalMiniBossKills } from '../meta/survivalStats';

interface RunSummaryProps {
  state: GameState;
  unlockedCount: number;
  totalArtifacts: number;
  lockedIds: string[];
  scrapEarned: number;
  metaScrapTotal: number;
  runUnlocks?: RunUnlocksSnapshot;
  newHighScoreThisRun?: boolean;
  newLongestThisRun?: boolean;
  personalBestScore?: number;
  personalBestTime?: number;
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
  runUnlocks,
  newHighScoreThisRun = false,
  newLongestThisRun = false,
  personalBestScore = 0,
  personalBestTime = 0,
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
  const newArtifacts =
    runUnlocks?.artifacts.map((id) => ARTIFACTS[id]?.name).filter(Boolean) ?? [];
  const newCompanions =
    runUnlocks?.companions.map((id) => getCompanionDisplayName(id)) ?? [];
  const hasNewUnlocks = newArtifacts.length > 0 || newCompanions.length > 0;
  const miniBossKills = state.miniBossKillsThisRun ?? 0;
  const careerMiniBossKills = getTotalMiniBossKills();
  const showSurvivalExtras = state.gameMode === 'NORMAL';

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
      <SpaceBackground scanlines />
      <div className="absolute inset-0 nebula-layer nebula-layer-animate pointer-events-none opacity-60" />

      <div className="relative z-10 flex flex-col items-center w-full">
      <p className="hud-micro-label mb-2">{victory ? 'Mission Complete' : 'Hull Breach'}</p>
      <h2
        className="title-hero text-center mb-2"
        style={{
          fontSize: 'clamp(2rem, 8vw, 3.5rem)',
          textShadow: victory
            ? '0 0 48px rgba(0,229,255,0.55), 0 0 90px rgba(0,229,255,0.2)'
            : '0 0 48px rgba(255,45,155,0.5), 0 0 90px rgba(192,38,211,0.2)',
        }}
      >
        {victory ? 'SECTOR CLEARED' : 'SIGNAL LOST'}
      </h2>
      <p className="font-mono text-[11px] uppercase tracking-[0.38em] text-cyan-400/65 mb-6">{buildName}</p>

      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <TacticalFrame size="lg" glow gold={victory} className="w-full max-w-md p-6 mb-8 space-y-4">
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
          {showSurvivalExtras && (
            <>
              <div className="bg-violet-500/10 border border-violet-500/25 p-3 rounded-xl">
                <p className="text-white/40 text-[10px] uppercase font-bold">Minibossar</p>
                <p className="text-violet-300 font-black">{miniBossKills}</p>
                {careerMiniBossKills > miniBossKills && (
                  <p className="text-violet-400/60 text-[10px] font-mono mt-0.5">
                    Totalt: {careerMiniBossKills}
                  </p>
                )}
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/25 p-3 rounded-xl">
                <p className="text-white/40 text-[10px] uppercase font-bold">Svårighet</p>
                <p className="text-cyan-300 font-black">{getSurvivalDifficultyLabelSv()}</p>
              </div>
            </>
          )}
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

        {hasNewUnlocks && (
          <motion.div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-amber-300 text-[10px] uppercase font-black tracking-widest mb-2 flex items-center gap-1">
              <Sparkles size={12} /> New unlocks this run
            </p>
            <ul className="text-xs text-amber-100/90 space-y-0.5">
              {newArtifacts.map((name) => (
                <li key={name}>Relic: {name}</li>
              ))}
              {newCompanions.map((name) => (
                <li key={name}>Companion: {name}</li>
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

        {(newHighScoreThisRun || newLongestThisRun) && (
          <motion.div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-center">
            <p className="text-cyan-300 text-[10px] uppercase font-black tracking-widest mb-1 flex items-center justify-center gap-1">
              <Trophy size={12} /> Personal best
            </p>
            {newHighScoreThisRun && (
              <p className="text-sm text-white font-bold">
                Score: {personalBestScore.toLocaleString()} pts
              </p>
            )}
            {newLongestThisRun && (
              <p className="text-sm text-white font-bold mt-0.5">
                Time: {formatSurvivalTime(personalBestTime)}
              </p>
            )}
          </motion.div>
        )}

        <motion.div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl col-span-2 text-center">
            <p className="text-amber-300 text-2xl font-black">+{scrapEarned}</p>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">scrap this run</p>
            <p className="text-white/50 text-xs mt-1">Total in hangar: {metaScrapTotal}</p>
            {state.shopScrapSpent > 0 && (
              <p className="text-white/40 text-xs mt-1">
                Shop spend this launch: −{state.shopScrapSpent}
              </p>
            )}
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
      </TacticalFrame>
      </motion.div>

      <motion.div className="flex flex-col gap-3 w-full max-w-sm px-4">
        <PrimaryButton variant="accent" onClick={onRestart} className="!w-full">
          <RotateCcw size={16} />
          New Run
        </PrimaryButton>
        <PrimaryButton variant="primary" onClick={onVault} className="!w-full">
          <Sparkles size={14} />
          View in Vault
        </PrimaryButton>
      </motion.div>
      </div>
    </motion.div>
  );
};
