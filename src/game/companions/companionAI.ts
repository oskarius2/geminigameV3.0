import { Vector2 } from '../utils/vector';
import { GameState, type CompanionId } from '../types';
import {
  createCompanionInstance,
  getCompanionDef,
  getScaledCompanionStats,
  tickCompanionTimers,
  useCompanionAbility,
} from './companionDefs';
import {
  applyCompanionGameStateToApp,
  fromGameState,
  type CompanionGameState,
} from './companionGameState';
import { applyCompanionPassivesLogic } from './companionPassives';
import { onCompanionAbility } from '../audio/survivalAudio';
import {
  updateCompanionBehavior,
  notifyCompanionAbilityUsed,
  notifyCompanionDamage,
  notifyCompanionFired,
} from './companionBehavior';
import { shouldTriggerCompanionAbility } from './companionAbilities';
import {
  CompanionAIState,
  CompanionType,
  companionIdToType,
  type CompanionDef,
  type CompanionInstance,
  type CompanionRuntime,
  type PlayerCompanionStats,
  type ScoutTrackMemory,
} from './companionTypes';

export type { CompanionRuntime } from './companionTypes';
export { TargetSelectionStrategy } from './companionTypes';
export {
  getTargetSelectionStrategy,
  selectClosestEnemy,
  selectHighestThreat,
  selectTarget,
  estimateThreatToPlayer,
} from './companionTargeting';

const ORBIT_RADIUS: Record<CompanionType, number> = {
  [CompanionType.GUARDIAN]: 58,
  [CompanionType.SCOUT]: 72,
  [CompanionType.HEALER]: 48,
  [CompanionType.GUNNER]: 64,
};

/** Per-frame player displacement above this ≈ dash (normal move is ~speed×dt). */
const SCOUT_DASH_SPEED_MULT = 3.5;
const SCOUT_LOST_TRACK_DIST = 500;
const SCOUT_PREDICT_FRAMES = 2;
const SCOUT_LOST_TRACK_DURATION = 0.5;

function dashDisplacementThreshold(playerSpeed: number): number {
  return Math.max(280, playerSpeed * SCOUT_DASH_SPEED_MULT);
}

function ensureScoutTrackMemory(
  runtime: CompanionRuntime,
  playerPos: Vector2,
): ScoutTrackMemory {
  if (!runtime.scoutTrack) {
    runtime.scoutTrack = {
      lastPlayerPos: playerPos.clone(),
      lastKnownPosition: playerPos.clone(),
      lastPlayerVelocity: new Vector2(0, 0),
      lostTrackTime: 0,
    };
  }
  return runtime.scoutTrack;
}

/**
 * Scout drone: remember player motion and predict landing after dash.
 * Call once per frame before movement; pass result into moveCompanionToward.
 */
export function resolveScoutMoveTarget(
  runtime: CompanionRuntime,
  state: CompanionGameState,
  roleTarget: Vector2,
  dtSec: number,
): Vector2 {
  const mem = ensureScoutTrackMemory(runtime, state.player.pos);
  const currentPlayerPos = state.player.pos;
  const playerVelocity = currentPlayerPos.sub(mem.lastPlayerPos);
  const dashThreshold = dashDisplacementThreshold(state.player.speed);
  const dashByMotion = playerVelocity.magnitude() > dashThreshold;
  const dashDetected = state.isPlayerDashing || dashByMotion;
  const distToPlayer = runtime.pos.distanceTo(currentPlayerPos);

  if (dashDetected) {
    mem.lastKnownPosition = mem.lastPlayerPos.clone();
    if (distToPlayer > SCOUT_LOST_TRACK_DIST) {
      mem.lostTrackTime = SCOUT_LOST_TRACK_DURATION;
    }
  }

  mem.lastPlayerVelocity = playerVelocity;
  mem.lastPlayerPos = currentPlayerPos.clone();

  if (mem.lostTrackTime > 0) {
    mem.lostTrackTime = Math.max(0, mem.lostTrackTime - dtSec);
    if (mem.lostTrackTime > 0) {
      return mem.lastKnownPosition.clone();
    }
  }

  if (dashDetected && playerVelocity.magnitude() > 1) {
    const predictedPos = currentPlayerPos.add(playerVelocity.mul(SCOUT_PREDICT_FRAMES));
    return roleTarget.lerp(predictedPos, 0.7);
  }

  return roleTarget;
}

function createRuntimeDefaults(
  state: CompanionGameState,
  defaultMax: number,
): CompanionRuntime {
  const offset = new Vector2(
    ORBIT_RADIUS[companionIdToType(state.activeCompanionId!)],
    0,
  );
  return {
    pos: state.player.pos.add(offset),
    velocity: new Vector2(0, 0),
    moveVelocity: new Vector2(0, 0),
    orbitAngle: 0,
    targetEnemyId: null,
    markedEnemyId: null,
    fireCooldown: 0,
    health: defaultMax,
    maxHealth: defaultMax,
    abilityCooldownRemaining: 0,
    energy: 100,
    playerStats: {},
    aiState: CompanionAIState.IDLE,
    stateTimer: 0,
    orbitRadiusOffset: 0,
    facingAngle: 0,
    hitFlashTimer: 0,
    abilityPulseTimer: 0,
    attackPulseTimer: 0,
    levelUpPulseTimer: 0,
    isAttacking: false,
    visualTime: 0,
    playerHitBurstTimer: 0,
    playerHitsInBurst: 0,
  };
}

function patchRuntimeDefaults(rt: CompanionRuntime): void {
  if (rt.moveVelocity === undefined) rt.moveVelocity = new Vector2(0, 0);
  if (rt.aiState === undefined) rt.aiState = CompanionAIState.IDLE;
  if (rt.stateTimer === undefined) rt.stateTimer = 0;
  if (rt.orbitRadiusOffset === undefined) rt.orbitRadiusOffset = 0;
  if (rt.facingAngle === undefined) rt.facingAngle = 0;
  if (rt.hitFlashTimer === undefined) rt.hitFlashTimer = 0;
  if (rt.abilityPulseTimer === undefined) rt.abilityPulseTimer = 0;
  if (rt.attackPulseTimer === undefined) rt.attackPulseTimer = 0;
  if (rt.levelUpPulseTimer === undefined) rt.levelUpPulseTimer = 0;
  if (rt.isAttacking === undefined) rt.isAttacking = false;
  if (rt.visualTime === undefined) rt.visualTime = 0;
  if (rt.playerHitBurstTimer === undefined) rt.playerHitBurstTimer = 0;
  if (rt.playerHitsInBurst === undefined) rt.playerHitsInBurst = 0;
  if (rt.scoutTrack) {
    if (!rt.scoutTrack.lastPlayerPos) rt.scoutTrack.lastPlayerPos = new Vector2(0, 0);
    if (!rt.scoutTrack.lastKnownPosition) {
      rt.scoutTrack.lastKnownPosition = rt.scoutTrack.lastPlayerPos.clone();
    }
    if (!rt.scoutTrack.lastPlayerVelocity) rt.scoutTrack.lastPlayerVelocity = new Vector2(0, 0);
    if (rt.scoutTrack.lostTrackTime === undefined) rt.scoutTrack.lostTrackTime = 0;
  }
}

export function buildCompanionInstance(state: CompanionGameState): CompanionInstance | null {
  if (!state.activeCompanionId) return null;
  const instance = createCompanionInstance(
    state.activeCompanionId,
    state.companionLevel,
    state.companionXp,
    true,
  );
  const scaled = getScaledCompanionStats(state.activeCompanionId, state.companionLevel);
  if (scaled?.health) {
    instance.maxHealth = scaled.health;
    instance.health = scaled.health;
  }
  const rt = state.companionRuntime;
  if (rt) {
    if (rt.maxHealth > 0) instance.maxHealth = rt.maxHealth;
    instance.health = Math.min(instance.maxHealth, rt.health ?? instance.maxHealth);
    instance.abilityCooldownRemaining = rt.abilityCooldownRemaining;
    instance.energy = rt.energy;
  }
  return instance;
}

function syncRuntimeFromInstance(runtime: CompanionRuntime, instance: CompanionInstance): void {
  const prevHealth = runtime.health;
  runtime.health = Math.max(0, Math.min(instance.maxHealth, instance.health));
  runtime.maxHealth = instance.maxHealth;
  runtime.abilityCooldownRemaining = instance.abilityCooldownRemaining ?? 0;
  runtime.energy = instance.energy ?? runtime.energy;
  if (runtime.health < prevHealth - 0.5) {
    notifyCompanionDamage(runtime, prevHealth - runtime.health);
  }
}

/** HUD-facing snapshot of the active companion (null if none). */
export function getCompanionHudSnapshot(state: GameState): {
  companionId: CompanionId;
  level: number;
  health: number;
  maxHealth: number;
  abilityCooldownRemaining: number;
  abilityCooldownMax: number;
  abilityName: string;
  energy?: number;
} | null {
  if (!state.activeCompanionId || state.gameMode !== 'NORMAL') return null;
  const def = getCompanionDef(state.activeCompanionId);
  if (!def) return null;
  const rt = state.companionRuntime;
  const maxHealth = rt?.maxHealth ?? def.baseStats.health ?? 80;
  const health = rt?.health ?? maxHealth;
  return {
    companionId: state.activeCompanionId,
    level: state.companionLevel,
    health,
    maxHealth,
    abilityCooldownRemaining: rt?.abilityCooldownRemaining ?? 0,
    abilityCooldownMax: def.activeAbility?.cooldown ?? 0,
    abilityName: def.activeAbility?.name ?? '',
    energy: rt?.energy,
  };
}

export function ensureCompanionRuntime(state: CompanionGameState): CompanionRuntime | null {
  if (!state.activeCompanionId) {
    state.companionRuntime = null;
    return null;
  }
  const scaled = getScaledCompanionStats(state.activeCompanionId, state.companionLevel);
  const defaultMax = scaled?.health ?? 80;

  if (!state.companionRuntime) {
    state.companionRuntime = createRuntimeDefaults(state, defaultMax);
    if (companionIdToType(state.activeCompanionId) === CompanionType.SCOUT) {
      ensureScoutTrackMemory(state.companionRuntime, state.player.pos);
    }
  } else {
    const rt = state.companionRuntime;
    patchRuntimeDefaults(rt);
    if (!rt.maxHealth) rt.maxHealth = defaultMax;
    if (!rt.health) rt.health = rt.maxHealth;
    if (rt.abilityCooldownRemaining === undefined) rt.abilityCooldownRemaining = 0;
    if (rt.energy === undefined) rt.energy = 100;
  }
  return state.companionRuntime;
}

/** @deprecated Use {@link updateCompanionBehavior} via updateCompanionAILogic */
export function updateCompanionPosition(
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: GameState | CompanionGameState,
  def: CompanionDef,
  dtSec: number,
): void {
  const gs =
    'camera' in state ? fromGameState(state as GameState) : (state as CompanionGameState);
  updateCompanionBehavior(instance, runtime, gs, def, dtSec);
}

export function shouldUseActiveAbility(
  instance: CompanionInstance,
  state: GameState | CompanionGameState,
): boolean {
  const gs =
    'camera' in state ? fromGameState(state as GameState) : (state as CompanionGameState);
  const rt = gs.companionRuntime;
  if (!rt) return false;
  const def = getCompanionDef(instance.type);
  if (!def?.activeAbility || !instance.isActive) return false;
  const cost = def.activeAbility.energyCost ?? 0;
  if (cost > 0 && (instance.energy ?? 0) < cost) return false;
  return shouldTriggerCompanionAbility(instance, gs, rt);
}

export function useActiveAbility(
  instance: CompanionInstance,
  state: CompanionGameState,
): boolean {
  const runtime = state.companionRuntime;
  if (!runtime) return false;
  syncPlayerStatsFromGame(state, runtime.playerStats);
  const fired = useCompanionAbility(instance, runtime.playerStats, 0);
  if (fired) {
    onCompanionAbility(instance.id);
    notifyCompanionAbilityUsed(runtime);
    if (runtime.playerStats.currentHealth !== undefined) {
      state.player.health = Math.min(
        state.player.maxHealth,
        runtime.playerStats.currentHealth,
      );
    }
  }
  return fired;
}

function syncPlayerStatsFromGame(state: CompanionGameState, stats: PlayerCompanionStats): void {
  const player = state.player;
  stats.maxHealth = player.maxHealth;
  stats.currentHealth = player.health;
  stats.moveSpeed = player.speed;
}

function applyCompanionCombat(
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: CompanionGameState,
  dtSec: number,
): void {
  if (instance.type !== CompanionType.GUNNER) return;
  const targetId = runtime.targetEnemyId;
  if (!targetId) return;

  const target = state.enemies.find((e) => e.id === targetId && e.health > 0);
  if (!target) return;

  const scaled = getScaledCompanionStats(instance.id, instance.currentLevel);
  const range = scaled?.range ?? 500;
  if (runtime.pos.distanceTo(target.pos) > range) return;

  runtime.fireCooldown -= dtSec;
  if (runtime.fireCooldown > 0) return;

  const fireRate = runtime.playerStats.companionFireRate ?? scaled?.fireRate ?? 6;
  const damage = runtime.playerStats.companionFireDamage ?? scaled?.attackDamage ?? 25;
  const burstMult = runtime.playerStats.focusedBurstMult ?? 1;

  target.health -= damage * burstMult;
  target.hitTimer = 6;
  notifyCompanionFired(runtime);

  runtime.fireCooldown = 1 / Math.max(fireRate, 0.5);
}

export function updateCompanionAILogic(state: CompanionGameState, dtSec: number): void {
  if (!state.activeCompanionId || state.isPaused || state.gameMode !== 'NORMAL') return;

  const runtime = ensureCompanionRuntime(state);
  if (!runtime) return;

  const instance = buildCompanionInstance(state);
  if (!instance) return;

  tickCompanionTimers(instance, dtSec);
  applyCompanionPassivesLogic(state, instance, dtSec);

  const def = getCompanionDef(instance.type);
  if (!def) return;

  updateCompanionBehavior(instance, runtime, state, def, dtSec);

  if (shouldUseActiveAbility(instance, state)) {
    useActiveAbility(instance, state);
  }

  applyCompanionCombat(instance, runtime, state, dtSec);
  syncRuntimeFromInstance(runtime, instance);
  state.companionRuntime = runtime;
}

export function updateCompanionAI(appState: GameState, dtSec: number): void {
  const gs = fromGameState(appState);
  updateCompanionAILogic(gs, dtSec);
  applyCompanionGameStateToApp(gs, appState);
}

export function getCompanionWorldPosition(state: GameState): Vector2 | null {
  return state.companionRuntime?.pos ?? null;
}
