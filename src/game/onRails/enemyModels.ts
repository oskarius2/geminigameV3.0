import { EnemyType } from '../types';

export interface RailsEnemyVisual {
  radius: number;
  color: string;
}

export const RAILS_ENEMY_VISUALS: Partial<Record<EnemyType, RailsEnemyVisual>> = {
  [EnemyType.RANGED]:   { radius: 20, color: '#4ade80' },
  [EnemyType.DASHER]:   { radius: 18, color: '#fb923c' },
  [EnemyType.ZAPPER]:   { radius: 16, color: '#38bdf8' },
  [EnemyType.BLOCKER]:  { radius: 40, color: '#94a3b8' },
  [EnemyType.SWARM_V2]: { radius: 8,  color: '#c084fc' },
  [EnemyType.CHARGER]:  { radius: 22, color: '#f87171' },
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
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = base;
  ctx.shadowBlur = hitFlash ? 28 : 18;

  switch (enemyType) {
    case EnemyType.RANGED: {
      // Threat triangle with targeting reticle
      ctx.beginPath();
      ctx.moveTo(0, r * 0.95);
      ctx.lineTo(-r * 0.7, -r * 0.55);
      ctx.lineTo(r * 0.7, -r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Targeting reticle dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = hitFlash ? '#ffffff' : '#052e16';
      ctx.beginPath();
      ctx.arc(0, r * 0.18, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Reticle cross-hairs
      ctx.strokeStyle = hitFlash ? '#ffffff' : 'rgba(5,46,22,0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.18, r * 0.18); ctx.lineTo(r * 0.18, r * 0.18);
      ctx.moveTo(0, 0);                ctx.lineTo(0, r * 0.36);
      ctx.stroke();
      break;
    }
    case EnemyType.DASHER: {
      // Spinning diamond with motion-blur ghost copies
      if (!hitFlash) {
        for (let ghost = 1; ghost <= 2; ghost++) {
          const ghostAng = time * 8 - ghost * 0.22;
          ctx.save();
          ctx.rotate(ghostAng);
          ctx.globalAlpha = 0.18 / ghost;
          ctx.beginPath();
          ctx.moveTo(0, -r); ctx.lineTo(r * 0.75, 0);
          ctx.lineTo(0, r); ctx.lineTo(-r * 0.75, 0);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.restore();
        }
      }
      ctx.rotate(time * 8);
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(r * 0.75, 0);
      ctx.lineTo(0, r); ctx.lineTo(-r * 0.75, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hitFlash ? '#ffffff' : '#9a3412';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.3, 3, 0, Math.PI * 2);
      ctx.arc(r * 0.3, -r * 0.3, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case EnemyType.ZAPPER: {
      // 4-point star with electric spark marks
      const pulse = 1 + Math.sin(time * 12) * 0.09;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const x1 = Math.cos(a) * r * pulse;
        const y1 = Math.sin(a) * r * pulse;
        const a2 = a + Math.PI / 4;
        const x2 = Math.cos(a2) * r * 0.38 * pulse;
        const y2 = Math.sin(a2) * r * 0.38 * pulse;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fill();
      }
      // Spark marks between points
      if (!hitFlash) {
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 8;
        for (let i = 0; i < 4; i++) {
          const a = ((i + 0.5) / 4) * Math.PI * 2 - Math.PI / 2;
          const sparkLen = r * (0.55 + Math.sin(time * 18 + i) * 0.15);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42);
          ctx.lineTo(Math.cos(a) * sparkLen, Math.sin(a) * sparkLen);
          ctx.stroke();
        }
      }
      ctx.fillStyle = hitFlash ? '#ffffff' : '#e0f2fe';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case EnemyType.BLOCKER: {
      // Heavy armored square with warning stripe
      const s = r * 0.88;
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      // Diagonal warning stripe
      if (!hitFlash) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(-s * 0.55, -s * 0.55);
        ctx.lineTo(s * 0.55, s * 0.55);
        ctx.moveTo(s * 0.55, -s * 0.55);
        ctx.lineTo(-s * 0.55, s * 0.55);
        ctx.stroke();
        // Corner bolts
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#64748b';
        for (const [bx, by] of [[-s * 0.72, -s * 0.72], [s * 0.72, -s * 0.72], [s * 0.72, s * 0.72], [-s * 0.72, s * 0.72]]) {
          ctx.beginPath();
          ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-s * 0.55, -s * 0.55); ctx.lineTo(s * 0.55, s * 0.55);
        ctx.moveTo(s * 0.55, -s * 0.55);  ctx.lineTo(-s * 0.55, s * 0.55);
        ctx.stroke();
      }
      break;
    }
    case EnemyType.SWARM_V2: {
      // Hexagon drone with inner glow
      ctx.rotate(time * 3);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * r; const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Inner hex
      ctx.shadowBlur = 0;
      ctx.fillStyle = hitFlash ? '#ffffff' : 'rgba(192,132,252,0.55)';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * r * 0.48; const py = Math.sin(a) * r * 0.48;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case EnemyType.CHARGER: {
      // Teardrop with forward chevron arrow
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 1.15, -r * 0.2, r * 0.72, r * 0.52);
      ctx.lineTo(0, r * 0.88);
      ctx.lineTo(-r * 0.72, r * 0.52);
      ctx.quadraticCurveTo(-r * 1.15, -r * 0.2, 0, -r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Forward chevron (direction indicator)
      ctx.strokeStyle = hitFlash ? '#ffffff' : '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = hitFlash ? 0 : 8;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, r * 0.12); ctx.lineTo(0, -r * 0.35); ctx.lineTo(r * 0.3, r * 0.12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.18, -r * 0.1); ctx.lineTo(0, -r * 0.55); ctx.lineTo(r * 0.18, -r * 0.1);
      ctx.stroke();
      ctx.lineCap = 'butt';
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}
