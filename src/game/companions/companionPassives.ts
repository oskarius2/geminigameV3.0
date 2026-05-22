import { Vector2 } from '../utils/vector';
import type { GameState } from '../types';
import { getCompanionDef, getScaledCompanionStats } from './companionDefs';
import { CompanionType } from './companionTypes';
import {
  applyCompanionGameStateToApp,
  fromGameState,
  toCompanionGameState,
  type CompanionEntityRef,
  type CompanionGameState,
} from './companionGameState';
import type {
  CompanionDef,
  CompanionInstance,
  PlayerCompanionStats,
} from './companionTypes';
import { getCompanionLevel } from './companionLeveling';

const PROJECTILE_TYPE = 'PROJECTILE';

function closestLivingEnemy(
  enemies: CompanionEntityRef[],
  fromPos: Vector2,
): CompanionEntityRef | null {
  let closest: CompanionEntityRef | null = null;
  let minDistSq = Infinity;
  for (const enemy of enemies) {
    if (enemy.health <= 0) continue;
    const dSq = fromPos.distanceToSq(enemy.pos);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      closest = enemy;
    }
  }
  return closest;
}

function syncPlayerStatsFromGame(state: CompanionGameState, stats: PlayerCompanionStats): void {
  const player = state.player;
  stats.maxHealth = player.maxHealth;
  stats.currentHealth = player.health;
  stats.moveSpeed = player.speed;
}

function resolvePassiveLevel(instance: CompanionInstance, state: CompanionGameState): number {
  return Math.max(instance.currentLevel, state.companionLevel, getCompanionLevel(instance.id));
}

/** Run passive effect callbacks into a fresh stat bag (no game mutation). */
export function computeCompanionPassiveStats(
  state: GameState | CompanionGameState,
  instance: CompanionInstance,
): PlayerCompanionStats {
  const gs = toCompanionGameState(state);
  const stats: PlayerCompanionStats = {};
  if (!instance.isActive) return stats;

  const def = getCompanionDef(instance.type);
  if (!def) return stats;

  syncPlayerStatsFromGame(gs, stats);
  const level = resolvePassiveLevel(instance, gs);

  for (const passive of def.passives) {
    passive.leveledEffect?.(instance, stats, level);
    passive.effect?.(instance, stats);
  }

  return stats;
}

function hasPassive(def: CompanionDef, name: string): boolean {
  return def.passives.some((p) => p.name === name);
}

function applyGuardianProjectileIntercept(
  state: CompanionGameState,
  stats: PlayerCompanionStats,
  instance: CompanionInstance,
): void {
  const interceptPct = stats.projectileInterceptPct ?? 0;
  if (interceptPct <= 0 || !state.companionRuntime) return;

  const companionPos = state.companionRuntime.pos;
  const auraRadius = stats.auraRadius ?? 100;

  for (const proj of state.projectiles) {
    if (proj.ownerId === 'player' || proj.type !== PROJECTILE_TYPE) continue;
    if (proj.health <= 0) continue;
    const nearCompanion = proj.pos.distanceTo(companionPos) <= auraRadius + proj.radius;
    const towardPlayer = proj.pos.distanceTo(state.player.pos) < auraRadius * 2;
    if (!nearCompanion && !towardPlayer) continue;
    if (Math.random() < interceptPct) {
      proj.health = 0;
      instance.health = Math.max(0, instance.health - (proj.damage ?? 5) * 0.15);
    }
  }
}

function applyScoutSpeedAura(state: CompanionGameState, stats: PlayerCompanionStats): void {
  const runtime = state.companionRuntime;
  if (!runtime) return;
  const mult = stats.speedMult ?? 1;
  if (mult === 1) {
    runtime.lastSpeedMult = 1;
    return;
  }
  if (runtime.playerBaseSpeed === undefined) {
    runtime.playerBaseSpeed = state.player.speed / (runtime.lastSpeedMult || 1);
  }
  runtime.lastSpeedMult = mult;
  state.player.speed = runtime.playerBaseSpeed * mult;
}

function applyHealerRegen(
  state: CompanionGameState,
  stats: PlayerCompanionStats,
  dtSec: number,
): void {
  const regen = stats.regenPerSec ?? 0;
  if (regen <= 0) return;
  const player = state.player;
  player.health = Math.min(player.maxHealth, player.health + regen * dtSec);
  stats.currentHealth = player.health;
}

function applyGunnerCoFireBuff(state: CompanionGameState, stats: PlayerCompanionStats): void {
  const runtime = state.companionRuntime;
  if (!runtime) return;
  const mult = stats.playerDamageMult ?? 1;
  if (runtime.playerBaseDamage === undefined) {
    runtime.playerBaseDamage = state.baseDamage / (runtime.lastDamageMult || 1);
  }
  runtime.lastDamageMult = mult;
  state.baseDamage = runtime.playerBaseDamage * mult;
}

/** Apply stat-bag modifiers to placeholder game state (speed, regen, gunner damage, intercept). */
export function applyPassiveFrameEffects(
  state: CompanionGameState,
  instance: CompanionInstance,
  stats: PlayerCompanionStats,
  dtSec: number,
): void {
  const def = getCompanionDef(instance.type);
  if (!def || !instance.isActive) return;

  if (hasPassive(def, 'Bodyguard') || hasPassive(def, 'Guardian Aura')) {
    applyGuardianProjectileIntercept(state, stats, instance);
  }
  if (hasPassive(def, 'Speed Aura')) {
    applyScoutSpeedAura(state, stats);
  }
  if (hasPassive(def, 'Continuous Healing')) {
    applyHealerRegen(state, stats, dtSec);
  }
  if (hasPassive(def, 'Co-fire')) {
    const scaled = getScaledCompanionStats(instance.id, instance.currentLevel);
    stats.playerDamageMult = 1.08;
    stats.companionFireDamage = stats.companionFireDamage ?? scaled?.attackDamage ?? 25;
    applyGunnerCoFireBuff(state, stats);
  }
}

/** Re-apply active ability buffs while timers run (passive recompute would wipe them). */
export function mergeActiveAbilityBuffs(
  instance: CompanionInstance,
  stats: PlayerCompanionStats,
): void {
  const def = getCompanionDef(instance.type);
  if (!def?.activeAbility) return;

  if (instance.evasionBurstTimer && instance.evasionBurstTimer > 0) {
    stats.evasionBurstActive = 1;
    stats.evasionBurstDuration = instance.evasionBurstTimer;
    stats.damageReduction = Math.min(0.6, (stats.damageReduction ?? 0) + 0.35);
    if (instance.type === CompanionType.SCOUT) {
      const scaled = getScaledCompanionStats(instance.id, instance.currentLevel);
      const boost = scaled?.speedBoost ?? 15;
      stats.speedMult = (stats.speedMult ?? 1) + (boost + 25) / 100;
    }
  }

  if (instance.tauntTimer && instance.tauntTimer > 0) {
    stats.tauntActive = 1;
    stats.tauntDuration = instance.tauntTimer;
  }
}

/** Scout detection range for minimap (px); Infinity = no filter. */
export function getScoutMinimapRevealRadius(state: GameState): number {
  if (state.activeCompanionId !== 'scout' || !state.companionRuntime) {
    return Infinity;
  }
  const r = state.companionRuntime.playerStats.revealRadius ?? 0;
  return r > 0 ? r : Infinity;
}

/**
 * Apply all companion passives for the current frame (standalone {@link CompanionGameState}).
 */
export function applyCompanionPassivesLogic(
  state: CompanionGameState,
  instance: CompanionInstance,
  dtSec: number,
): PlayerCompanionStats {
  const stats = computeCompanionPassiveStats(state, instance);
  mergeActiveAbilityBuffs(instance, stats);
  if (state.companionRuntime) {
    state.companionRuntime.playerStats = stats;
  }
  applyPassiveFrameEffects(state, instance, stats, dtSec);
  return stats;
}

/**
 * Apply all companion passives for the current frame.
 * Bridges app {@link GameState} ↔ placeholder view.
 */
export function applyCompanionPassives(
  appState: GameState,
  instance: CompanionInstance,
  dtSec: number,
): PlayerCompanionStats {
  const gs = fromGameState(appState);
  const stats = applyCompanionPassivesLogic(gs, instance, dtSec);
  applyCompanionGameStateToApp(gs, appState);
  return stats;
}

/** Reduce incoming damage using guardian/scout passive modifiers. */
export function mitigateCompanionIncomingDamage(appState: GameState, rawDamage: number): number {
  const stats = appState.companionRuntime?.playerStats;
  if (!stats || rawDamage <= 0) return rawDamage;

  let dmg = rawDamage;
  const reduction = Math.min(0.6, stats.damageReduction ?? 0);
  dmg *= 1 - reduction;

  const auraRadius = stats.auraRadius ?? 0;
  const auraDr = stats.auraDamageReductionPct ?? 0;
  if (auraRadius > 0 && auraDr > 0 && appState.companionRuntime) {
    const inAura = appState.player.pos.distanceTo(appState.companionRuntime.pos) <= auraRadius;
    if (inAura) dmg *= 1 - auraDr;
  }

  if (stats.evasionBurstActive) {
    dmg *= 1 - Math.min(0.5, stats.damageReduction ?? 0.35);
  }

  return Math.max(0, dmg);
}

/** Reflect a portion of damage taken back to the nearest enemy (Guardian). */
export function applyCompanionDamageReflect(appState: GameState, damageTaken: number): void {
  const stats = appState.companionRuntime?.playerStats;
  const reflectPct = stats?.damageReflectPct ?? 0;
  if (reflectPct <= 0 || damageTaken <= 0) return;

  const gs = fromGameState(appState);
  const living = gs.enemies.filter((e) => e.health > 0);
  const target = closestLivingEnemy(living, gs.player.pos);
  if (!target) return;

  const reflectDmg = damageTaken * reflectPct;
  target.health -= reflectDmg;
  target.hitTimer = 8;
  applyCompanionGameStateToApp(gs, appState);
}
