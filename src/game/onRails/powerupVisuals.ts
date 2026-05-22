import { GameState, Particle } from '../types';
import { Vector2 } from '../utils/vector';
import { RailsPowerupKind, RAILS_POWERUP_DEFS } from './powerups';

function drawSparkles(
  ctx: CanvasRenderingContext2D,
  color: string,
  count: number,
  spread: number
): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * spread;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHexShield(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  const sides = 6;
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * Math.PI * 2 + time * 2;
    const px = Math.cos(a) * r * 0.85;
    const py = Math.sin(a) * r * 0.85;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(0, 255, 255, 0.25)';
  ctx.fill();
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.35);
  ctx.lineTo(0, r * 0.35);
  ctx.moveTo(-r * 0.28, -r * 0.08);
  ctx.lineTo(r * 0.28, -r * 0.08);
  ctx.stroke();
}

function drawRapidGun(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  ctx.fillStyle = '#FF6347';
  ctx.fillRect(-r * 0.5, -r * 0.15, r * 0.9, r * 0.3);
  ctx.fillRect(r * 0.15, -r * 0.22, r * 0.55, r * 0.12);
  for (let i = 0; i < 3; i++) {
    const ox = r * 0.75 + i * 6 + Math.sin(time * 20 + i) * 2;
    ctx.globalAlpha = 0.35 + (i === 0 ? 0.4 : 0.2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(ox, -2, 10 - i * 2, 4);
  }
  ctx.globalAlpha = 1;
}

function drawHourglass(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  const w = r * 0.35;
  ctx.fillStyle = '#c4b5fd';
  ctx.beginPath();
  ctx.moveTo(-w, -r * 0.55);
  ctx.lineTo(w, -r * 0.55);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-w, r * 0.55);
  ctx.lineTo(w, r * 0.55);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  const grainY = ((time * 0.4) % 1) * r * 0.35 - r * 0.1;
  ctx.fillStyle = '#6A0DAD';
  ctx.beginPath();
  ctx.arc(0, grainY, 2.5, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const py = r * 0.15 + i * 5 + ((time * 0.15 + i * 0.2) % 1) * 12;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.arc((i - 1.5) * 5, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHeartPlus(ctx: CanvasRenderingContext2D, r: number): void {
  const s = r * 0.45;
  ctx.fillStyle = '#32CD32';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.9);
  ctx.bezierCurveTo(-s, s * 0.2, -s, -s * 0.5, 0, -s * 0.2);
  ctx.bezierCurveTo(s, -s * 0.5, s, s * 0.2, 0, s * 0.9);
  ctx.fill();
  ctx.strokeStyle = '#ecfccb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-s * 0.15, 0);
  ctx.lineTo(s * 0.15, 0);
  ctx.moveTo(0, -s * 0.15);
  ctx.lineTo(0, s * 0.15);
  ctx.stroke();
}

function drawScoreStar(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  ctx.fillStyle = '#FFD700';
  ctx.font = `bold ${Math.floor(r * 1.2)}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 1);
  const starR = r * 0.35;
  const a = time * 4;
  ctx.save();
  ctx.translate(r * 0.55, -r * 0.45);
  ctx.rotate(a);
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(ang) * starR;
    const py = Math.sin(ang) * starR;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawInvincShield(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  const hue = (time * 80) % 360;
  ctx.strokeStyle = `hsl(${hue}, 90%, 65%)`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, r * 0.1, r * 0.65, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.strokeStyle = '#f472b6';
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, -r * 0.35);
  ctx.lineTo(r * 0.2, r * 0.55);
  ctx.lineTo(-r * 0.35, r * 0.15);
  ctx.stroke();
}

function drawMegaBomb(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, r * 0.1, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF4500';
  ctx.fillRect(-r * 0.12, -r * 0.75, r * 0.24, r * 0.35);
  const pulse = 0.6 + Math.sin(time * 14) * 0.4;
  ctx.strokeStyle = `rgba(255, 69, 0, ${pulse})`;
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + time * 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
    ctx.lineTo(Math.cos(a) * r * (0.85 + pulse * 0.2), Math.sin(a) * r * (0.85 + pulse * 0.2));
    ctx.stroke();
  }
}

const PULSE_SPEED: Record<RailsPowerupKind, number> = {
  SHIELD_BUBBLE: 5,
  RAPID_FIRE: 14,
  SLOW_TIME: 3,
  HEALTH_RESTORE: 5,
  SCORE_MULTIPLIER: 8,
  INVINCIBILITY: 12,
  MEGA_BLAST: 10,
};

/** Distinct world-space pickup art per powerup kind. */
export function drawRailsPowerupVisual(
  ctx: CanvasRenderingContext2D,
  kind: RailsPowerupKind,
  x: number,
  y: number,
  r: number,
  time: number,
  anim = 0
): void {
  const def = RAILS_POWERUP_DEFS[kind];
  const pulse = 1 + Math.sin(time * PULSE_SPEED[kind]) * 0.1;
  const rot =
    time * (kind === 'SHIELD_BUBBLE' ? 2.2 : kind === 'SCORE_MULTIPLIER' ? 1.2 : 1.8) +
    anim * 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(pulse, pulse);

  ctx.shadowColor = def.color;
  ctx.shadowBlur = kind === 'INVINCIBILITY' ? 22 + Math.sin(time * 16) * 8 : 16;

  const drawR = r * 0.72;
  switch (kind) {
    case 'SHIELD_BUBBLE':
      drawHexShield(ctx, drawR, time);
      break;
    case 'RAPID_FIRE':
      drawRapidGun(ctx, drawR, time);
      break;
    case 'SLOW_TIME':
      drawHourglass(ctx, drawR, time);
      break;
    case 'HEALTH_RESTORE':
      drawHeartPlus(ctx, drawR);
      break;
    case 'SCORE_MULTIPLIER':
      drawScoreStar(ctx, drawR, time);
      break;
    case 'INVINCIBILITY':
      drawInvincShield(ctx, drawR, time);
      break;
    case 'MEGA_BLAST':
      drawMegaBomb(ctx, drawR, time);
      break;
  }

  ctx.shadowBlur = 0;
  if (kind === 'SCORE_MULTIPLIER' || kind === 'INVINCIBILITY') {
    drawSparkles(ctx, def.color, 3, drawR * 0.9);
  }
  ctx.restore();
}

/** Trail burst when a pickup is collected (flies toward HUD). */
export function spawnPowerupCollectParticles(
  state: GameState,
  kind: RailsPowerupKind,
  worldPos: Vector2,
  screenTargetX: number,
  screenTargetY: number
): void {
  const def = RAILS_POWERUP_DEFS[kind];
  const cam = state.camera;
  const zoom = state.rails?.viewZoom ?? 0.5;
  const sx = (worldPos.x - cam.x) * zoom;
  const sy = (worldPos.y - cam.y) * zoom;
  const dx = screenTargetX - sx;
  const dy = screenTargetY - sy;
  const len = Math.hypot(dx, dy) || 1;

  for (let i = 0; i < 10; i++) {
    const speed = 2.5 + Math.random() * 2;
    state.particles.push({
      id: `pu_col_${Math.random().toString(36).slice(2)}`,
      pos: new Vector2(sx + (Math.random() - 0.5) * 12, sy + (Math.random() - 0.5) * 12),
      velocity: new Vector2((dx / len) * speed, (dy / len) * speed),
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6,
      color: def.color,
      size: 2 + Math.random() * 3,
      particleType: 'spark',
    });
  }
}
