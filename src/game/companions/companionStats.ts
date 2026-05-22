import { Vector2 } from '../utils/vector';
import { CompanionType } from './companionTypes';

const BASE_MOVE_SPEED: Record<CompanionType, number> = {
  [CompanionType.GUARDIAN]: 150,
  [CompanionType.SCOUT]: 220,
  [CompanionType.HEALER]: 120,
  [CompanionType.GUNNER]: 200,
};

/**
 * Player `speed` stat is per simulation tick (~60/s), not px/s.
 * Multiply to approximate cruise world speed when velocity is idle.
 */
export const PLAYER_SPEED_STAT_TO_WORLD = 55;

/** Scout stays near player sprint but can burst slightly during catch-up. */
export const SCOUT_PLAYER_SPEED_CAP = 1.12;
export const SCOUT_CATCHUP_SPEED_MULT = 1.35;

export function getCompanionBaseMoveSpeed(type: CompanionType): number {
  return BASE_MOVE_SPEED[type];
}

/** Estimate how fast the player is moving in world px/s. */
export function estimatePlayerWorldSpeed(
  speedStat: number,
  velocity: Vector2 | undefined,
  dtSec: number,
): number {
  const velMag = velocity?.magnitude() ?? 0;
  const safeDt = Math.max(dtSec, 1 / 240);
  if (velMag > 6) {
    return velMag / safeDt;
  }
  return Math.max(90, speedStat * PLAYER_SPEED_STAT_TO_WORLD);
}

/** Effective max speed for companion movement (px/s). */
export function getCompanionMaxMoveSpeed(
  type: CompanionType,
  speedStat: number,
  velocity?: Vector2,
  dtSec = 1 / 60,
  catchUp = false,
): number {
  const base = BASE_MOVE_SPEED[type];
  const playerWorld = estimatePlayerWorldSpeed(speedStat, velocity, dtSec);

  if (type === CompanionType.SCOUT) {
    const cap = playerWorld * (catchUp ? SCOUT_CATCHUP_SPEED_MULT : SCOUT_PLAYER_SPEED_CAP);
    return Math.min(base, Math.max(140, cap));
  }

  return Math.max(base, playerWorld * 0.85);
}
