import { EnemyType, GameState, Particle } from '../types';
import { Vector2 } from '../utils/vector';
import { playSfx } from '../audio/sfx';
import type { RailsBossId } from './bosses';
import { Vector2 } from '../utils/vector';
import type { RailsBossDeathState, RailsRunState } from './types';

export interface BossDeathDef {
  durationMs: number;
  sfx: 'rails_boss_defeat_sentinel' | 'rails_boss_defeat_iron' | 'rails_boss_defeat_void';
}

const BOSS_DEATH_DEFS: Record<RailsBossId, BossDeathDef> = {
  sentinel_core: { durationMs: 1500, sfx: 'rails_boss_defeat_sentinel' },
  iron_titan: { durationMs: 2000, sfx: 'rails_boss_defeat_iron' },
  void_phantom: { durationMs: 2500, sfx: 'rails_boss_defeat_void' },
};

const BOSS_KILL_SCORE = 2000;
const CLEARED_BANNER_MS = 2200;

function bossDeathParticles(
  pos: Vector2,
  colors: string[],
  count: number,
  speed: number,
  inward = false
): Particle[] {
  const out: Particle[] = [];
  const velBase = speed / 60;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = velBase * (0.6 + Math.random() * 0.8);
    const dir = inward ? -1 : 1;
    out.push({
      id: `bd_${Math.random().toString(36).slice(2)}`,
      pos: pos.clone(),
      velocity: new Vector2(Math.cos(angle) * spd * dir, Math.sin(angle) * spd * dir),
      life: 0.6 + Math.random() * 0.5,
      maxLife: 1.1,
      color: colors[i % colors.length],
      size: 3 + Math.random() * 5,
      particleType: 'spark',
    });
  }
  return out;
}

export function isRailsBossDeathActive(rails: RailsRunState | null | undefined): boolean {
  return !!rails?.bossDeath && !rails.bossDeath.finished;
}

export function beginRailsBossDeath(
  state: GameState,
  boss: GameState['enemies'][0]
): void {
  const rails = state.rails;
  if (!rails || rails.bossDeath || !boss.railsBossId) return;

  const bossId = boss.railsBossId as RailsBossId;
  const def = BOSS_DEATH_DEFS[bossId];
  boss.health = 0;

  rails.bossDeath = {
    bossId,
    elapsedMs: 0,
    durationMs: def.durationMs,
    finished: false,
    pos: boss.pos.clone(),
    radius: boss.radius,
    impactBurst: false,
    flashCount: 0,
  };

  playSfx(def.sfx);
  state.score += BOSS_KILL_SCORE;
  rails.killCount += 1;
  state.screenshake = Math.max(state.screenshake, bossId === 'iron_titan' ? 10 : 6);

  if (bossId === 'sentinel_core') {
    state.screenFlash = 12;
    state.particles.push(
      ...bossDeathParticles(boss.pos, ['#22d3ee', '#00ffff', '#a855f7'], 22, 140)
    );
  } else if (bossId === 'iron_titan') {
    state.particles.push(
      ...bossDeathParticles(boss.pos, ['#f97316', '#fbbf24', '#78716c'], 32, 120)
    );
  } else {
    state.particles.push(
      ...bossDeathParticles(boss.pos, ['#c084fc', '#e9d5ff', '#4c1d95'], 24, 100, true)
    );
  }
}

export function updateRailsBossDeath(state: GameState, dtSec: number): boolean {
  const rails = state.rails;
  const death = rails?.bossDeath;
  if (!death || death.finished) return false;

  death.elapsedMs = Math.min(death.durationMs, death.elapsedMs + dtSec * 1000);
  const t = death.elapsedMs / death.durationMs;
  const bossId = death.bossId;

  if (bossId === 'sentinel_core' && death.flashCount < 5) {
    const flashInterval = 200;
    const expected = Math.floor(death.elapsedMs / flashInterval);
    if (expected > death.flashCount) {
      death.flashCount = expected;
      state.screenFlash = Math.max(state.screenFlash, 4);
    }
  }

  if (bossId === 'iron_titan' && !death.impactBurst && death.elapsedMs > 400) {
    death.impactBurst = true;
    state.screenshake = Math.max(state.screenshake, 8);
    state.particles.push(
      ...bossDeathParticles(death.pos, ['#ef4444', '#f97316'], 16, 150)
    );
  }

  if (bossId === 'void_phantom' && death.elapsedMs > 500 && death.elapsedMs < 1500) {
    state.screenFlash = Math.max(state.screenFlash, 2);
  }

  if (death.elapsedMs >= death.durationMs) {
    death.finished = true;
    rails!.bossDefeated = true;
    rails!.levelClearedBannerUntil = state.survivalTime + CLEARED_BANNER_MS / 1000;
    state.bossActive = false;
    state.activeBossId = null;
    state.enemies = state.enemies.filter(
      (e) => !(e.enemyType === EnemyType.BOSS && e.railsBossId === bossId)
    );
    return true;
  }

  return t >= 1;
}

export function getBossDeathProgress(rails: RailsRunState): number {
  const d = rails.bossDeath;
  if (!d) return 0;
  return Math.min(1, d.elapsedMs / d.durationMs);
}

export function shouldShowLevelClearedBanner(rails: RailsRunState, nowSec: number): boolean {
  return (
    rails.bossDefeated &&
    rails.levelClearedBannerUntil > nowSec &&
    rails.outcome === 'active'
  );
}

export function renderRailsBossDeath(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: { x: number; y: number },
  screenWidth: number,
  screenHeight: number,
  time: number
): void {
  const rails = state.rails;
  const death = rails?.bossDeath;
  if (!death) return;

  const t = death.elapsedMs / death.durationMs;
  const x = death.pos.x - camera.x;
  const y = death.pos.y - camera.y;
  const r = death.radius;

  ctx.save();
  ctx.translate(x, y);

  if (death.bossId === 'sentinel_core') {
    const spin = time * 3 + t * 8;
    ctx.rotate(spin);
    ctx.globalAlpha = 1 - t * 0.9;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * (1 - t * 0.5), Math.sin(a) * r * 0.85 * (1 - t * 0.5));
      ctx.stroke();
    }
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2 * (1 - t), 0, Math.PI * 2);
    ctx.fill();
  } else if (death.bossId === 'iron_titan') {
    const crumble = t;
    ctx.globalAlpha = 1 - crumble;
    ctx.fillStyle = '#78716c';
    ctx.fillRect(-r * 0.6, -r * 0.4 + crumble * r, r * 1.2, r * 0.8 * (1 - crumble * 0.5));
    if (t > 0.2) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.beginPath();
      ctx.arc(-r * 0.55, -r * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.arc(r * 0.55, -r * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.globalAlpha = 1 - t;
    const scale = 1 - t * 0.6;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * scale, r * 0.7 * scale, time * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(248, 250, 252, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.15 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  if (shouldShowLevelClearedBanner(rails!, state.survivalTime)) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const fadeIn = Math.min(1, (state.survivalTime - (rails!.levelClearedBannerUntil - CLEARED_BANNER_MS / 1000)) * 2);
    ctx.globalAlpha = fadeIn;
    ctx.font = 'bold 26px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 16;
    ctx.fillText('LEVEL CLEARED!', screenWidth / 2, screenHeight * 0.38);
    ctx.restore();
  }
}
