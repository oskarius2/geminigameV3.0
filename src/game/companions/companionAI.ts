import { Vector2 } from '../utils/vector';
import { EntityType, GameState, type CompanionId } from '../types';
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
  applyGunnerCombatVolley,
  applyGuardianCombat,
  applyHealerCombat,
  applyScoutCombat,
} from './companionCombat';
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

/** Seconds ahead to lead the player (velocity × horizon). */
export const SCOUT_PREDICT_HORIZON_SEC = 0.2;
/** Smoothing for velocity estimate (0–1, higher = snappier). */
const SCOUT_VELOCITY_SMOOTH = 0.38;
/** Frame displacement above this ≈ dash teleport. */
const SCOUT_DASH_SPEED_MULT = 2.4;
/** Drone farther than this from player while dashing → lost track. */
const SCOUT_LEASH_BREAK_DIST = 200;
/** Move to lastKnownPosition for this long after dash / leash break. */
const SCOUT_LOST_TRACK_DURATION = 0.55;
/** Scout marks deal light chip damage on interval. */
const SCOUT_MARK_PULSE_INTERVAL = 2.2;
const SCOUT_MARK_DAMAGE_BASE = 8;

function dashDisplacementThreshold(
  frameDeltaMag: number,
  playerVelocityMag: number,
  dtSec: number,
): number {
  const safeDt = Math.max(dtSec, 1 / 120);
  const fromVel = playerVelocityMag * safeDt * SCOUT_DASH_SPEED_MULT;
  return Math.max(55, Math.max(frameDeltaMag * 1.8, fromVel));
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
      smoothedVelocity: new Vector2(0, 0),
      lostTrackTime: 0,
      dashActive: false,
    };
  }
  return runtime.scoutTrack;
}

/**
 * Updates scout position memory + velocity prediction once per frame.
 * Call before movement / targeting.
 */
export function tickScoutTracking(
  runtime: CompanionRuntime,
  state: CompanionGameState,
  dtSec: number,
): void {
  const mem = ensureScoutTrackMemory(runtime, state.player.pos);
  const currentPlayerPos = state.player.pos;
  const frameDelta = currentPlayerPos.sub(mem.lastPlayerPos);
  const safeDt = Math.max(dtSec, 1 / 240);

  mem.lastPlayerVelocity = frameDelta;

  const instantVel = frameDelta.mul(1 / safeDt);
  mem.smoothedVelocity = mem.smoothedVelocity
    .mul(1 - SCOUT_VELOCITY_SMOOTH)
    .add(instantVel.mul(SCOUT_VELOCITY_SMOOTH));

  const frameMag = frameDelta.magnitude();
  const dashThreshold = dashDisplacementThreshold(
    frameMag,
    state.player.velocity.magnitude(),
    safeDt,
  );
  const dashByMotion = frameMag > dashThreshold;
  const dashDetected = state.isPlayerDashing || dashByMotion;
  const dashStarted = dashDetected && !mem.dashActive;

  const distToPlayer = runtime.pos.distanceTo(currentPlayerPos);

  if (dashStarted) {
    mem.lastKnownPosition = mem.lastPlayerPos.clone();
    if (distToPlayer > SCOUT_LEASH_BREAK_DIST) {
      mem.lostTrackTime = SCOUT_LOST_TRACK_DURATION;
    }
  } else if (dashDetected && distToPlayer > SCOUT_LEASH_BREAK_DIST) {
    mem.lostTrackTime = Math.max(mem.lostTrackTime, SCOUT_LOST_TRACK_DURATION * 0.5);
  } else if (mem.lostTrackTime > 0 && distToPlayer < SCOUT_LEASH_BREAK_DIST * 0.65) {
    mem.lostTrackTime = Math.max(0, mem.lostTrackTime - safeDt * 2.5);
  } else if (mem.lostTrackTime > 0) {
    mem.lostTrackTime = Math.max(0, mem.lostTrackTime - safeDt);
  }

  mem.dashActive = dashDetected;
  mem.lastPlayerPos = currentPlayerPos.clone();
}

/** Predicted player position for orbit / lead targeting. */
export function getScoutPredictedPlayerPos(
  mem: ScoutTrackMemory,
  playerPos: Vector2,
): Vector2 {
  const lead = mem.smoothedVelocity.mul(SCOUT_PREDICT_HORIZON_SEC);
  if (lead.magnitude() < 8) {
    return playerPos.clone();
  }
  return playerPos.add(lead);
}

/**
 * Scout drone: blend role orbit with prediction + last-known recovery after dash.
 */
export function resolveScoutMoveTarget(
  runtime: CompanionRuntime,
  state: CompanionGameState,
  roleTarget: Vector2,
  _dtSec: number,
): Vector2 {
  const mem = runtime.scoutTrack ?? ensureScoutTrackMemory(runtime, state.player.pos);
  const playerPos = state.player.pos;
  const predicted = getScoutPredictedPlayerPos(mem, playerPos);

  const predictOffset = predicted.sub(playerPos);
  const ledRole = roleTarget.add(predictOffset);

  if (mem.lostTrackTime > 0) {
    const t = 1 - mem.lostTrackTime / SCOUT_LOST_TRACK_DURATION;
    const blend = Math.max(0, Math.min(1, t * t));
    return mem.lastKnownPosition.clone().lerp(ledRole, blend);
  }

  const leadWeight = mem.dashActive ? 0.55 : 0.35;
  return roleTarget.lerp(ledRole, leadWeight);
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
    markPulseTimer: 0,
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
    timeSinceLastHit: 10,
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
  if (rt.timeSinceLastHit === undefined) rt.timeSinceLastHit = 10;
  if (rt.abilityPulseTimer === undefined) rt.abilityPulseTimer = 0;
  if (rt.attackPulseTimer === undefined) rt.attackPulseTimer = 0;
  if (rt.levelUpPulseTimer === undefined) rt.levelUpPulseTimer = 0;
  if (rt.isAttacking === undefined) rt.isAttacking = false;
  if (rt.visualTime === undefined) rt.visualTime = 0;
  if (rt.playerHitBurstTimer === undefined) rt.playerHitBurstTimer = 0;
  if (rt.playerHitsInBurst === undefined) rt.playerHitsInBurst = 0;
  if (rt.markPulseTimer === undefined) rt.markPulseTimer = 0;
  if (rt.evasionBurstTimer === undefined) rt.evasionBurstTimer = undefined;
  if (rt.tauntTimer === undefined) rt.tauntTimer = undefined;
  if (rt.scoutTrack) {
    if (!rt.scoutTrack.lastPlayerPos) rt.scoutTrack.lastPlayerPos = new Vector2(0, 0);
    if (!rt.scoutTrack.lastKnownPosition) {
      rt.scoutTrack.lastKnownPosition = rt.scoutTrack.lastPlayerPos.clone();
    }
    if (!rt.scoutTrack.lastPlayerVelocity) rt.scoutTrack.lastPlayerVelocity = new Vector2(0, 0);
    if (!rt.scoutTrack.smoothedVelocity) rt.scoutTrack.smoothedVelocity = new Vector2(0, 0);
    if (rt.scoutTrack.lostTrackTime === undefined) rt.scoutTrack.lostTrackTime = 0;
    if (rt.scoutTrack.dashActive === undefined) rt.scoutTrack.dashActive = false;
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
    instance.evasionBurstTimer = rt.evasionBurstTimer;
    instance.tauntTimer = rt.tauntTimer;
  }
  return instance;
}

function syncRuntimeFromInstance(runtime: CompanionRuntime, instance: CompanionInstance): void {
  const prevHealth = runtime.health;
  runtime.health = Math.max(0, Math.min(instance.maxHealth, instance.health));
  runtime.maxHealth = instance.maxHealth;
  runtime.abilityCooldownRemaining = instance.abilityCooldownRemaining ?? 0;
  runtime.energy = instance.energy ?? runtime.energy;
  runtime.evasionBurstTimer = instance.evasionBurstTimer;
  runtime.tauntTimer = instance.tauntTimer;
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
    const def = getCompanionDef(instance.type);
    notifyCompanionAbilityUsed(runtime, def?.activeAbility?.name);
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

/** Scout: periodic chip damage on marked threat (scanner ping). */
function applyScoutMarkPulse(
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: CompanionGameState,
  dtSec: number,
): void {
  const markId = runtime.markedEnemyId ?? runtime.targetEnemyId;
  if (!markId) return;

  const scaled = getScaledCompanionStats(instance.id, instance.currentLevel);
  const range = scaled?.detectionRange ?? 400;

  runtime.markPulseTimer = (runtime.markPulseTimer ?? 0) - dtSec;
  if (runtime.markPulseTimer > 0) return;

  const target = state.enemies.find(
    (e) => e.id === markId && e.type === EntityType.ENEMY && e.health > 0,
  );
  if (!target) return;
  if (runtime.pos.distanceTo(target.pos) > range) return;

  const damage =
    SCOUT_MARK_DAMAGE_BASE + instance.currentLevel * 3 + (scaled?.attackDamage ?? 1);
  target.health -= damage;
  target.hitTimer = 4;
  runtime.markPulseTimer = SCOUT_MARK_PULSE_INTERVAL;
  runtime.attackPulseTimer = 0.12;
  notifyCompanionFired(runtime);
}

function applyCompanionCombat(
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: CompanionGameState,
  dtSec: number,
): void {
  if (instance.type === CompanionType.GUNNER) {
    applyGunnerCombatVolley(instance, runtime, state, dtSec);
  }
  if (instance.type === CompanionType.SCOUT) {
    applyScoutCombat(instance, runtime, state, dtSec);
    applyScoutMarkPulse(instance, runtime, state, dtSec);
  }
  if (instance.type === CompanionType.GUARDIAN) {
    applyGuardianCombat(instance, runtime, state, dtSec);
  }
  if (instance.type === CompanionType.HEALER) {
    applyHealerCombat(instance, runtime, state, dtSec);
  }
}

/** HP regen per second when out of combat (not hit recently, no enemies within 220). */
const COMPANION_OUT_OF_COMBAT_REGEN_PCT = 0.04;
const COMPANION_HIT_REGEN_LOCKOUT_SEC = 3.5;

function applyCompanionRegen(
  runtime: CompanionRuntime,
  instance: CompanionInstance,
  state: CompanionGameState,
  dtSec: number,
): void {
  if (runtime.health <= 0) return;
  if (runtime.health >= runtime.maxHealth) return;
  /** Recent hit → no regen. */
  if ((runtime.timeSinceLastHit ?? 0) < COMPANION_HIT_REGEN_LOCKOUT_SEC) return;
  /** Enemies near companion suppress regen. */
  const inCombat = state.enemies.some(
    (e) => e.health > 0 && e.pos.distanceTo(runtime.pos) <= 220,
  );
  if (inCombat) return;
  const regen = runtime.maxHealth * COMPANION_OUT_OF_COMBAT_REGEN_PCT * dtSec;
  runtime.health = Math.min(runtime.maxHealth, runtime.health + regen);
  instance.health = runtime.health;
}

export function updateCompanionAILogic(state: CompanionGameState, dtSec: number): void {
  if (
    !state.activeCompanionId ||
    state.isPaused ||
    (state.gameMode !== 'NORMAL' && state.gameMode !== 'SURVIVAL')
  ) {
    return;
  }

  const runtime = ensureCompanionRuntime(state);
  if (!runtime) return;

  const instance = buildCompanionInstance(state);
  if (!instance) return;

  tickCompanionTimers(instance, dtSec);

  const def = getCompanionDef(instance.type);
  if (!def) return;

  updateCompanionBehavior(instance, runtime, state, def, dtSec);

  if (shouldUseActiveAbility(instance, state)) {
    useActiveAbility(instance, state);
  }

  applyCompanionPassivesLogic(state, instance, dtSec);

  applyCompanionCombat(instance, runtime, state, dtSec);
  applyCompanionRegen(runtime, instance, state, dtSec);
  syncRuntimeFromInstance(runtime, instance);
  state.companionRuntime = runtime;
}

/** Manual ability trigger (keybind). Ignores auto-trigger heuristics. */
export function forceCompanionActiveAbility(appState: GameState): boolean {
  if (!appState.activeCompanionId || appState.isPaused) return false;
  const gs = fromGameState(appState);
  const instance = buildCompanionInstance(gs);
  if (!instance?.isActive) return false;
  const def = getCompanionDef(instance.type);
  if (!def?.activeAbility) return false;
  if (instance.abilityCooldownRemaining && instance.abilityCooldownRemaining > 0) {
    return false;
  }
  const fired = useActiveAbility(instance, gs);
  if (fired) applyCompanionGameStateToApp(gs, appState);
  return fired;
}

export function updateCompanionAI(appState: GameState, dtSec: number): void {
  const gs = fromGameState(appState);
  updateCompanionAILogic(gs, dtSec);
  applyCompanionGameStateToApp(gs, appState);
}

export function getCompanionWorldPosition(state: GameState): Vector2 | null {
  return state.companionRuntime?.pos ?? null;
}
