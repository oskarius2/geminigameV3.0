import { EnemyType, GameState } from '../types';
import { playSfx } from '../audio/sfx';
import type { RailsBossId } from './bosses';
import type { RailsBossEntranceState, RailsRunState } from './types';

export type BossEntranceEffectType =
  | 'screen_flash'
  | 'screen_shake'
  | 'electric_arcs'
  | 'impact_sparks'
  | 'cannon_glow'
  | 'rift_swirl'
  | 'screen_glitch'
  | 'boss_fall'
  | 'boss_drop'
  | 'boss_materialize'
  | 'title_fade'
  | 'title_shake'
  | 'title_flicker';

export interface BossEntranceEffect {
  type: BossEntranceEffectType;
  atMs: number;
  durationMs: number;
  color?: string;
}

export interface BossEntrance {
  bossBuildId: RailsBossId;
  duration: number;
  textDisplay: string;
  effects: BossEntranceEffect[];
  audioStinger: string;
}

export const SENTINEL_CORE_ENTRANCE: BossEntrance = {
  bossBuildId: 'sentinel_core',
  duration: 2000,
  textDisplay: 'SENTINEL CORE DETECTED!',
  audioStinger: 'sentinel_stinger',
  effects: [
    { type: 'boss_fall', atMs: 0, durationMs: 2000 },
    { type: 'screen_flash', atMs: 0, durationMs: 300, color: '#00FFFF' },
    { type: 'electric_arcs', atMs: 200, durationMs: 1800 },
    { type: 'title_fade', atMs: 1000, durationMs: 500 },
  ],
};

export const IRON_TITAN_ENTRANCE: BossEntrance = {
  bossBuildId: 'iron_titan',
  duration: 2500,
  textDisplay: 'IRON TITAN APPROACHING!',
  audioStinger: 'metallic_clang',
  effects: [
    { type: 'boss_drop', atMs: 0, durationMs: 2500 },
    { type: 'screen_shake', atMs: 900, durationMs: 400 },
    { type: 'impact_sparks', atMs: 900, durationMs: 600 },
    { type: 'cannon_glow', atMs: 1200, durationMs: 1300 },
    { type: 'title_shake', atMs: 500, durationMs: 1200 },
  ],
};

export const VOID_PHANTOM_ENTRANCE: BossEntrance = {
  bossBuildId: 'void_phantom',
  duration: 3000,
  textDisplay: 'VOID PHANTOM EMERGING!',
  audioStinger: 'cosmic_tear',
  effects: [
    { type: 'boss_materialize', atMs: 0, durationMs: 3000 },
    { type: 'rift_swirl', atMs: 0, durationMs: 3000 },
    { type: 'screen_glitch', atMs: 500, durationMs: 1000 },
    { type: 'title_flicker', atMs: 400, durationMs: 2200 },
  ],
};

const ENTRANCE_BY_BOSS: Record<RailsBossId, BossEntrance> = {
  sentinel_core: SENTINEL_CORE_ENTRANCE,
  iron_titan: IRON_TITAN_ENTRANCE,
  void_phantom: VOID_PHANTOM_ENTRANCE,
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function getBossEntranceDef(bossId: RailsBossId): BossEntrance {
  return ENTRANCE_BY_BOSS[bossId];
}

export function playBossEntranceStinger(stingerId: string): void {
  switch (stingerId) {
    case 'sentinel_stinger':
      playSfx('rails_sentinel_stinger');
      break;
    case 'metallic_clang':
      playSfx('rails_iron_clang');
      break;
    case 'cosmic_tear':
      playSfx('rails_void_tear');
      break;
    default:
      playSfx('boss');
      break;
  }
}

export function beginBossEntrance(rails: RailsRunState, bossId: RailsBossId): void {
  const def = getBossEntranceDef(bossId);
  rails.bossCombatActive = false;
  rails.bossEntrance = {
    bossId,
    elapsedMs: 0,
    durationMs: def.duration,
    audioPlayed: false,
    particles: [],
    impactDone: false,
    riftPulse: 0,
  };
}

export function isBossEntranceActive(rails: RailsRunState | null | undefined): boolean {
  return !!rails?.bossEntrance && !rails.bossCombatActive;
}

export function isBossCombatActive(rails: RailsRunState | null | undefined): boolean {
  if (!rails?.bossSpawned) return false;
  return rails.bossCombatActive;
}

function spawnArcParticles(ent: RailsBossEntranceState, count: number): void {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    ent.particles.push({
      x: Math.cos(angle) * 40,
      y: Math.sin(angle) * 30,
      vx: Math.cos(angle) * 120,
      vy: Math.sin(angle) * 80,
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6,
      color: i % 2 === 0 ? '#00FFFF' : '#a855f7',
      size: 2 + Math.random() * 2,
    });
  }
}

function spawnImpactSparks(ent: RailsBossEntranceState): void {
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 160;
    ent.particles.push({
      x: 0,
      y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.35,
      maxLife: 0.75,
      color: Math.random() > 0.5 ? '#f97316' : '#fbbf24',
      size: 3 + Math.random() * 4,
    });
  }
}

function spawnRiftParticles(ent: RailsBossEntranceState): void {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    ent.particles.push({
      x: Math.cos(angle) * (20 + Math.random() * 30),
      y: Math.sin(angle) * (20 + Math.random() * 30),
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      color: Math.random() > 0.4 ? '#c084fc' : '#e9d5ff',
      size: 2 + Math.random() * 3,
    });
  }
}

export function updateRailsBossEntrance(state: GameState, dtSec: number): void {
  const rails = state.rails;
  if (!rails?.bossEntrance || rails.bossCombatActive) return;

  const ent = rails.bossEntrance;
  const def = getBossEntranceDef(ent.bossId);
  const prevMs = ent.elapsedMs;
  ent.elapsedMs = Math.min(ent.durationMs, ent.elapsedMs + dtSec * 1000);

  if (!ent.audioPlayed) {
    ent.audioPlayed = true;
    playBossEntranceStinger(def.audioStinger);
  }

  const boss = state.enemies.find(
    (e) => e.enemyType === EnemyType.BOSS && e.railsBossId === ent.bossId
  );

  if (ent.bossId === 'sentinel_core' && ent.elapsedMs > 200 && ent.elapsedMs < 1900) {
    if (Math.floor(ent.elapsedMs / 120) !== Math.floor(prevMs / 120)) {
      spawnArcParticles(ent, 5);
    }
  }

  if (ent.bossId === 'iron_titan') {
    const landingMs = 900;
    if (!ent.impactDone && ent.elapsedMs >= landingMs) {
      ent.impactDone = true;
      spawnImpactSparks(ent);
      state.screenshake = Math.max(state.screenshake, 5);
    }
    if (ent.elapsedMs >= landingMs && ent.elapsedMs < landingMs + 400) {
      state.screenshake = Math.max(state.screenshake, 4);
    }
  }

  if (ent.bossId === 'void_phantom') {
    const pulsePeriod = 700;
    const pulseIdx = Math.floor(ent.elapsedMs / pulsePeriod);
    const prevIdx = Math.floor(prevMs / pulsePeriod);
    if (pulseIdx !== prevIdx && pulseIdx < 3) {
      ent.riftPulse = pulseIdx + 1;
      spawnRiftParticles(ent);
    }
    if (ent.elapsedMs >= 500 && ent.elapsedMs < 1500) {
      state.screenFlash = Math.max(state.screenFlash, 2);
    }
  }

  for (const p of ent.particles) {
    p.x += p.vx * dtSec;
    p.y += p.vy * dtSec;
    p.life -= dtSec;
  }
  ent.particles = ent.particles.filter((p) => p.life > 0);

  if (ent.elapsedMs >= ent.durationMs) {
    rails.bossCombatActive = true;
    rails.bossEntrance = null;
    if (boss) {
      boss.aiTimer = 0.5;
    }
  }
}

export interface BossEntranceVisuals {
  offsetScreenY: number;
  rotation: number;
  opacity: number;
  cannonGlow: boolean;
  riftScale: number;
}

export function getBossEntranceVisuals(rails: RailsRunState): BossEntranceVisuals | null {
  const ent = rails.bossEntrance;
  if (!ent) return null;

  const t = ent.elapsedMs / ent.durationMs;
  const eased = easeOutCubic(Math.min(1, t));

  switch (ent.bossId) {
    case 'sentinel_core': {
      const fallT = easeOutCubic(Math.min(1, ent.elapsedMs / 2000));
      return {
        offsetScreenY: -200 + fallT * 200,
        rotation: fallT * Math.PI * 2,
        opacity: 1,
        cannonGlow: false,
        riftScale: 1,
      };
    }
    case 'iron_titan': {
      const dropT = easeOutCubic(Math.min(1, ent.elapsedMs / 900));
      const settle = ent.elapsedMs > 900 ? Math.sin((ent.elapsedMs - 900) / 80) * 3 * (1 - (ent.elapsedMs - 900) / 400) : 0;
      return {
        offsetScreenY: -300 + dropT * 300 + settle,
        rotation: 0,
        opacity: 1,
        cannonGlow: ent.elapsedMs >= 1200,
        riftScale: 1,
      };
    }
    case 'void_phantom': {
      const fadeT = easeInOutQuad(Math.min(1, ent.elapsedMs / 1500));
      return {
        offsetScreenY: 0,
        rotation: 0,
        opacity: fadeT,
        cannonGlow: false,
        riftScale: 0.6 + fadeT * 0.4,
      };
    }
    default:
      return { offsetScreenY: 0, rotation: 0, opacity: 1, cannonGlow: false, riftScale: 1 };
  }
}

function titleAlpha(ent: RailsBossEntranceState, def: BossEntrance): number {
  const e = def.effects.find((x) => x.type.startsWith('title_'));
  if (!e) return 0;
  const local = ent.elapsedMs - e.atMs;
  if (local < 0 || local > e.durationMs) return 0;

  if (e.type === 'title_fade') {
    if (local < 200) return local / 200;
    if (local > e.durationMs - 200) return (e.durationMs - local) / 200;
    return 1;
  }
  if (e.type === 'title_shake') {
    return 0.85 + Math.sin(local * 0.02) * 0.15;
  }
  if (e.type === 'title_flicker') {
    const pulse = Math.sin(local * 0.018) > 0 ? 1 : 0.25;
    return pulse * Math.min(1, local / 300);
  }
  return 0;
}

function titleShakeOffset(ent: RailsBossEntranceState, def: BossEntrance): number {
  const e = def.effects.find((x) => x.type === 'title_shake');
  if (!e) return 0;
  const local = ent.elapsedMs - e.atMs;
  if (local < 0 || local > e.durationMs) return 0;
  return Math.sin(local * 0.04) * 4;
}

export function renderRailsBossEntrance(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: { x: number; y: number },
  screenWidth: number,
  screenHeight: number,
  time: number
): void {
  const rails = state.rails;
  if (!rails?.bossEntrance) return;

  const ent = rails.bossEntrance;
  const def = getBossEntranceDef(ent.bossId);
  const boss = state.enemies.find(
    (e) => e.enemyType === EnemyType.BOSS && e.railsBossId === ent.bossId
  );
  const visuals = getBossEntranceVisuals(rails);
  const zoom = rails.viewZoom;

  ctx.save();

  const flashFx = def.effects.find((x) => x.type === 'screen_flash');
  if (flashFx) {
    const local = ent.elapsedMs - flashFx.atMs;
    if (local >= 0 && local < flashFx.durationMs) {
      const a = 0.55 * (1 - local / flashFx.durationMs);
      ctx.fillStyle = flashFx.color ?? '#00FFFF';
      ctx.globalAlpha = a;
      ctx.fillRect(0, 0, screenWidth, screenHeight);
      ctx.globalAlpha = 1;
    }
  }

  const glitchFx = def.effects.find((x) => x.type === 'screen_glitch');
  if (glitchFx) {
    const local = ent.elapsedMs - glitchFx.atMs;
    if (local >= 0 && local < glitchFx.durationMs) {
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 6; i++) {
        const y = (Math.sin(time * 40 + i * 3) * 0.5 + 0.5) * screenHeight;
        const h = 4 + (i % 3) * 6;
        ctx.fillStyle = i % 2 === 0 ? '#c084fc' : '#1e1b4b';
        ctx.fillRect(0, y, screenWidth, h);
      }
      ctx.globalAlpha = 1;
    }
  }

  if (boss && visuals) {
    const bx = boss.pos.x - camera.x;
    const by = boss.pos.y - camera.y + visuals.offsetScreenY / zoom;
    const r = boss.radius;

    if (ent.bossId === 'void_phantom') {
      const riftA = 0.35 + Math.sin(time * 4) * 0.15;
      ctx.strokeStyle = `rgba(192, 132, 252, ${riftA * visuals.opacity})`;
      ctx.lineWidth = 3;
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        ctx.ellipse(
          bx,
          by,
          r * (0.5 + ring * 0.15) * visuals.riftScale,
          r * (0.35 + ring * 0.1) * visuals.riftScale,
          time * 0.5 + ring,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
    }

    for (const p of ent.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha * visuals.opacity;
      ctx.beginPath();
      ctx.arc(bx + p.x / zoom, by + p.y / zoom, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (ent.bossId === 'sentinel_core') {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + time * 3;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + Math.sin(time * 8 + i) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(a) * r * 1.1, by + Math.sin(a) * r * 0.9);
        ctx.stroke();
      }
    }

    if (visuals.cannonGlow) {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
      ctx.beginPath();
      ctx.arc(bx - r * 0.55, by + r * 0.1, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx + r * 0.55, by + r * 0.1, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const titleA = titleAlpha(ent, def);
  if (titleA > 0.02) {
    const shakeX = titleShakeOffset(ent, def);
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle =
      ent.bossId === 'sentinel_core'
        ? '#22d3ee'
        : ent.bossId === 'iron_titan'
          ? '#ea580c'
          : '#e9d5ff';
    ctx.globalAlpha = titleA;
    ctx.fillText(def.textDisplay, screenWidth / 2 + shakeX, screenHeight * 0.22);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
