import { Vector2 } from '../utils/vector';
import { EntityType, EnemyType, GameState } from '../types';
import {
  toCompanionGameState,
  type CompanionEntityRef,
  type CompanionGameState,
} from './companionGameState';
import { getScaledCompanionStats } from './companionDefs';
import {
  CompanionType,
  TargetSelectionStrategy,
  type CompanionDef,
  type CompanionInstance,
} from './companionTypes';

export function getTargetSelectionStrategy(type: CompanionType): TargetSelectionStrategy {
  switch (type) {
    case CompanionType.GUARDIAN:
      return TargetSelectionStrategy.CLOSEST_ENEMY;
    case CompanionType.SCOUT:
      return TargetSelectionStrategy.HIGHEST_THREAT;
    case CompanionType.HEALER:
      return TargetSelectionStrategy.PLAYER_ORBIT;
    case CompanionType.GUNNER:
      return TargetSelectionStrategy.PLAYER_AIM;
    default:
      return TargetSelectionStrategy.PLAYER_ORBIT;
  }
}

function livingEnemies(state: CompanionGameState): CompanionEntityRef[] {
  return state.enemies.filter((e) => e.type === EntityType.ENEMY && e.health > 0);
}

export function selectClosestEnemy<T extends { pos: Vector2 }>(
  enemies: T[],
  fromPos: Vector2,
): T | null {
  let closest: T | null = null;
  let minDistSq = Infinity;
  for (const enemy of enemies) {
    const dSq = fromPos.distanceToSq(enemy.pos);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      closest = enemy;
    }
  }
  return closest;
}

export function estimateThreatToPlayer(enemy: CompanionEntityRef, playerPos: Vector2): number {
  const dist = Math.max(enemy.pos.distanceTo(playerPos), 40);
  const dmg = enemy.damage ?? 12;
  const hpRatio = enemy.health / Math.max(enemy.maxHealth, 1);
  let weight = 1;
  if (enemy.enemyType === EnemyType.BOSS || enemy.miniBossId) weight = 3.5;
  else if (enemy.enemyType === EnemyType.ELITE || enemy.enemyType === EnemyType.TANK) weight = 1.8;
  else if (enemy.enemyType === EnemyType.RANGED || enemy.enemyType === EnemyType.SNIPER) weight = 1.35;
  return (dmg * hpRatio * weight * 8000) / dist;
}

export function selectHighestThreat(
  enemies: CompanionEntityRef[],
  playerPos: Vector2,
): CompanionEntityRef | null {
  let highest: CompanionEntityRef | null = null;
  let maxThreat = -Infinity;
  for (const enemy of enemies) {
    const threat = estimateThreatToPlayer(enemy, playerPos);
    if (threat > maxThreat) {
      maxThreat = threat;
      highest = enemy;
    }
  }
  return highest;
}

export function selectTarget(
  instance: CompanionInstance,
  state: GameState | CompanionGameState,
  def: CompanionDef,
): CompanionEntityRef | null {
  const gs = toCompanionGameState(state);
  const enemies = livingEnemies(gs);
  if (enemies.length === 0) return null;

  const strategy = getTargetSelectionStrategy(instance.type);
  const playerPos = gs.player.pos;

  switch (strategy) {
    case TargetSelectionStrategy.CLOSEST_ENEMY:
      return selectClosestEnemy(enemies, playerPos);
    case TargetSelectionStrategy.HIGHEST_THREAT:
      return selectHighestThreat(enemies, playerPos);
    case TargetSelectionStrategy.PLAYER_AIM: {
      const scaled = getScaledCompanionStats(instance.id, instance.currentLevel);
      const range = scaled?.range ?? 500;
      const inRange = enemies.filter((e) => e.pos.distanceTo(playerPos) <= range);
      const pool = inRange.length > 0 ? inRange : enemies;
      const aimDir = gs.player.aimDir;
      if (aimDir && aimDir.magnitude() > 0.1) {
        let best: CompanionEntityRef | null = null;
        let bestDot = -Infinity;
        const dir = aimDir.normalize();
        for (const e of pool) {
          const toEnemy = e.pos.sub(playerPos).normalize();
          const dot = dir.x * toEnemy.x + dir.y * toEnemy.y;
          if (dot > bestDot) {
            bestDot = dot;
            best = e;
          }
        }
        if (best && bestDot > 0.25) return best;
      }
      return selectClosestEnemy(pool, playerPos);
    }
    case TargetSelectionStrategy.PLAYER_ORBIT:
    default:
      return null;
  }
}
