/** Screen-space void + cyan corridor walls; ON_RAILS entity overlays. */

import { EnemyType, GameState } from '../types';
import { RailsPowerupKind } from './powerups';
import { RAILS_BOSS_DEFS, RailsBossId } from './bosses';
import { drawRailsEnemy } from './enemyModels';
import { isRailsInvincible } from './powerups';
import { drawRailsPowerupVisual } from './powerupVisuals';
import { weakPointBarMarkerX } from './levelProgressBar';
import { renderRailsEnemyDeath } from './enemyDeathAnimations';
import { renderRailsLevelProgressBar } from './levelProgressBar';
import {
  getBossEntranceVisuals,
  renderRailsBossEntrance,
} from './bossEntranceAnimations';
import { renderRailsBossDeath } from './bossDeathAnimations';
import { renderBossWeakPointGlow } from './bossWeakPointGlow';

export const RAILS_WALL_INSET_PX = 52;
export const RAILS_VOID_COLOR = '#000000';
export const RAILS_PLAY_COLOR = '#030712';

export interface RailsPlayBounds {
  inset: number;
  left: number;
  right: number;
  top: number;
  width: number;
  height: number;
  centerX: number;
}

export function getRailsLateralHalfWidth(screenWidth: number, zoom: number): number {
  const bounds = getRailsPlayBounds(screenWidth, 1);
  return (bounds.width / Math.max(0.2, zoom)) * 0.5 * 0.97;
}

export function getRailsPlayBounds(screenWidth: number, screenHeight: number): RailsPlayBounds {
  const inset = RAILS_WALL_INSET_PX;
  const left = inset;
  const right = screenWidth - inset;
  return {
    inset,
    left,
    right,
    top: 0,
    width: Math.max(1, right - left),
    height: screenHeight,
    centerX: screenWidth / 2,
  };
}

export function renderRailsVoidBackground(
  ctx: CanvasRenderingContext2D,
  screenWidth: number,
  screenHeight: number
): RailsPlayBounds {
  const bounds = getRailsPlayBounds(screenWidth, screenHeight);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = RAILS_VOID_COLOR;
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  ctx.fillStyle = RAILS_PLAY_COLOR;
  ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);

  ctx.restore();
  return bounds;
}

export function renderRailsWallStrokes(
  ctx: CanvasRenderingContext2D,
  screenWidth: number,
  screenHeight: number
): void {
  const bounds = getRailsPlayBounds(screenWidth, screenHeight);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
  ctx.lineWidth = 5;
  ctx.shadowColor = 'rgba(6, 182, 212, 0.45)';
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.moveTo(bounds.left, 0);
  ctx.lineTo(bounds.left, screenHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bounds.right, 0);
  ctx.lineTo(bounds.right, screenHeight);
  ctx.stroke();

  ctx.restore();
}

/** Colored enemy circles + boss visuals (world space). */
export function renderRailsEntities(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: { x: number; y: number },
  time: number
): void {
  const rails = state.rails;
  if (!rails) return;

  for (const e of state.enemies) {
    const x = e.pos.x - camera.x;
    const y = e.pos.y - camera.y;

    if (e.railsDying) {
      renderRailsEnemyDeath(ctx, e, x, y, time);
      continue;
    }

    if (e.enemyType === EnemyType.BOSS && e.railsBossId) {
      if (rails.bossDeath) continue;
      const def = RAILS_BOSS_DEFS[e.railsBossId as RailsBossId];
      const entrance = rails.bossEntrance ? getBossEntranceVisuals(rails) : null;
      const rot = time * 0.8 + (entrance?.rotation ?? 0);
      const opacity = entrance?.opacity ?? 1;
      const offsetY = (entrance?.offsetScreenY ?? 0) / rails.viewZoom;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y + offsetY);
      ctx.rotate(rot * 0.15);

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, e.radius * 0.15, e.radius * 1.1, e.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + rot;
        ctx.strokeStyle = def.colors[i % 2];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * e.radius, Math.sin(a) * e.radius * 0.85);
        ctx.stroke();
      }

      if (rails.bossCombatActive) {
        renderBossWeakPointGlow(ctx, e, rails, time);
      } else {
        const coreR = e.radius * 0.22;
        ctx.fillStyle = def.colors[0];
        ctx.beginPath();
        ctx.arc(0, 0, coreR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      continue;
    }

    const hitFlash = (e.hitTimer ?? 0) > 0;
    drawRailsEnemy(ctx, e.enemyType, x, y, time, hitFlash);
  }

  for (const item of state.items) {
    if (!item.railsPowerup) continue;
    drawRailsPowerupVisual(
      ctx,
      item.railsPowerup as RailsPowerupKind,
      item.pos.x - camera.x,
      item.pos.y - camera.y,
      item.radius,
      time,
      item.railsPickupAnim ?? 0
    );
  }
}

/** Boss health bar in screen space (top of play strip). */
export function renderRailsBossHud(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  screenWidth: number
): void {
  const rails = state.rails;
  if (!rails?.bossSpawned || rails.bossDefeated || !rails.bossCombatActive) return;

  const boss = state.enemies.find(
    (e) => e.enemyType === EnemyType.BOSS && e.health > 0
  );
  if (!boss?.railsBossId) return;

  const def = RAILS_BOSS_DEFS[boss.railsBossId as RailsBossId];
  const bounds = getRailsPlayBounds(screenWidth, 48);
  const barW = bounds.width * 0.7;
  const barH = 10;
  const x = bounds.centerX - barW / 2;
  const y = 56;
  const ratio = Math.max(0, boss.health / boss.maxHealth);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 4, y - 18, barW + 8, barH + 28);

  ctx.font = '600 11px system-ui';
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.fillText(def.name, bounds.centerX, y - 4);

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x, y, barW, barH);

  const grad = ctx.createLinearGradient(x, y, x + barW, y);
  grad.addColorStop(0, def.colors[0]);
  grad.addColorStop(1, def.colors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, barW * ratio, barH);

  if (boss.railsWeakPointOpen) {
    const wx = weakPointBarMarkerX(x, barW, ratio);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(wx, y + barH / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '600 9px system-ui';
    ctx.fillStyle = '#fca5a5';
    ctx.fillText('WEAK POINT', bounds.centerX, y + barH + 12);
  }

  ctx.restore();
}

/** Slow-time tint, shield / invincible / rapid-fire player feedback (screen space). */
export function renderRailsScreenOverlays(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  screenWidth: number,
  screenHeight: number
): void {
  const rails = state.rails;
  if (!rails) return;

  const now = state.survivalTime;
  const zoom = rails.viewZoom;
  const px = (state.player.pos.x - state.camera.x) * zoom;
  const py = (state.player.pos.y - state.camera.y) * zoom;
  const pr = state.player.radius * zoom;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (rails.slowTimeUntil > now) {
    ctx.fillStyle = 'rgba(106, 13, 173, 0.2)';
    const b = getRailsPlayBounds(screenWidth, screenHeight);
    ctx.fillRect(b.left, b.top, b.width, b.height);
  }

  if (rails.shieldBubbleHits > 0) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.75)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(px, py, pr + 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (isRailsInvincible(rails, now)) {
    const hue = (now * 120) % 360;
    ctx.strokeStyle = `hsla(${hue}, 90%, 65%, 0.85)`;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(px, py, pr + 18 + Math.sin(now * 12) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (rails.rapidFireUntil > now) {
    ctx.fillStyle = 'rgba(255, 99, 71, 0.35)';
    ctx.beginPath();
    ctx.arc(px, py - pr - 6, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  if (rails.megaBlastCharges > 0) {
    ctx.fillStyle = '#FF4500';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('MEGA', px, py - pr - 22);
  }

  if (rails.scoreMultUntil > now) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.font = '600 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('2x SCORE', px, py + pr + 20);
  }

  ctx.restore();
}

/** Dark tunnel interior inside the play clip (world space, after zoom). */
export function renderRailsTunnelInterior(
  ctx: CanvasRenderingContext2D,
  camera: { x: number; y: number },
  viewWidth: number,
  viewHeight: number,
  time: number
): void {
  ctx.save();
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  const cx = viewWidth * 0.5;
  const scroll = (time * 120) % 80;
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
  ctx.lineWidth = 1;
  for (let y = -scroll; y < viewHeight + 80; y += 80) {
    ctx.beginPath();
    ctx.moveTo(cx - 40, y);
    ctx.lineTo(cx, y + 30);
    ctx.lineTo(cx + 40, y);
    ctx.stroke();
  }

  const vanishY = viewHeight * 0.35;
  const grad = ctx.createLinearGradient(0, vanishY, 0, viewHeight);
  grad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, viewWidth, viewHeight);
  ctx.restore();
}

/** Screen-space HUD, boss entrance FX, walls (call after world ctx.restore). */
export function renderRailsScreenUi(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: { x: number; y: number },
  screenWidth: number,
  screenHeight: number,
  time: number
): void {
  renderRailsBossEntrance(ctx, state, camera, screenWidth, screenHeight, time);
  renderRailsBossDeath(ctx, state, camera, screenWidth, screenHeight, time);
  if (state.rails?.bossCombatActive && !state.rails.bossDeath) {
    renderRailsBossHud(ctx, state, screenWidth);
  }
  renderRailsScreenOverlays(ctx, state, screenWidth, screenHeight);
  renderRailsLevelProgressBar(ctx, state, screenWidth, screenHeight, time);
  renderRailsWallStrokes(ctx, screenWidth, screenHeight);
}
