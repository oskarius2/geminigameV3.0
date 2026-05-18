import { Entity, EnemyType, EntityType, GameState } from '../types';
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
      const phase = Math.floor(Date.now() / 3000) % 3;
      if (dist < 350 && phase === 1) { // hover/strafe
        vx = strafe.x * enemy.speed * 0.8;
        vy = strafe.y * enemy.speed * 0.8;
      } else if (phase === 2 && dist > 150) { // charge
        vx = toPlayer.x * enemy.speed * 1.8;
        vy = toPlayer.y * enemy.speed * 1.8;
      } else { // approach slowly
        vx = toPlayer.x * enemy.speed * 0.5;
        vy = toPlayer.y * enemy.speed * 0.5;
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
    vx += enemy.knockback.x;
    vy += enemy.knockback.y;
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
