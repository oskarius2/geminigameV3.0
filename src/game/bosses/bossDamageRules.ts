import type { Entity } from '../types';
import { EnemyType } from '../types';

/**
 * BOSS DAMAGE RULES — pure helpers used by the projectile-vs-enemy hit
 * pipeline in App.tsx. Pulled out so the logic is unit-testable in
 * isolation without spinning up the whole game state.
 *
 * Tuning intent (from "Boss HP + Damage Rebalancing"):
 *   - 30–90 second boss fights, regardless of player power level
 *   - Unbuffed player: 30–90s on stage 1 (was 205s — too tanky)
 *   - Heavy augment stack: 30–90s (was ~1s — too short, single-hit one-shots)
 *
 * The two levers we expose:
 *   1. {@link BOSS_HIT_DAMAGE_CAP_PCT}  — caps any single hit relative to
 *      maxHealth. Prevents stacked Crit × Phantom × Hunter Mark × Multishot
 *      from deleting the boss in one volley.
 *   2. {@link applyEarlyBossResistance}  — bumps damage resist for the first
 *      few seconds after a boss spawns, so opening burst damage gets eaten
 *      by the boss's "shielded entry" instead of trivializing the fight.
 */

/**
 * Maximum damage a single projectile/beam tick can deal to a boss,
 * expressed as a fraction of the boss's max health.
 *
 * 0.03 = 3% — guarantees a minimum of ~33 hits to kill the boss,
 * regardless of how absurd the player's damage stack gets.
 */
export const BOSS_HIT_DAMAGE_CAP_PCT = 0.03;

/**
 * Seconds after spawn during which the boss has +25% extra damage resist
 * stacked on top of its baseline. Lets the player breathe instead of
 * getting their entire kit shredded by the opening volley.
 */
export const BOSS_ENTRY_GRACE_SECONDS = 8;

/**
 * Extra damage resistance applied during the entry-grace window.
 * Stacked multiplicatively on top of baseline {@link Entity.damageResist}.
 *
 * Resulting effective resist during grace: `1 - (1 - 0.35) × (1 - 0.25) = 0.51`
 * (i.e. the player only deals 49% of nominal damage in those first 8s).
 */
export const BOSS_ENTRY_GRACE_RESIST_BONUS = 0.25;

/**
 * Fast type guard — true when the entity is an active boss (not a mini-boss
 * or boss-flavored elite) eligible for the boss-only damage rules.
 */
export function isBossEntity(e: Entity): boolean {
  return e.enemyType === EnemyType.BOSS;
}

/**
 * Compute the effective damage resistance of a boss this frame, including
 * the entry-grace bonus. Pure function — does not mutate the entity.
 *
 * @param e Boss entity (must have bossEngageTimer ≥ 0).
 * @returns A fraction in [0, 1] — multiply incoming damage by `1 - result`.
 */
export function getEffectiveBossDamageResist(e: Entity): number {
  const baseline = e.damageResist ?? 0;
  if (!isBossEntity(e)) return baseline;

  const engageSec = e.bossEngageTimer ?? 0;
  if (engageSec >= BOSS_ENTRY_GRACE_SECONDS) return baseline;

  // Stack multiplicatively so the curves don't break if baseline ever changes.
  // resist_total = 1 - (1 - baseline) * (1 - graceBonus)
  const stacked = 1 - (1 - baseline) * (1 - BOSS_ENTRY_GRACE_RESIST_BONUS);
  return Math.min(0.95, stacked);
}

/**
 * Cap a single-hit damage value against a boss's max-HP fraction. Returns
 * the (possibly clamped) damage to actually subtract from `e.health`.
 *
 * Non-boss entities pass through unchanged so this can be called
 * unconditionally in the hit pipeline.
 *
 * @example
 * // boss.maxHealth = 24000, BOSS_HIT_DAMAGE_CAP_PCT = 0.03 → cap = 720
 * capBossHitDamage(boss, 50000) // → 720
 * capBossHitDamage(boss, 100)   // → 100  (under cap, untouched)
 */
export function capBossHitDamage(e: Entity, damage: number): number {
  if (!isBossEntity(e)) return damage;
  if (!Number.isFinite(damage) || damage <= 0) return damage;
  const cap = e.maxHealth * BOSS_HIT_DAMAGE_CAP_PCT;
  return Math.min(damage, cap);
}

/**
 * Estimate boss time-to-kill in seconds for a given DPS — handy for design
 * tuning sanity checks and as a self-documenting helper used by tests.
 *
 * Assumes the player can sustain `dpsAfterResist` (i.e. the resist has
 * already been applied) and ignores enrage / phase transitions.
 *
 * @param maxHealth Boss raw max HP.
 * @param dpsAfterResist Damage per second after the boss's resist has been applied.
 * @param hitsPerSecond Used to clamp by the per-hit cap (e.g. 10 fire/sec).
 */
export function estimateBossTTK(
  maxHealth: number,
  dpsAfterResist: number,
  hitsPerSecond: number,
): number {
  if (dpsAfterResist <= 0 || hitsPerSecond <= 0) return Infinity;
  const cappedDamagePerHit = maxHealth * BOSS_HIT_DAMAGE_CAP_PCT;
  const cappedDps = Math.min(dpsAfterResist, cappedDamagePerHit * hitsPerSecond);
  return maxHealth / cappedDps;
}
