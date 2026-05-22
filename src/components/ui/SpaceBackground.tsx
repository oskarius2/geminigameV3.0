import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';

function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; z: number; pz: number; twinkle: number }[] = [];
    const COUNT = 280;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      stars.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        z: Math.random() * 800,
        pz: 0,
        twinkle: Math.random(),
      });
    }

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = 'rgba(1,2,8,0.28)';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const t = Date.now() * 0.001;

      for (const s of stars) {
        s.pz = s.z;
        s.z -= 1.3;
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
        const size = Math.max(0.35, (1 - s.z / W) * 2.6);
        const bright = Math.min(1, (1 - s.z / W) * 1.5);
        const flicker = 0.6 + 0.4 * Math.sin(t * 3.5 + s.twinkle * 20);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(${120 + Math.floor(bright * 80)},${200 + Math.floor(bright * 40)},${255},${bright * flicker * 0.88})`;
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

export const HudCorner = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const base = 'absolute w-6 h-6 pointer-events-none';
  const corners = {
    tl: 'top-0 left-0 border-t-2 border-l-2 border-cyan-400/60',
    tr: 'top-0 right-0 border-t-2 border-r-2 border-cyan-400/45',
    bl: 'bottom-0 left-0 border-b-2 border-l-2 border-cyan-400/35',
    br: 'bottom-0 right-0 border-b-2 border-r-2 border-cyan-400/55',
  };
  return <span className={`${base} ${corners[position]}`} aria-hidden />;
};

interface SpaceBackgroundProps {
  scanlines?: boolean;
}

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ scanlines = false }) => (
  <>
    <div className="absolute inset-0">
      <StarField />
    </div>
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.04]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse 85% 75% at 50% 45%, black 25%, transparent 78%)',
      }}
    />
    {scanlines && <div className="scanline-overlay" aria-hidden />}
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none"
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
    />
  </>
);
