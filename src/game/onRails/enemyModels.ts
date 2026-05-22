import { EnemyType } from '../types';

export interface RailsEnemyVisual {
  radius: number;
  color: string;
}

export const RAILS_ENEMY_VISUALS: Partial<Record<EnemyType, RailsEnemyVisual>> = {
  [EnemyType.RANGED]: { radius: 20, color: '#00FF00' },
  [EnemyType.DASHER]: { radius: 18, color: '#FF6600' },
  [EnemyType.ZAPPER]: { radius: 16, color: '#00FFFF' },
  [EnemyType.BLOCKER]: { radius: 40, color: '#808080' },
  [EnemyType.SWARM_V2]: { radius: 8, color: '#FF00FF' },
  [EnemyType.CHARGER]: { radius: 22, color: '#FF0000' },
};

/** Distinct canvas shapes per enemy archetype (world space, origin at center). */
export function drawRailsEnemy(
  ctx: CanvasRenderingContext2D,
  enemyType: EnemyType | undefined,
  x: number,
  y: number,
  time: number,
  hitFlash: boolean
): void {
  const vis = RAILS_ENEMY_VISUALS[enemyType ?? EnemyType.RANGED];
  const r = vis?.radius ?? 16;
  const base = hitFlash ? '#ffffff' : (vis?.color ?? '#f97316');

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = base;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = base;
  ctx.shadowBlur = 10;

  switch (enemyType) {
    case EnemyType.RANGED: {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.9);
      ctx.lineTo(-r * 0.65, -r * 0.5);
      ctx.lineTo(r * 0.65, -r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#052e16';
      ctx.beginPath();
      ctx.arc(0, r * 0.15, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case EnemyType.DASHER: {
      const spin = time * 8;
      ctx.rotate(spin);
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.75, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.75, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.35, 3, 0, Math.PI * 2);
      ctx.arc(r * 0.35, -r * 0.35, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case EnemyType.ZAPPER: {
      const pulse = 1 + Math.sin(time * 10) * 0.08;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const x1 = Math.cos(a) * r * pulse;
        const y1 = Math.sin(a) * r * pulse;
        const a2 = a + Math.PI / 4;
        const x2 = Math.cos(a2) * r * 0.35 * pulse;
        const y2 = Math.sin(a2) * r * 0.35 * pulse;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#e0f2fe';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case EnemyType.BLOCKER: {
      const s = r * 0.85;
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.5);
      ctx.lineTo(s * 0.5, s * 0.5);
      ctx.moveTo(s * 0.5, -s * 0.5);
      ctx.lineTo(-s * 0.5, s * 0.5);
      ctx.stroke();
      break;
    }
    case EnemyType.SWARM_V2: {
      ctx.rotate(time * 3);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case EnemyType.CHARGER: {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 1.1, -r * 0.2, r * 0.7, r * 0.5);
      ctx.lineTo(0, r * 0.85);
      ctx.lineTo(-r * 0.7, r * 0.5);
      ctx.quadraticCurveTo(-r * 1.1, -r * 0.2, 0, -r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(4, -r * 0.05);
      ctx.lineTo(-4, -r * 0.05);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
