import React from 'react';
import { motion } from 'motion/react';
import { Circle, Hexagon, Sparkles } from 'lucide-react';
import { RailsLevel } from '../game/onRails/types';

interface RailsLevelSelectProps {
  levels: RailsLevel[];
  highScores: Record<string, number>;
  onSelectLevel: (levelId: string) => void;
  onBack: () => void;
}

function LevelIcon({ icon }: { icon: RailsLevel['ui']['icon'] }) {
  const size = 28;
  if (icon === 'asteroid') return <Hexagon size={size} className="text-orange-300" />;
  if (icon === 'void') return <Sparkles size={size} className="text-violet-200" />;
  return <Circle size={size} className="text-cyan-300" />;
}

export const RailsLevelSelect: React.FC<RailsLevelSelectProps> = ({
  levels,
  highScores,
  onSelectLevel,
  onBack,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-6 overflow-y-auto"
      style={{ background: '#282c34' }}
    >
      <h1
        className="font-display font-bold text-white uppercase tracking-[0.15em] mb-8"
        style={{ fontSize: '2rem' }}
      >
        Select Level
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-md">
        {levels.map((level, i) => {
          const best = highScores[level.id] ?? 0;
          return (
            <motion.button
              key={level.id}
              type="button"
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2, duration: 0.45 }}
              onClick={() => onSelectLevel(level.id)}
              className="w-full text-left rounded-2xl p-5 pointer-events-auto border border-white/10 hover:border-white/25 transition-colors"
              style={{
                background: `linear-gradient(135deg, ${level.ui.gradientFrom} 0%, ${level.ui.gradientTo} 100%)`,
              }}
            >
              <div className="flex items-start gap-4">
                <LevelIcon icon={level.ui.icon} />
                <div className="min-w-0 flex-1">
                  <p
                    className="font-display font-bold text-lg"
                    style={{ color: level.ui.accentText }}
                  >
                    {level.name}
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    {level.ui.difficulty} · {level.targetSeconds}s
                  </p>
                  <p className="text-white/60 text-xs mt-2 font-mono">
                    Best: {best > 0 ? best.toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-10 text-white/60 hover:text-white text-sm font-semibold uppercase tracking-widest pointer-events-auto"
      >
        Back to Menu
      </button>
    </motion.div>
  );
};
