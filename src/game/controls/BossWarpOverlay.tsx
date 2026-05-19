import React from 'react';
import { motion } from 'motion/react';
import { BOSS_DEFINITIONS } from '../content/bosses';
import { BOSS_WARP_DURATION, getBossWarpProgress } from '../content/bossArenas';

interface BossWarpOverlayProps {
  bossId: string | null;
  bossArenaTransition: number;
}

export const BossWarpOverlay: React.FC<BossWarpOverlayProps> = ({
  bossId,
  bossArenaTransition,
}) => {
  if (bossArenaTransition <= 0) return null;

  const progress = bossArenaTransition > 0 ? 1 - bossArenaTransition / BOSS_WARP_DURATION : 1;
  const boss = BOSS_DEFINITIONS.find((b) => b.id === bossId);
  const showName = progress > 0.42 && boss;
  const tunnel = Math.sin(progress * Math.PI);

  return (
    <div className="absolute inset-0 z-[85] pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent ${30 - tunnel * 25}%, rgba(2, 6, 23, ${0.55 + tunnel * 0.4}) 100%)`,
        }}
      />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2 + progress * 4;
        const len = 40 + tunnel * 120;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-0.5 origin-left bg-white/30"
            style={{
              width: len,
              transform: `rotate(${angle}rad) translateX(${20 + progress * 80}px)`,
              opacity: tunnel * 0.7,
            }}
          />
        );
      })}
      {showName && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center px-6"
        >
          <motion.div className="text-center px-6 py-5 rounded-2xl bg-black/75 border border-cyan-500/40 backdrop-blur-md max-w-md">
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-cyan-400/90 mb-2">
              {progress < 0.55 ? 'Warp jump' : 'Boss arena'}
            </p>
            <p className="text-2xl md:text-4xl font-display font-black text-white uppercase italic">
              {boss.name}
            </p>
            <p className="text-xs text-white/50 mt-2 font-mono">{boss.tagline}</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
