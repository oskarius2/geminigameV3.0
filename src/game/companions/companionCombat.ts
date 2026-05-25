import { EntityType, type GameState } from '../types';
import { Vector2 } from '../utils/vector';
import { getScaledCompanionStats } from './companionDefs';
import type { CompanionGameState } from './companionGameState';
import { selectClosestEnemy } from './companionTargeting';
import type { CompanionInstance, CompanionRuntime } from './companionTypes';
import { notifyCompanionFired } from './companionBehavior';
import { playSfx } from '../audio/sfx';

const SCOUT_OWNER = 'companion_scout';
const GUNNER_OWNER = 'companion_gunner';
const GUARDIAN_OWNER = 'companion_guardian';
const HEALER_OWNER = 'companion_healer';

/** Companion damage scaling vs player base damage (per archetype). */
const PLAYER_DAMAGE_SHARE: Record<string, number> = {
  scout: 0.32,
  gunner: 0.5,
  guardian: 0.3,
  healer: 0.22,
};

/** Player damage multiplier vs scout-marked target. */
export const SCOUT_MARK_SYNERGY_MULT = 1.28;

export function isScoutMarkedTarget(state: GameState, enemyId: string): boolean {
  return (
    state.activeCompanionId === 'scout' &&
    state.companionRuntime?.markedEnemyId === enemyId
  );
}

export function getScoutSynergyDamageMult(state: GameState, enemyId: string): number {
  return isScoutMarkedTarget(state, enemyId) ? SCOUT_MARK_SYNERGY_MULT : 1;
}

export function spawnCompanionBolt(
  state: CompanionGameState,
  from: Vector2,
  toward: Vector2,
  damage: number,
  ownerId: string,
  color = '#67e8f9',
): void {
  const dir = toward.sub(from);
  const mag = dir.magnitude();
  if (mag < 4) return;
  const norm = dir.mul(1 / mag);
  const speed = ownerId === GUNNER_OWNER ? 12 : 15;
  state.projectiles.push({
    id: `c-${Math.random().toString(36).slice(2, 9)}`,
    type: EntityType.PROJECTILE,
    active: true,
    pos: from.clone(),
    radius: ownerId === GUNNER_OWNER ? 4 : 3,
    /** Survives App.tsx projectile cleanup (`p.health > 0`) until hit / obstacle. */
    health: Number.POSITIVE_INFINITY,
    maxHealth: Number.POSITIVE_INFINITY,
    speed,
    velocity: norm.mul(speed),
    color,
    ownerId,
    damage: Math.max(1, Math.floor(damage)),
    bounceCount: 0,
  });
}

function scoutFireRate(instance: CompanionInstance, runtime: CompanionRuntime): number {
  const scaled = getScaledCompanionStats(instance.id, instance.currentLevel);
  const base = scaled?.fireRate ?? 5.5;
  const evasion = (runtime.evasionBurstTimer ?? 0) > 0 ? 1.85 : 1;
  const linked = runtime.isAttacking ? 1.25 : 1;
  const combatBoost = runtime.markedEnemyId ? 1.2 : 1;
  return base * evasion * linked * combatBoost;
}

function scoutBoltDamage(
  instance: CompanionInstance,
  state: CompanionGameState,
  runtime: CompanionRuntime,
  targetMarked: boolean,
): number {
  const scaled = getScaledCompanionStats(instance.id, instance.currentLevel);
  const base = scaled?.attackDamage ?? 14;
  const playerShare =
    (runtime.playerBaseDamage ?? state.baseDamage ?? 20) * (PLAYER_DAMAGE_SHARE.scout ?? 0.28);
  const markBonus = targetMarked ? 1.35 : 1;
  const evasion = (runtime.evasionBurstTimer ?? 0) > 0 ? 1.2 : 1;
  return (base + playerShare) * markBonus * evasion;
}

function livingEnemies(state: CompanionGameState) {
  return state.enemies.filter((e) => e.active !== false && e.type === EntityType.ENEMY && e.health > 0);
}

function resolveScoutFireTarget(
  runtime: CompanionRuntime,
  state: CompanionGameState,
  range: number,
) {
  const pool = livingEnemies(state).filter(
    (e) => e.pos.distanceTo(state.player.pos) <= range,
  );
  if (pool.length === 0) return null;

  const preferredId = runtime.markedEnemyId ?? runtime.targetEnemyId;
  if (preferredId) {
    const preferred = pool.find((e) => e.id === preferredId);
    if (preferred) return preferred;
  }
  return selectClosestEnemy(pool, runtime.pos);
}

export function applyScoutCombat(
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: CompanionGameState,
  dtSec: number,
): void {
  const scaled = getScaledCompanionStats(instance.id, instance.currentLevel);
  const range = scaled?.detectionRange ?? 400;
  const target = resolveScoutFireTarget(runtime, state, range);
  if (!target) return;

  const droneDist = runtime.pos.distanceTo(target.pos);
  const playerDist = state.player.pos.distanceTo(target.pos);
  if (droneDist > range && playerDist > range) return;

  runtime.fireCooldown -= dtSec;
  if (runtime.fireCooldown > 0) return;

  const marked = runtime.markedEnemyId === target.id;
  const damage = scoutBoltDamage(instance, state, runtime, marked);
  const muzzle = runtime.pos.add(
    target.pos.sub(runtime.pos).normalize().mul(14),
  );
  spawnCompanionBolt(state, muzzle, target.pos, damage, SCOUT_OWNER);
  if (instance.currentLevel >= 5) {
    const lateral = new Vector2(
      -(target.pos.y - runtime.pos.y),
      target.pos.x - runtime.pos.x,
    )
      .normalize()
      .mul(10);
    spawnCompanionBolt(
      state,
      muzzle.add(lateral),
      target.pos,
      Math.floor(damage * 0.85),
      SCOUT_OWNER,
      '#a5f3fc',
    );
  }
  runtime.facingAngle = Math.atan2(
    target.pos.y - runtime.pos.y,
    target.pos.x - runtime.pos.x,
  );
  runtime.fireCooldown = 1 / Math.max(scoutFireRate(instance, runtime), 0.5);
  runtime.attackPulseTimer = 0.14;
  notifyCompanionFired(runtime);
  playSfx('companionSpeed', { gainScale: 0.55, pitchMul: 1.05 });
}

export function applyGunnerCombatVolley(
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: CompanionGameState,
  dtSec: number,
): void {
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
  const baseDmg = runtime.playerStats.companionFireDamage ?? scaled?.attackDamage ?? 25;
  /** Gunner: blend base damage with a share of the player's base damage for scaling. */
  const playerShare = (state.baseDamage ?? 20) * (PLAYER_DAMAGE_SHARE.gunner ?? 0.5);
  const burstMult = runtime.playerStats.focusedBurstMult ?? 1;
  const finalDmg = (baseDmg + playerShare) * burstMult;

  const muzzle = runtime.pos.add(
    target.pos.sub(runtime.pos).normalize().mul(16),
  );
  spawnCompanionBolt(state, muzzle, target.pos, finalDmg, GUNNER_OWNER, '#fdba74');
  runtime.facingAngle = Math.atan2(
    target.pos.y - runtime.pos.y,
    target.pos.x - runtime.pos.x,
  );
  runtime.fireCooldown = 1 / Math.max(fireRate, 0.5);
  runtime.attackPulseTimer = 0.16;
  notifyCompanionFired(runtime);
}

/** Pick closest living enemy within range from companion. */
function pickEnemyInRange(
  state: CompanionGameState,
  fromPos: Vector2,
  range: number,
) {
  const pool = state.enemies.filter(
    (e) =>
      e.type === EntityType.ENEMY &&
      e.health > 0 &&
      e.pos.distanceTo(fromPos) <= range,
  );
  if (pool.length === 0) return null;
  return selectClosestEnemy(pool, fromPos);
}

/**
 * Guardian — heavy slow plasma bolt. Lower fire rate, blocks projectiles & taunts.
 * Damage scales with player base damage so it remains relevant late-game.
 */
export function applyGuardianCombat(
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: CompanionGameState,
  dtSec: number,
): void {
  const range = 260;
  const target = pickEnemyInRange(state, runtime.pos, range);
  if (!target) return;

  runtime.fireCooldown -= dtSec;
  if (runtime.fireCooldown > 0) return;

  const tauntActive = (runtime.tauntTimer ?? 0) > 0;
  const fireRate = tauntActive ? 1.8 : 1.1; // shots/sec — slow but steady
  const playerShare = (state.baseDamage ?? 20) * (PLAYER_DAMAGE_SHARE.guardian ?? 0.3);
  const levelBoost = 1 + (instance.currentLevel - 1) * 0.12;
  const damage = (8 + playerShare) * levelBoost * (tauntActive ? 1.3 : 1);

  const muzzle = runtime.pos.add(
    target.pos.sub(runtime.pos).normalize().mul(18),
  );
  spawnCompanionBolt(state, muzzle, target.pos, damage, GUARDIAN_OWNER, '#7dd3fc');
  runtime.facingAngle = Math.atan2(
    target.pos.y - runtime.pos.y,
    target.pos.x - runtime.pos.x,
  );
  runtime.fireCooldown = 1 / Math.max(fireRate, 0.5);
  runtime.attackPulseTimer = 0.18;
  notifyCompanionFired(runtime);
}

/**
 * Healer — only fires when player is healthy + an enemy is close, to clear pressure
 * while letting regen run when the player is hurt. Light micro-bolts.
 */
export function applyHealerCombat(
  instance: CompanionInstance,
  runtime: CompanionRuntime,
  state: CompanionGameState,
  dtSec: number,
): void {
  const playerHpRatio =
    state.player.health / Math.max(state.player.maxHealth, 1);
  /** Healer prioritises healing — only chip-fires when player is healthy. */
  if (playerHpRatio < 0.55) return;

  const range = 200;
  const target = pickEnemyInRange(state, runtime.pos, range);
  if (!target) return;

  runtime.fireCooldown -= dtSec;
  if (runtime.fireCooldown > 0) return;

  const fireRate = 1.4;
  const playerShare = (state.baseDamage ?? 20) * (PLAYER_DAMAGE_SHARE.healer ?? 0.22);
  const levelBoost = 1 + (instance.currentLevel - 1) * 0.1;
  const damage = (5 + playerShare) * levelBoost;

  const muzzle = runtime.pos.add(
    target.pos.sub(runtime.pos).normalize().mul(12),
  );
  spawnCompanionBolt(state, muzzle, target.pos, damage, HEALER_OWNER, '#4ade80');
  runtime.facingAngle = Math.atan2(
    target.pos.y - runtime.pos.y,
    target.pos.x - runtime.pos.x,
  );
  runtime.fireCooldown = 1 / Math.max(fireRate, 0.5);
  runtime.attackPulseTimer = 0.12;
  notifyCompanionFired(runtime);
}
