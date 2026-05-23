import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { GameIcon, GameIconFromKey } from '../../components/icons';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { TacticalFrame } from '../../components/ui/TacticalFrame';
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
  onOpenOptions: () => void;
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
    const COUNT = 300;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      stars.push({ x: Math.random() * 2000 - 1000, y: Math.random() * 2000 - 1000, z: Math.random() * 800, pz: 0, twinkle: Math.random() });
    }

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = 'rgba(1,2,8,0.2)';
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
        const size = Math.max(0.35, (1 - s.z / W) * 2.5);
        const bright = Math.min(1, (1 - s.z / W) * 1.5);
        const flicker = 0.65 + 0.35 * Math.sin(t * 3.2 + s.twinkle * 22);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(${130 + Math.floor(bright * 70)},${210 + Math.floor(bright * 35)},${255},${bright * flicker * 0.92})`;
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

const CLIP_DIFF = 'polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)';

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="hud-micro-label">{label}</p>
      <p className="font-display font-bold text-sm tabular-nums text-[#f0f8ff]">{value}</p>
    </div>
  );
}

export const StartPage: React.FC<StartPageProps> = ({
  onStartSurvival,
  onOpenHangar,
  onOpenOptions,
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

  const hasStats = bestScore > 0 || longest > 0 || totalMiniBossKills > 0;

  return (
    <div
      className="absolute inset-0 z-[500] overflow-y-auto flex flex-col items-center justify-start bg-[var(--bg-void)]"
      style={{
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <div className="absolute inset-0">
        <StarField />
      </div>
      <div className="absolute inset-0 nebula-layer nebula-layer-animate pointer-events-none opacity-95" />
      <div className="scanline-overlay opacity-25" aria-hidden />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {hasStats && (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20"
        >
          <TacticalFrame size="sm" glow className="px-3.5 py-2.5 text-right min-w-[120px]">
            {bestScore > 0 && <StatRow label="Best Score" value={bestScore.toLocaleString()} />}
            {longest > 0 && <StatRow label="Longest Run" value={formatSurvivalTime(longest)} />}
            {totalMiniBossKills > 0 && <StatRow label="Mini Bosses" value={String(totalMiniBossKills)} />}
          </TacticalFrame>
        </motion.div>
      )}

      <div className="absolute bottom-4 left-4 z-20 font-mono uppercase text-[8px] tracking-[0.28em] text-white/20">
        SYS·v{APP_VERSION}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-xs px-1 my-auto py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center mb-5 sm:mb-8"
        >
          <div className="badge-tactical mb-5 mx-auto">
            <span className="data-blink text-[#00e5ff]" aria-hidden>
              ◆
            </span>
            Neural Combat System
          </div>

          <h1 className="title-hero logo-pulse text-glitch text-center" style={{ fontSize: 'clamp(2rem, 11vw, 5.2rem)' }}>
            SPACE
            <br />
            <span style={{ color: 'var(--color-gold)' }}>HERO</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-5 font-mono uppercase text-center text-[10px] tracking-[0.38em] text-cyan-400/60"
          >
            Survival is the only victory
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
          className="w-full mb-4"
        >
          <p className="mb-2 text-center hud-micro-label">Svårighet</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(['easy', 'normal', 'hard'] as SurvivalDifficulty[]).map((d) => {
              const active = difficulty === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => selectDifficulty(d)}
                  className="min-h-touch font-mono font-bold uppercase text-[10px] tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
                  style={{
                    clipPath: CLIP_DIFF,
                    background: active ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(0,229,255,0.65)' : 'rgba(255,255,255,0.1)'}`,
                    color: active ? '#00e5ff' : 'rgba(255,255,255,0.45)',
                    boxShadow: active ? '0 0 20px rgba(0,229,255,0.25), inset 0 0 12px rgba(0,229,255,0.08)' : 'none',
                  }}
                >
                  {SURVIVAL_DIFFICULTY_LABELS[d]}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center font-mono text-[9px] leading-snug text-white/30">
            {difficulty === 'easy' && 'Färre minibossar · lägre HP'}
            {difficulty === 'normal' && 'Design-standard'}
            {difficulty === 'hard' && 'Miniboss nästan varje våg'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-full mb-2"
        >
          <PrimaryButton onClick={onStartSurvival} variant="accent">
            <GameIcon name="ui.play" size={15} color="currentColor" />
            Start Survival
          </PrimaryButton>
        </motion.div>

        <div className="w-full flex flex-col gap-1.5 mt-1">
          {[
            { delay: 0.34, onClick: onOpenOptions, icon: <GameIconFromKey iconKey="Settings" size={13} color="#a78bfa" />, label: 'Options', accent: 'default' as const },
            { delay: 0.36, onClick: onOpenHangar, icon: <GameIcon name="ui.wrench" size={13} color="#7df9ff" />, label: 'Hangar', accent: 'default' as const },
            onOpenUnlocks
              ? {
                  delay: 0.4,
                  onClick: onOpenUnlocks,
                  icon: <GameIcon name="ui.sparkles" size={13} color="#e8b84a" />,
                  label: 'Unlocks',
                  accent: 'gold' as const,
                  badge: hasPendingUnlocks,
                }
              : null,
            { delay: 0.44, onClick: onOnRails, icon: <GameIconFromKey iconKey="MoveHorizontal" size={13} color="#ffaa00" />, label: 'On Rails', accent: 'amber' as const },
            { delay: 0.48, onClick: onCampaign, icon: <GameIcon name="ui.map" size={13} color="#7df9ff" />, label: 'Campaign', accent: 'default' as const },
          ]
            .filter(Boolean)
            .map((item) => {
              const it = item as {
                delay: number;
                onClick: () => void;
                icon: React.ReactNode;
                label: string;
                accent: 'default' | 'amber' | 'gold';
                badge?: boolean;
              };
              return (
                <motion.div
                  key={it.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: it.delay, duration: 0.35 }}
                  className="relative"
                >
                  <SecondaryButton onClick={it.onClick} accent={it.accent}>
                    {it.icon}
                    {it.label}
                    <ChevronRight size={12} className="ml-auto opacity-40" />
                  </SecondaryButton>
                  {it.badge && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                      style={{ background: '#e8b84a', boxShadow: '0 0 10px rgba(232,184,74,0.9)' }}
                      aria-label="New unlocks"
                    />
                  )}
                </motion.div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
