import { Entity, EntityType, Obstacle, BeamFlash } from '../types';
import { Vector2 } from '../utils/vector';
import { checkProjectileObstacleCollision } from '../Logic';

export type { BeamFlash };

export interface BeamHit {
  enemy: Entity;
  distance: number;
}

export interface BeamResult {
  hits: BeamHit[];
  end: Vector2;
  blocked: boolean;
}

const BEAM_LENGTH = 840;
const BEAM_STEP = 35;
const BEAM_RADIUS = 35;

function pointToBeamDistance(point: Vector2, origin: Vector2, dir: Vector2, maxDist: number): { perp: number; along: number } {
  const toP = point.sub(origin);
  const along = toP.x * dir.x + toP.y * dir.y;
  const proj = origin.add(dir.mul(Math.max(0, Math.min(along, maxDist))));
  return { perp: point.distanceTo(proj), along };
}

function obstacleBlocksAt(origin: Vector2, dir: Vector2, dist: number, obstacles: Obstacle[]): boolean {
  const testPos = origin.add(dir.mul(dist));
  const probe: Entity = {
    id: 'beam-probe',
    type: EntityType.PROJECTILE,
    pos: testPos,
    radius: BEAM_RADIUS * 0.5,
    health: 1,
    maxHealth: 1,
    speed: 0,
    velocity: new Vector2(0, 0),
    color: '#00f2ff',
  };
  for (const obs of obstacles) {
    if (checkProjectileObstacleCollision(probe, obs)) return true;
  }
  return false;
}

export function computeBeam(
  origin: Vector2,
  angle: number,
  enemies: Entity[],
  obstacles: Obstacle[],
  unlimitedPierce: boolean,
  maxHits = 12
): BeamResult {
  const dir = new Vector2(Math.cos(angle), Math.sin(angle));

  let blockedDist = BEAM_LENGTH;
  for (let d = BEAM_STEP; d <= BEAM_LENGTH; d += BEAM_STEP) {
    if (obstacleBlocksAt(origin, dir, d, obstacles)) {
      blockedDist = Math.max(BEAM_STEP, d - BEAM_STEP);
      break;
    }
  }

  const actualEnd = origin.add(dir.mul(blockedDist));
  const hits: BeamHit[] = [];

  for (const e of enemies) {
    if (e.health <= 0) continue;
    const { perp, along } = pointToBeamDistance(e.pos, origin, dir, blockedDist);
    if (perp > BEAM_RADIUS + e.radius) continue;
    if (along < 0 || along > blockedDist + e.radius * 0.5) continue;
    hits.push({ enemy: e, distance: along });
  }

  hits.sort((a, b) => a.distance - b.distance);
  const limit = unlimitedPierce ? hits.length : Math.min(maxHits, hits.length);

  return {
    hits: hits.slice(0, limit),
    end: actualEnd,
    blocked: blockedDist < BEAM_LENGTH,
  };
}

export function createBeamFlash(origin: Vector2, end: Vector2, color: string): BeamFlash {
  return {
    id: Math.random().toString(36).slice(2),
    origin: origin.clone(),
    end: end.clone(),
    color,
    life: 0.15,
    maxLife: 0.15,
  };
}
