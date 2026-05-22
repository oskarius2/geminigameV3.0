import { GameState } from '../types';
import { getRailsPlayBounds } from './renderCorridor';
import { getRailsWavesForLevel } from './enemies';
import type { RailsRunState } from './types';

export interface LevelProgressTheme {
  gradient: [string, string];
  marker: string;
  glow: string;
}

const THEMES: Record<string, LevelProgressTheme> = {
  tunnel_01: {
    gradient: ['#06b6d4', '#22d3ee'],
    marker: 'rgba(34, 211, 238, 0.9)',
    glow: 'rgba(6, 182, 212, 0.6)',
  },
  asteroid_belt: {
    gradient: ['#ea580c', '#fb923c'],
    marker: 'rgba(251, 146, 60, 0.95)',
    glow: 'rgba(234, 88, 12, 0.55)',
  },
  void_run: {
    gradient: ['#7c3aed', '#c084fc'],
    marker: 'rgba(192, 132, 252, 0.95)',
    glow: 'rgba(124, 58, 237, 0.55)',
  },
};

const DEFAULT_THEME = THEMES.tunnel_01;

/** Weak-point marker on screen-space boss health bar. */
export function weakPointBarMarkerX(
  barX: number,
  barW: number,
  healthRatio: number
): number {
  return barX + barW * healthRatio * 0.42;
}

function themeFor(rails: RailsRunState): LevelProgressTheme {
  return THEMES[rails.levelId] ?? DEFAULT_THEME;
}

/** Bottom rail progress + wave milestones (screen space). */
export function renderRailsLevelProgressBar(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  screenWidth: number,
  screenHeight: number,
  time: number
): void {
  const rails = state.rails;
  if (!rails || rails.outcome !== 'active') return;

  const bounds = getRailsPlayBounds(screenWidth, screenHeight);
  const theme = themeFor(rails);
  const ratio = Math.min(1, rails.distance / Math.max(1, rails.railLength));
  const barH = 6;
  const barW = bounds.width * 0.88;
  const x = bounds.centerX - barW / 2;
  const y = screenHeight - Math.max(18, barH + 14);
  const bossGlow = rails.bossSpawned && !rails.bossDefeated;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x - 6, y - 10, barW + 12, barH + 20);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, y, barW, barH);

  const grad = ctx.createLinearGradient(x, y, x + barW, y);
  grad.addColorStop(0, bossGlow ? '#ef4444' : theme.gradient[0]);
  grad.addColorStop(1, bossGlow ? '#f97316' : theme.gradient[1]);
  ctx.fillStyle = grad;
  if (bossGlow) {
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 10 + Math.sin(time * 8) * 6;
  }
  ctx.fillRect(x, y, barW * ratio, barH);
  ctx.shadowBlur = 0;

  const milestones = [0.25, 0.5, 0.75, 1];
  for (const m of milestones) {
    const mx = x + barW * m;
    ctx.fillStyle = ratio >= m - 0.02 ? theme.marker : 'rgba(255,255,255,0.25)';
    ctx.fillRect(mx - 1, y - 3, 2, barH + 6);
  }

  const waves = getRailsWavesForLevel(rails.levelId);
  const maxSec = rails.targetSeconds || 1;
  for (const wave of waves) {
    const wx = x + barW * Math.min(1, wave.startSec / maxSec);
    ctx.fillStyle = rails.triggeredWaveIds.includes(wave.id)
      ? 'rgba(255,255,255,0.5)'
      : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(wx, y - 5);
    ctx.lineTo(wx + 4, y - 9);
    ctx.lineTo(wx - 4, y - 9);
    ctx.closePath();
    ctx.fill();
  }

  ctx.font = '600 9px system-ui';
  ctx.textAlign = 'center';
  if (bossGlow) {
    ctx.fillStyle = '#fca5a5';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillText('BOSS!', bounds.centerX, y - 14);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(`${Math.floor(ratio * 100)}%`, bounds.centerX, y - 14);
  }

  ctx.restore();
}
