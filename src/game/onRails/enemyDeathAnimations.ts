import { EnemyType, GameState, Particle } from '../types';
import { Vector2 } from '../utils/vector';
import { playSfx, SfxEvent } from '../audio/sfx';
import { railsEnemyKillScore } from './enemies';
import { railsScoreMult, trySpawnPowerupOnKill } from './powerups';

export interface EnemyDeathDef {
  durationMs: number;
  sparkCount: number;
  speedPxPerSec: number;
  colors: string[];
  sfx: SfxEvent;
}

export const ENEMY_DEATH_DEFS: Partial<Record<EnemyType, EnemyDeathDef>> = {
  [EnemyType.RANGED]: {
    durationMs: 300,
    sparkCount: 10,
    speedPxPerSec: 120,
    colors: ['#22c55e', '#86efac', '#052e16'],
    sfx: 'rails_death_ranged',
  },
  [EnemyType.DASHER]: {
    durationMs: 400,
    sparkCount: 12,
    speedPxPerSec: 140,
    colors: ['#f97316', '#fb923c', '#ea580c'],
    sfx: 'rails_death_dasher',
  },
  [EnemyType.ZAPPER]: {
    durationMs: 500,
    sparkCount: 8,
    speedPxPerSec: 100,
    colors: ['#22d3ee', '#67e8f9', '#06b6d4'],
    sfx: 'rails_death_zapper',
  },
  [EnemyType.BLOCKER]: {
    durationMs: 600,
    sparkCount: 15,
    speedPxPerSec: 80,
    colors: ['#a8a29e', '#e7e5e4', '#57534e'],
    sfx: 'rails_death_blocker',
  },
  [EnemyType.SWARM_V2]: {
    durationMs: 200,
    sparkCount: 6,
    speedPxPerSec: 160,
    colors: ['#d946ef', '#f0abfc', '#a21caf'],
    sfx: 'rails_death_swarm',
  },
  [EnemyType.CHARGER]: {
    durationMs: 500,
    sparkCount: 14,
    speedPxPerSec: 130,
    colors: ['#ef4444', '#f97316', '#fbbf24'],
    sfx: 'rails_death_charger',
  },
};

const DEFAULT_DEATH = ENEMY_DEATH_DEFS[EnemyType.RANGED]!;

export function getEnemyDeathDef(type: EnemyType | undefined): EnemyDeathDef {
  return ENEMY_DEATH_DEFS[type ?? EnemyType.RANGED] ?? DEFAULT_DEATH;
}

function sparkBurst(
  pos: Vector2,
  def: EnemyDeathDef,
  scale = 1
): Particle[] {
  const out: Particle[] = [];
  const velScale = def.speedPxPerSec / 60;
  for (let i = 0; i < def.sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = velScale * (0.7 + Math.random() * 0.6) * scale;
    out.push({
      id: `rd_${Math.random().toString(36).slice(2)}`,
      pos: pos.clone(),
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: 0.5 + Math.random() * 0.35,
      maxLife: 0.85,
      color: def.colors[i % def.colors.length],
      size: 2 + Math.random() * 4,
      particleType: 'spark',
    });
  }
  return out;
}

/** Start death FX + rewards (once). */
export function beginRailsEnemyDeath(
  state: GameState,
  enemy: GameState['enemies'][0]
): void {
  if (enemy.railsDying || enemy.enemyType === EnemyType.BOSS) return;

  const rails = state.rails;
  if (!rails) return;

  const def = getEnemyDeathDef(enemy.enemyType);
  enemy.railsDying = true;
  enemy.railsDeathElapsedMs = 0;
  enemy.health = 0;
  enemy.velocity = new Vector2(0, 0);

  playSfx(def.sfx);
  state.particles.push(...sparkBurst(enemy.pos, def));

  rails.killCount += 1;
  let scoreGain = railsEnemyKillScore(enemy.enemyType) * railsScoreMult(rails, state.survivalTime);
  state.score += Math.floor(scoreGain);
  trySpawnPowerupOnKill(state);
}

export function updateRailsEnemyDeaths(state: GameState, dtSec: number): void {
  const dtMs = dtSec * 1000;
  const removeIds: string[] = [];

  for (const enemy of state.enemies) {
    if (!enemy.railsDying) continue;
    if (enemy.enemyType === EnemyType.BOSS) continue;

    enemy.railsDeathElapsedMs = (enemy.railsDeathElapsedMs ?? 0) + dtMs;
    const def = getEnemyDeathDef(enemy.enemyType);
    if (enemy.railsDeathElapsedMs >= def.durationMs) {
      removeIds.push(enemy.id);
    }
  }

  if (removeIds.length > 0) {
    state.enemies = state.enemies.filter((e) => !removeIds.includes(e.id));
  }
}

export function processRailsEnemyKills(state: GameState, dtSec: number): void {
  for (const enemy of state.enemies) {
    if (enemy.enemyType === EnemyType.BOSS) continue;
    if (enemy.health > 0) continue;
    if (!enemy.railsDying) beginRailsEnemyDeath(state, enemy);
  }
  updateRailsEnemyDeaths(state, dtSec);
}

export function getEnemyDeathProgress(enemy: GameState['enemies'][0]): number {
  const def = getEnemyDeathDef(enemy.enemyType);
  return Math.min(1, (enemy.railsDeathElapsedMs ?? 0) / def.durationMs);
}

/** Death pose overlay (world space, center at x,y). */
export function renderRailsEnemyDeath(
  ctx: CanvasRenderingContext2D,
  enemy: GameState['enemies'][0],
  x: number,
  y: number,
  time: number
): void {
  if (!enemy.railsDying) return;

  const def = getEnemyDeathDef(enemy.enemyType);
  const t = getEnemyDeathProgress(enemy);
  const type = enemy.enemyType ?? EnemyType.RANGED;

  ctx.save();
  ctx.translate(x, y);

  if (type === EnemyType.RANGED) {
    const alpha = 1 - t;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${Math.floor(22 * (1 - t))},${Math.floor(34 * (1 - t))},${Math.floor(8 * (1 - t))})`;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * (1 + t * 0.4), 0, Math.PI * 2);
    ctx.fill();
  } else if (type === EnemyType.DASHER) {
    const spin = time * 18 + t * 12;
    const scale = 1 - t;
    ctx.rotate(spin);
    ctx.globalAlpha = 1 - t * 0.95;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === EnemyType.ZAPPER) {
    for (let i = 0; i < 3; i++) {
      const phase = (t * 3 + i * 0.33) % 1;
      const a = 1 - Math.abs(phase - 0.5) * 2;
      ctx.globalAlpha = a * 0.7;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc((i - 1) * 28, 0, enemy.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (type === EnemyType.BLOCKER) {
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 2;
    for (let c = 0; c < 5; c++) {
      const a = (c / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * enemy.radius, Math.sin(a) * enemy.radius);
      ctx.stroke();
    }
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * (1 - t * 0.85), 0, Math.PI * 2);
    ctx.fill();
  } else if (type === EnemyType.SWARM_V2) {
    ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + t * 4;
      ctx.fillStyle = '#d946ef';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 20 * t, Math.sin(a) * 20 * t, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === EnemyType.CHARGER) {
    const ring = enemy.radius * (1 + t * 1.8);
    ctx.strokeStyle = `rgba(239, 68, 68, ${(1 - t) * 0.6})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, ring, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * (1 - t * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
