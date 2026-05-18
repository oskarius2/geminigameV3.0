import React, { useRef, useState } from 'react';

interface JoystickProps {
  onMove: (dir: { x: number; y: number }) => void;
  onEnd: () => void;
}

export const VirtualJoystick: React.FC<JoystickProps> = ({ onMove, onEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    updatePosition(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    updatePosition(clientX, clientY);
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;

    if (distance > maxRadius) {
      dx *= maxRadius / distance;
      dy *= maxRadius / distance;
    }

    setPosition({ x: dx, y: dy });
    onMove({ x: dx / maxRadius, y: dy / maxRadius });
  };

  const handleEnd = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onEnd();
  };

  return (
    <div 
      ref={containerRef}
      className="w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 relative touch-none pointer-events-auto flex items-center justify-center"
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        e.preventDefault();
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleEnd();
      }}
    >
      <div 
        className="w-12 h-12 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] absolute transition-transform duration-75"
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)` 
        }}
      />
    </div>
  );
};
