import { EnemyType, GameState, Particle } from '../types';
import { Vector2 } from '../utils/vector';
import { playSfx } from '../audio/sfx';
import type { RailsBossId } from './bosses';
import { RAILS_BOSS_DEFS } from './bosses';
import type { RailsRunState } from './types';

/** Spec: weak point hits deal 2.5x normal damage. */
export const RAILS_WEAK_POINT_DAMAGE_MULT = 2.5;

const SENTINEL_CYCLE = 2;
const IRON_CYCLE = 1.5;
const VOID_CYCLE = 2;

export function railsWeakPointDamageMult(enemy: GameState['enemies'][0]): number {
  if (enemy.enemyType !== EnemyType.BOSS || !enemy.railsBossId) return 1;
  return enemy.railsWeakPointOpen ? RAILS_WEAK_POINT_DAMAGE_MULT : 1;
}

export function updateRailsWeakPointGlow(
  rails: RailsRunState,
  boss: GameState['enemies'][0],
  dtSec: number,
  survivalTime: number
): void {
  const bossId = boss.railsBossId as RailsBossId;
  let cycle = SENTINEL_CYCLE;
  if (bossId === 'iron_titan') cycle = IRON_CYCLE;
  if (bossId === 'void_phantom') cycle = VOID_CYCLE;

  rails.weakPointPhase = (rails.weakPointPhase ?? 0) + dtSec / cycle;
  const phaseT = rails.weakPointPhase % 1;

  if (bossId === 'sentinel_core') {
    rails.weakPointOpen = phaseT > 0.5;
    if (rails.weakPointOpen && !rails.weakPointWasOpen) {
      playSfx('rails_weak_beep');
    }
  } else if (bossId === 'iron_titan') {
    rails.weakPointOpen = phaseT > 0.35 && phaseT < 0.7;
    if (rails.weakPointOpen && !rails.weakPointWasOpen) {
      playSfx('rails_weak_ding');
    }
  } else {
    rails.weakPointOpen = phaseT > 0.4 && phaseT < 0.75;
    if (rails.weakPointOpen && !rails.weakPointWasOpen) {
      playSfx('rails_weak_tear');
    }
  }

  rails.weakPointWasOpen = rails.weakPointOpen;
  boss.railsWeakPointOpen = rails.weakPointOpen;

  if (rails.weakPointHitFlashUntil > survivalTime) {
    rails.weakPointHitFlash = 1 - (rails.weakPointHitFlashUntil - survivalTime) / 0.15;
  } else {
    rails.weakPointHitFlash = 0;
  }
}

export function triggerWeakPointHitFx(state: GameState, boss: GameState['enemies'][0]): void {
  const rails = state.rails;
  if (!rails) return;

  rails.weakPointHitFlashUntil = state.survivalTime + 0.15;
  rails.weakPointHitFlash = 1;

  const def = RAILS_BOSS_DEFS[boss.railsBossId as RailsBossId];
  const colors = ['#ffffff', def.colors[0], def.colors[1]];
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 4;
    state.particles.push({
      id: `wp_${Math.random().toString(36).slice(2)}`,
      pos: boss.pos.clone(),
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: 0.35,
      maxLife: 0.5,
      color: colors[i % colors.length],
      size: 3 + Math.random() * 3,
      particleType: 'flash',
    });
  }
}

export function renderBossWeakPointGlow(
  ctx: CanvasRenderingContext2D,
  boss: GameState['enemies'][0],
  rails: RailsRunState,
  time: number
): void {
  if (!boss.railsBossId || boss.health <= 0) return;

  const bossId = boss.railsBossId as RailsBossId;
  const coreR = boss.radius * 0.22;
  const pulse = 0.5 + Math.sin(time * 8) * 0.5;
  const flash = rails.weakPointHitFlash ?? 0;

  ctx.save();

  if (bossId === 'sentinel_core') {
    const open = rails.weakPointOpen;
    ctx.shadowBlur = open ? 28 + pulse * 12 : 12;
    ctx.shadowColor = open ? '#ef4444' : '#22d3ee';
    ctx.fillStyle = open ? '#ef4444' : '#22d3ee';
    ctx.beginPath();
    ctx.arc(0, 0, coreR * (open ? 1.15 : 1), 0, Math.PI * 2);
    ctx.fill();
    if (open) {
      for (let i = 0; i < 4; i++) {
        const a = time * 4 + (i / 4) * Math.PI * 2;
        ctx.strokeStyle = i % 2 === 0 ? '#00ffff' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * coreR * 2.2, Math.sin(a) * coreR * 2.2);
        ctx.stroke();
      }
    }
  } else if (bossId === 'iron_titan') {
    const glow = rails.weakPointOpen ? 0.85 + pulse * 0.15 : 0.35 + pulse * 0.2;
    ctx.fillStyle = `rgba(249, 115, 22, ${glow})`;
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = rails.weakPointOpen ? 24 : 10;
    ctx.fillRect(-boss.radius * 0.35, -boss.radius * 0.12, boss.radius * 0.7, boss.radius * 0.35);
    if (rails.weakPointOpen) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + time * 2;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * boss.radius * 0.4, Math.sin(a) * boss.radius * 0.2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    const visible = rails.weakPointOpen;
    ctx.globalAlpha = visible ? 0.9 + pulse * 0.1 : 0.25;
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = visible ? 22 : 8;
    ctx.beginPath();
    ctx.arc(0, 0, coreR, 0, Math.PI * 2);
    ctx.fill();
    if (visible) {
      ctx.strokeStyle = `rgba(192, 132, 252, ${0.5 + pulse * 0.4})`;
      ctx.lineWidth = 2;
      for (let ring = 0; ring < 2; ring++) {
        ctx.beginPath();
        ctx.arc(0, 0, coreR * (1.8 + ring * 0.4), time + ring, time + ring + Math.PI * 1.4);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.85})`;
    ctx.beginPath();
    ctx.arc(0, 0, coreR * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
