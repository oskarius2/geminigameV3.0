import type { CompanionId } from '../types';
import { companionBobOffset, companionRotationRad, glowIntensity } from './companionAnimations';
import { CompanionAIState, CompanionType, companionIdToType } from './companionTypes';
import type { CompanionRuntime } from './companionTypes';

export interface CompanionDrawParams {
  companionId: CompanionId;
  level: number;
  runtime: CompanionRuntime;
  timeMs: number;
  isMobile: boolean;
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  hpRatio: number,
  show: boolean,
): void {
  if (!show || hpRatio >= 0.999) return;
  const w = 22;
  const h = 3;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(-w / 2, -32, w, h);
  const col =
    hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#facc15' : '#ef4444';
  ctx.fillStyle = col;
  ctx.fillRect(-w / 2, -32, w * hpRatio, h);
}

function drawLevelBadge(ctx: CanvasRenderingContext2D, level: number, color: string): void {
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.fillText(`Lv${level}`, 22, -28);
}

function drawGuardian(ctx: CanvasRenderingContext2D, glow: number, rot: number, pulse: number): void {
  const corePulse = 0.85 + pulse * 0.15;
  ctx.save();
  ctx.rotate(rot);
  ctx.shadowBlur = 10 * glow;
  ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';

  ctx.fillStyle = '#6b7280';
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const r = 20;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const spikes = [
    [22, 0],
    [-22, 0],
    [0, 22],
    [0, -22],
  ];
  ctx.fillStyle = `rgba(96, 165, 250, ${0.5 + glow * 0.5})`;
  for (const [sx, sy] of spikes) {
    ctx.beginPath();
    ctx.moveTo(sx * 0.7, sy * 0.7);
    ctx.lineTo(sx * 1.1, sy * 1.1);
    ctx.lineTo(sx * 0.85 + sy * 0.15, sy * 0.85 + sx * 0.15);
    ctx.closePath();
    ctx.fill();
  }

  const coreR = 6 * corePulse;
  const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
  grd.addColorStop(0, '#e0f2fe');
  grd.addColorStop(1, '#0284c7');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawScout(ctx: CanvasRenderingContext2D, glow: number, rot: number, scanPhase: number): void {
  ctx.save();
  ctx.rotate(rot * 0.3);
  ctx.shadowBlur = 12 * glow;
  ctx.shadowColor = 'rgba(0, 212, 255, 0.9)';

  ctx.fillStyle = '#0891b2';
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-14, 12);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-14, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = `rgba(0, 212, 255, ${0.6 + scanPhase * 0.4})`;
  ctx.lineWidth = 2;
  const scanW = 8 + scanPhase * 4;
  ctx.beginPath();
  ctx.moveTo(-scanW, 0);
  ctx.lineTo(scanW, 0);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawHealer(ctx: CanvasRenderingContext2D, glow: number, pulse: number): void {
  const ringR = 18 + pulse * 4;
  ctx.shadowBlur = 14 * glow;
  ctx.shadowColor = 'rgba(51, 255, 136, 0.6)';
  ctx.strokeStyle = `rgba(51, 255, 136, ${0.35 + pulse * 0.35})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  const s = 5;
  ctx.fillRect(-s / 2, -s * 1.2, s, s * 2.4);
  ctx.fillRect(-s * 1.2, -s / 2, s * 2.4, s);
  ctx.shadowBlur = 0;

  if (pulse > 0.7 && Math.random() < 0.08) {
    ctx.fillStyle = 'rgba(134, 239, 172, 0.9)';
    ctx.beginPath();
    ctx.arc((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 24, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGunner(
  ctx: CanvasRenderingContext2D,
  glow: number,
  rot: number,
  attacking: boolean,
): void {
  ctx.save();
  ctx.rotate(rot);
  ctx.shadowBlur = (attacking ? 16 : 10) * glow;
  ctx.shadowColor = 'rgba(255, 107, 53, 0.85)';

  ctx.fillStyle = '#c2410c';
  ctx.strokeStyle = '#fdba74';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-16, -14, 32, 28);
  ctx.strokeRect(-16, -14, 32, 28);

  ctx.fillStyle = '#ea580c';
  ctx.fillRect(-6, -4, 5, 10);
  ctx.fillRect(2, -4, 5, 10);

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-18, -18, 10, 8);
  ctx.strokeRect(8, 10, 10, 8);

  if (attacking) {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.9)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(14 + i * 4, (i - 1) * 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  runtime: CompanionRuntime,
  color: string,
): void {
  const v = runtime.velocity;
  if (v.magnitude() < 20) return;
  const dir = v.normalize();
  ctx.strokeStyle = color.replace(')', ', 0.35)').replace('rgb', 'rgba');
  if (!color.includes('rgba')) {
    ctx.strokeStyle = `${color}55`;
  }
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-dir.x * 14, -dir.y * 14);
  ctx.lineTo(0, 0);
  ctx.stroke();
}

/** Render companion at canvas origin (caller translates). */
export function drawCompanionOnCanvas(
  ctx: CanvasRenderingContext2D,
  params: CompanionDrawParams,
): void {
  const { companionId, level, runtime, timeMs } = params;
  const type = companionIdToType(companionId);
  const t = runtime.visualTime;
  const hpRatio = runtime.health / Math.max(runtime.maxHealth, 1);
  const abilityReady = (runtime.abilityCooldownRemaining ?? 0) <= 0;
  const pulse = runtime.abilityPulseTimer > 0 ? runtime.abilityPulseTimer : 0;
  const glow = glowIntensity(runtime.aiState, abilityReady, pulse);
  const rot = companionRotationRad(type, t, runtime.aiState);
  const bob = companionBobOffset(type, t);
  const scanPhase = (Math.sin(t * Math.PI) + 1) * 0.5;

  if (runtime.hitFlashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5 * (runtime.hitFlashTimer / 0.2);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const scale =
    1 +
    (runtime.attackPulseTimer > 0 ? 0.08 : 0) +
    (runtime.levelUpPulseTimer > 0 ? Math.sin(runtime.levelUpPulseTimer * 12) * 0.08 : 0);

  ctx.save();
  ctx.translate(bob.x, bob.y);
  ctx.scale(scale, scale);

  const trailColors: Record<CompanionType, string> = {
    [CompanionType.GUARDIAN]: '#60a5fa',
    [CompanionType.SCOUT]: '#00d4ff',
    [CompanionType.HEALER]: '#33ff88',
    [CompanionType.GUNNER]: '#ff6b35',
  };
  drawTrail(ctx, runtime, trailColors[type]);

  switch (type) {
    case CompanionType.GUARDIAN:
      drawGuardian(ctx, glow, rot, scanPhase);
      break;
    case CompanionType.SCOUT:
      drawScout(ctx, glow, rot, scanPhase);
      break;
    case CompanionType.HEALER:
      drawHealer(ctx, glow, scanPhase);
      break;
    case CompanionType.GUNNER:
      drawGunner(ctx, glow, rot, runtime.isAttacking);
      break;
  }

  const badgeColors: Record<CompanionType, string> = {
    [CompanionType.GUARDIAN]: '#93c5fd',
    [CompanionType.SCOUT]: '#67e8f9',
    [CompanionType.HEALER]: '#86efac',
    [CompanionType.GUNNER]: '#fdba74',
  };
  drawLevelBadge(ctx, level, badgeColors[type]);
  drawHealthBar(ctx, hpRatio, runtime.hitFlashTimer > 0 || hpRatio < 1);

  ctx.restore();
}
