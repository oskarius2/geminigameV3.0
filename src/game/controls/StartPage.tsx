import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, Swords, Shield, Zap, Wind, Map } from 'lucide-react';
import { ArtifactSlot, Artifact, Trait } from '../types';
import { ARTIFACTS } from '../Logic';

interface StartPageProps {
  onStart: () => void;
  onCampaign: () => void;
  onOpenGear: () => void;
  onOpenInventory: () => void;
  relicCount: number;
  metaScrap: number;
  equippedArtifactIds: Record<ArtifactSlot, string | null>;
  activeTraits: Trait[];
}

const SlotIcon = ({ slot, size = 14 }: { slot: ArtifactSlot; size?: number }) => {
  switch (slot) {
    case 'CANNON_A': return <Swords size={size} className="text-cyan-400" />;
    case 'CANNON_B': return <Swords size={size} className="text-cyan-400" />;
    case 'ARMOR': return <Shield size={size} className="text-sky-400" />;
    case 'MOBILITY': return <Wind size={size} className="text-teal-400" />;
    case 'ULTIMATE': return <Zap size={size} className="text-fuchsia-400" />;
    default: return <Sparkles size={size} className="text-white/60" />;
  }
};

function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; z: number; pz: number }[] = [];
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
      });
    }

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = 'rgba(2,6,23,0.25)';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;

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

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(${148 + Math.floor(bright * 60)},${220 + Math.floor(bright * 35)},${255},${bright * 0.85})`;
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

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
}

const HudCorner = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const base = 'absolute w-5 h-5 border-cyan-400/50';
  const corners = {
    tl: 'top-0 left-0 border-t-2 border-l-2',
    tr: 'top-0 right-0 border-t-2 border-r-2',
    bl: 'bottom-0 left-0 border-b-2 border-l-2',
    br: 'bottom-0 right-0 border-b-2 border-r-2',
  };
  return <span className={`${base} ${corners[position]}`} />;
};

export const StartPage: React.FC<StartPageProps> = ({
  onStart,
  onCampaign,
  onOpenGear,
  onOpenInventory,
  relicCount,
  metaScrap,
  equippedArtifactIds,
  activeTraits,
}) => {
  const equippedList = useMemo(
    () =>
      Object.entries(equippedArtifactIds)
        .filter(([_, id]) => id !== null)
        .map(([slot, id]) => ({
          slot: slot as ArtifactSlot,
          artifact: ARTIFACTS[id as string],
        })),
    [equippedArtifactIds]
  );

  return (
    <div
      className="absolute inset-0 z-[500] overflow-hidden flex flex-col"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(6,182,212,0.07) 0%, transparent 70%), #020617',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      {/* Starfield */}
      <div className="absolute inset-0">
        <StarField />
      </div>

      {/* Radial grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',
        }}
      />

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 flex flex-col">

        {/* Header bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between pt-2 pb-4"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/70">SYS ONLINE</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">v3.0</span>
        </motion.div>

        {/* Main layout */}
        <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:gap-10 py-2">

          {/* Left: Hero */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 flex flex-col items-center lg:items-start"
          >
            {/* Ship silhouette glow */}
            <div className="relative mb-6 flex items-center justify-center lg:justify-start">
              <div
                className="absolute w-48 h-48 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(217,70,239,0.08) 50%, transparent 70%)',
                  filter: 'blur(24px)',
                }}
              />
              <svg viewBox="0 0 80 80" width={72} height={72} className="relative drop-shadow-[0_0_16px_rgba(6,182,212,0.7)]">
                <polygon points="40,4 60,68 40,56 20,68" fill="none" stroke="rgba(6,182,212,0.9)" strokeWidth="1.5" />
                <polygon points="40,4 60,68 40,56 20,68" fill="rgba(6,182,212,0.08)" />
                <circle cx="40" cy="52" r="4" fill="rgba(217,70,239,0.8)" />
                <line x1="20" y1="68" x2="4" y2="56" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
                <line x1="60" y1="68" x2="76" y2="56" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
              </svg>
            </div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <span
                className="block font-display font-bold tracking-[0.15em] text-white"
                style={{
                  fontSize: 'clamp(2.8rem, 8vw, 4.5rem)',
                  textShadow: '0 0 40px rgba(6,182,212,0.5), 0 0 80px rgba(6,182,212,0.2)',
                }}
              >
                SPACEHERO
              </span>
              <span className="block font-mono text-[11px] tracking-[0.4em] text-cyan-400/60 mt-1 uppercase">
                Survival Protocol
              </span>
            </motion.h1>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex gap-6 mt-6"
            >
              <div className="flex flex-col items-center lg:items-start">
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Scrap</span>
                <span className="font-mono text-base font-bold text-amber-400 tabular-nums">{metaScrap.toLocaleString()}</span>
              </div>
              <div className="w-px bg-white/10" />
              <div className="flex flex-col items-center lg:items-start">
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Relics</span>
                <span className="font-mono text-base font-bold text-fuchsia-400 tabular-nums">{relicCount}</span>
              </div>
            </motion.div>

            {/* Loadout panel */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative mt-6 w-full lg:max-w-md p-4 rounded-xl"
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
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-400/40 mb-3">Active Loadout</p>
              {equippedList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {equippedList.map(({ slot, artifact }) => (
                    <div
                      key={slot}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: 'rgba(6,182,212,0.06)',
                        border: '1px solid rgba(6,182,212,0.12)',
                      }}
                    >
                      <SlotIcon slot={slot} size={12} />
                      <span className="text-[11px] text-white/80 font-medium">{artifact?.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-white/30 text-xs font-mono">— No loadout equipped —</span>
              )}
              {activeTraits.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/[0.06]">
                  {activeTraits.map((trait) => (
                    <span
                      key={trait.id}
                      className={`font-mono text-[9px] font-bold uppercase px-2 py-1 rounded ${
                        trait.isPositive
                          ? 'border border-emerald-500/30 text-emerald-400 bg-emerald-500/08'
                          : 'border border-rose-500/30 text-rose-400 bg-rose-500/08'
                      }`}
                    >
                      {trait.name}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Right: Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col gap-3 w-full max-w-sm lg:max-w-xs mt-10 lg:mt-0 lg:shrink-0"
          >
            {/* Primary CTA */}
            <motion.button
              type="button"
              onClick={onStart}
              className="relative overflow-hidden min-h-[3rem] w-full rounded-xl font-display font-bold uppercase tracking-[0.2em] text-sm text-white cursor-pointer"
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
                <Play size={16} fill="currentColor" />
                Start Survival
              </span>
              {/* Shimmer */}
              <motion.span
                className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                animate={{ left: ['-20%', '120%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              />
            </motion.button>

            {/* Campaign */}
            <motion.button
              type="button"
              onClick={onCampaign}
              className="relative min-h-[3rem] w-full rounded-xl font-display font-semibold uppercase tracking-[0.15em] text-sm text-cyan-300 cursor-pointer"
              style={{
                background: 'rgba(6,182,212,0.06)',
                border: '1px solid rgba(6,182,212,0.25)',
                backdropFilter: 'blur(12px)',
              }}
              whileHover={{
                background: 'rgba(6,182,212,0.12)',
                borderColor: 'rgba(6,182,212,0.5)',
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <span className="flex items-center justify-center gap-2.5">
                <Map size={15} />
                Campaign
              </span>
            </motion.button>

            {/* Secondary row */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Hangar', icon: <Swords size={14} />, onClick: onOpenGear },
                { label: `Vault (${relicCount})`, icon: <Sparkles size={14} />, onClick: onOpenInventory },
              ].map(({ label, icon, onClick }) => (
                <motion.button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="min-h-[3rem] w-full rounded-xl font-sans font-medium text-sm text-white/70 cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                  }}
                  whileHover={{
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,1)',
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {icon}
                    {label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Version / footer note */}
            <p className="text-center font-mono text-[9px] uppercase tracking-[0.3em] text-white/20 mt-2">
              Survival Mode — Endless
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
