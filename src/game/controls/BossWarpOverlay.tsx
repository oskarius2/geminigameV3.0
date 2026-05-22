import React from 'react';
import { BossVisuals } from '../../components/BossVisuals';
import { getBossIntroLine, getBossSpec, getBossTauntLine } from '../bosses/bossSpecs';
import { BOSS_DEFINITIONS } from '../content/bosses';
import { BOSS_WARP_DURATION } from '../content/bossArenas';

interface BossWarpOverlayProps {
  bossId: string | null;
  bossArenaTransition: number;
}

export const BossWarpOverlay: React.FC<BossWarpOverlayProps> = ({
  bossId,
  bossArenaTransition,
}) => {
  if (bossArenaTransition <= 0) return null;

  const progress =
    bossArenaTransition > 0 ? 1 - bossArenaTransition / BOSS_WARP_DURATION : 1;
  const boss = BOSS_DEFINITIONS.find((b) => b.id === bossId);
  const tunnel = Math.sin(progress * Math.PI);

  // Seconds left (bossArenaTransition is in seconds after App loop fix)
  const secondsLeft = Math.ceil(bossArenaTransition);
  const countdownString =
    secondsLeft >= 1 && secondsLeft <= 3 ? String(secondsLeft) : '';

  const spec = getBossSpec(bossId);
  const introLine = getBossIntroLine(bossId) ?? boss?.tagline;
  const tauntLine = getBossTauntLine(bossId);
  const showBossCard = progress > 0.42 && boss;
  const showTaunt = progress > 0.58 && progress < 0.72 && tauntLine;
  const showEntering = progress >= 0.7;
  const showCountdown = countdownString.length > 0 && showEntering;

  return (
    <div className="absolute inset-0 z-[85] pointer-events-none overflow-hidden">
      <div
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
      {showBossCard && (
        <div
          className="absolute inset-0 flex items-center justify-center px-6"
          style={{ opacity: progress > 0.42 ? 1 : 0 }}
        >
          <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-black/75 border border-cyan-500/40 backdrop-blur-md max-w-md">
            <BossVisuals
              visualId={spec?.visualId ?? boss.id}
              attackPattern={spec?.attackPattern}
              size={96}
            />
            <div className="text-center">
              <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-cyan-400/90 mb-2">
                {progress < 0.55 ? 'Warp jump' : 'Boss arena'}
              </p>
              <p className="text-2xl md:text-4xl font-display font-black text-white uppercase italic">
                {boss.name}
              </p>
              <p className="text-xs text-white/50 mt-2 font-mono">{introLine}</p>
              {showTaunt && (
                <p className="text-[11px] text-amber-300/80 mt-3 font-mono italic">{tauntLine}</p>
              )}
            </div>
          </div>
        </div>
      )}
      {showEntering && (
        <p
          className="absolute inset-0 flex items-center justify-center text-4xl md:text-6xl font-display font-black text-white uppercase tracking-wide text-center px-4"
          style={{ opacity: showCountdown ? 0.35 : 1 }}
        >
          ENTERING BOSS ARENA
        </p>
      )}
      {showCountdown && (
        <p className="absolute inset-0 flex items-center justify-center text-7xl md:text-9xl font-display font-black text-cyan-300 tabular-nums">
          {countdownString}
        </p>
      )}
    </div>
  );
};
