import { createExplosion } from '../Logic';
import { EntityType, GameState, Entity, EnemyType } from '../types';
import { Vector2 } from '../utils/vector';
import { hasTimeSlowEffect } from '../buffs/applyBuff';
import {
  fireAtPlayer,
  fireCooldownReady,
  markFired,
  pushProjectile,
} from '../ai/enemyBehaviors';
import { getMiniBossDef, isMiniBossId, tryGetMiniBossDef, type MiniBossId } from './miniBossDefs';
import { playMiniBossExplosionSfx } from './miniBossSfx';
import { getMiniBossIncomingDamageMult } from './miniBossPassives';

const SHOCKWAVE_INTERVAL_MS = 4000;
const BURST_INTERVAL_MS = 1500;
const BURST_SHOT_COUNT = 3;
const BURST_SHOT_GAP_MS = 120;

const ECLIPSE_DASH_FRAMES = 14;
const ECLIPSE_DASH_COOLDOWN_FRAMES = 120;
const ECLIPSE_CONE_DEG = 30;
const ECLIPSE_SLASH_RANGE = 130;

const VOID_HIDE_INTERVAL_MS = 6000;
const VOID_HIDE_DURATION_MS = 3000;
const VOID_MAX_DRONES = 4;
const VOID_DRONES_PER_PHASE = 2;

const PLASMA_CLUSTER_INTERVAL_MS = 2600;
const PLASMA_CLUSTER_COUNT = 7;
const PLASMA_EXPLOSION_RADIUS = 110;

const CHRONOS_FIELD_RADIUS = 240;
const CHRONOS_SLOW_FRAMES = 3;

const SWARM_SUMMON_INTERVAL_MS = 4800;
const SWARM_PACK_SIZE = 4;
const SWARM_MAX_MINIONS = 10;

type VelocityResult = { vx: number; vy: number };

function dirNorm(dx: number, dy: number, dist: number): Vector2 {
  if (dist < 0.1) return new Vector2(1, 0);
  return new Vector2(dx / dist, dy / dist);
}

function ensureMiniBossTimers(enemy: Entity): void {
  if (enemy.miniBossShockwaveTimer === undefined) {
    enemy.miniBossShockwaveTimer = SHOCKWAVE_INTERVAL_MS * 0.5;
  }
  if (enemy.miniBossBurstShots === undefined) enemy.miniBossBurstShots = 0;
  if (enemy.miniBossBurstCooldown === undefined) enemy.miniBossBurstCooldown = 0;
  if (enemy.miniBossPhase === undefined) enemy.miniBossPhase = 0;
}

function fireShockwaveSentinelBurst(
  state: GameState,
  enemy: Entity,
  angleToPlayer: number,
  slow: boolean,
): void {
  const dmg = (enemy.damage ?? 14) * (slow ? 0.85 : 1);
  fireAtPlayer(state, enemy, angleToPlayer, {
    speed: 9,
    radius: 7,
    color: '#c084fc',
    damage: dmg,
    spread: 0.08,
    count: 1,
  });
}

export function fireMiniBossShockwave(state: GameState, enemy: Entity): void {
  const def = tryGetMiniBossDef(enemy.miniBossId);
  const auraColor = def?.auraColor ?? '#c084fc';
  const player = state.player;
  const dist = player.pos.distanceTo(enemy.pos);
  const maxRadius = 180;
  const damage = 28 + state.stage * 2;

  if (dist < maxRadius) {
    const falloff = 1 - dist / maxRadius;
    const taken = damage * Math.max(0.35, falloff);
    state.player.health -= taken;
    const dir = player.pos.sub(enemy.pos);
    const mag = dir.magnitude() || 1;
    state.player.knockback = dir.normalize().mul(14 + falloff * 10);
    state.screenFlash = Math.max(state.screenFlash, 4);
    state.screenFlashColor = auraColor;
    state.screenshake = Math.min(state.screenshake + 6, 12);
  }

  playMiniBossExplosionSfx();
  state.particles.push(...createExplosion(enemy.pos, auraColor, 14, 1.2));
  for (let ring = 0; ring < 3; ring++) {
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      state.particles.push({
        id: Math.random().toString(36).slice(2),
        pos: enemy.pos.clone(),
        velocity: new Vector2(Math.cos(ang) * (2 + ring), Math.sin(ang) * (2 + ring)),
        life: 0.5 + ring * 0.15,
        maxLife: 0.65 + ring * 0.15,
        color: auraColor,
        size: (40 + ring * 50) * 0.08,
        particleType: 'ring',
      });
    }
  }
}

function applyEclipseConeSlash(state: GameState, enemy: Entity, dx: number, dy: number, dist: number): void {
  if (dist > ECLIPSE_SLASH_RANGE) return;
  const toPlayer = dirNorm(dx, dy, dist);
  const face = Math.atan2(enemy.velocity.y, enemy.velocity.x);
  const aim = Math.atan2(dy, dx);
  let diff = Math.abs(face - aim);
  if (diff > Math.PI) diff = Math.PI * 2 - diff;
  if (diff > (ECLIPSE_CONE_DEG * Math.PI) / 180) return;

  const dmg = (enemy.damage ?? 60) * (1 + state.stage * 0.08);
  state.player.health -= dmg;
  state.player.knockback = toPlayer.mul(12);
  state.screenFlash = Math.max(state.screenFlash, 3);
  state.screenFlashColor = '#ef4444';
  state.screenshake = Math.min(state.screenshake + 5, 12);
  state.particles.push(...createExplosion(enemy.pos, '#ef4444', 6, 1.1));
}

function countVoidDrones(state: GameState, bossId: string): number {
  return state.enemies.filter((e) => e.miniBossParentId === bossId && e.health > 0).length;
}

function spawnVoidDrone(state: GameState, boss: Entity): void {
  if (countVoidDrones(state, boss.id) >= VOID_MAX_DRONES) return;
  const angle = Math.random() * Math.PI * 2;
  const offset = new Vector2(Math.cos(angle) * 70, Math.sin(angle) * 70);
  const hp = 35 * (1 + state.stage * 0.15);
  state.enemies.push({
    id: `vd_${boss.id}_${Math.random().toString(36).slice(2, 7)}`,
    type: EntityType.ENEMY,
    pos: boss.pos.add(offset),
    radius: 11,
    health: hp,
    maxHealth: hp,
    speed: 2.8 + Math.random() * 0.6,
    velocity: new Vector2(0, 0),
    color: '#1e40af',
    damage: 8 + state.stage * 2,
    enemyType: EnemyType.SWARMER,
    miniBossParentId: boss.id,
    aiState: 'chase',
  });
}

function beginVoidHide(state: GameState, enemy: Entity): void {
  enemy.aiState = 'invisible';
  enemy.miniBossShockwaveTimer = VOID_HIDE_DURATION_MS;
  const existing = countVoidDrones(state, enemy.id);
  const toSpawn = Math.min(VOID_DRONES_PER_PHASE, VOID_MAX_DRONES - existing);
  for (let i = 0; i < toSpawn; i++) spawnVoidDrone(state, enemy);
  state.particles.push(...createExplosion(enemy.pos, '#38bdf8', 8, 0.9));
}

function tickShockwaveSentinel(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  slow: boolean,
): void {
  ensureMiniBossTimers(enemy);
  const angleToPlayer = Math.atan2(dy, dx);
  const dtMs = slow ? 48 : 16;

  enemy.miniBossShockwaveTimer! -= dtMs;
  if (enemy.miniBossShockwaveTimer! <= 0) {
    enemy.miniBossShockwaveTimer = SHOCKWAVE_INTERVAL_MS;
    fireMiniBossShockwave(state, enemy);
  }

  if ((enemy.miniBossBurstCooldown ?? 0) > 0) {
    enemy.miniBossBurstCooldown! -= dtMs;
    if (enemy.miniBossBurstCooldown! <= 0 && (enemy.miniBossBurstShots ?? 0) > 0) {
      fireShockwaveSentinelBurst(state, enemy, angleToPlayer, slow);
      enemy.miniBossBurstShots = (enemy.miniBossBurstShots ?? 0) - 1;
      if (enemy.miniBossBurstShots! > 0) {
        enemy.miniBossBurstCooldown = BURST_SHOT_GAP_MS;
      }
    }
    return;
  }

  const inRange = dist > 200 && dist < 950;
  if (!inRange) return;
  if (!fireCooldownReady(enemy, BURST_INTERVAL_MS, state)) return;

  markFired(enemy);
  enemy.miniBossBurstShots = BURST_SHOT_COUNT - 1;
  fireShockwaveSentinelBurst(state, enemy, angleToPlayer, slow);
  enemy.miniBossBurstCooldown = BURST_SHOT_GAP_MS;
}

function tickVoidHarbingerAttacks(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  slow: boolean,
): void {
  ensureMiniBossTimers(enemy);
  const dtMs = slow ? 48 : 16;
  const angleToPlayer = Math.atan2(dy, dx);

  if (enemy.aiState === 'invisible') {
    enemy.miniBossShockwaveTimer! -= dtMs;
    if (enemy.miniBossShockwaveTimer! <= 0) {
      enemy.aiState = 'chase';
      enemy.miniBossShockwaveTimer = VOID_HIDE_INTERVAL_MS * 0.5;
      pushProjectile(state, enemy, angleToPlayer, 10, 10, '#38bdf8', (enemy.damage ?? 18) * 1.4);
      state.particles.push(...createExplosion(enemy.pos, '#38bdf8', 6, 1));
    }
    return;
  }

  enemy.miniBossShockwaveTimer! -= dtMs;
  if (enemy.miniBossShockwaveTimer! <= 0) {
    enemy.miniBossShockwaveTimer = VOID_HIDE_INTERVAL_MS;
    beginVoidHide(state, enemy);
    return;
  }

  if (dist < 500 && fireCooldownReady(enemy, slow ? 2200 : 1400, state)) {
    markFired(enemy);
    fireAtPlayer(state, enemy, angleToPlayer, {
      speed: 11,
      radius: 6,
      color: '#7dd3fc',
      damage: (enemy.damage ?? 18) * 0.9,
      spread: 0.1,
      count: 2,
    });
  }
}

/** Custom movement for mini-bosses (returns null to fall back to default enemy type). */
export function getMiniBossVelocity(
  enemy: Entity,
  state: GameState,
  enemyDt: number,
  dist: number,
  dx: number,
  dy: number,
): VelocityResult | null {
  if (!enemy.miniBossId) return null;
  const toPlayer = dirNorm(dx, dy, dist);
  const seed = enemy.behaviorSeed ?? 0.5;
  const strafeSign = seed > 0.5 ? 1 : -1;
  const strafe = new Vector2(-toPlayer.y * strafeSign, toPlayer.x * strafeSign);

  if (enemy.miniBossId === 'eclipse_dasher') {
    if (enemy.aiState === 'retreat' && (enemy.aiTimer ?? 0) > 0) {
      return {
        vx: -toPlayer.x * enemy.speed * 1.4,
        vy: -toPlayer.y * enemy.speed * 1.4,
      };
    }
    if (enemy.aiState === 'lunge') {
      if ((enemy.aiTimer ?? 0) > 0) {
        return {
          vx: toPlayer.x * enemy.speed * 4,
          vy: toPlayer.y * enemy.speed * 4,
        };
      }
      applyEclipseConeSlash(state, enemy, dx, dy, dist);
      enemy.miniBossPhase = (enemy.miniBossPhase ?? 0) + 1;
      if ((enemy.miniBossPhase ?? 0) >= 2) {
        enemy.aiState = 'retreat';
        enemy.aiTimer = ECLIPSE_DASH_COOLDOWN_FRAMES;
        enemy.miniBossPhase = 0;
      } else {
        enemy.aiState = 'chase';
        enemy.aiTimer = 10;
      }
    } else if (
      (enemy.aiTimer ?? 0) <= 0 &&
      dist < 700 &&
      (enemy.miniBossPhase ?? 0) < 2 &&
      enemy.aiState !== 'retreat'
    ) {
      enemy.aiState = 'lunge';
      enemy.aiTimer = ECLIPSE_DASH_FRAMES;
      return {
        vx: toPlayer.x * enemy.speed * 4,
        vy: toPlayer.y * enemy.speed * 4,
      };
    }
    const erratic = Math.sin(Date.now() / 400 + seed * 10) * 0.35;
    return {
      vx: (toPlayer.x * 0.5 + strafe.x * (0.5 + erratic)) * enemy.speed,
      vy: (toPlayer.y * 0.5 + strafe.y * (0.5 + erratic)) * enemy.speed,
    };
  }

  if (enemy.miniBossId === 'void_harbinger') {
    if (enemy.aiState === 'invisible') {
      return { vx: strafe.x * enemy.speed * 0.2, vy: strafe.y * enemy.speed * 0.2 };
    }
    return {
      vx: (toPlayer.x * 0.45 + strafe.x * 0.55) * enemy.speed,
      vy: (toPlayer.y * 0.45 + strafe.y * 0.55) * enemy.speed,
    };
  }

  if (enemy.miniBossId === 'shockwave_sentinel') {
    const minZ = 320;
    const maxZ = 680;
    if (dist > maxZ) {
      return { vx: toPlayer.x * enemy.speed, vy: toPlayer.y * enemy.speed };
    }
    if (dist < minZ) {
      enemy.aiState = 'retreat';
      return { vx: -toPlayer.x * enemy.speed * 1.05, vy: -toPlayer.y * enemy.speed * 1.05 };
    }
    enemy.aiState = 'strafe';
    return { vx: strafe.x * enemy.speed, vy: strafe.y * enemy.speed };
  }

  if (enemy.miniBossId === 'plasma_splitter') {
    const minZ = 260;
    const maxZ = 720;
    if (dist > maxZ) {
      return { vx: toPlayer.x * enemy.speed * 0.9, vy: toPlayer.y * enemy.speed * 0.9 };
    }
    if (dist < minZ) {
      return { vx: -toPlayer.x * enemy.speed, vy: -toPlayer.y * enemy.speed };
    }
    return { vx: strafe.x * enemy.speed * 1.1, vy: strafe.y * enemy.speed * 1.1 };
  }

  if (enemy.miniBossId === 'chronos_guardian') {
    if (dist < 180) {
      return { vx: -toPlayer.x * enemy.speed * 0.7, vy: -toPlayer.y * enemy.speed * 0.7 };
    }
    if (dist > 500) {
      return { vx: toPlayer.x * enemy.speed * 0.6, vy: toPlayer.y * enemy.speed * 0.6 };
    }
    return { vx: strafe.x * enemy.speed * 0.5, vy: strafe.y * enemy.speed * 0.5 };
  }

  if (enemy.miniBossId === 'swarm_overlord') {
    if (dist < 200) {
      return { vx: -toPlayer.x * enemy.speed * 1.2, vy: -toPlayer.y * enemy.speed * 1.2 };
    }
    return {
      vx: (toPlayer.x * 0.35 + strafe.x * 0.65) * enemy.speed,
      vy: (toPlayer.y * 0.35 + strafe.y * 0.65) * enemy.speed,
    };
  }

  return null;
}

function pushPlasmaBolt(
  state: GameState,
  enemy: Entity,
  angle: number,
  spread: number,
  slow: boolean,
): void {
  const dmg = (enemy.damage ?? 22) * (slow ? 0.9 : 1);
  pushProjectile(state, enemy, angle + spread, 6.5, 9, '#fb923c', dmg * 0.85);
  const bolt = state.projectiles[state.projectiles.length - 1];
  if (bolt) bolt.explosiveRadius = PLASMA_EXPLOSION_RADIUS;
}

export function applyPlasmaExplosion(
  state: GameState,
  pos: Vector2,
  baseDamage: number,
  radius: number = PLASMA_EXPLOSION_RADIUS,
): void {
  const player = state.player;
  const dist = player.pos.distanceTo(pos);
  if (dist < radius && state.dashIFrameTimer <= 0 && state.playerIFrameTimer <= 0) {
    const falloff = Math.max(0.35, 1 - dist / radius);
    let splash = baseDamage * 0.65 * falloff;
    splash = splash * getMiniBossIncomingDamageMult(state);
    player.health -= splash;
    state.playerIFrameTimer = 30;
    state.screenFlash = Math.max(state.screenFlash, 2);
    state.screenFlashColor = '#fb923c';
  }
  playMiniBossExplosionSfx();
  state.particles.push(...createExplosion(pos, '#fb923c', 12, 1.5));
  state.screenshake = Math.min(state.screenshake + 4, 12);
}

function tickPlasmaSplitter(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  slow: boolean,
): void {
  ensureMiniBossTimers(enemy);
  const angleToPlayer = Math.atan2(dy, dx);
  if (dist < 200 || dist > 900) return;
  if (!fireCooldownReady(enemy, PLASMA_CLUSTER_INTERVAL_MS, state)) return;

  markFired(enemy);
  const spread = 0.55;
  for (let i = 0; i < PLASMA_CLUSTER_COUNT; i++) {
    const offset = PLASMA_CLUSTER_COUNT === 1 ? 0 : ((i / (PLASMA_CLUSTER_COUNT - 1)) - 0.5) * spread;
    pushPlasmaBolt(state, enemy, angleToPlayer, offset, slow);
  }
}

function tickChronosGuardian(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  slow: boolean,
): void {
  ensureMiniBossTimers(enemy);
  const angleToPlayer = Math.atan2(dy, dx);
  if (dist < 620 && fireCooldownReady(enemy, slow ? 2800 : 1800, state)) {
    markFired(enemy);
    playMiniBossExplosionSfx();
    fireAtPlayer(state, enemy, angleToPlayer, {
      speed: 8,
      radius: 8,
      color: '#a78bfa',
      damage: (enemy.damage ?? 20) * 0.8,
      spread: 0.2,
      count: 3,
    });
  }
}

function countSwarmMinions(state: GameState, bossId: string): number {
  return state.enemies.filter((e) => e.miniBossParentId === bossId && e.health > 0).length;
}

function spawnSwarmPackmate(state: GameState, boss: Entity): void {
  if (countSwarmMinions(state, boss.id) >= SWARM_MAX_MINIONS) return;
  const angle = Math.random() * Math.PI * 2;
  const offset = new Vector2(Math.cos(angle) * (50 + Math.random() * 40), Math.sin(angle) * (50 + Math.random() * 40));
  const hp = 28 * (1 + state.stage * 0.12);
  state.enemies.push({
    id: `so_${boss.id}_${Math.random().toString(36).slice(2, 7)}`,
    type: EntityType.ENEMY,
    pos: boss.pos.add(offset),
    radius: 10,
    health: hp,
    maxHealth: hp,
    speed: 2.6 + Math.random() * 0.8,
    velocity: new Vector2(0, 0),
    color: '#fbbf24',
    damage: 10 + state.stage * 2,
    enemyType: EnemyType.SWARM_V2,
    miniBossParentId: boss.id,
    aiState: 'chase',
    behaviorSeed: Math.random(),
  });
}

function tickSwarmOverlord(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  slow: boolean,
): void {
  ensureMiniBossTimers(enemy);
  const dtMs = slow ? 48 : 16;
  enemy.miniBossShockwaveTimer! -= dtMs;
  if (enemy.miniBossShockwaveTimer! <= 0) {
    enemy.miniBossShockwaveTimer = SWARM_SUMMON_INTERVAL_MS;
    const existing = countSwarmMinions(state, enemy.id);
    const toSpawn = Math.min(SWARM_PACK_SIZE, SWARM_MAX_MINIONS - existing);
    if (toSpawn > 0) {
      playMiniBossExplosionSfx();
      for (let i = 0; i < toSpawn; i++) spawnSwarmPackmate(state, enemy);
      state.particles.push(...createExplosion(enemy.pos, '#fbbf24', 6, 0.85));
    }
  }

  const angleToPlayer = Math.atan2(dy, dx);
  if (dist > 180 && dist < 700 && fireCooldownReady(enemy, slow ? 1400 : 900, state)) {
    markFired(enemy);
    fireAtPlayer(state, enemy, angleToPlayer, {
      speed: 10,
      radius: 4,
      color: '#f59e0b',
      damage: (enemy.damage ?? 12) * 0.75,
      spread: 0.35,
      count: 4,
    });
  }
}

/** Chronos slow field + ambient particles — call once per frame from App. */
export function tickMiniBossWorldEffects(state: GameState, dtSec: number): void {
  if (state.gameMode !== 'NORMAL') return;

  for (const enemy of state.enemies) {
    if (enemy.miniBossId !== 'chronos_guardian' || enemy.health <= 0) continue;
    const dist = state.player.pos.distanceTo(enemy.pos);
    if (dist >= CHRONOS_FIELD_RADIUS) continue;

    state.buffs.timeSlow = Math.max(state.buffs.timeSlow, CHRONOS_SLOW_FRAMES);

    if (Math.random() < 0.08) {
      const ang = Math.random() * Math.PI * 2;
      const r = CHRONOS_FIELD_RADIUS * (0.4 + Math.random() * 0.5);
      state.particles.push({
        id: Math.random().toString(36).slice(2),
        pos: enemy.pos.add(new Vector2(Math.cos(ang) * r, Math.sin(ang) * r)),
        velocity: new Vector2(0, 0),
        life: 0.35,
        maxLife: 0.4,
        color: '#a78bfa',
        size: 6,
        particleType: 'ring',
      });
    }
  }

  void dtSec;
}

/** Mini-boss attack patterns — called instead of default enemy attacks when miniBossId is set. */
export function runMiniBossAttacks(
  enemy: Entity,
  state: GameState,
  dist: number,
  dx: number,
  dy: number,
): boolean {
  if (!isMiniBossId(enemy.miniBossId)) return false;
  const slow = hasTimeSlowEffect(state);

  switch (enemy.miniBossId) {
    case 'shockwave_sentinel':
      tickShockwaveSentinel(state, enemy, dist, dx, dy, slow);
      return true;
    case 'eclipse_dasher':
      return true;
    case 'void_harbinger':
      tickVoidHarbingerAttacks(state, enemy, dist, dx, dy, slow);
      return true;
    case 'plasma_splitter':
      tickPlasmaSplitter(state, enemy, dist, dx, dy, slow);
      return true;
    case 'chronos_guardian':
      tickChronosGuardian(state, enemy, dist, dx, dy, slow);
      return true;
    case 'swarm_overlord':
      tickSwarmOverlord(state, enemy, dist, dx, dy, slow);
      return true;
    default:
      return false;
  }
}
