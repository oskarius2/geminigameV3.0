import { EnemyType, Obstacle } from '../types';
import { Vector2 } from '../utils/vector';
import type { RailsBossId } from './bosses';

export interface BossEntranceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface RailsBossEntranceState {
  bossId: RailsBossId;
  elapsedMs: number;
  durationMs: number;
  audioPlayed: boolean;
  particles: BossEntranceParticle[];
  impactDone: boolean;
  riftPulse: number;
}

export interface RailsBossDeathState {
  bossId: RailsBossId;
  elapsedMs: number;
  durationMs: number;
  finished: boolean;
  pos: Vector2;
  radius: number;
  impactBurst: boolean;
  flashCount: number;
}

/**
 * ON_RAILS — content + runtime types only.
 * No imports from campaignLevels / bossArenas.
 */

/** One vertex on the tunnel centerline (world pixels). */
export interface RailPoint {
  x: number;
  y: number;
}

/** Static hazard placed along the tunnel. */
export interface RailsObstacleSpec {
  id: string;
  /** Distance along the rail from start (world units). */
  atDistance: number;
  /** Offset from centerline, -1..1 × corridorHalfWidth at spawn time. */
  lateral: number;
  shape: 'circle' | 'rect';
  width: number;
  height: number;
  color: string;
}

/** Spawn pack triggered when the run reaches a distance marker. */
export interface RailsSpawnPack {
  atDistance: number;
  enemyType: EnemyType;
  count: number;
}

export type RailsVisualStyle = 'digital' | 'geometric' | 'elegant';
export type RailsPalette = 'cyberpunk' | 'industrial' | 'cosmic';
export type RailsDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface RailsLevelUi {
  style: RailsVisualStyle;
  palette: RailsPalette;
  rules: readonly string[];
  difficulty: RailsDifficulty;
  gradientFrom: string;
  gradientTo: string;
  accentText: string;
  clearedTitle: string;
  icon: 'tunnel' | 'asteroid' | 'void';
}

/**
 * Level definition — small, explicit, no campaign concepts.
 * Centerline is piecewise-linear between `centerline` points (no splines).
 */
export interface RailsLevel {
  id: string;
  name: string;
  ui: RailsLevelUi;
  /** Survive this many seconds to win. */
  targetSeconds: number;
  /** How fast the run advances along the rail (world units / second). */
  scrollSpeed: number;
  /** Half-width of the playable strip (world units). */
  corridorHalfWidth: number;
  /**
   * Total rail length (world units). Should match the last centerline segment end.
   * Used for win-by-distance optional modes later; v1 uses targetSeconds only.
   */
  railLength: number;
  /** Tunnel center polyline, at least 2 points, monotonic along travel. */
  centerline: readonly RailPoint[];
  obstacles: readonly RailsObstacleSpec[];
  spawns: readonly RailsSpawnPack[];
  /** Optional repeating spawns between packs (seconds). 0 = off. */
  ambientSpawnInterval: number;
  ambientEnemyType: EnemyType;
}

/** Live ON_RAILS run — only meaningful when gameMode === 'ON_RAILS'. */
export interface RailsRunState {
  levelId: string;
  /** Progress along rail (0 .. railLength). */
  distance: number;
  /** Lateral offset from centerline in world units (clamped each frame). */
  lateral: number;
  /** Depth along tunnel tangent: + = forward, − = back (±50% corridorHalfWidth). */
  forward: number;
  targetSeconds: number;
  scrollSpeed: number;
  corridorHalfWidth: number;
  railLength: number;
  outcome: 'active' | 'cleared' | 'failed';
  /** Seconds until next ambient spawn. */
  ambientSpawnTimer: number;
  /** Distances already consumed from RailsSpawnPack. */
  triggeredSpawnDistances: number[];
  /** Cached centerline + width for systems (built once at run start). */
  centerline: RailPoint[];
  /** Obstacles instantiated into world space for this run. */
  builtObstacles: Obstacle[];
  /** Cached polyline arc-lengths (same length as centerline). */
  cumulativeLengths: number[];
  /** Render zoom for corridor (set at run start). */
  viewZoom: number;
  /** Kills this run (ON_RAILS HUD / victory). */
  killCount: number;
  /** Wave segment ids already fired. */
  triggeredWaveIds: string[];
  /** Powerup pickups spawned this wave segment. */
  wavePowerupBudget: number;
  bossSpawned: boolean;
  bossDefeated: boolean;
  /** False during intro cinematic; true when boss can attack. */
  bossCombatActive: boolean;
  bossEntrance: RailsBossEntranceState | null;
  bossDeath: RailsBossDeathState | null;
  /** Survival time until "LEVEL CLEARED!" banner hides. */
  levelClearedBannerUntil: number;
  weakPointOpen: boolean;
  weakPointPhase: number;
  weakPointWasOpen: boolean;
  weakPointHitFlash: number;
  weakPointHitFlashUntil: number;
  shieldBubbleHits: number;
  rapidFireUntil: number;
  slowTimeUntil: number;
  scoreMultUntil: number;
  invincibleUntil: number;
  megaBlastCharges: number;
  enemySlowMult: number;
}

export function createRailsPowerupState(): Pick<
  RailsRunState,
  | 'shieldBubbleHits'
  | 'rapidFireUntil'
  | 'slowTimeUntil'
  | 'scoreMultUntil'
  | 'invincibleUntil'
  | 'megaBlastCharges'
  | 'enemySlowMult'
> {
  return {
    shieldBubbleHits: 0,
    rapidFireUntil: 0,
    slowTimeUntil: 0,
    scoreMultUntil: 0,
    invincibleUntil: 0,
    megaBlastCharges: 0,
    enemySlowMult: 1,
  };
}

export function createRailsRunState(level: RailsLevel): RailsRunState {
  return {
    levelId: level.id,
    distance: 0,
    lateral: 0,
    forward: 0,
    targetSeconds: level.targetSeconds,
    scrollSpeed: level.scrollSpeed,
    corridorHalfWidth: level.corridorHalfWidth,
    railLength: level.railLength,
    outcome: 'active',
    ambientSpawnTimer: level.ambientSpawnInterval > 0 ? level.ambientSpawnInterval : 0,
    triggeredSpawnDistances: [],
    centerline: [...level.centerline],
    builtObstacles: [],
    cumulativeLengths: [],
    viewZoom: 0.5,
    killCount: 0,
    triggeredWaveIds: [],
    wavePowerupBudget: 0,
    bossSpawned: false,
    bossDefeated: false,
    bossCombatActive: false,
    bossEntrance: null,
    bossDeath: null,
    levelClearedBannerUntil: 0,
    weakPointOpen: false,
    weakPointPhase: 0,
    weakPointWasOpen: false,
    weakPointHitFlash: 0,
    weakPointHitFlashUntil: 0,
    ...createRailsPowerupState(),
  };
}
