import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';

export type RailsMedal = 'bronze' | 'silver' | 'gold';

const MEDAL_COLORS: Record<RailsMedal, string> = {
  bronze: '#795548',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

interface RailsVictoryScreenProps {
  title: string;
  time: number;
  kills: number;
  score: number;
  medal: RailsMedal;
  onNextLevel: () => void;
  onLevelSelect: () => void;
  hasNextLevel: boolean;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const RailsVictoryScreen: React.FC<RailsVictoryScreenProps> = ({
  title,
  time,
  kills,
  score,
  medal,
  onNextLevel,
  onLevelSelect,
  hasNextLevel,
}) => {
  const medalColor = MEDAL_COLORS[medal];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[110] flex flex-col items-center justify-center p-6"
      style={{ background: '#282c34' }}
    >
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        className="mb-6"
      >
        <Trophy size={72} strokeWidth={1.5} style={{ color: medalColor }} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="font-display font-bold text-white text-center mb-8 uppercase tracking-wide"
        style={{ fontSize: '2rem' }}
      >
        {title}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.15, duration: 0.45 }}
        className="text-white text-center space-y-2 mb-8 font-mono"
        style={{ fontSize: '1rem' }}
      >
        <p>Time: {formatTime(time)}</p>
        <p>Kills: {kills}</p>
        <p>Score: {score.toLocaleString()}</p>
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.35, type: 'spring', stiffness: 200 }}
        className="mb-10 px-6 py-3 rounded-full font-bold uppercase tracking-widest text-sm"
        style={{ background: medalColor, color: '#282c34' }}
      >
        {medal} medal
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        {hasNextLevel && (
          <button
            type="button"
            onClick={onNextLevel}
            className="w-full py-4 rounded-xl font-display font-bold uppercase tracking-wider text-white transition-colors pointer-events-auto"
            style={{
              background: '#0891b2',
              boxShadow: '0 0 24px rgba(6, 182, 212, 0.35)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#06b6d4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0891b2';
            }}
          >
            Next Level
          </button>
        )}
        <button
          type="button"
          onClick={onLevelSelect}
          className="w-full py-3 rounded-xl font-semibold uppercase tracking-wider text-cyan-300 border border-cyan-500/40 pointer-events-auto hover:bg-cyan-500/10 transition-colors"
        >
          Level Select
        </button>
      </motion.div>
    </motion.div>
  );
};
