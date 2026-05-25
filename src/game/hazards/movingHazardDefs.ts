import { Vector2 } from '../utils/vector';
import { HAZARD_COLORS } from '../../config/gameTheme';
import type { MovingHazard, MovingHazardKind, MovingHazardPattern } from '../types';

// ============================================================================
// PER-KIND CONFIG
// ============================================================================

interface MovingHazardConfig {
  kind: MovingHazardKind;
  /** [min, max] radius pixels */
  radius: [number, number];
  health: number;
  /** [min, max] collision damage per hit */
  damage: [number, number];
  /** [min, max] base speed pixels/frame */
  speed: [number, number];
  /** Allowed movement patterns for this kind */
  patterns: MovingHazardPattern[];
  color: string;
  trailColor: string;
  scoreValue: number;
  /** Pixels/s applied to player on impact */
  knockbackForce: number;
}

export const MOVING_HAZARD_CONFIGS: Record<MovingHazardKind, MovingHazardConfig> = {
  COMET: {
    kind: 'COMET',
    radius: [8, 14],
    health: 2,
    damage: [10, 15],
    speed: [7, 12],
    patterns: ['linear', 'sine'],
    color: HAZARD_COLORS.cometBody,
    trailColor: HAZARD_COLORS.cometTrail,
    scoreValue: 75,
    knockbackForce: 320,
  },
  ASTEROID: {
    kind: 'ASTEROID',
    radius: [20, 32],
    health: 6,
    damage: [8, 12],
    speed: [2, 4],
    patterns: ['bounce', 'linear'],
    color: HAZARD_COLORS.asteroidBody,
    trailColor: HAZARD_COLORS.asteroidTrail,
    scoreValue: 120,
    knockbackForce: 200,
  },
  DEBRIS: {
    kind: 'DEBRIS',
    radius: [6, 11],
    health: 1,
    damage: [5, 8],
    speed: [4, 9],
    patterns: ['bounce', 'linear', 'sine'],
    color: HAZARD_COLORS.debrisBody,
    trailColor: HAZARD_COLORS.debrisTrail,
    scoreValue: 40,
    knockbackForce: 150,
  },
};

// ============================================================================
// PER-STAGE SPAWN TUNING
// ============================================================================

export interface HazardStageConfig {
  /** Maximum moving hazards alive simultaneously */
  maxHazards: number;
  /** Seconds between spawn attempts */
  spawnIntervalSecs: number;
  /** Kinds allowed this stage */
  kinds: MovingHazardKind[];
}

export function getHazardStageConfig(stage: number): HazardStageConfig {
  if (stage <= 1) {
    return { maxHazards: 2, spawnIntervalSecs: 12, kinds: ['ASTEROID', 'DEBRIS'] };
  }
  if (stage <= 3) {
    return { maxHazards: 3, spawnIntervalSecs: 9, kinds: ['COMET', 'ASTEROID', 'DEBRIS'] };
  }
  if (stage <= 5) {
    return { maxHazards: 4, spawnIntervalSecs: 7, kinds: ['COMET', 'ASTEROID', 'DEBRIS'] };
  }
  return { maxHazards: 4, spawnIntervalSecs: 5, kinds: ['COMET', 'ASTEROID', 'DEBRIS'] };
}

// ============================================================================
// EDGE SPAWN FACTORY
// ============================================================================

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Minimum spawn-point distance (px) between a new hazard and any existing one. */
const MIN_SPAWN_SEPARATION = 220;
/** Max attempts to find a non-overlapping edge spawn before giving up. */
const SPAWN_ATTEMPTS = 6;

/** Toggle dev logging for hazard spawns. Set false in production builds. */
const HAZARD_SPAWN_LOG =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;

/**
 * Spawn a moving hazard from a random world edge, aimed toward the interior.
 *
 * @param existing Currently alive hazards — used to avoid overlapping spawn points.
 *                 Pass `[]` if you don't care about clustering.
 * @returns The new hazard, or `null` if no non-overlapping edge slot was found
 *          (caller can simply skip spawning this tick).
 */
export function spawnMovingHazard(
  worldWidth: number,
  worldHeight: number,
  stage: number,
  existing: MovingHazard[] = [],
): MovingHazard | null {
  const stageConf = getHazardStageConfig(stage);
  const kind = pickFrom(stageConf.kinds);
  const cfg = MOVING_HAZARD_CONFIGS[kind];

  const radius = rand(cfg.radius[0], cfg.radius[1]);
  const speed = rand(cfg.speed[0], cfg.speed[1]);
  const damage = rand(cfg.damage[0], cfg.damage[1]);
  const pattern: MovingHazardPattern = pickFrom(cfg.patterns);

  // Try multiple edge spawns; reject any that overlap an existing hazard.
  let spawnX = 0;
  let spawnY = 0;
  let edge = 0;
  let attempt = 0;
  for (; attempt < SPAWN_ATTEMPTS; attempt++) {
    edge = Math.floor(Math.random() * 4);
    const margin = radius + 10;

    if (edge === 0) {
      spawnX = rand(margin, worldWidth - margin);
      spawnY = -margin;
    } else if (edge === 1) {
      spawnX = rand(margin, worldWidth - margin);
      spawnY = worldHeight + margin;
    } else if (edge === 2) {
      spawnX = -margin;
      spawnY = rand(margin, worldHeight - margin);
    } else {
      spawnX = worldWidth + margin;
      spawnY = rand(margin, worldHeight - margin);
    }

    let overlaps = false;
    for (const other of existing) {
      const dx = other.pos.x - spawnX;
      const dy = other.pos.y - spawnY;
      if (dx * dx + dy * dy < MIN_SPAWN_SEPARATION * MIN_SPAWN_SEPARATION) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) break;
  }
  if (attempt >= SPAWN_ATTEMPTS) {
    if (HAZARD_SPAWN_LOG) {
      console.log(
        `[hazard] skipped ${kind} — could not find non-overlapping edge after ${SPAWN_ATTEMPTS} attempts`,
      );
    }
    return null;
  }

  // Aim toward a random point near world center (with scatter)
  const targetX = worldWidth / 2 + (Math.random() - 0.5) * worldWidth * 0.5;
  const targetY = worldHeight / 2 + (Math.random() - 0.5) * worldHeight * 0.5;

  const dx = targetX - spawnX;
  const dy = targetY - spawnY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const vx = (dx / len) * speed;
  const vy = (dy / len) * speed;

  const anchorX = worldWidth / 2;
  const anchorY = worldHeight / 2;
  const sineAmplitude = kind === 'COMET' ? 40 + Math.random() * 60 : 80 + Math.random() * 120;
  const health = cfg.health + Math.floor(stage / 3);

  const hazard: MovingHazard = {
    id: `hz_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    kind,
    pos: new Vector2(spawnX, spawnY),
    velocity: new Vector2(vx, vy),
    radius,
    health,
    maxHealth: health,
    damage,
    pattern,
    patternPhase: Math.random() * Math.PI * 2,
    anchorPos: new Vector2(anchorX, anchorY),
    sineAmplitude,
    color: cfg.color,
    trailColor: cfg.trailColor,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.12,
    hitFlash: 0,
    scoreValue: cfg.scoreValue,
    knockbackForce: cfg.knockbackForce,
  };

  if (HAZARD_SPAWN_LOG) {
    const edgeName = ['TOP', 'BOTTOM', 'LEFT', 'RIGHT'][edge];
    console.log(
      `[hazard] spawn ${kind} stage=${stage} edge=${edgeName} pos=(${spawnX.toFixed(0)},${spawnY.toFixed(0)}) ` +
        `vel=(${vx.toFixed(1)},${vy.toFixed(1)}) hp=${health} dmg=${damage.toFixed(1)} pattern=${pattern}`,
    );
  }

  return hazard;
}
