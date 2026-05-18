import React, { useRef, useState, useCallback, useEffect } from 'react';

interface JoystickProps {
  onMove: (dir: { x: number; y: number }) => void;
  onTap?: () => void;
  onEnd?: () => void;
  label?: string;
  color?: string;
  size?: number;
}

export const Joystick: React.FC<JoystickProps> = ({ 
  onMove, onTap, onEnd, label, color = 'bg-white/20', size = 128 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isMoved, setIsMoved] = useState(false);
  const pointerId = useRef<number | null>(null);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !knobRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate vector from center
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;
    
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }
    
    // Direct DOM manipulation
    knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    onMove({ x: dx / maxRadius, y: dy / maxRadius });
    if(distance > 5) setIsMoved(true);
  }, [onMove]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (pointerId.current !== null) return;
    pointerId.current = e.pointerId;
    setIsActive(true);
    setIsMoved(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (knobRef.current) {
      knobRef.current.style.transition = 'none';
    }
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (e.pointerId === pointerId.current) {
      updatePosition(e.clientX, e.clientY);
    }
  }, [updatePosition]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (e.pointerId === pointerId.current) {
      pointerId.current = null;
      setIsActive(false);
      
      if (!isMoved && onTap) {
        onTap();
      }

      if (knobRef.current) {
        knobRef.current.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        knobRef.current.style.transform = 'translate(0px, 0px)';
      }
      if (onEnd) onEnd();
    }
  }, [onEnd, isMoved, onTap]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isActive, handlePointerMove, handlePointerUp]);

  const knobSize = size / 2.5;

  return (
    <div className="relative pointer-events-auto select-none">
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        style={{ width: size, height: size }}
        className={`rounded-full border-2 border-white/20 ${color} backdrop-blur-md flex items-center justify-center relative touch-none pointer-events-auto transition-transform duration-200 ${isActive ? 'scale-105 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : ''}`}
      >
        <div
          ref={knobRef}
          style={{ 
            width: knobSize, 
            height: knobSize,
            transform: 'translate(0px, 0px)',
            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          className={`bg-white rounded-full shadow-lg z-10 pointer-events-none transition-shadow ${isActive ? 'shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}`}
        />
        {label && (
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white font-bold text-[8px] uppercase tracking-widest opacity-50">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
