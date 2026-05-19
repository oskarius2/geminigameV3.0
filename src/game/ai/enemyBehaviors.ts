import { Entity, EnemyType, EntityType, GameState, Particle } from '../types';
import { Vector2 } from '../utils/vector';
import { hasTimeSlowEffect } from '../buffs/applyBuff';

type VelocityResult = { vx: number; vy: number };

function dirToPlayer(enemy: Entity, playerPos: Vector2, dist: number): Vector2 {
  if (dist < 0.1) return new Vector2(1, 0);
  return new Vector2(
    (playerPos.x - enemy.pos.x) / dist,
    (playerPos.y - enemy.pos.y) / dist
  );
}

function perp(dir: Vector2, sign: number): Vector2 {
  return new Vector2(-dir.y * sign, dir.x * sign);
}

export function steerAroundObstacles(
  enemy: Entity,
  vx: number,
  vy: number,
  obstacles: GameState['obstacles']
): VelocityResult {
  let sx = vx;
  let sy = vy;
  for (const obs of obstacles) {
    const pushDist = enemy.radius + (obs.type === 'CIRCLE' ? obs.size.x : Math.max(obs.size.x, obs.size.y) * 0.5) + 40;
    const dx = enemy.pos.x - obs.pos.x;
    const dy = enemy.pos.y - obs.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.1;
    if (d < pushDist) {
      const push = ((pushDist - d) / pushDist) * enemy.speed * 1.2;
      sx += (dx / d) * push;
      sy += (dy / d) * push;
    }
  }
  return { vx: sx, vy: sy };
}

function pushProjectile(
  state: GameState,
  enemy: Entity,
  angle: number,
  speed: number,
  radius: number,
  color: string,
  damage: number
) {
  // Scale enemy projectile damage progressively with stages
  const stageScaling = 1 + (state.stage - 1) * 0.8;
  const scaledDamage = damage * stageScaling;

  state.projectiles.push({
    id: Math.random().toString(),
    type: EntityType.PROJECTILE,
    pos: enemy.pos.clone(),
    radius,
    health: 1,
    maxHealth: 1,
    speed,
    velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
    color,
    ownerId: enemy.id,
    damage: scaledDamage,
  });
}

function threatAdjustedInterval(intervalMs: number, state: GameState): number {
  if (state.threatLevel > 70) return intervalMs * 0.68;
  if (state.threatLevel > 40) return intervalMs * 0.82;
  return intervalMs;
}

function fireCooldownReady(enemy: Entity, intervalMs: number, state: GameState): boolean {
  return Date.now() - (enemy.lastShot || 0) > threatAdjustedInterval(intervalMs, state);
}

function markFired(enemy: Entity): void {
  enemy.lastShot = Date.now();
}

/** Movement aligned away from player (backing off / kiting out). */
function isRetreating(vx: number, vy: number, toPlayer: Vector2): boolean {
  const vmag = Math.sqrt(vx * vx + vy * vy);
  if (vmag < 0.4) return false;
  const dot = (vx * toPlayer.x + vy * toPlayer.y) / vmag;
  return dot < -0.2;
}

function fireAtPlayer(
  state: GameState,
  enemy: Entity,
  angleToPlayer: number,
  opts: { speed: number; radius: number; color: string; damage: number; spread?: number; count?: number }
): void {
  const count = opts.count ?? 1;
  const spread = opts.spread ?? 0.1;
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? (Math.random() - 0.5) * spread : ((i / (count - 1)) - 0.5) * spread * 2;
    pushProjectile(state, enemy, angleToPlayer + offset, opts.speed, opts.radius, opts.color, opts.damage);
  }
}

function tryRetreatFire(
  state: GameState,
  enemy: Entity,
  dist: number,
  angleToPlayer: number,
  toPlayer: Vector2,
  vx: number,
  vy: number,
  opts: { minDist: number; maxDist: number; intervalMs: number; speed: number; radius: number; color: string; damageScale?: number; burstChance?: number }
): boolean {
  if (dist < opts.minDist || dist > opts.maxDist) return false;
  const backingOff = enemy.aiState === 'retreat' || isRetreating(vx, vy, toPlayer);
  if (!backingOff) return false;
  if (!fireCooldownReady(enemy, opts.intervalMs, state)) return false;

  markFired(enemy);
  const dmg = Math.floor((enemy.damage || 10) * (opts.damageScale ?? 0.85));
  fireAtPlayer(state, enemy, angleToPlayer, {
    speed: opts.speed,
    radius: opts.radius,
    color: opts.color,
    damage: dmg,
    spread: 0.14,
  });

  if (opts.burstChance && Math.random() < opts.burstChance) {
    fireAtPlayer(state, enemy, angleToPlayer, {
      speed: opts.speed * 1.05,
      radius: opts.radius,
      color: opts.color,
      damage: dmg,
      spread: 0.28,
      count: 2,
    });
  }
  return true;
}

export function runEnemyAttacks(
  enemy: Entity,
  state: GameState,
  dist: number,
  dx: number,
  dy: number,
  vx: number,
  vy: number
): void {
  const slow = hasTimeSlowEffect(state);
  const angleToPlayer = Math.atan2(dy, dx);
  const toPlayer = dirToPlayer(enemy, state.player.pos, dist);
  const backingOff = enemy.aiState === 'retreat' || isRetreating(vx, vy, toPlayer);

  if (enemy.enemyType === EnemyType.RANGED) {
    const fireRate = (slow ? 5000 : 2200) * (0.75 + (enemy.behaviorSeed ?? 0.5) * 0.5);
    const inComfortZone = dist > 280 && dist < 900;
    const kiteRetreat = dist < 420 && backingOff;

    if ((inComfortZone || kiteRetreat) && fireCooldownReady(enemy, fireRate, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 8,
        radius: 5,
        color: '#ff4d00',
        damage: enemy.damage || 10,
        spread: kiteRetreat ? 0.18 : 0.1,
      });
      if (kiteRetreat && Math.random() < 0.45) {
        fireAtPlayer(state, enemy, angleToPlayer, {
          speed: 9,
          radius: 5,
          color: '#ff0000',
          damage: enemy.damage || 10,
          spread: 0.22,
        });
      }
    }
    return;
  }

  if (enemy.enemyType === EnemyType.ELITE) {
    const interval = slow ? 3200 : 2200;
    if (fireCooldownReady(enemy, interval, state) && dist < 620 && (backingOff || dist > 200)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 9,
        radius: 6,
        color: '#ff2200',
        damage: enemy.damage || 15,
        spread: 0.35,
        count: 3,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.BOSS) {
    // Colossus: telegraph windup then devastating attacks
    if (state.activeBossId === 'colossus') {
      const interval = slow ? 4000 : 2200;

      // Fire phase: windup just expired
      if (enemy.aiState === 'windup' && (enemy.aiTimer ?? 0) <= 0) {
        markFired(enemy);
        enemy.aiState = 'chase';
        const pattern = Math.floor(Date.now() / 2200) % 3;
        if (pattern === 0) {
          for (let a = 0; a < 16; a++) {
            const angle = (a / 16) * Math.PI * 2;
            pushProjectile(state, enemy, angle, 4, 18, '#78716c', (enemy.damage || 40) * 1.5);
          }
        } else if (pattern === 1) {
          fireAtPlayer(state, enemy, angleToPlayer, {
            speed: 7, radius: 22, color: '#ef4444',
            damage: (enemy.damage || 40) * 2.5, spread: 0.0, count: 1,
          });
        } else {
          for (let a = 0; a < 8; a++) {
            const offset = (a / 7 - 0.5) * Math.PI * 0.8;
            pushProjectile(state, enemy, angleToPlayer + offset, 6, 14, '#dc2626', (enemy.damage || 40) * 1.2);
          }
        }
        return;
      }

      // Still in telegraph — hold
      if (enemy.aiState === 'windup') return;

      // Start telegraph when cooldown ready
      if (fireCooldownReady(enemy, interval, state)) {
        enemy.aiState = 'windup';
        enemy.aiTimer = 70; // ~1.2s warning
      }
      return;
    }

    // Hive Queen: spawns minion packs + fires spread
    if (state.activeBossId === 'hive_queen') {
      const spawnInterval = slow ? 5000 : 2800;
      const fireInterval = slow ? 1800 : 900;
      if (fireCooldownReady(enemy, fireInterval, state)) {
        markFired(enemy);
        // Fire a spread of organic shots
        for (let a = 0; a < 6; a++) {
          const offset = (a / 5 - 0.5) * 1.2;
          pushProjectile(state, enemy, angleToPlayer + offset, 7, 7, '#4ade80', (enemy.damage || 25) * 0.7);
        }
      }
      // Spawn minions periodically
      if (fireCooldownReady({ ...enemy, lastShot: (enemy as any)._queenSpawn ?? 0 } as any, spawnInterval, state)) {
        (enemy as any)._queenSpawn = Date.now();
        const { Vector2: V2 } = { Vector2: (x: number, y: number) => ({ x, y, clone: () => ({ x, y }) }) };
        for (let m = 0; m < 3; m++) {
          const mAngle = Math.random() * Math.PI * 2;
          const mDist = 80 + Math.random() * 60;
          state.enemies.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'ENEMY' as any,
            pos: { x: enemy.pos.x + Math.cos(mAngle) * mDist, y: enemy.pos.y + Math.sin(mAngle) * mDist, clone: () => ({ x: enemy.pos.x + Math.cos(mAngle) * mDist, y: enemy.pos.y + Math.sin(mAngle) * mDist }) } as any,
            radius: 9,
            health: enemy.maxHealth * 0.04,
            maxHealth: enemy.maxHealth * 0.04,
            speed: 2.8,
            velocity: { x: 0, y: 0, clone: () => ({ x: 0, y: 0 }) } as any,
            color: '#86efac',
            damage: Math.floor((enemy.damage || 25) * 0.5),
            enemyType: 'SWARM_V2' as any,
            lastShot: Date.now(),
            aiTimer: 0,
            behaviorSeed: Math.random(),
            aiState: 'chase',
          });
        }
      }
      return;
    }

    // Wraith Lord: fires 3-projectile burst after each teleport
    if (state.activeBossId === 'wraith_lord') {
      const interval = slow ? 1200 : 550;
      if (!fireCooldownReady(enemy, interval, state)) return;
      markFired(enemy);
      // 3-projectile burst: center + two angled flanks
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 13, radius: 7, color: '#a855f7',
        damage: (enemy.damage || 30) * 1.1, spread: 0, count: 1,
      });
      pushProjectile(state, enemy, angleToPlayer + 0.28, 12, 6, '#c084fc', (enemy.damage || 30) * 0.85);
      pushProjectile(state, enemy, angleToPlayer - 0.28, 12, 6, '#c084fc', (enemy.damage || 30) * 0.85);
      return;
    }

    const baseInterval = slow ? 2000 : 800; // faster attacks
    if (!fireCooldownReady(enemy, baseInterval, state)) return;
    markFired(enemy);
    const attackPattern = Math.floor(Date.now() / 2000) % 4; // 4 patterns

    // 0: Spiral
    if (attackPattern === 0) {
      const offsetAng = (Date.now() / 200) % (Math.PI * 2);
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2 + offsetAng;
        pushProjectile(state, enemy, angle, 8, 12, '#ff0055', enemy.damage || 30);
      }
    } 
    // 1: Ring burst
    else if (attackPattern === 1) {
      for (let a = 0; a < 24; a++) {
        const angle = (a / 24) * Math.PI * 2;
        pushProjectile(state, enemy, angle, 6, 8, '#ff6600', enemy.damage || 20);
      }
    } 
    // 2: Machine gun aimed
    else if (attackPattern === 2) {
       fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 16,
        radius: 10,
        color: '#ffdd00',
        damage: enemy.damage || 25,
        spread: 0.1,
        count: 5,
      });
    }
    // 3: Giant slow homing-like (or just large) projectile
    else {
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 5,
        radius: 40,
        color: '#ff0000',
        damage: (enemy.damage || 30) * 2,
        spread: 0,
        count: 1,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.FAST) {
    tryRetreatFire(state, enemy, dist, angleToPlayer, toPlayer, vx, vy, {
      minDist: 90,
      maxDist: 480,
      intervalMs: slow ? 1400 : 750,
      speed: 10,
      radius: 4,
      color: '#ff8800',
      damageScale: 0.9,
      burstChance: 0.4,
    });
    if (enemy.aiState === 'lunge' && dist < 280 && fireCooldownReady(enemy, slow ? 2000 : 1100, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 11,
        radius: 4,
        color: '#ff4400',
        damage: Math.floor((enemy.damage || 10) * 0.7),
        spread: 0.2,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.WRAITH) {
    if (backingOff && dist < 520 && fireCooldownReady(enemy, slow ? 2000 : 1000, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 11,
        radius: 5,
        color: '#ff0055',
        damage: Math.floor((enemy.damage || 10) * 0.95),
        spread: 0.12,
        count: 2,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.CHASER || enemy.enemyType === EnemyType.SWARMER || !enemy.enemyType) {
    // Retreat firing
    tryRetreatFire(state, enemy, dist, angleToPlayer, toPlayer, vx, vy, {
      minDist: 100,
      maxDist: enemy.enemyType === EnemyType.SWARMER ? 380 : 520,
      intervalMs: slow ? 2800 : enemy.enemyType === EnemyType.SWARMER ? 1600 : 1300,
      speed: enemy.enemyType === EnemyType.SWARMER ? 7 : 8,
      radius: enemy.enemyType === EnemyType.SWARMER ? 3 : 4,
      color: enemy.enemyType === EnemyType.SWARMER ? '#ff8800' : '#ff2200',
      damageScale: enemy.enemyType === EnemyType.SWARMER ? 0.55 : 0.75,
      burstChance: enemy.enemyType === EnemyType.SWARMER ? 0.15 : 0.25,
    });
    
    // Aggressive lunging fire
    if (enemy.aiState === 'windup' && enemy.aiTimer < 5 && fireCooldownReady(enemy, slow ? 2000 : 1000, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: enemy.enemyType === EnemyType.SWARMER ? 9 : 10,
        radius: 4,
        color: enemy.enemyType === EnemyType.SWARMER ? '#ff4d00' : '#ff0000',
        damage: Math.floor((enemy.damage || 10) * 0.6),
        spread: 0.15,
        count: enemy.enemyType === EnemyType.CHASER ? 2 : 1,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.SPLINTER) {
    if (backingOff && dist < 400 && fireCooldownReady(enemy, slow ? 2500 : 1400, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 7,
        radius: 4,
        color: '#ff4d00',
        damage: Math.floor((enemy.damage || 10) * 0.65),
        spread: 0.2,
        count: 2,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.TANK) {
    if (enemy.aiState === 'windup' && enemy.aiTimer > 35 && fireCooldownReady(enemy, slow ? 3500 : 2000, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 6,
        radius: 8,
        color: '#ff5500',
        damage: Math.floor((enemy.damage || 10) * 1.1),
        spread: 0.4,
        count: 3,
      });
    } else {
      tryRetreatFire(state, enemy, dist, angleToPlayer, toPlayer, vx, vy, {
        minDist: 120,
        maxDist: 400,
        intervalMs: slow ? 4000 : 2500,
        speed: 5,
        radius: 7,
        color: '#ff2200',
        damageScale: 0.8,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.PHALANX) {
    if (dist > 150 && dist < 500 && (backingOff || dist > 280) && fireCooldownReady(enemy, slow ? 3500 : 2200, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 6,
        radius: 6,
        color: '#ff4400',
        damage: Math.floor((enemy.damage || 10) * 0.85),
        spread: 0.25,
        count: 2,
      });
    }
  }

  if (enemy.enemyType === EnemyType.SNIPER) {
    const interval = slow ? 6000 : 4000;
    if (dist > 300 && dist < 1000 && fireCooldownReady(enemy, interval, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 16,
        radius: 7,
        color: '#ff0000',
        damage: Math.floor((enemy.damage || 10) * 2),
        spread: 0.05,
        count: 1,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.DASHER) {
    // Only fires during retreat after a lunge
    tryRetreatFire(state, enemy, dist, angleToPlayer, toPlayer, vx, vy, {
      minDist: 80,
      maxDist: 350,
      intervalMs: slow ? 1200 : 600,
      speed: 12,
      radius: 4,
      color: '#ff6b35',
      damageScale: 0.7,
    });
    return;
  }

  if (enemy.enemyType === EnemyType.PHANTOM) {
    // Fires a burst from the new teleport position (post-teleport ghost phase)
    if (enemy.aiState === 'invisible' && fireCooldownReady(enemy, slow ? 1200 : 600, state)) {
      markFired(enemy);
      enemy.aiState = 'chase'; // exit ghost phase after shooting
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 11,
        radius: 5,
        color: '#00d4ff',
        damage: Math.floor((enemy.damage || 10) * 1.2),
        spread: 0.06,
        count: 2,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.ZAPPER) {
    // 1 fast shot every 1.5s
    if (dist < 480 && fireCooldownReady(enemy, slow ? 2500 : 1500, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 14,
        radius: 5,
        color: '#38bdf8',
        damage: Math.floor((enemy.damage || 10) * 0.9),
        spread: 0.06,
        count: 1,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.STRIKER) {
    // Fires a single heavy shot during windup
    if (enemy.aiState === 'windup' && enemy.aiTimer !== undefined && enemy.aiTimer < 8 && fireCooldownReady(enemy, slow ? 2500 : 1500, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 14,
        radius: 8,
        color: '#cc2200',
        damage: Math.floor((enemy.damage || 10) * 1.5),
        spread: 0.06,
        count: 1,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.SWARM_V2) {
    // Fires in fan burst occasionally
    if (dist < 320 && fireCooldownReady(enemy, slow ? 2400 : 1200, state)) {
      markFired(enemy);
      for (let a = 0; a < 4; a++) {
        const offset = (a / 3 - 0.5) * 0.6;
        pushProjectile(state, enemy, angleToPlayer + offset, 8, 3, '#ff8c00', Math.floor((enemy.damage || 10) * 0.4));
      }
    }
    return;
  }

  if (enemy.enemyType === EnemyType.TRACKER) {
    // Slow homing-ish aimed shot with low spread
    if (dist < 700 && fireCooldownReady(enemy, slow ? 4000 : 2200, state)) {
      markFired(enemy);
      // Fire a slow heavy shot that tracks well (tight spread)
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 6,
        radius: 9,
        color: '#c026d3',
        damage: Math.floor((enemy.damage || 10) * 1.8),
        spread: 0.04,
        count: 1,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.FORTIFIED) {
    // Slow massive shots
    if (dist < 500 && fireCooldownReady(enemy, slow ? 4000 : 2500, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 5,
        radius: 12,
        color: '#94a3b8',
        damage: Math.floor((enemy.damage || 10) * 2.2),
        spread: 0.3,
        count: 2,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.SHIELDED) {
    // Standard ranged fire, shield is the threat
    if (dist > 180 && dist < 550 && fireCooldownReady(enemy, slow ? 3000 : 1800, state)) {
      markFired(enemy);
      fireAtPlayer(state, enemy, angleToPlayer, {
        speed: 8,
        radius: 6,
        color: '#06b6d4',
        damage: Math.floor((enemy.damage || 10) * 0.9),
        spread: 0.18,
        count: 2,
      });
    }
    return;
  }

  if (enemy.enemyType === EnemyType.REGENERATING) {
    // Fires while retreating to regen
    tryRetreatFire(state, enemy, dist, angleToPlayer, toPlayer, vx, vy, {
      minDist: 100,
      maxDist: 600,
      intervalMs: slow ? 2500 : 1400,
      speed: 7,
      radius: 5,
      color: '#22c55e',
      damageScale: 0.8,
      burstChance: 0.3,
    });
    return;
  }
}

export function computeEnemyVelocity(
  enemy: Entity,
  state: GameState,
  enemyDt: number,
  dist: number,
  dx: number,
  dy: number
): VelocityResult {
  const playerPos = state.player.pos;
  const seed = enemy.behaviorSeed ?? 0.5;
  const sign = seed > 0.5 ? 1 : -1;
  const toPlayer = dirToPlayer(enemy, playerPos, dist);
  const strafe = perp(toPlayer, sign);
  let vx = 0;
  let vy = 0;

  if (!enemy.aiState) enemy.aiState = 'chase';
  if (enemy.aiTimer === undefined) enemy.aiTimer = 0;
  enemy.aiTimer -= enemyDt;

  switch (enemy.enemyType ?? EnemyType.CHASER) {
    case EnemyType.RANGED: {
      const minZ = 320;
      const maxZ = 680;
      if (dist > maxZ) {
        vx = toPlayer.x * enemy.speed;
        vy = toPlayer.y * enemy.speed;
      } else if (dist < minZ) {
        enemy.aiState = 'retreat';
        vx = -toPlayer.x * enemy.speed * 1.1;
        vy = -toPlayer.y * enemy.speed * 1.1;
      } else {
        enemy.aiState = 'strafe';
        vx = strafe.x * enemy.speed;
        vy = strafe.y * enemy.speed;
      }
      break;
    }
    case EnemyType.FAST: {
      if (enemy.aiState === 'retreat' && enemy.aiTimer > 0) {
        vx = -toPlayer.x * enemy.speed * 1.3;
        vy = -toPlayer.y * enemy.speed * 1.3;
      } else if (dist < 120) {
        enemy.aiState = 'retreat';
        enemy.aiTimer = 45;
        vx = -toPlayer.x * enemy.speed * 1.2;
        vy = -toPlayer.y * enemy.speed * 1.2;
      } else if (enemy.aiState === 'lunge' && enemy.aiTimer > 0) {
        vx = toPlayer.x * enemy.speed * 2.2;
        vy = toPlayer.y * enemy.speed * 2.2;
      } else if (dist > 200 && enemy.aiTimer <= 0) {
        enemy.aiState = 'lunge';
        enemy.aiTimer = 18;
        vx = toPlayer.x * enemy.speed * 2;
        vy = toPlayer.y * enemy.speed * 2;
      } else {
        vx = (toPlayer.x * 0.6 + strafe.x * 0.4) * enemy.speed;
        vy = (toPlayer.y * 0.6 + strafe.y * 0.4) * enemy.speed;
      }
      break;
    }
    case EnemyType.SWARMER: {
      vx = (toPlayer.x * 0.85 + strafe.x * 0.35) * enemy.speed * 0.9;
      vy = (toPlayer.y * 0.85 + strafe.y * 0.35) * enemy.speed * 0.9;
      break;
    }
    case EnemyType.TANK: {
      if (dist < 180 && enemy.aiTimer <= 0) {
        enemy.aiState = 'windup';
        enemy.aiTimer = 50;
        vx = 0;
        vy = 0;
      } else if (enemy.aiState === 'windup' && enemy.aiTimer > 30) {
        vx = 0;
        vy = 0;
      } else if (enemy.aiState === 'windup' && enemy.aiTimer <= 30 && enemy.aiTimer > 0) {
        vx = toPlayer.x * enemy.speed * 2.5;
        vy = toPlayer.y * enemy.speed * 2.5;
      } else {
        vx = toPlayer.x * enemy.speed * 0.65;
        vy = toPlayer.y * enemy.speed * 0.65;
      }
      break;
    }
    case EnemyType.PHALANX: {
      vx = toPlayer.x * enemy.speed * 0.45;
      vy = toPlayer.y * enemy.speed * 0.45;
      break;
    }
    case EnemyType.SNIPER: {
      const minZ = 400;
      if (dist < minZ) {
        vx = -toPlayer.x * enemy.speed * 1.5;
        vy = -toPlayer.y * enemy.speed * 1.5;
      } else {
        vx = strafe.x * enemy.speed * 0.5;
        vy = strafe.y * enemy.speed * 0.5;
      }
      break;
    }
    case EnemyType.WRAITH: {
      if (enemy.aiState === 'blink' && enemy.aiTimer > 0) {
        vx = strafe.x * enemy.speed * 0.3;
        vy = strafe.y * enemy.speed * 0.3;
      } else if (dist < 250 && enemy.aiTimer <= 0) {
        enemy.aiState = 'blink';
        enemy.aiTimer = 35;
        const flank = (seed - 0.5) * Math.PI * 0.8;
        const cos = Math.cos(flank);
        const sin = Math.sin(flank);
        enemy.pos.x += (toPlayer.x * cos - toPlayer.y * sin) * 120;
        enemy.pos.y += (toPlayer.x * sin + toPlayer.y * cos) * 120;
        vx = strafe.x * enemy.speed;
        vy = strafe.y * enemy.speed;
      } else {
        vx = (toPlayer.x * 0.5 + strafe.x * 0.5) * enemy.speed * 1.2;
        vy = (toPlayer.y * 0.5 + strafe.y * 0.5) * enemy.speed * 1.2;
      }
      break;
    }
    case EnemyType.NOVA: {
      if (dist < 160) {
        if (enemy.aiState !== 'windup') {
          enemy.aiState = 'windup';
          enemy.aiTimer = 60;
        }
        vx = 0;
        vy = 0;
        if (enemy.aiTimer <= 0) {
          enemy.health = 0;
        }
      } else {
        vx = toPlayer.x * enemy.speed;
        vy = toPlayer.y * enemy.speed;
      }
      break;
    }
    case EnemyType.SPLINTER: {
      vx = toPlayer.x * enemy.speed * 0.75;
      vy = toPlayer.y * enemy.speed * 0.75;
      break;
    }
    case EnemyType.ELITE: {
      if (dist < 500) {
        vx = (strafe.x * 0.8 + toPlayer.x * 0.2) * enemy.speed;
        vy = (strafe.y * 0.8 + toPlayer.y * 0.2) * enemy.speed;
      } else {
        vx = toPlayer.x * enemy.speed;
        vy = toPlayer.y * enemy.speed;
      }
      break;
    }
    case EnemyType.BOSS: {
      // Wraith Lord: teleport every 1-2s regardless of distance
      if (state.activeBossId === 'wraith_lord') {
        if ((enemy.aiTimer ?? 0) <= 0) {
          // Teleport to a flanking position near player
          const wlInterval = 60 + Math.floor(seed * 60); // 1-2s
          enemy.aiTimer = wlInterval;
          enemy.aiState = 'teleport';
          const tAngle = Math.atan2(dy, dx) + (seed - 0.5) * Math.PI;
          const tDist = 180 + seed * 160;
          const oldX = enemy.pos.x;
          const oldY = enemy.pos.y;
          enemy.pos.x = Math.max(60, Math.min(state.world.width - 60, playerPos.x + Math.cos(tAngle) * tDist));
          enemy.pos.y = Math.max(60, Math.min(state.world.height - 60, playerPos.y + Math.sin(tAngle) * tDist));
          const makeWLFlash = (px: number, py: number): Particle => ({
            id: Math.random().toString(36).substr(2, 6),
            pos: new Vector2(px, py),
            velocity: new Vector2(0, 0),
            life: 0.4,
            maxLife: 0.4,
            color: '#a855f7',
            size: enemy.radius * 3,
            particleType: 'ring',
          });
          state.particles.push(makeWLFlash(oldX, oldY), makeWLFlash(enemy.pos.x, enemy.pos.y));
        }
        vx = (toPlayer.x * 0.7 + strafe.x * 0.3) * enemy.speed * 1.5;
        vy = (toPlayer.y * 0.7 + strafe.y * 0.3) * enemy.speed * 1.5;
        break;
      }
      // Colossus: slow march, freezes during attack telegraph
      if (state.activeBossId === 'colossus') {
        if (enemy.aiState === 'windup' && (enemy.aiTimer ?? 0) > 0) {
          vx = 0; vy = 0; // frozen during telegraph
        } else {
          vx = toPlayer.x * enemy.speed * 0.6;
          vy = toPlayer.y * enemy.speed * 0.6;
        }
        break;
      }
      // Hive Queen: stay mid-range, circle player
      if (state.activeBossId === 'hive_queen') {
        const ideal = 400;
        if (dist > ideal + 80) {
          vx = toPlayer.x * enemy.speed * 0.7;
          vy = toPlayer.y * enemy.speed * 0.7;
        } else if (dist < ideal - 80) {
          vx = -toPlayer.x * enemy.speed * 0.7;
          vy = -toPlayer.y * enemy.speed * 0.7;
        } else {
          vx = strafe.x * enemy.speed * 0.9;
          vy = strafe.y * enemy.speed * 0.9;
        }
        break;
      }
      const phase = Math.floor(Date.now() / 3000) % 3;
      if (dist < 350 && phase === 1) {
        vx = strafe.x * enemy.speed * 0.8;
        vy = strafe.y * enemy.speed * 0.8;
      } else if (phase === 2 && dist > 150) {
        vx = toPlayer.x * enemy.speed * 1.8;
        vy = toPlayer.y * enemy.speed * 1.8;
      } else {
        vx = toPlayer.x * enemy.speed * 0.5;
        vy = toPlayer.y * enemy.speed * 0.5;
      }
      break;
    }
    case EnemyType.DASHER: {
      const wallMargin = 60;
      const nearWallX = enemy.pos.x < wallMargin || enemy.pos.x > state.world.width - wallMargin;
      const nearWallY = enemy.pos.y < wallMargin || enemy.pos.y > state.world.height - wallMargin;
      if (nearWallX || nearWallY) {
        // Bounce: reflect current velocity direction and charge back toward player
        if (nearWallX) enemy.velocity.x = -enemy.velocity.x * 0.6;
        if (nearWallY) enemy.velocity.y = -enemy.velocity.y * 0.6;
        vx = toPlayer.x * enemy.speed * 2.5;
        vy = toPlayer.y * enemy.speed * 2.5;
        enemy.aiState = 'lunge';
        enemy.aiTimer = 12;
        break;
      }
      if (enemy.aiState === 'retreat' && (enemy.aiTimer ?? 0) > 0) {
        vx = -toPlayer.x * enemy.speed * 1.5;
        vy = -toPlayer.y * enemy.speed * 1.5;
      } else if (enemy.aiState === 'lunge' && (enemy.aiTimer ?? 0) > 0) {
        vx = toPlayer.x * enemy.speed * 3.5;
        vy = toPlayer.y * enemy.speed * 3.5;
      } else if ((enemy.aiTimer ?? 0) <= 0 && dist < 600) {
        enemy.aiState = 'lunge';
        enemy.aiTimer = 12;
        vx = toPlayer.x * enemy.speed * 3.5;
        vy = toPlayer.y * enemy.speed * 3.5;
      } else {
        vx = toPlayer.x * enemy.speed;
        vy = toPlayer.y * enemy.speed;
      }
      if (enemy.aiState === 'lunge' && (enemy.aiTimer ?? 1) <= 0) {
        enemy.aiState = 'retreat';
        enemy.aiTimer = 22;
      }
      break;
    }
    case EnemyType.PHANTOM: {
      // Teleport every 2-3 seconds to a random flank position
      if ((enemy.aiTimer ?? 0) <= 0) {
        const teleInterval = 120 + Math.floor(seed * 60); // 2-3s at 60fps
        enemy.aiTimer = teleInterval;
        // Choose a position flanking the player
        const tAngle = Math.atan2(dy, dx) + (seed - 0.5) * Math.PI * 1.5;
        const tDist = 180 + seed * 220;
        const oldX = enemy.pos.x;
        const oldY = enemy.pos.y;
        enemy.pos.x = Math.max(40, Math.min(state.world.width - 40, playerPos.x + Math.cos(tAngle) * tDist));
        enemy.pos.y = Math.max(40, Math.min(state.world.height - 40, playerPos.y + Math.sin(tAngle) * tDist));
        // Flash particles at old and new position
        const makeFlash = (px: number, py: number): Particle => ({
          id: Math.random().toString(36).substr(2, 6),
          pos: new Vector2(px, py),
          velocity: new Vector2(0, 0),
          life: 0.35,
          maxLife: 0.35,
          color: '#00d4ff',
          size: enemy.radius * 2.5,
          particleType: 'ring',
        });
        state.particles.push(makeFlash(oldX, oldY), makeFlash(enemy.pos.x, enemy.pos.y));
        enemy.aiState = 'invisible'; // brief post-teleport ghost phase
      }
      // After teleport: close in on player
      vx = (toPlayer.x * 0.75 + strafe.x * 0.25) * enemy.speed * 1.1;
      vy = (toPlayer.y * 0.75 + strafe.y * 0.25) * enemy.speed * 1.1;
      break;
    }
    case EnemyType.ZAPPER: {
      const minZ = 200;
      const maxZ = 450;
      if (dist > maxZ) {
        vx = toPlayer.x * enemy.speed;
        vy = toPlayer.y * enemy.speed;
      } else if (dist < minZ) {
        vx = -toPlayer.x * enemy.speed * 1.2;
        vy = -toPlayer.y * enemy.speed * 1.2;
      } else {
        vx = strafe.x * enemy.speed * 1.1;
        vy = strafe.y * enemy.speed * 1.1;
      }
      break;
    }
    case EnemyType.STRIKER: {
      // Always charging — no retreat
      if (enemy.aiState === 'windup' && (enemy.aiTimer ?? 0) > 0) {
        vx = 0; vy = 0;
      } else if (enemy.aiState === 'lunge' && (enemy.aiTimer ?? 0) > 0) {
        vx = toPlayer.x * enemy.speed * 3.8;
        vy = toPlayer.y * enemy.speed * 3.8;
      } else if ((enemy.aiTimer ?? 0) <= 0 && dist < 400) {
        enemy.aiState = 'windup';
        enemy.aiTimer = 20;
        vx = 0; vy = 0;
      } else {
        vx = toPlayer.x * enemy.speed * 1.2;
        vy = toPlayer.y * enemy.speed * 1.2;
      }
      if (enemy.aiState === 'windup' && (enemy.aiTimer ?? 1) <= 0) {
        enemy.aiState = 'lunge';
        enemy.aiTimer = 14;
      }
      if (enemy.aiState === 'lunge' && (enemy.aiTimer ?? 1) <= 0) {
        enemy.aiState = 'chase';
        enemy.aiTimer = 10;
      }
      break;
    }
    case EnemyType.SWARM_V2: {
      // Tighter group than SWARMER, occasionally spirals
      const spiral = Math.sin(Date.now() * 0.003 + seed * 10) * 0.5;
      vx = (toPlayer.x * 0.9 + strafe.x * (0.3 + spiral)) * enemy.speed;
      vy = (toPlayer.y * 0.9 + strafe.y * (0.3 + spiral)) * enemy.speed;
      break;
    }
    case EnemyType.TRACKER: {
      // Slow deliberate approach
      if (dist < 500) {
        vx = (strafe.x * 0.6 + toPlayer.x * 0.4) * enemy.speed;
        vy = (strafe.y * 0.6 + toPlayer.y * 0.4) * enemy.speed;
      } else {
        vx = toPlayer.x * enemy.speed;
        vy = toPlayer.y * enemy.speed;
      }
      break;
    }
    case EnemyType.FORTIFIED: {
      // Slow unstoppable march
      vx = toPlayer.x * enemy.speed * 0.5;
      vy = toPlayer.y * enemy.speed * 0.5;
      break;
    }
    case EnemyType.SHIELDED: {
      // Defensive strafe, doesn't close in fast
      if (dist > 300) {
        vx = (toPlayer.x * 0.7 + strafe.x * 0.3) * enemy.speed;
        vy = (toPlayer.y * 0.7 + strafe.y * 0.3) * enemy.speed;
      } else {
        vx = strafe.x * enemy.speed;
        vy = strafe.y * enemy.speed;
      }
      break;
    }
    case EnemyType.REGENERATING: {
      // Retreat when low HP to regen, then re-engage
      const hpFraction = enemy.health / enemy.maxHealth;
      if (hpFraction < 0.35) {
        enemy.aiState = 'retreat';
        vx = -toPlayer.x * enemy.speed * 1.4;
        vy = -toPlayer.y * enemy.speed * 1.4;
      } else if (enemy.aiState === 'retreat' && hpFraction > 0.7) {
        enemy.aiState = 'chase';
        vx = toPlayer.x * enemy.speed;
        vy = toPlayer.y * enemy.speed;
      } else if (enemy.aiState === 'retreat') {
        vx = -toPlayer.x * enemy.speed * 1.2;
        vy = -toPlayer.y * enemy.speed * 1.2;
      } else {
        vx = toPlayer.x * enemy.speed;
        vy = toPlayer.y * enemy.speed;
      }
      break;
    }
    case EnemyType.CHASER:
    default: {
      const wobble = Math.sin(Date.now() / 200 + seed * 12) * 0.35;
      
      if (enemy.aiState === 'windup' && enemy.aiTimer <= 0) {
        enemy.aiState = 'lunge';
        enemy.aiTimer = 18;
      }
      if (enemy.aiState === 'lunge' && enemy.aiTimer <= 0) {
        enemy.aiState = 'retreat';
        enemy.aiTimer = 15;
      }
      
      const shouldAttack = enemy.aiTimer <= 0 && dist > 100 && dist < 450 && enemy.aiState !== 'retreat' && enemy.aiState !== 'windup';
      if (shouldAttack) {
        enemy.aiState = 'windup';
        enemy.aiTimer = 15; // Telegraph
      }

      if (enemy.aiState === 'windup') {
        // Slow down to shoot
        vx = toPlayer.x * enemy.speed * 0.1;
        vy = toPlayer.y * enemy.speed * 0.1;
      } else if (enemy.aiState === 'retreat' && enemy.aiTimer > 0) {
        vx = -toPlayer.x * enemy.speed * 1.15;
        vy = -toPlayer.y * enemy.speed * 1.15;
      } else {
        const speedMult = enemy.aiState === 'lunge' ? 1.8 : 1;
        const mixStrafe = dist < 400 ? 0.45 : 0.15;
        vx = (toPlayer.x * (1 - mixStrafe) + strafe.x * mixStrafe) * enemy.speed * speedMult;
        vy = (toPlayer.y * (1 - mixStrafe) + strafe.y * mixStrafe) * enemy.speed * speedMult;
        if (wobble && enemy.aiState !== 'lunge') {
          vx += strafe.x * wobble * enemy.speed;
          vy += strafe.y * wobble * enemy.speed;
        }
      }
      break;
    }
  }

  return steerAroundObstacles(enemy, vx, vy, state.obstacles);
}

export function getSeparationForce(
  enemy: Entity,
  enemies: Entity[],
  grid: Record<string, number[]>,
  gridSize: number,
  index: number,
  enemyType?: EnemyType,
  state?: GameState
): VelocityResult {
  const gx = Math.floor(enemy.pos.x / gridSize);
  const gy = Math.floor(enemy.pos.y / gridSize);
  let steerX = 0;
  let steerY = 0;
  const sepMult =
    enemyType === EnemyType.TANK || enemyType === EnemyType.PHALANX
      ? 5.5
      : enemyType === EnemyType.SWARMER || enemyType === EnemyType.FAST
        ? 2.2
        : 3.5;
  let bufferMult =
    enemyType === EnemyType.SWARMER || enemyType === EnemyType.FAST ? 2.8 : 4;
  if (state && state.multiShot >= 5 && enemyType === EnemyType.SWARMER) {
    bufferMult *= 1.45;
  }

  for (let ox = -1; ox <= 1; ox++) {
    for (let oy = -1; oy <= 1; oy++) {
      const cell = grid[`${gx + ox},${gy + oy}`];
      if (!cell) continue;
      for (const otherIdx of cell) {
        if (otherIdx === index) continue;
        const other = enemies[otherIdx];
        const sdx = enemy.pos.x - other.pos.x;
        const sdy = enemy.pos.y - other.pos.y;
        const sdistSq = sdx * sdx + sdy * sdy;
        const minDist = (enemy.radius + other.radius) * bufferMult;
        if (sdistSq < minDist * minDist) {
          const sdist = Math.sqrt(sdistSq) || 0.1;
          const push = (minDist - sdist) / minDist;
          steerX += (sdx / sdist) * push * sepMult;
          steerY += (sdy / sdist) * push * sepMult;
        }
      }
    }
  }
  return { vx: steerX, vy: steerY };
}

export function finalizeEnemyMovement(
  enemy: Entity,
  state: GameState,
  vx: number,
  vy: number,
  enemyDt: number,
  index: number
): void {
  const noiseX = Math.sin(Date.now() * 0.002 + index * 500) * 0.5;
  const noiseY = Math.cos(Date.now() * 0.003 + index * 700) * 0.5;
  vx += noiseX;
  vy += noiseY;

  if (enemy.knockback) {
    const kbScale = enemy.enemyType === EnemyType.FORTIFIED ? 0.08 : 1;
    vx += enemy.knockback.x * kbScale;
    vy += enemy.knockback.y * kbScale;
    enemy.knockback.x *= Math.pow(0.85, enemyDt);
    enemy.knockback.y *= Math.pow(0.85, enemyDt);
    if (Math.abs(enemy.knockback.x) < 0.1 && Math.abs(enemy.knockback.y) < 0.1) {
      enemy.knockback = undefined;
    }
  }

  if (enemy.frostTimer && enemy.frostTimer > 0) {
    enemy.frostTimer -= enemyDt;
    vx *= 0.65;
    vy *= 0.65;
  }

  enemy.pos.x += vx * enemyDt;
  enemy.pos.y += vy * enemyDt;
  enemy.velocity.x = vx;
  enemy.velocity.y = vy;
  enemy.pos.x = Math.max(0, Math.min(state.world.width, enemy.pos.x));
  enemy.pos.y = Math.max(0, Math.min(state.world.height, enemy.pos.y));
}
