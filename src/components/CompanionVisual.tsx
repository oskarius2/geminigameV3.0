import React, { useMemo } from 'react';
import type { CompanionId } from '../game/types';
import { CompanionAIState, companionIdToType, CompanionType } from '../game/companions/companionTypes';
import { companionBobOffset, companionRotationRad, glowIntensity } from '../game/companions/companionAnimations';

export interface CompanionVisualProps {
  type: CompanionId;
  x: number;
  y: number;
  isHovering?: boolean;
  isAttacking?: boolean;
  health: number;
  maxHealth: number;
  level: number;
  aiState?: CompanionAIState;
  abilityReady?: boolean;
  visualTime?: number;
  className?: string;
}

const TYPE_COLORS: Record<CompanionType, string> = {
  [CompanionType.GUARDIAN]: '#60a5fa',
  [CompanionType.SCOUT]: '#00d4ff',
  [CompanionType.HEALER]: '#33ff88',
  [CompanionType.GUNNER]: '#ff6b35',
};

export function CompanionVisual({
  type: companionId,
  x,
  y,
  isHovering = false,
  isAttacking = false,
  health,
  maxHealth,
  level,
  aiState = CompanionAIState.IDLE,
  abilityReady = true,
  visualTime = 0,
  className = '',
}: CompanionVisualProps) {
  const companionType = companionIdToType(companionId);
  const hpRatio = maxHealth > 0 ? health / maxHealth : 1;
  const glow = glowIntensity(aiState, abilityReady, 0) * (isHovering ? 1.15 : 1);
  const rot = (companionRotationRad(companionType, visualTime, aiState) * 180) / Math.PI;
  const bob = companionBobOffset(companionType, visualTime);
  const scan = (Math.sin(visualTime * Math.PI) + 1) * 0.5;

  const size = companionType === CompanionType.SCOUT ? { w: 40, h: 48 } : { w: 48, h: 48 };

  const filter = useMemo(
    () => `drop-shadow(0 0 ${8 + glow * 10}px ${TYPE_COLORS[companionType]}88)`,
    [companionType, glow],
  );

  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{
        left: x,
        top: y,
        width: size.w,
        height: size.h,
        transform: `translate(-50%, -50%) translate(${bob.x}px, ${bob.y}px)`,
        filter,
      }}
    >
      {companionType === CompanionType.GUARDIAN && (
        <svg viewBox="-24 -24 48 48" width={size.w} height={size.h} className="overflow-visible">
          <g transform={`rotate(${rot})`}>
            <polygon
              points="0,-20 17,10 -17,10"
              fill="#6b7280"
              stroke="#9ca3af"
              strokeWidth="1.5"
            />
            <polygon points="22,0 26,4 22,8" fill="#60a5fa" opacity={0.6 + glow * 0.4} />
            <polygon points="-22,0 -26,4 -22,8" fill="#60a5fa" opacity={0.6 + glow * 0.4} />
            <circle r={6 + scan * 2} fill="#0284c7" className="companion-core-pulse" />
          </g>
        </svg>
      )}

      {companionType === CompanionType.SCOUT && (
        <svg viewBox="-24 -24 48 48" width={size.w} height={size.h}>
          <g transform={`rotate(${rot * 0.3})`}>
            <polygon points="18,0 -14,12 -10,0 -14,-12" fill="#0891b2" stroke="#e0f2fe" strokeWidth="1.5" />
            <line x1={-8 - scan * 4} y1="0" x2={8 + scan * 4} y2="0" stroke="#00d4ff" strokeWidth="2" />
          </g>
        </svg>
      )}

      {companionType === CompanionType.HEALER && (
        <svg viewBox="-24 -24 48 48" width={size.w} height={size.h}>
          <circle r={18 + scan * 4} fill="none" stroke="#33ff88" strokeWidth="2" opacity={0.4 + glow * 0.3} />
          <circle r={16} fill="#22c55e" />
          <rect x={-2.5} y={-6} width={5} height={12} fill="#fff" />
          <rect x={-6} y={-2.5} width={12} height={5} fill="#fff" />
        </svg>
      )}

      {companionType === CompanionType.GUNNER && (
        <svg viewBox="-24 -24 48 48" width={size.w} height={size.h}>
          <g transform={`rotate(${rot})`}>
            <rect x={-16} y={-14} width={32} height={28} fill="#c2410c" stroke="#fdba74" strokeWidth="1.5" />
            <rect x={-6} y={-4} width={5} height={10} fill="#ea580c" />
            <rect x={2} y={-4} width={5} height={10} fill="#ea580c" />
            {isAttacking && (
              <>
                <circle cx={16} cy={-4} r={2} fill="#fb923c" />
                <circle cx={20} cy={0} r={2} fill="#fb923c" />
              </>
            )}
          </g>
        </svg>
      )}

      <span
        className="absolute -top-1 -right-1 text-[9px] font-mono font-bold"
        style={{ color: TYPE_COLORS[companionType] }}
      >
        Lv{level}
      </span>

      {hpRatio < 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-[22px] h-[3px] bg-black/50 rounded-sm overflow-hidden">
          <div
            className="h-full rounded-sm"
            style={{
              width: `${hpRatio * 100}%`,
              backgroundColor: hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#facc15' : '#ef4444',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default CompanionVisual;
