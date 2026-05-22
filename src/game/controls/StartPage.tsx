import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Map, MoveHorizontal, Wrench, Sparkles } from 'lucide-react';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { GhostButton } from '../../components/ui/GhostButton';
import { APP_VERSION } from '../design/uiTokens';
import {
  getSurvivalHighScore,
  getLongestSurvivalSeconds,
  getTotalMiniBossKills,
  formatSurvivalTime,
} from '../meta/survivalStats';
import {
  getSurvivalDifficulty,
  setSurvivalDifficulty,
  SURVIVAL_DIFFICULTY_LABELS,
  type SurvivalDifficulty,
} from '../balance/miniBossDifficulty';

interface StartPageProps {
  onStartSurvival: () => void;
  onOpenHangar: () => void;
  onOpenUnlocks?: () => void;
  hasPendingUnlocks?: boolean;
  onOnRails: () => void;
  onCampaign: () => void;
}

function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; z: number; pz: number; twinkle: number }[] = [];
    const COUNT = 220;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width - canvas.width / 2,
        y: Math.random() * canvas.height - canvas.height / 2,
        z: Math.random() * canvas.width,
        pz: 0,
        twinkle: Math.random(),
      });
    }

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = 'rgba(2,6,23,0.25)';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const t = Date.now() * 0.001;

      for (const s of stars) {
        s.pz = s.z;
        s.z -= 1.4;
        if (s.z <= 0) {
          s.x = Math.random() * W - cx;
          s.y = Math.random() * H - cy;
          s.z = W;
          s.pz = s.z;
        }
        const sx = (s.x / s.z) * W + cx;
        const sy = (s.y / s.z) * H + cy;
        const px = (s.x / s.pz) * W + cx;
        const py = (s.y / s.pz) * H + cy;
        const size = Math.max(0.3, (1 - s.z / W) * 2.2);
        const bright = Math.min(1, (1 - s.z / W) * 1.4);
        const flicker = 0.7 + 0.3 * Math.sin(t * 3 + s.twinkle * 20);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(${148 + Math.floor(bright * 60)},${220 + Math.floor(bright * 35)},${255},${bright * flicker * 0.85})`;
        ctx.lineWidth = size;
        ctx.stroke();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export const StartPage: React.FC<StartPageProps> = ({
  onStartSurvival,
  onOpenHangar,
  onOpenUnlocks,
  hasPendingUnlocks = false,
  onOnRails,
  onCampaign,
}) => {
  const bestScore = getSurvivalHighScore();
  const longest = getLongestSurvivalSeconds();
  const totalMiniBossKills = getTotalMiniBossKills();
  const [difficulty, setDifficulty] = useState<SurvivalDifficulty>(() => getSurvivalDifficulty());

  const selectDifficulty = (value: SurvivalDifficulty) => {
    setDifficulty(value);
    setSurvivalDifficulty(value);
  };

  return (
    <div
      className="absolute inset-0 z-[500] overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.06) 0%, transparent 70%), #020617',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <div className="absolute inset-0">
        <StarField />
      </div>
      <div className="absolute inset-0 nebula-layer nebula-layer-animate pointer-events-none opacity-80" />

      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20 text-right font-mono text-sm text-[var(--hud-accent)]">
        <p>
          <span className="text-white/40 uppercase text-[10px] tracking-widest mr-2">Best</span>
          {bestScore.toLocaleString()} pts
        </p>
        <p className="mt-1">
          <span className="text-white/40 uppercase text-[10px] tracking-widest mr-2">Longest</span>
          {formatSurvivalTime(longest)}
        </p>
        {totalMiniBossKills > 0 && (
          <p className="mt-1">
            <span className="text-white/40 uppercase text-[10px] tracking-widest mr-2">MB</span>
            {totalMiniBossKills}
          </p>
        )}
      </div>

      <div className="absolute bottom-4 left-4 z-20 font-mono text-[8px] text-white/25 uppercase tracking-widest">
        v{APP_VERSION}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-8">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="logo-pulse font-display font-bold uppercase tracking-[0.2em] text-white text-center"
          style={{
            fontSize: 'clamp(2.5rem, 10vw, 4.5rem)',
            textShadow: '0 0 40px rgba(0,212,255,0.5), 0 0 80px rgba(0,212,255,0.2)',
          }}
        >
          SPACEHERO
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-4 text-center font-mono text-sm uppercase tracking-[0.35em] text-[var(--hud-accent)]/80"
        >
          Survival is the only victory
        </motion.p>

        <div className="mt-8 sm:mt-16 flex flex-col gap-4 w-full max-w-[200px] sm:max-w-[220px]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="w-full"
          >
            <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-widest text-white/45">
              Svårighet
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(['easy', 'normal', 'hard'] as SurvivalDifficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => selectDifficulty(d)}
                  className={`min-h-touch rounded border px-1 py-2 font-mono text-[11px] uppercase tracking-wide transition-colors ${
                    difficulty === d
                      ? 'border-[var(--hud-accent)] bg-[var(--hud-accent)]/15 text-[var(--hud-accent)]'
                      : 'border-white/15 bg-black/30 text-white/55 hover:border-white/30'
                  }`}
                >
                  {SURVIVAL_DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-center font-mono text-[9px] leading-snug text-white/35">
              {difficulty === 'easy' && 'Färre minibossar, lägre HP'}
              {difficulty === 'normal' && 'Design-standard'}
              {difficulty === 'hard' && 'Miniboss nästan varje våg'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <PrimaryButton
              onClick={onStartSurvival}
              className="!w-full border-2 border-[var(--hud-accent)]/60 shadow-[0_0_32px_rgba(0,212,255,0.35)]"
            >
              <span className="flex items-center justify-center gap-2">
                <Play size={16} fill="currentColor" />
                Start Survival
              </span>
            </PrimaryButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <GhostButton onClick={onOpenHangar} className="!w-full min-h-touch border-white/20">
              <span className="flex items-center justify-center gap-2">
                <Wrench size={14} />
                Hangar
              </span>
            </GhostButton>
          </motion.div>

          {onOpenUnlocks && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <GhostButton
                onClick={onOpenUnlocks}
                className="!w-full min-h-touch border-amber-500/25 text-amber-100/90 relative"
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={14} />
                  Unlocks
                </span>
                {hasPendingUnlocks && (
                  <span
                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                    aria-label="New unlocks"
                  />
                )}
              </GhostButton>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <GhostButton onClick={onOnRails} className="!w-full min-h-touch border-amber-500/30 text-amber-200/90">
              <span className="flex items-center justify-center gap-2">
                <MoveHorizontal size={14} />
                On Rails
              </span>
            </GhostButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            <GhostButton onClick={onCampaign} className="!w-full min-h-touch">
              <span className="flex items-center justify-center gap-2">
                <Map size={14} />
                Campaign
              </span>
            </GhostButton>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
