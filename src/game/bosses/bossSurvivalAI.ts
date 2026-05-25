import { EnemyType, type Entity, type GameState } from '../types';
import { fireAtPlayer } from '../ai/enemyBehaviors';
import { getBossAttackPattern, type BossAttackPattern } from './bossSpecs';
import { Vector2 } from '../utils/vector';

/** Phase boundary: below this HP ratio the boss enters phase 2. */
const PHASE2_THRESHOLD = 0.5;

/** Minimum frames between any two boss attacks. */
const GLOBAL_COOLDOWN = 90; // ~1.5s at 60fps

// ── Soft-enrage tuning ──────────────────────────────────────────
// Bosses pack 24k HP × stage scaling and 35% resist. At low DPS a fight can
// drag past 10 minutes, which is unfun bullet-sponge territory. The soft
// enrage gives a steady, fair ramp instead of an unwinnable wall.

/** Seconds after boss spawn before enrage starts ramping. */
const ENRAGE_START_S = 180;
/** Seconds it takes to advance one full enrage level past the start. */
const ENRAGE_STEP_S = 60;
/** Hard cap on enrage level — prevents asymptotic "impossible" boss. */
const ENRAGE_MAX_LEVEL = 2.0;
/** Damage gain per enrage level. lvl=1 → 1.5×, lvl=2 → 2.0× (capped). */
const ENRAGE_DAMAGE_PER_LEVEL = 0.5;
/** Cooldown reduction (attack speed gain) per enrage level. lvl=1 → 1.3×, lvl=2 → 1.6×. */
const ENRAGE_SPEED_PER_LEVEL = 0.3;
/** Seconds the "BOSS ENRAGED!" banner remains on-screen. */
const ENRAGE_WARNING_DURATION_S = 4;

export interface BossEnrageMultipliers {
  /** 0 (fresh) → 2 (full enrage). */
  level: number;
  /** Damage multiplier applied to every boss projectile (1 + level * 0.5). */
  damMult: number;
  /** Attack-speed multiplier — divides cooldown so attacks fire sooner (1 + level * 0.3). */
  speedMult: number;
}

/**
 * Soft-enrage curve. Pure function so it's easy to unit-test and to call
 * from the renderer for aura color.
 *
 *   enrageLevel = clamp((bossEngageTimer - 180) / 60, 0, 2)
 *   damMult     = 1 + enrageLevel * 0.5
 *   speedMult   = 1 + enrageLevel * 0.3
 */
export function computeBossEnrage(engageTimerSec: number): BossEnrageMultipliers {
  const raw = (engageTimerSec - ENRAGE_START_S) / ENRAGE_STEP_S;
  const level = Math.max(0, Math.min(ENRAGE_MAX_LEVEL, raw));
  return {
    level,
    damMult: 1 + level * ENRAGE_DAMAGE_PER_LEVEL,
    speedMult: 1 + level * ENRAGE_SPEED_PER_LEVEL,
  };
}

/** Read-side helper used by the renderer (aura tint) and HUD. */
export function getBossEnrageMultipliers(enemy: Entity): BossEnrageMultipliers {
  return computeBossEnrage(enemy.bossEngageTimer ?? 0);
}

function bossPhase(enemy: Entity): 1 | 2 {
  if (enemy.maxHealth <= 0) return 1;
  return enemy.health / enemy.maxHealth <= PHASE2_THRESHOLD ? 2 : 1;
}

function initBossPatternState(enemy: Entity): void {
  if (enemy.bossPatternTimer == null) enemy.bossPatternTimer = 0;
  if (enemy.bossPhaseAnnounced == null) enemy.bossPhaseAnnounced = false;
  if (enemy.bossEngageTimer == null) enemy.bossEngageTimer = 0;
  if (enemy.bossEnrageAnnounced == null) enemy.bossEnrageAnnounced = false;
}

// ── Attack helpers ──────────────────────────────────────────────

/** Radial burst of N projectiles evenly spread. */
function fireRadialBurst(
  state: GameState,
  enemy: Entity,
  count: number,
  opts: { speed: number; radius: number; color: string; damage: number },
): void {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    fireAtPlayer(state, enemy, angle, {
      speed: opts.speed,
      radius: opts.radius,
      color: opts.color,
      damage: opts.damage,
      spread: 0,
      count: 1,
    });
  }
}

/** Aimed fan of projectiles toward the player. */
function fireFan(
  state: GameState,
  enemy: Entity,
  dx: number,
  dy: number,
  count: number,
  spreadAngle: number,
  opts: { speed: number; radius: number; color: string; damage: number },
): void {
  const baseAngle = Math.atan2(dy, dx);
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : ((i / (count - 1)) - 0.5) * spreadAngle;
    fireAtPlayer(state, enemy, baseAngle + offset, {
      speed: opts.speed,
      radius: opts.radius,
      color: opts.color,
      damage: opts.damage,
      spread: 0,
      count: 1,
    });
  }
}

/** Apply knockback to the boss when hit by a projectile (called from App.tsx). */
export function applyBossKnockback(
  enemy: Entity,
  fromDir: Vector2,
  force: number,
): void {
  if (enemy.enemyType !== EnemyType.BOSS) return;
  const kb = fromDir.normalize().mul(force);
  enemy.velocity = new Vector2(
    (enemy.velocity?.x ?? 0) + kb.x,
    (enemy.velocity?.y ?? 0) + kb.y,
  );
}

// ── Pattern implementations ─────────────────────────────────────
// Each ticker now receives the precomputed enrage multipliers from the
// dispatcher. damMult scales projectile damage; speedMult shortens the
// cooldown so attacks fire more frequently as the fight drags on.

function tickStandard(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  _dt: number,
  enrage: BossEnrageMultipliers,
): void {
  const phase = bossPhase(enemy);
  const cd = (phase === 2 ? GLOBAL_COOLDOWN * 0.7 : GLOBAL_COOLDOWN) / enrage.speedMult;
  if ((enemy.bossPatternTimer ?? 0) > 0) return;
  if (dist > 600) return;

  enemy.bossPatternTimer = cd;
  const dmg = (enemy.damage ?? 30) * (phase === 2 ? 1.3 : 1) * enrage.damMult;

  fireFan(state, enemy, dx, dy, phase === 2 ? 5 : 3, 0.4, {
    speed: 5, radius: 10, color: '#ef4444', damage: dmg,
  });

  if (phase === 2 && Math.random() < 0.35) {
    fireRadialBurst(state, enemy, 8, {
      speed: 3.5, radius: 8, color: '#fca5a5', damage: dmg * 0.6,
    });
  }
}

function tickGravityPulse(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  _dt: number,
  enrage: BossEnrageMultipliers,
): void {
  const phase = bossPhase(enemy);
  const cd = (phase === 2 ? 60 : 90) / enrage.speedMult;
  if ((enemy.bossPatternTimer ?? 0) > 0) return;

  enemy.bossPatternTimer = cd;
  state.buffs.timeSlow = Math.max(state.buffs.timeSlow, phase === 2 ? 55 : 40);
  state.screenshake = Math.min(14, state.screenshake + 5);

  const dmg = (enemy.damage ?? 30) * 0.85 * enrage.damMult;

  if (dist < 480) {
    const angle = Math.atan2(dy, dx);
    const count = phase === 2 ? 10 : 6;
    for (let i = 0; i < count; i++) {
      const offset = ((i / (count - 1)) - 0.5) * (phase === 2 ? 1.0 : 0.6);
      fireAtPlayer(state, enemy, angle + offset, {
        speed: phase === 2 ? 5.5 : 4.5,
        radius: 10,
        color: '#6366f1',
        damage: dmg,
        spread: 0.05,
        count: 1,
      });
    }
  }

  // Phase 2: radial gravity shockwave every other attack
  if (phase === 2 && Math.random() < 0.5) {
    fireRadialBurst(state, enemy, 12, {
      speed: 3, radius: 9, color: '#a78bfa', damage: dmg * 0.5,
    });
  }
}

function tickEnforcerBarrage(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  _dt: number,
  enrage: BossEnrageMultipliers,
): void {
  const phase = bossPhase(enemy);
  const cd = (phase === 2 ? 40 : 55) / enrage.speedMult;
  if ((enemy.bossPatternTimer ?? 0) > 0 || dist > 700) return;

  enemy.bossPatternTimer = cd;
  const angle = Math.atan2(dy, dx);
  const dmg = (enemy.damage ?? 35) * 1.1 * enrage.damMult;

  // Phase 1: 5-shot fan
  fireAtPlayer(state, enemy, angle, {
    speed: 8,
    radius: 12,
    color: '#dc2626',
    damage: dmg,
    spread: phase === 2 ? 0.18 : 0.12,
    count: phase === 2 ? 8 : 5,
  });
  state.screenFlash = Math.max(state.screenFlash, 1.5);

  // Phase 2: secondary delayed burst
  if (phase === 2) {
    setTimeout(() => {
      if (enemy.health <= 0) return;
      fireFan(state, enemy, dx, dy, 5, 0.8, {
        speed: 5, radius: 10, color: '#f87171', damage: dmg * 0.6,
      });
    }, 400);
  }
}

function tickColossusSlamPattern(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  _dt: number,
  enrage: BossEnrageMultipliers,
): void {
  const phase = bossPhase(enemy);
  const cd = (phase === 2 ? 70 : 100) / enrage.speedMult;
  if ((enemy.bossPatternTimer ?? 0) > 0) return;

  enemy.bossPatternTimer = cd;
  const dmg = (enemy.damage ?? 40) * 1.5 * enrage.damMult;

  // Ground slam: radial shockwave
  const ringCount = phase === 2 ? 16 : 10;
  fireRadialBurst(state, enemy, ringCount, {
    speed: phase === 2 ? 4.5 : 3.5,
    radius: phase === 2 ? 14 : 12,
    color: '#94a3b8',
    damage: dmg,
  });

  state.screenshake = Math.min(20, state.screenshake + 8);
  state.screenFlash = Math.max(state.screenFlash, 2);

  // Phase 2: follow-up aimed triple after slam
  if (phase === 2 && dist < 500) {
    setTimeout(() => {
      if (enemy.health <= 0) return;
      fireFan(state, enemy, dx, dy, 3, 0.3, {
        speed: 7, radius: 11, color: '#64748b', damage: dmg * 0.5,
      });
    }, 500);
  }
}

function tickSwarmCrown(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  _dt: number,
  enrage: BossEnrageMultipliers,
): void {
  const phase = bossPhase(enemy);
  const cd = (phase === 2 ? 50 : 75) / enrage.speedMult;
  if ((enemy.bossPatternTimer ?? 0) > 0) return;

  enemy.bossPatternTimer = cd;
  const dmg = (enemy.damage ?? 25) * 0.7 * enrage.damMult;

  // Spiral pattern — swarm feel
  const count = phase === 2 ? 12 : 8;
  const baseAngle = (Date.now() / 1000) * 2;
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (i / count) * Math.PI * 2;
    fireAtPlayer(state, enemy, angle, {
      speed: 3.5 + Math.sin(i) * 1.5,
      radius: 8,
      color: '#4ade80',
      damage: dmg,
      spread: 0,
      count: 1,
    });
  }

  // Phase 2: aimed tracking volley
  if (phase === 2 && dist < 500) {
    fireFan(state, enemy, dx, dy, 4, 0.5, {
      speed: 5, radius: 9, color: '#22c55e', damage: dmg * 1.2,
    });
  }
}

function tickWraithBlink(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  _dt: number,
  enrage: BossEnrageMultipliers,
): void {
  const phase = bossPhase(enemy);
  const cd = (phase === 2 ? 45 : 70) / enrage.speedMult;
  if ((enemy.bossPatternTimer ?? 0) > 0) return;

  enemy.bossPatternTimer = cd;
  const dmg = (enemy.damage ?? 30) * enrage.damMult;

  if (phase === 2 || Math.random() < 0.4) {
    // Blink: teleport closer to player + radial burst
    const blinkDist = Math.min(dist * 0.6, 300);
    const angle = Math.atan2(dy, dx);
    enemy.pos = new Vector2(
      enemy.pos.x + Math.cos(angle) * blinkDist,
      enemy.pos.y + Math.sin(angle) * blinkDist,
    );
    state.screenFlash = Math.max(state.screenFlash, 1.5);

    fireRadialBurst(state, enemy, phase === 2 ? 10 : 6, {
      speed: 5, radius: 9, color: '#818cf8', damage: dmg * 0.8,
    });
  } else {
    // Regular aimed attack
    fireFan(state, enemy, dx, dy, 3, 0.35, {
      speed: 6, radius: 10, color: '#6366f1', damage: dmg,
    });
  }
}

// ── Main tick dispatcher ────────────────────────────────────────

type PatternTicker = (
  s: GameState,
  e: Entity,
  d: number,
  dx: number,
  dy: number,
  dt: number,
  enrage: BossEnrageMultipliers,
) => void;

const PATTERN_TICKERS: Record<BossAttackPattern, PatternTicker> = {
  standard: tickStandard,
  gravity_pulse: tickGravityPulse,
  enforcer_barrage: tickEnforcerBarrage,
  colossus_slam: tickColossusSlamPattern,
  swarm_crown: tickSwarmCrown,
  wraith_blink: tickWraithBlink,
};

/**
 * Stage-specific boss pattern ticks.
 * Phase 1 (HP > 50%): standard attacks.
 * Phase 2 (HP ≤ 50%): harder patterns + additional projectiles + screen FX.
 * Soft enrage (>180s alive): progressive damage + attack-speed buff so a
 * low-DPS player can't stall the fight indefinitely.
 */
export function tickSurvivalBossPattern(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  dt: number,
): void {
  if (enemy.enemyType !== EnemyType.BOSS || !state.activeBossId) return;

  initBossPatternState(enemy);
  enemy.bossPatternTimer = (enemy.bossPatternTimer ?? 0) - dt;

  // Track engage time in seconds. dt is in 60fps frames, so divide by 60.
  // We intentionally use unscaled `dt` (not enemyDt) so a player chugging
  // time-slow buffs can't game the enrage clock.
  const prevEngage = enemy.bossEngageTimer ?? 0;
  const nextEngage = prevEngage + dt / 60;
  enemy.bossEngageTimer = nextEngage;

  // Fire the "BOSS ENRAGED!" banner exactly once, the frame the boss
  // crosses the 180-second threshold.
  if (
    !enemy.bossEnrageAnnounced &&
    prevEngage < ENRAGE_START_S &&
    nextEngage >= ENRAGE_START_S
  ) {
    enemy.bossEnrageAnnounced = true;
    state.bossEnrageWarningTimer = ENRAGE_WARNING_DURATION_S;
    state.screenshake = Math.min(24, state.screenshake + 12);
    state.screenFlash = Math.max(state.screenFlash, 2.5);
    state.screenFlashColor = '#ef4444';
  }

  const enrage = computeBossEnrage(nextEngage);

  // Phase 2 announcement — once per boss
  const phase = bossPhase(enemy);
  if (phase === 2 && !enemy.bossPhaseAnnounced) {
    enemy.bossPhaseAnnounced = true;
    state.screenshake = Math.min(20, state.screenshake + 10);
    state.screenFlash = Math.max(state.screenFlash, 3);
    // Speed up in phase 2
    enemy.speed = (enemy.speed ?? 1) * 1.15;
  }

  const pattern = enemy.bossPatternId ?? getBossAttackPattern(state.activeBossId);
  const ticker = PATTERN_TICKERS[pattern] ?? PATTERN_TICKERS.standard;
  ticker(state, enemy, dist, dx, dy, dt, enrage);
}
