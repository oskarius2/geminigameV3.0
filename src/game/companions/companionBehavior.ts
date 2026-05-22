import { Vector2 } from '../utils/vector';
import { EntityType, EnemyType } from '../types';
import type { CompanionGameState } from './companionGameState';
import { selectClosestEnemy, selectTarget } from './companionTargeting';
import { resolveScoutMoveTarget } from './companionAI';
import type { CompanionDef, CompanionInstance, CompanionRuntime } from './companionTypes';
import { CompanionAIState, CompanionType } from './companionTypes';

const COMPANION_RADIUS = 14;
const PLAYER_REPEL = 32;

const MOVE_SPEED: Record<CompanionType, number> = {
  [CompanionType.GUARDIAN]: 150,
  [CompanionType.SCOUT]: 250,
  [CompanionType.HEALER]: 120,
  [CompanionType.GUNNER]: 200,
};

const ACCEL: Record<CompanionType, number> = {
  [CompanionType.GUARDIAN]: 420,
  [CompanionType.SCOUT]: 680,
  [CompanionType.HEALER]: 360,
  [CompanionType.GUNNER]: 560,
};

const IDLE_ORBIT = 120;
const ROLE_ORBIT_BIAS: Record<CompanionType, number> = {
  [CompanionType.GUARDIAN]: 0,
  [CompanionType.SCOUT]: -Math.PI / 2,
  [CompanionType.HEALER]: Math.PI,
  [CompanionType.GUNNER]: Math.PI / 2,
};

function livingEnemies(state: CompanionGameState) {
  return state.enemies.filter((e) => e.type === EntityType.ENEMY && e.health > 0);
}

function nearestEnemyDist(state: CompanionGameState, playerPos: Vector2): number {
  const enemies = livingEnemies(state);
  if (enemies.length === 0) return Infinity;
  let min = Infinity;
  for (const e of enemies) {
    min = Math.min(min, e.pos.distanceTo(playerPos));
  }
  return min;
}

function primaryThreat(state: CompanionGameState, playerPos: Vector2) {
  return selectClosestEnemy(livingEnemies(state), playerPos);
}

export function determineCompanionState(
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: CompanionGameState,
): CompanionAIState {
  const player = state.player;
  const playerHp = player.health / Math.max(player.maxHealth, 1);
  const companionHp = instance.health / Math.max(instance.maxHealth, 1);
  const nearest = nearestEnemyDist(state, player.pos);

  if (playerHp < 0.3) return CompanionAIState.PLAYER_DISTRESSED;
  if (companionHp < 0.25) return CompanionAIState.LOW_HP;
  if (nearest <= 150) return CompanionAIState.COMBAT;
  if (nearest <= 300) return CompanionAIState.THREAT;

  const onCooldown =
    (instance.abilityCooldownRemaining ?? 0) > 0 &&
    nearest > 200 &&
    playerHp > 0.5;
  if (onCooldown) return CompanionAIState.COOLDOWN;

  return CompanionAIState.IDLE;
}

function orbitPoint(
  playerPos: Vector2,
  angle: number,
  radius: number,
): Vector2 {
  return new Vector2(
    playerPos.x + Math.cos(angle) * radius,
    playerPos.y + Math.sin(angle) * radius,
  );
}

function bodyblockPoint(playerPos: Vector2, threatPos: Vector2, dist: number): Vector2 {
  const dir = threatPos.sub(playerPos);
  const mag = dir.magnitude();
  if (mag < 1) return playerPos.clone();
  const n = dir.normalize();
  return playerPos.add(n.mul(dist));
}

function flankPoint(
  playerPos: Vector2,
  threatPos: Vector2,
  dist: number,
  side: number,
): Vector2 {
  const toThreat = threatPos.sub(playerPos);
  const mag = toThreat.magnitude();
  if (mag < 1) return orbitPoint(playerPos, 0, dist);
  const n = toThreat.normalize();
  const perp = new Vector2(-n.y * side, n.x * side);
  return playerPos.add(n.mul(dist * 0.5)).add(perp.mul(dist * 0.85));
}

function aheadOfPlayer(playerPos: Vector2, aimDir: Vector2 | undefined, dist: number): Vector2 {
  const dir =
    aimDir && aimDir.magnitude() > 0.1
      ? aimDir.normalize()
      : new Vector2(1, 0);
  return playerPos.add(dir.mul(dist));
}

export function getTargetPosition(
  aiState: CompanionAIState,
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: CompanionGameState,
  def: CompanionDef,
): Vector2 {
  const playerPos = state.player.pos;
  const aimDir = state.player.aimDir;
  const type = instance.type;
  const threat = primaryThreat(state, playerPos) ?? selectTarget(instance, state, def);
  const jitter =
    runtime.orbitRadiusOffset +
    Math.sin(runtime.visualTime * 2.3) * 8;

  const lead =
    aimDir && aimDir.magnitude() > 0.1
      ? aimDir.normalize().mul((state.player.speed ?? 100) * 0.12)
      : new Vector2(0, 0);
  const playerPredict = playerPos.add(lead);

  let radius = IDLE_ORBIT + jitter;
  let angle = runtime.orbitAngle + ROLE_ORBIT_BIAS[type];

  switch (aiState) {
    case CompanionAIState.PLAYER_DISTRESSED: {
      if (type === CompanionType.GUARDIAN && threat) {
        return bodyblockPoint(playerPos, threat.pos, 45);
      }
      if (type === CompanionType.HEALER) {
        return orbitPoint(playerPos, angle + Math.PI, 100);
      }
      if (type === CompanionType.GUNNER && threat) {
        return flankPoint(playerPos, threat.pos, 90, 1);
      }
      if (type === CompanionType.SCOUT) {
        return aheadOfPlayer(playerPos, aimDir, 70);
      }
      radius = 90;
      break;
    }
    case CompanionAIState.LOW_HP: {
      if (type === CompanionType.GUARDIAN && threat) {
        return bodyblockPoint(playerPos, threat.pos, 55);
      }
      return orbitPoint(playerPos, angle + Math.PI, 130);
    }
    case CompanionAIState.COMBAT: {
      if (type === CompanionType.GUARDIAN && threat) {
        const block = bodyblockPoint(playerPos, threat.pos, 42);
        return block.lerp(orbitPoint(playerPos, angle, 70), 0.35);
      }
      if (type === CompanionType.SCOUT) {
        const strafe = Math.sin(runtime.visualTime * 5) * 35;
        return orbitPoint(playerPos, angle + Math.PI / 2, 75 + strafe);
      }
      if (type === CompanionType.HEALER) {
        return orbitPoint(playerPos, angle + Math.PI, 120);
      }
      if (type === CompanionType.GUNNER && threat) {
        return flankPoint(playerPos, threat.pos, 85, Math.sin(runtime.visualTime * 2) > 0 ? 1 : -1);
      }
      radius = 80;
      break;
    }
    case CompanionAIState.THREAT: {
      if (type === CompanionType.GUARDIAN && threat) {
        return bodyblockPoint(playerPos, threat.pos, 65);
      }
      if (type === CompanionType.SCOUT) {
        return aheadOfPlayer(playerPos, aimDir, 80);
      }
      if (type === CompanionType.HEALER) {
        return orbitPoint(playerPos, angle + Math.PI, 115);
      }
      if (type === CompanionType.GUNNER && threat) {
        return flankPoint(playerPos, threat.pos, 95, 1);
      }
      radius = 90;
      break;
    }
    case CompanionAIState.COOLDOWN:
    case CompanionAIState.IDLE:
    default:
      radius = IDLE_ORBIT + jitter;
      break;
  }

  let desired = orbitPoint(playerPredict, angle, radius);

  if (type === CompanionType.GUNNER && threat && aiState !== CompanionAIState.IDLE) {
    desired = desired.lerp(flankPoint(playerPos, threat.pos, 88, 1), 0.4);
  }

  return desired;
}

function applyRepulsion(
  pos: Vector2,
  playerPos: Vector2,
  enemies: CompanionGameState['enemies'],
): Vector2 {
  let out = pos.clone();
  const toPlayer = out.sub(playerPos);
  const pd = toPlayer.magnitude();
  if (pd < PLAYER_REPEL && pd > 0.01) {
    out = playerPos.add(toPlayer.normalize().mul(PLAYER_REPEL));
  }
  for (const e of enemies) {
    if (e.health <= 0) continue;
    const d = out.distanceTo(e.pos);
    const minD = COMPANION_RADIUS + (e.radius ?? 18);
    if (d < minD && d > 0.01) {
      const push = out.sub(e.pos).normalize().mul(minD - d + 4);
      out = out.add(push);
    }
  }
  return out;
}

export function moveCompanionToward(
  runtime: CompanionRuntime,
  targetPos: Vector2,
  type: CompanionType,
  state: CompanionGameState,
  dtSec: number,
): void {
  const maxSpeed = MOVE_SPEED[type];
  const accel = ACCEL[type];

  let urgency = 1;
  if (runtime.aiState === CompanionAIState.COMBAT) urgency = 1.25;
  if (runtime.aiState === CompanionAIState.PLAYER_DISTRESSED) urgency = 1.15;
  if (runtime.aiState === CompanionAIState.LOW_HP) urgency = 0.75;

  const desired = applyRepulsion(targetPos, state.player.pos, state.enemies);
  const toTarget = desired.sub(runtime.pos);
  const dist = toTarget.magnitude();

  if (dist > 0.5) {
    const wishDir = toTarget.normalize();
    const wishVel = wishDir.mul(maxSpeed * urgency);
    const dv = wishVel.sub(runtime.moveVelocity);
    const maxDelta = accel * dtSec;
    const dMag = dv.magnitude();
    if (dMag > maxDelta) {
      runtime.moveVelocity = runtime.moveVelocity.add(dv.normalize().mul(maxDelta));
    } else {
      runtime.moveVelocity = wishVel;
    }
  } else {
    runtime.moveVelocity = runtime.moveVelocity.mul(Math.max(0, 1 - dtSec * 4));
  }

  const speed = runtime.moveVelocity.magnitude();
  if (speed > maxSpeed * urgency) {
    runtime.moveVelocity = runtime.moveVelocity.normalize().mul(maxSpeed * urgency);
  }

  const prev = runtime.pos.clone();
  runtime.pos = runtime.pos.add(runtime.moveVelocity.mul(dtSec));
  runtime.velocity = runtime.pos.sub(prev).mul(1 / Math.max(dtSec, 0.001));

  if (runtime.velocity.magnitude() > 5) {
    runtime.facingAngle = Math.atan2(runtime.velocity.y, runtime.velocity.x);
  }

  const halfW = state.world.width * 0.5 - COMPANION_RADIUS;
  const halfH = state.world.height * 0.5 - COMPANION_RADIUS;
  runtime.pos.x = Math.max(-halfW, Math.min(halfW, runtime.pos.x));
  runtime.pos.y = Math.max(-halfH, Math.min(halfH, runtime.pos.y));
}

export function updateCompanionBehavior(
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: CompanionGameState,
  def: CompanionDef,
  dtSec: number,
): void {
  runtime.visualTime += dtSec;
  runtime.stateTimer += dtSec;

  if (runtime.hitFlashTimer > 0) runtime.hitFlashTimer -= dtSec;
  if (runtime.abilityPulseTimer > 0) runtime.abilityPulseTimer -= dtSec;
  if (runtime.attackPulseTimer > 0) runtime.attackPulseTimer -= dtSec;
  if (runtime.levelUpPulseTimer > 0) runtime.levelUpPulseTimer -= dtSec;
  if (runtime.playerHitBurstTimer > 0) {
    runtime.playerHitBurstTimer -= dtSec;
  } else {
    runtime.playerHitsInBurst = 0;
  }

  const orbitSpeed =
    runtime.aiState === CompanionAIState.COMBAT
      ? 2.4
      : runtime.aiState === CompanionAIState.IDLE || runtime.aiState === CompanionAIState.COOLDOWN
        ? 0.75
        : 1.5;
  runtime.orbitAngle += dtSec * orbitSpeed;
  runtime.orbitRadiusOffset += (Math.random() - 0.5) * dtSec * 12;
  runtime.orbitRadiusOffset *= Math.max(0, 1 - dtSec * 2);
  runtime.orbitRadiusOffset = Math.max(-12, Math.min(12, runtime.orbitRadiusOffset));

  const prevState = runtime.aiState;
  runtime.aiState = determineCompanionState(instance, runtime, state);
  if (runtime.aiState !== prevState) runtime.stateTimer = 0;

  const target = selectTarget(instance, state, def);
  runtime.targetEnemyId = target?.id ?? null;
  if (instance.type === CompanionType.SCOUT && target) {
    runtime.markedEnemyId = target.id;
  } else if (instance.type !== CompanionType.SCOUT) {
    runtime.markedEnemyId = null;
  }

  let goal = getTargetPosition(runtime.aiState, instance, runtime, state, def);
  if (instance.type === CompanionType.SCOUT) {
    goal = resolveScoutMoveTarget(runtime, state, goal, dtSec);
  }
  moveCompanionToward(runtime, goal, instance.type, state, dtSec);
  runtime.isAttacking = runtime.attackPulseTimer > 0;
}

export function notifyCompanionPlayerHit(runtime: CompanionRuntime): void {
  if (runtime.playerHitBurstTimer <= 0) runtime.playerHitsInBurst = 0;
  runtime.playerHitsInBurst += 1;
  runtime.playerHitBurstTimer = 1;
}

export function notifyCompanionDamage(runtime: CompanionRuntime, amount: number): void {
  if (amount > 0) runtime.hitFlashTimer = 0.2;
}

export function notifyCompanionFired(runtime: CompanionRuntime): void {
  runtime.attackPulseTimer = 0.15;
  runtime.isAttacking = true;
}

export function notifyCompanionAbilityUsed(runtime: CompanionRuntime): void {
  runtime.abilityPulseTimer = 1;
}
