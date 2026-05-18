import { EnemyType } from '../types';

export interface EnemySpawnRule {
  typeOverride: number; // maps to spawnEnemy typeOverride switch (0–11)
  enemyType: EnemyType; // for readability / future filtering
  weight: number;       // relative spawn probability, weights sum to ~100
  startAt: number;      // 0.0–1.0 progress through level before type appears
}

// Normalized 0–1 coords, multiplied by world.width / world.height at runtime.
// Player always starts near (0.5, 0.5). Portal is the final waypoint.
export interface PathWaypoint {
  x: number;
  y: number;
}

/** Obstacle placed along the level path. Coords normalized 0–1. */
export interface ObstacleSpec {
  x: number;
  y: number;
  type: 'CIRCLE' | 'RECT';
  radius: number;  // world-space (not normalized) — same scale as corridorHalfWidth
  color: string;
}

export const PORTAL_TRIGGER_RADIUS = 180; // world-space pixels

export interface CampaignLevel {
  id: string;
  number: number;
  name: string;
  flavorIntro: string;
  flavorBossIntro: string;
  flavorOutro: string;
  enemiesToKill: number;
  enemyComposition: EnemySpawnRule[];
  bossType: EnemyType;
  backgroundTheme: 0 | 1 | 2 | 3 | 4;
  path: PathWaypoint[];      // [start ≈ player spawn, ...intermediates, portal]
  portalPos: PathWaypoint;   // convenience alias = path[path.length - 1]
  spawnRadius: number;       // world-space radius around active waypoint to spawn enemies
  corridorHalfWidth: number; // world-space half-width of the on-rails corridor
  obstacles: ObstacleSpec[]; // static hazards placed along the corridor
}

// typeOverride reference (from spawnEnemy switch):
//  0 = CHASER   1 = PHALANX  2 = WRAITH   3 = ELITE
//  4 = SPLINTER 5 = NOVA     6 = RANGED   9 = FAST
// 10 = SWARMER 11 = SNIPER

export const CAMPAIGN_LEVELS: CampaignLevel[] = [
  {
    id: 'level_1',
    number: 1,
    name: 'Debris Field',
    flavorIntro:
      'Wreckage from the outer colonies drifts across sector zero. ' +
      'Salvage drones have gone rogue — clear the field.',
    flavorBossIntro: 'A salvage hauler emerges from the debris. It has seen better days.',
    flavorOutro:
      'The field is clear. Whatever turned these machines hostile came from deeper in the sector.',
    enemiesToKill: 35,
    enemyComposition: [
      { typeOverride: 0,  enemyType: EnemyType.CHASER,  weight: 55, startAt: 0.0 },
      { typeOverride: 9,  enemyType: EnemyType.FAST,    weight: 30, startAt: 0.1 },
      { typeOverride: 10, enemyType: EnemyType.SWARMER, weight: 15, startAt: 0.4 },
    ],
    bossType: EnemyType.BOSS,
    backgroundTheme: 0,
    // Gentle arc sweeping north-east — introductory, readable
    path: [
      { x: 0.50, y: 0.50 },
      { x: 0.55, y: 0.38 },
      { x: 0.65, y: 0.28 },
      { x: 0.75, y: 0.22 },
    ],
    portalPos: { x: 0.75, y: 0.22 },
    spawnRadius: 700,
    corridorHalfWidth: 550,
    obstacles: [
      { x: 0.57, y: 0.45, type: 'CIRCLE', radius: 90,  color: 'rgba(100,120,140,0.7)' },
      { x: 0.62, y: 0.36, type: 'CIRCLE', radius: 70,  color: 'rgba(80,100,120,0.7)'  },
      { x: 0.70, y: 0.30, type: 'RECT',   radius: 110, color: 'rgba(90,110,130,0.7)'  },
      { x: 0.67, y: 0.24, type: 'CIRCLE', radius: 60,  color: 'rgba(100,120,140,0.7)' },
    ],
  },

  {
    id: 'level_2',
    number: 2,
    name: 'The Swarm',
    flavorIntro:
      'A bio-mechanical hive ship has seeded the asteroid belt. ' +
      'Thousands of drones pour from its hull. Do not let them reach the colony.',
    flavorBossIntro: 'The hive mind surfaces. It coordinates every drone with a single pulse.',
    flavorOutro:
      'The swarm collapses as the hive mind falls silent. ' +
      'But the signal that woke it is still broadcasting.',
    enemiesToKill: 55,
    enemyComposition: [
      { typeOverride: 10, enemyType: EnemyType.SWARMER, weight: 40, startAt: 0.0 },
      { typeOverride: 0,  enemyType: EnemyType.CHASER,  weight: 25, startAt: 0.0 },
      { typeOverride: 9,  enemyType: EnemyType.FAST,    weight: 20, startAt: 0.2 },
      { typeOverride: 6,  enemyType: EnemyType.RANGED,  weight: 15, startAt: 0.5 },
    ],
    bossType: EnemyType.BOSS,
    backgroundTheme: 1,
    // S-curve — weaves through the swarm zone
    path: [
      { x: 0.50, y: 0.50 },
      { x: 0.60, y: 0.60 },
      { x: 0.70, y: 0.50 },
      { x: 0.78, y: 0.38 },
      { x: 0.80, y: 0.25 },
    ],
    portalPos: { x: 0.80, y: 0.25 },
    spawnRadius: 750,
    corridorHalfWidth: 480,
    obstacles: [
      { x: 0.63, y: 0.57, type: 'CIRCLE', radius: 80,  color: 'rgba(120,80,40,0.7)'  },
      { x: 0.68, y: 0.52, type: 'CIRCLE', radius: 60,  color: 'rgba(100,60,30,0.7)'  },
      { x: 0.72, y: 0.44, type: 'RECT',   radius: 100, color: 'rgba(110,70,35,0.7)'  },
      { x: 0.76, y: 0.36, type: 'CIRCLE', radius: 75,  color: 'rgba(120,80,40,0.7)'  },
      { x: 0.74, y: 0.28, type: 'CIRCLE', radius: 55,  color: 'rgba(100,60,30,0.7)'  },
    ],
  },

  {
    id: 'level_3',
    number: 3,
    name: 'Crystal Caverns',
    flavorIntro:
      'Deep below the moon\'s crust, crystalline structures hum with alien energy. ' +
      'The entities here do not fight — they hunt.',
    flavorBossIntro:
      'The cavern trembles. Something vast stirs in the dark below the resonance crystal.',
    flavorOutro:
      'The crystal goes dark. In the silence you find a single transmission — ' +
      'coordinates pointing inward toward the void.',
    enemiesToKill: 70,
    enemyComposition: [
      { typeOverride: 2,  enemyType: EnemyType.WRAITH,  weight: 35, startAt: 0.0 },
      { typeOverride: 3,  enemyType: EnemyType.ELITE,   weight: 25, startAt: 0.2 },
      { typeOverride: 0,  enemyType: EnemyType.CHASER,  weight: 20, startAt: 0.0 },
      { typeOverride: 11, enemyType: EnemyType.SNIPER,  weight: 12, startAt: 0.4 },
      { typeOverride: 6,  enemyType: EnemyType.RANGED,  weight: 8,  startAt: 0.3 },
    ],
    bossType: EnemyType.BOSS,
    backgroundTheme: 2,
    // Deep dive south then curve up to crystal chamber
    path: [
      { x: 0.50, y: 0.50 },
      { x: 0.42, y: 0.62 },
      { x: 0.32, y: 0.70 },
      { x: 0.25, y: 0.62 },
      { x: 0.22, y: 0.50 },
    ],
    portalPos: { x: 0.22, y: 0.50 },
    spawnRadius: 700,
    corridorHalfWidth: 400,
    obstacles: [
      { x: 0.39, y: 0.58, type: 'CIRCLE', radius: 95,  color: 'rgba(60,180,160,0.5)' },
      { x: 0.35, y: 0.65, type: 'RECT',   radius: 120, color: 'rgba(40,160,140,0.5)' },
      { x: 0.29, y: 0.68, type: 'CIRCLE', radius: 70,  color: 'rgba(60,180,160,0.5)' },
      { x: 0.24, y: 0.62, type: 'CIRCLE', radius: 85,  color: 'rgba(40,160,140,0.5)' },
      { x: 0.24, y: 0.55, type: 'RECT',   radius: 90,  color: 'rgba(60,180,160,0.5)' },
    ],
  },

  {
    id: 'level_4',
    number: 4,
    name: 'The Void',
    flavorIntro:
      'Beyond the mapped sectors, space itself behaves differently. ' +
      'Enemies here fragment, detonate, and reform. Trust nothing that holds still.',
    flavorBossIntro:
      'A structure of pure annihilation materialises at the void\'s centre. ' +
      'It has no name in any database.',
    flavorOutro:
      'The void structure collapses inward. The coordinates it was broadcasting lead ' +
      'to a single point — something built the boss lair deliberately.',
    enemiesToKill: 90,
    enemyComposition: [
      { typeOverride: 4,  enemyType: EnemyType.SPLINTER, weight: 35, startAt: 0.0 },
      { typeOverride: 5,  enemyType: EnemyType.NOVA,     weight: 30, startAt: 0.0 },
      { typeOverride: 2,  enemyType: EnemyType.WRAITH,   weight: 15, startAt: 0.2 },
      { typeOverride: 3,  enemyType: EnemyType.ELITE,    weight: 12, startAt: 0.3 },
      { typeOverride: 1,  enemyType: EnemyType.PHALANX,  weight: 8,  startAt: 0.5 },
    ],
    bossType: EnemyType.BOSS,
    backgroundTheme: 3,
    // Spiral inward — disorienting, void-like
    path: [
      { x: 0.50, y: 0.50 },
      { x: 0.35, y: 0.40 },
      { x: 0.28, y: 0.28 },
      { x: 0.38, y: 0.20 },
      { x: 0.52, y: 0.22 },
      { x: 0.60, y: 0.32 },
    ],
    portalPos: { x: 0.60, y: 0.32 },
    spawnRadius: 800,
    corridorHalfWidth: 600,
    obstacles: [
      { x: 0.41, y: 0.44, type: 'CIRCLE', radius: 100, color: 'rgba(80,40,120,0.6)'  },
      { x: 0.32, y: 0.35, type: 'RECT',   radius: 130, color: 'rgba(60,20,100,0.6)'  },
      { x: 0.36, y: 0.26, type: 'CIRCLE', radius: 80,  color: 'rgba(80,40,120,0.6)'  },
      { x: 0.45, y: 0.22, type: 'CIRCLE', radius: 70,  color: 'rgba(60,20,100,0.6)'  },
      { x: 0.54, y: 0.27, type: 'RECT',   radius: 110, color: 'rgba(80,40,120,0.6)'  },
    ],
  },

  {
    id: 'level_5',
    number: 5,
    name: 'Boss Lair',
    flavorIntro:
      'Every signal, every attack, every wave across five sectors was a test. ' +
      'This is what you were being tested for. ' +
      'One ship. One target. End it.',
    flavorBossIntro:
      'It rises from below the station core — the architect of everything you have fought. ' +
      'It is enormous. It is aware of you. It has been waiting.',
    flavorOutro:
      'The station falls silent for the first time in years. ' +
      'Across all sectors, the hostiles power down one by one. ' +
      'You drift out of the wreckage into empty, quiet space. ' +
      'It\'s over.',
    enemiesToKill: 120,
    enemyComposition: [
      { typeOverride: 3,  enemyType: EnemyType.ELITE,    weight: 22, startAt: 0.0 },
      { typeOverride: 4,  enemyType: EnemyType.SPLINTER, weight: 18, startAt: 0.0 },
      { typeOverride: 5,  enemyType: EnemyType.NOVA,     weight: 16, startAt: 0.0 },
      { typeOverride: 1,  enemyType: EnemyType.PHALANX,  weight: 14, startAt: 0.1 },
      { typeOverride: 2,  enemyType: EnemyType.WRAITH,   weight: 12, startAt: 0.1 },
      { typeOverride: 11, enemyType: EnemyType.SNIPER,   weight: 8,  startAt: 0.3 },
      { typeOverride: 6,  enemyType: EnemyType.RANGED,   weight: 6,  startAt: 0.2 },
      { typeOverride: 0,  enemyType: EnemyType.CHASER,   weight: 4,  startAt: 0.0 },
    ],
    bossType: EnemyType.BOSS,
    backgroundTheme: 4,
    // Long diagonal gauntlet — no shortcuts, straight to the architect
    path: [
      { x: 0.50, y: 0.50 },
      { x: 0.42, y: 0.42 },
      { x: 0.34, y: 0.34 },
      { x: 0.27, y: 0.27 },
      { x: 0.22, y: 0.22 },
    ],
    portalPos: { x: 0.22, y: 0.22 },
    spawnRadius: 900,
    corridorHalfWidth: 420,
    obstacles: [
      { x: 0.44, y: 0.44, type: 'CIRCLE', radius: 85,  color: 'rgba(200,60,40,0.6)'  },
      { x: 0.38, y: 0.38, type: 'RECT',   radius: 110, color: 'rgba(180,40,20,0.6)'  },
      { x: 0.32, y: 0.32, type: 'CIRCLE', radius: 75,  color: 'rgba(200,60,40,0.6)'  },
      { x: 0.27, y: 0.27, type: 'CIRCLE', radius: 90,  color: 'rgba(180,40,20,0.6)'  },
      { x: 0.30, y: 0.23, type: 'RECT',   radius: 100, color: 'rgba(200,60,40,0.6)'  },
      { x: 0.24, y: 0.28, type: 'CIRCLE', radius: 65,  color: 'rgba(180,40,20,0.6)'  },
    ],
  },
];

export function getCampaignLevel(id: string): CampaignLevel | undefined {
  return CAMPAIGN_LEVELS.find((l) => l.id === id);
}

/** Convert a normalized PathWaypoint to world-space pixels. */
export function waypointToWorld(wp: PathWaypoint, worldW: number, worldH: number): { x: number; y: number } {
  return { x: wp.x * worldW, y: wp.y * worldH };
}

/**
 * Catmull-Rom spline sample.
 * Given four control points p0–p3, returns the interpolated point at t (0–1).
 */
export function catmullRom(
  p0: PathWaypoint, p1: PathWaypoint, p2: PathWaypoint, p3: PathWaypoint, t: number
): PathWaypoint {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * t2 + (-p0.x + 3*p1.x - 3*p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * t2 + (-p0.y + 3*p1.y - 3*p2.y + p3.y) * t3),
  };
}

/**
 * Returns the index of the active waypoint (look-ahead of 1) based on
 * how many enemies remain vs total to kill.
 */
export function activeWaypointIndex(level: CampaignLevel, enemiesToKill: number): number {
  const progress = Math.max(0, 1 - enemiesToKill / level.enemiesToKill);
  const raw = Math.floor(progress * (level.path.length - 1));
  return Math.min(raw + 1, level.path.length - 1);
}

/**
 * Returns a world-space spawn position scattered around the active
 * waypoint ahead of the player. Used by App.tsx to override spawnEnemy pos.
 */
export function getSpawnPosAlongPath(
  level: CampaignLevel,
  enemiesToKill: number,
  worldW: number,
  worldH: number
): { x: number; y: number } {
  const idx = activeWaypointIndex(level, enemiesToKill);
  const wp = level.path[idx];
  const r = level.spawnRadius;
  const angle = Math.random() * Math.PI * 2;
  const dist = r * 0.3 + Math.random() * r * 0.7; // inner 30%–100% of radius
  return {
    x: Math.max(0, Math.min(worldW, wp.x * worldW + Math.cos(angle) * dist)),
    y: Math.max(0, Math.min(worldH, wp.y * worldH + Math.sin(angle) * dist)),
  };
}

/**
 * Samples a continuous world-space position along the full path at t (0–1).
 * Uses Catmull-Rom between segments; clamps p0/p3 at edges.
 */
export function samplePath(
  level: CampaignLevel,
  t: number,
  worldW: number,
  worldH: number
): { x: number; y: number } {
  const pts = level.path;
  const N = pts.length;
  if (N === 1) return waypointToWorld(pts[0], worldW, worldH);
  const clamped = Math.max(0, Math.min(1, t));
  const total = N - 1;
  const scaled = clamped * total;
  const i = Math.min(Math.floor(scaled), total - 1);
  const localT = scaled - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[Math.min(N - 1, i + 1)];
  const p3 = pts[Math.min(N - 1, i + 2)];
  return waypointToWorld(catmullRom(p0, p1, p2, p3, localT), worldW, worldH);
}

/** Returns the normalized tangent direction along the path at t (0–1). */
export function samplePathTangent(
  level: CampaignLevel,
  t: number,
  worldW: number,
  worldH: number
): { x: number; y: number } {
  const eps = 0.01;
  const a = samplePath(level, Math.max(0, t - eps), worldW, worldH);
  const b = samplePath(level, Math.min(1, t + eps), worldW, worldH);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function pickCampaignEnemyType(
  level: CampaignLevel,
  progress: number // 0.0–1.0, kills done / enemiesToKill
): number {
  const eligible = level.enemyComposition.filter((r) => progress >= r.startAt);
  if (eligible.length === 0) return level.enemyComposition[0].typeOverride;

  const totalWeight = eligible.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const rule of eligible) {
    roll -= rule.weight;
    if (roll <= 0) return rule.typeOverride;
  }
  return eligible[eligible.length - 1].typeOverride;
}
