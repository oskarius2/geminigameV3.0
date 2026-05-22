import { COMPANION_MAX_LEVEL } from '../companions/companionDefs';
import { computeThreatLevel } from '../balance/threat';
import { applySurvivalDifficultyToThreat } from '../balance/miniBossDifficulty';
import { getArtifactDropChance } from '../loot/dropLogic';
import type { GameState } from '../types';
import type { ShopItemId, ShopRunFlags } from './shopTypes';

const DAMAGE_CAP = 1.25;
const SPEED_CAP = 1.2;
const CRIT_CAP = 0.1;
const REGEN_CAP = 0.5;

function hasItem(ids: ShopItemId[], id: ShopItemId): boolean {
  return ids.includes(id);
}

export function defaultShopRunFlags(): ShopRunFlags {
  return {};
}

/** Apply purchased shop items after ship, traits, artifacts, companion setup. */
export function applyShopEffects(state: GameState, purchasedIds: ShopItemId[]): void {
  state.shopPurchasedIds = [...purchasedIds];
  state.shopRunFlags = defaultShopRunFlags();
  state.shopScrapSpent = 0;

  if (purchasedIds.length === 0) return;

  let damageMult = 1;
  let speedMult = 1;
  let critAdd = 0;
  let regenAdd = 0;
  let maxHpAdd = 0;

  const flags = state.shopRunFlags;

  if (hasItem(purchasedIds, 'shop_overdrive')) damageMult *= 1.2;
  if (hasItem(purchasedIds, 'shop_kinetic_surge')) speedMult *= 1.15;
  if (hasItem(purchasedIds, 'shop_fortified')) maxHpAdd += 30;
  if (hasItem(purchasedIds, 'shop_sharpened')) critAdd += 0.1;
  if (hasItem(purchasedIds, 'shop_regeneration')) regenAdd += 0.5;

  damageMult = Math.min(damageMult, DAMAGE_CAP);
  speedMult = Math.min(speedMult, SPEED_CAP);
  critAdd = Math.min(critAdd, CRIT_CAP);
  regenAdd = Math.min(regenAdd, REGEN_CAP);

  state.baseDamage *= damageMult;
  state.player.speed *= speedMult;
  state.critChance = Math.min(0.95, state.critChance + critAdd);
  state.regen += regenAdd;

  if (maxHpAdd > 0) {
    state.player.maxHealth += maxHpAdd;
    state.player.health += maxHpAdd;
  }

  if (hasItem(purchasedIds, 'shop_abundant_ammo')) {
    flags.abundantAmmoStagesLeft = 2;
  }
  if (hasItem(purchasedIds, 'shop_swift_training')) {
    flags.swiftTrainingStagesLeft = 2;
  }
  if (hasItem(purchasedIds, 'shop_lucky_streak')) {
    flags.luckyArtifactPicksLeft = 2;
  }
  if (hasItem(purchasedIds, 'shop_guardian_angel')) {
    state.buffs.shield = Math.max(state.buffs.shield, 50);
    flags.guardianShieldTimer = 30;
  }
  if (hasItem(purchasedIds, 'shop_calm_before_storm')) {
    flags.threatOffset = (flags.threatOffset ?? 0) - 10;
  }
  if (hasItem(purchasedIds, 'shop_breathing_room')) {
    flags.threatGrowthMult = (flags.threatGrowthMult ?? 1) * 0.8;
  }

  if (hasItem(purchasedIds, 'shop_companion_ascension') && state.activeCompanionId) {
    state.companionLevel = Math.min(COMPANION_MAX_LEVEL, state.companionLevel + 1);
  }

  if (hasItem(purchasedIds, 'shop_companion_hp')) {
    flags.companionHpBoost = true;
  }
}

/** Apply companion HP shop buff after runtime is created. */
export function applyCompanionHpShopBoost(state: GameState): void {
  if (!state.shopRunFlags.companionHpBoost || !state.companionRuntime) return;
  const rt = state.companionRuntime;
  rt.maxHealth = Math.floor(rt.maxHealth * 1.5);
  rt.health = rt.maxHealth;
}

/** Recompute threat after passives; apply shop offsets. */
export function applyShopThreat(state: GameState): void {
  let level = computeThreatLevel(state);
  const offset = state.shopRunFlags.threatOffset ?? 0;
  const growth = state.shopRunFlags.threatGrowthMult ?? 1;
  if (growth !== 1) {
    level = Math.round(level * growth);
  }
  level += offset;
  state.threatLevel = Math.min(100, Math.max(0, level));
  if (state.gameMode === 'NORMAL') {
    state.threatLevel = applySurvivalDifficultyToThreat(state.threatLevel);
  }
  state.threatPeak = Math.max(state.threatPeak, state.threatLevel);
}

export function getExperienceGainMultiplier(state: GameState): number {
  const left = state.shopRunFlags.swiftTrainingStagesLeft ?? 0;
  if (left <= 0 || state.stage > 2) return 1;
  return 1.25;
}

export function getLootDropChanceMultiplier(state: GameState): number {
  const left = state.shopRunFlags.abundantAmmoStagesLeft ?? 0;
  if (left <= 0 || state.stage > 2) return 1;
  return 2;
}

export function getEffectiveArtifactDropChance(state: GameState): number {
  const base =
    state.artifactDropRate ?? getArtifactDropChance(state.stage);
  return base * getLootDropChanceMultiplier(state);
}

/** Call when survival stage increments (after stage++). Buffs apply on stages 1–2 only. */
export function onShopStageAdvanced(state: GameState): void {
  if (state.stage > 2) {
    state.shopRunFlags.abundantAmmoStagesLeft = 0;
    state.shopRunFlags.swiftTrainingStagesLeft = 0;
  }
}

export function tickShopRunFlags(state: GameState, dtSec: number): void {
  const flags = state.shopRunFlags;
  if ((flags.guardianShieldTimer ?? 0) > 0) {
    flags.guardianShieldTimer = Math.max(0, flags.guardianShieldTimer! - dtSec);
    if (flags.guardianShieldTimer <= 0 && state.buffs.shield > 0 && state.buffs.shield <= 50) {
      state.buffs.shield = 0;
    }
  }
}

export function consumeLuckyArtifactPick(state: GameState): boolean {
  const left = state.shopRunFlags.luckyArtifactPicksLeft ?? 0;
  if (left <= 0) return false;
  state.shopRunFlags.luckyArtifactPicksLeft = left - 1;
  return true;
}
