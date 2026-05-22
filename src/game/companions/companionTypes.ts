import { Vector2 } from '../utils/vector';
import type { CompanionId, ShipId } from '../types';
import type { CompanionGameState } from './companionGameState';

/** Companion archetype — string values align with {@link CompanionId}. */
export enum CompanionType {
  GUARDIAN = 'guardian',
  SCOUT = 'scout',
  HEALER = 'healer',
  GUNNER = 'gunner',
}

export type CompanionRole = 'tank' | 'scout' | 'healer' | 'offense';

/** Mutable stat bag written by passives / actives; read by combat + HUD. */
export interface PlayerCompanionStats {
  maxHealth?: number;
  currentHealth?: number;
  moveSpeed?: number;
  damageReduction?: number;
  projectileInterceptPct?: number;
  damageReflectPct?: number;
  auraRadius?: number;
  auraDamageReductionPct?: number;
  speedMult?: number;
  revealRadius?: number;
  markDangerousEnemy?: number;
  regenPerSec?: number;
  companionFireDamage?: number;
  companionFireRate?: number;
  companionFireRange?: number;
  critChanceBonus?: number;
  playerDamageMult?: number;
  tauntActive?: number;
  tauntDuration?: number;
  evasionBurstActive?: number;
  evasionBurstDuration?: number;
  triageHealPct?: number;
  focusedBurstMult?: number;
  [key: string]: number | undefined;
}

/** Live companion state for the current run. */
export interface CompanionInstance {
  id: CompanionId;
  type: CompanionType;
  currentLevel: number;
  currentXP: number;
  health: number;
  maxHealth: number;
  isActive: boolean;
  energy?: number;
  abilityCooldownRemaining?: number;
  tauntTimer?: number;
  evasionBurstTimer?: number;
}

export interface CompanionPassive {
  name: string;
  description: string;
  effect?: (instance: CompanionInstance, playerStats: PlayerCompanionStats) => void;
  leveledEffect?: (
    instance: CompanionInstance,
    playerStats: PlayerCompanionStats,
    level: number,
  ) => void;
}

export interface CompanionAbility {
  name: string;
  description: string;
  cooldown: number;
  energyCost?: number;
  effect: (instance: CompanionInstance, playerStats: PlayerCompanionStats) => void;
}

export type CompanionBaseStats = Record<string, number>;

/** Static definition for a companion drone. */
export interface CompanionDef {
  id: CompanionId;
  type: CompanionType;
  name: string;
  description: string;
  role: CompanionRole;
  bestFor: ShipId[];
  baseStats: CompanionBaseStats;
  passives: CompanionPassive[];
  activeAbility?: CompanionAbility;
  levelScaling: Record<number, CompanionBaseStats>;
  passivesSummary: string[];
  abilitySummary: string;
}

/** Per-level row for legacy menus / loot helpers. */
export interface CompanionLevelScaling {
  level: number;
  companionHp?: number;
  damageAbsorbPct?: number;
  speedAuraDuration?: number;
  revealRadius?: number;
  regenPctPerSec?: number;
  burstHealPct?: number;
  gunnerDamageMult?: number;
  gunnerFireRate?: number;
  bonusPassive?: string;
}

/** Simplified def shape for UI copy + scaling tables. */
export interface LegacyCompanionDef {
  id: CompanionId;
  name: string;
  description: string;
  role: CompanionRole;
  bestFor: ShipId[];
  passives: string[];
  ability: string;
  scaling: CompanionLevelScaling[];
}

/** World-space runtime: position, targeting, cached stat modifiers. */
export interface CompanionRuntime {
  pos: Vector2;
  velocity: Vector2;
  orbitAngle: number;
  targetEnemyId: string | null;
  markedEnemyId: string | null;
  fireCooldown: number;
  /** Scout — mark pulse chip damage cooldown. */
  markPulseTimer?: number;
  /** Active ability timers (persist across per-frame instance rebuild). */
  evasionBurstTimer?: number;
  tauntTimer?: number;
  health: number;
  maxHealth: number;
  abilityCooldownRemaining: number;
  energy: number;
  abilityToastTimer?: number;
  abilityToastName?: string;
  playerStats: PlayerCompanionStats;
  playerBaseSpeed?: number;
  lastSpeedMult?: number;
  playerBaseDamage?: number;
  lastDamageMult?: number;
  /** AI state machine output. */
  aiState: CompanionAIState;
  stateTimer: number;
  /** Smoothed movement (acceleration model). */
  moveVelocity: Vector2;
  /** Organic orbit radius wobble. */
  orbitRadiusOffset: number;
  /** Facing angle (radians). */
  facingAngle: number;
  /** Visual / feedback timers (seconds). */
  hitFlashTimer: number;
  abilityPulseTimer: number;
  attackPulseTimer: number;
  levelUpPulseTimer: number;
  isAttacking: boolean;
  visualTime: number;
  /** Recent damage burst counter for scout evasion trigger. */
  playerHitBurstTimer: number;
  playerHitsInBurst: number;
  /** Scout-only: dash tracking / prediction memory. */
  scoutTrack?: ScoutTrackMemory;
}

/** Position memory for Scout drone follow-after-dash. */
export interface ScoutTrackMemory {
  lastPlayerPos: Vector2;
  /** Pre-dash / last stable player position when track is lost. */
  lastKnownPosition: Vector2;
  /** Raw displacement last frame (px). */
  lastPlayerVelocity: Vector2;
  /** Smoothed velocity (px/s) for leading the player. */
  smoothedVelocity: Vector2;
  /** Seconds remaining in "lost track" recovery (move to last known first). */
  lostTrackTime: number;
  /** Player was dashing last tick (edge-detect dash start). */
  dashActive: boolean;
}

/** Meta progress entry (also stored in localStorage via companionLeveling). */
export interface CompanionProgressEntry {
  xp: number;
  level: number;
}

export type CompanionProgressSave = Partial<Record<CompanionId, CompanionProgressEntry>>;

/** Result of granting XP to a companion type. */
export interface GainXpResult {
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  totalXp: number;
  xpGained: number;
}

/** High-level companion AI state (positioning + visuals). */
export enum CompanionAIState {
  IDLE = 'IDLE',
  THREAT = 'THREAT',
  COMBAT = 'COMBAT',
  LOW_HP = 'LOW_HP',
  PLAYER_DISTRESSED = 'PLAYER_DISTRESSED',
  COOLDOWN = 'COOLDOWN',
}

/** Targeting strategy used by companion AI. */
export enum TargetSelectionStrategy {
  CLOSEST_ENEMY = 'CLOSEST_ENEMY',
  HIGHEST_THREAT = 'HIGHEST_THREAT',
  PLAYER_ORBIT = 'PLAYER_ORBIT',
  PLAYER_AIM = 'PLAYER_AIM',
}

/** Snapshot passed into passive / ability effect callbacks (standalone game view). */
export interface CompanionEffectContext {
  state: CompanionGameState;
  instance: CompanionInstance;
  playerStats: PlayerCompanionStats;
  dtSec: number;
}

export function isCompanionType(value: string): value is CompanionType {
  return (
    value === CompanionType.GUARDIAN ||
    value === CompanionType.SCOUT ||
    value === CompanionType.HEALER ||
    value === CompanionType.GUNNER
  );
}

export function companionTypeToId(type: CompanionType): CompanionId {
  return type as CompanionId;
}

export function companionIdToType(id: CompanionId): CompanionType {
  return id as CompanionType;
}
