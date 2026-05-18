import React, { useRef, useEffect } from 'react';

interface JoystickProps {
  size: number;
  color?: string;
  onMove: (dir: { x: number, y: number }) => void;
  onEnd: () => void;
}

export function Joystick({ size, color = 'bg-white/10', onMove, onEnd }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const maxDist = size / 2.5;
    let active = false;

    const getCenter = () => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    const handleStart = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      active = true;
      handleMove(e);
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!active) return;
      e.preventDefault();
      const t = 'touches' in e ? e.touches[0] : e;
      const c = getCenter();
      let dx = t.clientX - c.x;
      let dy = t.clientY - c.y;
      const d = Math.hypot(dx, dy);
      
      if (d > maxDist) {
        dx = (dx / d) * maxDist;
        dy = (dy / d) * maxDist;
      }
      
      if (thumbRef.current) {
        thumbRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      onMove({ x: dx / maxDist, y: dy / maxDist });
    };

    const handleEnd = () => {
      active = false;
      if (thumbRef.current) thumbRef.current.style.transform = 'translate(0px, 0px)';
      onEnd();
    };

    el.addEventListener('touchstart', handleStart, { passive: false });
    el.addEventListener('touchmove', handleMove, { passive: false });
    el.addEventListener('touchend', handleEnd);
    el.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    return () => {
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchmove', handleMove);
      el.removeEventListener('touchend', handleEnd);
      el.removeEventListener('mousedown', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, [size, onMove, onEnd]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className={`rounded-full backdrop-blur-md border-[1.5px] border-white/20 pointer-events-auto touch-none flex items-center justify-center ${color}`}
    >
      <div
        ref={thumbRef}
        style={{ width: size * 0.4, height: size * 0.4 }}
        className="bg-white/90 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.4)] pointer-events-none transition-transform duration-75 ease-out absolute"
      />
    </div>
  );
}
