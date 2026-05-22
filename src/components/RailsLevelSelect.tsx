import React from 'react';
import { motion } from 'motion/react';
import { GameIconFromKey } from './icons';
import { RailsLevel } from '../game/onRails/types';

interface RailsLevelSelectProps {
  levels: RailsLevel[];
  highScores: Record<string, number>;
  onSelectLevel: (levelId: string) => void;
  onBack: () => void;
}

function LevelIcon({ icon, accent }: { icon: RailsLevel['ui']['icon']; accent: string }) {
  const color =
    icon === 'asteroid' ? '#fdba74' : icon === 'void' ? '#ddd6fe' : accent;
  return <GameIconFromKey iconKey={icon} size={28} color={color} glow />;
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
      style={{
        background:
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(167,139,250,0.12) 0%, transparent 60%), var(--ui-bg-deepest, #0f172a)',
      }}
    >
      <h1
        className="font-display font-bold text-white uppercase tracking-[0.05em] mb-8"
        style={{ fontSize: '2rem', textShadow: 'var(--ui-text-neon)' }}
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
              className="ui-menu-card w-full text-left rounded-2xl p-5 pointer-events-auto hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${level.ui.gradientFrom} 0%, ${level.ui.gradientTo} 100%)`,
              }}
            >
              <div className="flex items-start gap-4">
                <LevelIcon icon={level.ui.icon} accent={level.ui.accentText} />
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
