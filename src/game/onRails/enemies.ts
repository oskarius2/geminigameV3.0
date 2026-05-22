import { EntityType, EnemyType, GameState } from '../types';
import { Vector2 } from '../utils/vector';
import { clampLateral, sampleRailAt, worldFromRail } from './geometry';
import { smoothFollowLateral } from './steering';
import { spawnRailsPowerupPickup } from './powerups';
import { getRailsBossForLevel, spawnRailsBoss } from './bosses';

/** Spawn this far ahead of player along the rail (world units). */
export const RAILS_SPAWN_AHEAD = 1450;

const HOVER_MIN_AHEAD = 720;
const ENGAGE_AHEAD_THRESHOLD = 480;
const HOVER_SCROLL_MULT = 0.32;

const ENEMY_PATH_FORWARD_SPEED = 0;
const RAILS_ENEMY_STRAFE_RATE = 7;
const RAILS_STRAFE_RETARGET_DIST = 18;

export interface RailsEnemyDef {
  type: EnemyType;
  health: number;
  radius: number;
  color: string;
  /** Lateral strafe rate multiplier. */
  strafeMult: number;
  collisionDamage: number;
  shotDamage?: number;
  shotCooldownMin?: number;
  shotCooldownMax?: number;
}

export const RAILS_ENEMY_DEFS: Partial<Record<EnemyType, RailsEnemyDef>> = {
  [EnemyType.RANGED]: {
    type: EnemyType.RANGED,
    health: 20,
    radius: 20,
    color: '#00FF00',
    strafeMult: 1,
    collisionDamage: 0,
    shotDamage: 15,
    shotCooldownMin: 0.55,
    shotCooldownMax: 1.05,
  },
  [EnemyType.DASHER]: {
    type: EnemyType.DASHER,
    health: 15,
    radius: 18,
    color: '#FF6600',
    strafeMult: 1.5,
    collisionDamage: 20,
  },
  [EnemyType.ZAPPER]: {
    type: EnemyType.ZAPPER,
    health: 10,
    radius: 16,
    color: '#00FFFF',
    strafeMult: 0.6,
    collisionDamage: 0,
    shotDamage: 12,
    shotCooldownMin: 0.35,
    shotCooldownMax: 0.5,
  },
  [EnemyType.BLOCKER]: {
    type: EnemyType.BLOCKER,
    health: 50,
    radius: 40,
    color: '#808080',
    strafeMult: 0.5,
    collisionDamage: 25,
  },
  [EnemyType.SWARM_V2]: {
    type: EnemyType.SWARM_V2,
    health: 5,
    radius: 8,
    color: '#FF00FF',
    strafeMult: 1.2,
    collisionDamage: 0,
    shotDamage: 5,
    shotCooldownMin: 1.2,
    shotCooldownMax: 1.8,
  },
  [EnemyType.CHARGER]: {
    type: EnemyType.CHARGER,
    health: 25,
    radius: 22,
    color: '#FF0000',
    strafeMult: 1.1,
    collisionDamage: 30,
  },
};

export const RAILS_KILL_SCORE: Partial<Record<EnemyType, number>> = {
  [EnemyType.RANGED]: 100,
  [EnemyType.DASHER]: 150,
  [EnemyType.ZAPPER]: 200,
  [EnemyType.BLOCKER]: 250,
  [EnemyType.SWARM_V2]: 50,
  [EnemyType.CHARGER]: 175,
  [EnemyType.BOSS]: 2000,
};

export function railsEnemyKillScore(enemyType: EnemyType | undefined): number {
  return RAILS_KILL_SCORE[enemyType ?? EnemyType.RANGED] ?? 100;
}

export interface RailsWaveSpawn {
  type: EnemyType;
  count: number;
  /** For SWARM: spawn this many groups of 5–10. */
  groups?: number;
}

export interface RailsWaveSegment {
  id: string;
  startSec: number;
  spawns: RailsWaveSpawn[];
  /** 1–2 powerup pickups when wave fires. */
  powerupCount: number;
}

export const RAILS_WAVES_TUNNEL_01: RailsWaveSegment[] = [
  {
    id: 't1_intro',
    startSec: 0,
    spawns: [{ type: EnemyType.RANGED, count: 3 }],
    powerupCount: 1,
  },
  {
    id: 't1_dasher',
    startSec: 20,
    spawns: [
      { type: EnemyType.RANGED, count: 2 },
      { type: EnemyType.DASHER, count: 2 },
    ],
    powerupCount: 2,
  },
  {
    id: 't1_heavy',
    startSec: 40,
    spawns: [{ type: EnemyType.RANGED, count: 5 }],
    powerupCount: 2,
  },
];

export const RAILS_WAVES_ASTEROID: RailsWaveSegment[] = [
  {
    id: 'ab_blocker',
    startSec: 0,
    spawns: [{ type: EnemyType.BLOCKER, count: 2 }],
    powerupCount: 1,
  },
  {
    id: 'ab_charger',
    startSec: 30,
    spawns: [
      { type: EnemyType.CHARGER, count: 3 },
      { type: EnemyType.RANGED, count: 1 },
    ],
    powerupCount: 2,
  },
  {
    id: 'ab_swarm',
    startSec: 50,
    spawns: [{ type: EnemyType.SWARM_V2, count: 0, groups: 2 }],
    powerupCount: 2,
  },
  {
    id: 'ab_zapper',
    startSec: 75,
    spawns: [{ type: EnemyType.ZAPPER, count: 2 }],
    powerupCount: 1,
  },
];

export const RAILS_WAVES_VOID: RailsWaveSegment[] = [
  {
    id: 'vr_zapper',
    startSec: 0,
    spawns: [{ type: EnemyType.ZAPPER, count: 3 }],
    powerupCount: 1,
  },
  {
    id: 'vr_swarm',
    startSec: 40,
    spawns: [{ type: EnemyType.SWARM_V2, count: 0, groups: 3 }],
    powerupCount: 2,
  },
  {
    id: 'vr_charger',
    startSec: 70,
    spawns: [{ type: EnemyType.CHARGER, count: 4 }],
    powerupCount: 2,
  },
  {
    id: 'vr_blocker',
    startSec: 100,
    spawns: [{ type: EnemyType.BLOCKER, count: 3 }],
    powerupCount: 2,
  },
];

const WAVES_BY_LEVEL: Record<string, RailsWaveSegment[]> = {
  tunnel_01: RAILS_WAVES_TUNNEL_01,
  asteroid_belt: RAILS_WAVES_ASTEROID,
  void_run: RAILS_WAVES_VOID,
};

export function getRailsWavesForLevel(levelId: string): RailsWaveSegment[] {
  return WAVES_BY_LEVEL[levelId] ?? [];
}

const BOSS_AT_SEC: Record<string, number> = {
  tunnel_01: 60,
  asteroid_belt: 90,
  void_run: 120,
};

function syncEnemyWorldFromRail(state: GameState, enemy: GameState['enemies'][0]): void {
  const rails = state.rails!;
  const dist = enemy.railsDistance ?? rails.distance + 400;
  const lat = clampLateral(enemy.railsLateral ?? 0, rails.corridorHalfWidth);
  enemy.railsLateral = lat;
  const sample = sampleRailAt(rails.centerline, rails.cumulativeLengths, dist);
  const pos = worldFromRail(sample, lat);
  enemy.pos.x = pos.x;
  enemy.pos.y = pos.y;
}

function pickStrafeTarget(
  state: GameState,
  enemy: GameState['enemies'][0],
  mult: number
): void {
  const rails = state.rails!;
  const span = rails.corridorHalfWidth * 0.88;
  const playerLat = rails.lateral;

  switch (enemy.enemyType) {
    case EnemyType.BLOCKER:
      enemy.railsLateralTarget = clampLateral(playerLat * 0.35, rails.corridorHalfWidth);
      break;
    case EnemyType.DASHER: {
      const away = playerLat >= 0 ? -0.75 : 0.75;
      enemy.railsLateralTarget = away * span;
      break;
    }
    case EnemyType.RANGED:
      enemy.railsLateralTarget = (Math.random() * 2 - 1) * span * 0.75;
      break;
    case EnemyType.CHARGER:
      enemy.railsLateralTarget = (Math.random() > 0.5 ? 1 : -1) * span * 0.65;
      break;
    default:
      enemy.railsLateralTarget = (Math.random() * 2 - 1) * span * mult;
  }
}

function shouldEngageEnemy(
  state: GameState,
  enemy: GameState['enemies'][0]
): boolean {
  const rails = state.rails!;
  const ahead = (enemy.railsDistance ?? 0) - rails.distance;
  if (ahead <= ENGAGE_AHEAD_THRESHOLD) return true;
  if (rails.forward > rails.corridorHalfWidth * 0.2) return true;
  if (state.survivalTime > 2 + (enemy.behaviorSeed ?? 0) * 0.04) return true;
  return false;
}

function applyHoverDrift(
  state: GameState,
  enemy: GameState['enemies'][0],
  scroll: number,
  dtSec: number
): void {
  const rails = state.rails!;
  const minDist = rails.distance + HOVER_MIN_AHEAD;
  const drift = (ENEMY_PATH_FORWARD_SPEED - scroll * HOVER_SCROLL_MULT) * dtSec;
  enemy.railsDistance = (enemy.railsDistance ?? minDist) + drift;
  if (enemy.railsDistance < minDist) {
    enemy.railsDistance = minDist;
  }
}

function fireEnemyShot(
  state: GameState,
  enemy: GameState['enemies'][0],
  player: GameState['player'],
  damage: number,
  speed: number,
  spread = 0.12
): void {
  const dx = player.pos.x - enemy.pos.x;
  const dy = player.pos.y - enemy.pos.y;
  const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread;
  state.projectiles.push({
    id: `rails_${Math.random().toString(36).slice(2)}`,
    type: EntityType.PROJECTILE,
    pos: enemy.pos.clone(),
    radius: enemy.enemyType === EnemyType.SWARM_V2 ? 4 : 6,
    health: 1,
    maxHealth: 1,
    speed,
    velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
    color: enemy.color,
    ownerId: enemy.id,
    damage,
  });
}

export function spawnRailsEnemy(
  state: GameState,
  enemyType: EnemyType,
  spawnDistance: number,
  lateralNorm: number
): void {
  const def = RAILS_ENEMY_DEFS[enemyType];
  if (!def) return;

  const rails = state.rails!;
  const lateral = clampLateral(
    lateralNorm * rails.corridorHalfWidth,
    rails.corridorHalfWidth
  );
  const sample = sampleRailAt(
    rails.centerline,
    rails.cumulativeLengths,
    spawnDistance
  );
  const pos = worldFromRail(sample, lateral);

  state.enemies.push({
    id: Math.random().toString(36).slice(2),
    type: EntityType.ENEMY,
    pos: new Vector2(pos.x, pos.y),
    radius: def.radius,
    health: def.health,
    maxHealth: def.health,
    speed: 0,
    velocity: new Vector2(0, 0),
    color: def.color,
    enemyType,
    damage: def.collisionDamage,
    railsDistance: spawnDistance,
    railsLateral: lateral,
    railsLateralTarget: lateral,
    aiTimer: Math.random() * (def.shotCooldownMax ?? 1),
    aiState: enemyType === EnemyType.CHARGER ? 'windup' : 'hover',
    behaviorSeed: Math.random() * 100,
  });
}

export function spawnRailsSwarmGroup(
  state: GameState,
  spawnDistance: number,
  lateralNorm: number
): void {
  const count = 5 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const spread = (i / Math.max(1, count - 1) - 0.5) * 0.6;
    spawnRailsEnemy(state, EnemyType.SWARM_V2, spawnDistance + i * 25, lateralNorm + spread);
  }
}

/** @deprecated Use spawnRailsEnemy */
export function spawnRailsRangedEnemy(
  state: GameState,
  spawnDistance: number,
  lateralNorm: number
): void {
  spawnRailsEnemy(state, EnemyType.RANGED, spawnDistance, lateralNorm);
}

function spawnWavePack(
  state: GameState,
  spawn: RailsWaveSpawn,
  baseDist: number
): void {
  if (spawn.groups && spawn.type === EnemyType.SWARM_V2) {
    for (let g = 0; g < spawn.groups; g++) {
      const lat = Math.random() * 2 - 1;
      spawnRailsSwarmGroup(state, baseDist + g * 120, lat);
    }
    return;
  }
  for (let i = 0; i < spawn.count; i++) {
    const lateralNorm =
      spawn.count <= 1 ? 0 : (i / (spawn.count - 1)) * 2 - 1;
    spawnRailsEnemy(
      state,
      spawn.type,
      baseDist + 80 + i * 50 + Math.random() * 60,
      lateralNorm
    );
  }
}

export function processRailsWaves(state: GameState): void {
  const rails = state.rails!;
  if (rails.bossSpawned) return;

  const waves = WAVES_BY_LEVEL[rails.levelId];
  if (!waves) return;

  const t = state.survivalTime;
  for (const wave of waves) {
    if (rails.triggeredWaveIds.includes(wave.id)) continue;
    if (t < wave.startSec) continue;

    rails.triggeredWaveIds.push(wave.id);
    const baseDist = rails.distance + RAILS_SPAWN_AHEAD + 80;

    for (const spawn of wave.spawns) {
      spawnWavePack(state, spawn, baseDist);
    }

    const puCount = wave.powerupCount;
    for (let p = 0; p < puCount; p++) {
      spawnRailsPowerupPickup(
        state,
        baseDist + 200 + p * 90,
        Math.random() * 2 - 1
      );
    }
  }

  const bossAt = BOSS_AT_SEC[rails.levelId];
  const bossDist = rails.railLength - (rails.levelId === 'void_run' ? 700 : rails.levelId === 'asteroid_belt' ? 600 : 500);
  const timeReady = bossAt !== undefined && t >= bossAt;
  const distReady = rails.distance >= bossDist;
  if (!rails.bossSpawned && (timeReady || distReady)) {
    const bossId = getRailsBossForLevel(rails.levelId);
    if (bossId) spawnRailsBoss(state, bossId);
  }
}

export function updateRailsEnemies(state: GameState, dtSec: number): void {
  const rails = state.rails;
  if (!rails) return;

  const scroll = rails.scrollSpeed * rails.enemySlowMult;
  const player = state.player;

  for (const enemy of state.enemies) {
    if (enemy.railsDying) continue;
    if (enemy.health <= 0) continue;
    if (enemy.enemyType === EnemyType.BOSS) continue;

    const def = RAILS_ENEMY_DEFS[enemy.enemyType ?? EnemyType.RANGED];
    if (!def) continue;

    if (enemy.railsDistance === undefined) {
      enemy.railsDistance = rails.distance + RAILS_SPAWN_AHEAD * 0.85;
    }
    if (enemy.railsLateral === undefined) enemy.railsLateral = 0;
    if (enemy.railsLateralTarget === undefined) {
      enemy.railsLateralTarget = enemy.railsLateral;
    }

    if (enemy.aiState === 'hover' && shouldEngageEnemy(state, enemy)) {
      enemy.aiState = 'engage';
    }

    const hovering = enemy.aiState === 'hover';
    if (hovering) {
      applyHoverDrift(state, enemy, scroll, dtSec);
    } else {
      enemy.railsDistance += (ENEMY_PATH_FORWARD_SPEED - scroll) * dtSec;
    }

    enemy.railsDistance = Math.max(
      rails.distance - 200,
      Math.min(rails.railLength, enemy.railsDistance)
    );

    const strafeRate = RAILS_ENEMY_STRAFE_RATE * def.strafeMult;
    const latGap = Math.abs(enemy.railsLateralTarget - enemy.railsLateral);
    if (latGap < RAILS_STRAFE_RETARGET_DIST) {
      pickStrafeTarget(state, enemy, def.strafeMult);
    }

    if (enemy.enemyType === EnemyType.ZAPPER && Math.random() < dtSec * 1.8) {
      enemy.railsLateralTarget = (Math.random() * 2 - 1) * rails.corridorHalfWidth * 0.85;
    }

    if (enemy.enemyType === EnemyType.CHARGER) {
      const engaged = enemy.aiState === 'engage' || enemy.aiState === 'lunge';
      if (!engaged && shouldEngageEnemy(state, enemy)) {
        enemy.aiState = 'windup';
        enemy.aiTimer = 0.8;
      }
      if (enemy.aiState === 'windup') {
        enemy.aiTimer = (enemy.aiTimer ?? 0) - dtSec;
        if (enemy.aiTimer <= 0) {
          enemy.aiState = 'lunge';
          enemy.aiTimer = 0.55;
          const toPlayer = rails.lateral - (enemy.railsLateral ?? 0);
          enemy.railsLateralTarget = clampLateral(
            (enemy.railsLateral ?? 0) + toPlayer * 1.4,
            rails.corridorHalfWidth
          );
        }
      } else if (enemy.aiState === 'lunge') {
        enemy.aiTimer = (enemy.aiTimer ?? 0) - dtSec;
        enemy.railsDistance -= scroll * 1.15 * dtSec;
        enemy.railsLateral = smoothFollowLateral(
          enemy.railsLateral,
          enemy.railsLateralTarget,
          rails.corridorHalfWidth,
          dtSec,
          strafeRate * 2.8
        );
        if (enemy.aiTimer <= 0) {
          enemy.aiState = 'windup';
          enemy.aiTimer = 1.4;
        }
        syncEnemyWorldFromRail(state, enemy);
        continue;
      }
    }

    enemy.railsLateral = smoothFollowLateral(
      enemy.railsLateral,
      enemy.railsLateralTarget,
      rails.corridorHalfWidth,
      dtSec,
      strafeRate
    );

    syncEnemyWorldFromRail(state, enemy);

    const canShoot =
      !hovering &&
      def.shotDamage &&
      def.shotCooldownMin !== undefined &&
      (enemy.enemyType !== EnemyType.RANGED ||
        (enemy.railsDistance ?? 0) - rails.distance < 900);

    if (canShoot) {
      enemy.aiTimer = (enemy.aiTimer ?? 0) - dtSec;
      if (enemy.aiTimer <= 0) {
        if (enemy.enemyType === EnemyType.ZAPPER) {
          for (let b = 0; b < 3; b++) {
            fireEnemyShot(state, enemy, player, def.shotDamage, 9, 0.08);
          }
        } else {
          fireEnemyShot(
            state,
            enemy,
            player,
            def.shotDamage,
            enemy.enemyType === EnemyType.SWARM_V2 ? 6 : 8
          );
        }
        enemy.aiTimer =
          def.shotCooldownMin +
          Math.random() * ((def.shotCooldownMax ?? 1) - def.shotCooldownMin);
      }
    }

    const driftVel = hovering
      ? (ENEMY_PATH_FORWARD_SPEED - scroll * HOVER_SCROLL_MULT)
      : ENEMY_PATH_FORWARD_SPEED - scroll;
    const sample = sampleRailAt(
      rails.centerline,
      rails.cumulativeLengths,
      enemy.railsDistance
    );
    enemy.velocity = new Vector2(
      sample.tangentX * driftVel,
      sample.tangentY * driftVel
    );
  }
}

export function applyRailsProjectileDrift(state: GameState, dtSec: number): void {
  const rails = state.rails;
  if (!rails) return;

  const sample = sampleRailAt(
    rails.centerline,
    rails.cumulativeLengths,
    rails.distance
  );
  const d = rails.scrollSpeed * dtSec;

  for (const proj of state.projectiles) {
    if (proj.ownerId !== 'player') {
      proj.pos.x += sample.tangentX * d;
      proj.pos.y += sample.tangentY * d;
      if (proj.homing) {
        const player = state.player;
        const dx = player.pos.x - proj.pos.x;
        const dy = player.pos.y - proj.pos.y;
        const len = Math.hypot(dx, dy) || 1;
        const spd = proj.speed || 7;
        proj.velocity = new Vector2((dx / len) * spd, (dy / len) * spd);
      }
    }
  }
}

/** ON_RAILS body collision — always 1 HP per hit when engaged. */
export function railsEnemyBodyDamage(enemy: GameState['enemies'][0]): number {
  if (enemy.aiState === 'hover') return 0;
  const def = RAILS_ENEMY_DEFS[enemy.enemyType ?? EnemyType.RANGED];
  return (def?.collisionDamage ?? 0) > 0 ? 1 : 0;
}
