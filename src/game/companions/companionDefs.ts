import type { CompanionId, ShipId } from '../types';
import {
  CompanionType,
  companionIdToType,
  type CompanionAbility,
  type CompanionBaseStats,
  type CompanionDef,
  type CompanionInstance,
  type CompanionLevelScaling,
  type CompanionPassive,
  type LegacyCompanionDef,
  type PlayerCompanionStats,
} from './companionTypes';

export type { CompanionId };
export type {
  CompanionAbility,
  CompanionBaseStats,
  CompanionDef,
  CompanionInstance,
  CompanionLevelScaling,
  CompanionPassive,
  LegacyCompanionDef,
  PlayerCompanionStats,
} from './companionTypes';
export {
  CompanionType,
  companionIdToType,
  companionTypeToId,
  isCompanionType,
} from './companionTypes';

export const COMPANION_MAX_LEVEL = 5;

/** @deprecated Use per-type thresholds in companionLeveling. */
export const COMPANION_XP_THRESHOLDS = [0, 50, 150, 350, 700];

function scaledStats(def: CompanionDef, level: number): CompanionBaseStats {
  const clamped = Math.max(1, Math.min(COMPANION_MAX_LEVEL, level));
  return { ...def.baseStats, ...def.levelScaling[clamped] };
}

function pctFromAbsorb(absorb: number): number {
  return absorb > 1 ? absorb / 100 : absorb;
}

function toLegacyScaling(def: CompanionDef): CompanionLevelScaling[] {
  const rows: CompanionLevelScaling[] = [];
  for (let level = 1; level <= COMPANION_MAX_LEVEL; level++) {
    const s = scaledStats(def, level);
    const row: CompanionLevelScaling = { level };
    switch (def.type) {
      case CompanionType.GUARDIAN:
        row.companionHp = s.health;
        row.damageAbsorbPct = pctFromAbsorb(s.damageAbsorption ?? 15);
        if (level === 5) row.bonusPassive = 'Fortified Shell — taunt duration +50%.';
        break;
      case CompanionType.SCOUT:
        row.revealRadius = s.detectionRange;
        row.speedAuraDuration = (s.speedBoost ?? 15) / 5;
        row.gunnerDamageMult = (s.attackDamage ?? 12) / 100;
        row.gunnerFireRate = s.fireRate ?? 4.5;
        if (level === 5) row.bonusPassive = 'Twin Link — fires paired bolts; mark synergy +10%.';
        break;
      case CompanionType.HEALER:
        row.regenPctPerSec = (s.healRate ?? 3.5) / 100;
        row.burstHealPct = 0.12 + level * 0.04;
        if (level === 5) row.bonusPassive = 'Overclock Medbay — regen doubles while standing still.';
        break;
      case CompanionType.GUNNER:
        row.gunnerDamageMult = (s.attackDamage ?? 25) / 100;
        row.gunnerFireRate = s.fireRate ?? 6;
        if (level === 5) row.bonusPassive = 'Twin Link — burst fire fires from two angles.';
        break;
    }
    rows.push(row);
  }
  return rows;
}

function toLegacyDef(def: CompanionDef): LegacyCompanionDef {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    role: def.role,
    bestFor: def.bestFor,
    passives: def.passivesSummary,
    ability: def.abilitySummary,
    scaling: toLegacyScaling(def),
  };
}

// --- Guardian Drone ---

const guardianDroneDef: CompanionDef = {
  id: 'guardian',
  type: CompanionType.GUARDIAN,
  name: 'Guardian Drone',
  description: 'Armored drone that blocks projectiles and draws fire.',
  role: 'tank',
  bestFor: ['gunship'],
  baseStats: {
    health: 100,
    armor: 20,
    damageAbsorption: 15,
    moveSpeed: 140,
    attack: 0,
    auraRadius: 100,
  },
  passivesSummary: [
    'Absorbs 15% of player damage',
    'Reflects 20% of absorbed damage',
    'Aura reduces ally damage by 10%',
  ],
  abilitySummary: 'Taunt — enemies briefly focus the drone instead of the player.',
  passives: [
    {
      name: 'Bodyguard',
      description: 'Drone orbits player, intercepting a portion of incoming projectiles.',
      leveledEffect(instance, stats, level) {
        const absorb = scaledStats(guardianDroneDef, level).damageAbsorption ?? 15;
        stats.projectileInterceptPct = (stats.projectileInterceptPct ?? 0) + pctFromAbsorb(absorb);
        stats.damageReduction =
          (stats.damageReduction ?? 0) + pctFromAbsorb(absorb) * 0.5;
      },
    },
    {
      name: 'Reflect Plating',
      description: 'When absorbing damage, 20% of absorbed damage reflects back to attacker.',
      effect(_instance, stats) {
        stats.damageReflectPct = (stats.damageReflectPct ?? 0) + 0.2;
      },
    },
    {
      name: 'Guardian Aura',
      description: 'Drone creates protective aura (100px radius), allies in aura take 10% less damage.',
      effect(instance, stats) {
        const aura = scaledStats(guardianDroneDef, instance.currentLevel).auraRadius ?? 100;
        stats.auraRadius = Math.max(stats.auraRadius ?? 0, aura);
        stats.auraDamageReductionPct = (stats.auraDamageReductionPct ?? 0) + 0.1;
      },
    },
  ],
  activeAbility: {
    name: 'Taunt',
    description: 'Pulls nearby enemy aggro and projectiles to the drone for several seconds.',
    cooldown: 11,
    effect(instance, stats) {
      const duration = instance.currentLevel >= 5 ? 6 : 4;
      instance.tauntTimer = duration;
      stats.tauntActive = 1;
      stats.tauntDuration = duration;
    },
  },
  levelScaling: {
    1: { health: 100, armor: 20, damageAbsorption: 15, moveSpeed: 140 },
    2: { health: 130, armor: 22, damageAbsorption: 18, moveSpeed: 140 },
    3: { health: 160, armor: 24, damageAbsorption: 20, moveSpeed: 140 },
    4: { health: 190, armor: 26, damageAbsorption: 23, moveSpeed: 140 },
    5: { health: 220, armor: 28, damageAbsorption: 25, moveSpeed: 140 },
  },
};

// --- Scout Drone ---

const scoutDroneDef: CompanionDef = {
  id: 'scout',
  type: CompanionType.SCOUT,
  name: 'Scout Drone',
  description: 'Agile drone that highlights threats and boosts speed.',
  role: 'scout',
  bestFor: ['interceptor'],
  baseStats: {
    detectionRange: 400,
    speedBoost: 15,
    moveSpeed: 200,
    attackDamage: 12,
    fireRate: 4.5,
  },
  passivesSummary: [
    'Linked pulse lasers on marked targets',
    'Your shots deal +28% vs marked enemies',
    'Reveals threats on minimap · +speed aura',
  ],
  abilitySummary: 'Evasion Burst — faster fire, speed spike, damage reduction.',
  passives: [
    {
      name: 'Enemy Radar',
      description: 'Reveals all enemy positions on minimap within detection range (always active).',
      leveledEffect(_instance, stats, level) {
        const range = scaledStats(scoutDroneDef, level).detectionRange ?? 400;
        stats.revealRadius = Math.max(stats.revealRadius ?? 0, range);
      },
    },
    {
      name: 'Speed Aura',
      description: 'Player gains bonus move speed while companion is active.',
      leveledEffect(_instance, stats, level) {
        const boost = scaledStats(scoutDroneDef, level).speedBoost ?? 15;
        stats.speedMult = (stats.speedMult ?? 1) + boost / 100;
      },
    },
    {
      name: 'Threat Assessment',
      description: 'Highlights most dangerous enemy (largest threat marker).',
      effect(_instance, stats) {
        stats.markDangerousEnemy = 1;
      },
    },
  ],
  activeAbility: {
    name: 'Evasion Burst',
    description: 'Grants a short evasion window with extra speed.',
    cooldown: 15,
    effect(instance, stats) {
      const duration = instance.currentLevel >= 5 ? 2.5 : 2;
      instance.evasionBurstTimer = duration;
      stats.evasionBurstActive = 1;
      stats.evasionBurstDuration = duration;
      const boost = scaledStats(scoutDroneDef, instance.currentLevel).speedBoost ?? 15;
      stats.speedMult = (stats.speedMult ?? 1) + (boost + 25) / 100;
      stats.damageReduction = (stats.damageReduction ?? 0) + 0.35;
    },
  },
  levelScaling: {
    1: { detectionRange: 400, speedBoost: 15, moveSpeed: 200, attackDamage: 12, fireRate: 4.5 },
    2: { detectionRange: 450, speedBoost: 18, moveSpeed: 200, attackDamage: 15, fireRate: 5 },
    3: { detectionRange: 500, speedBoost: 20, moveSpeed: 200, attackDamage: 18, fireRate: 5.5 },
    4: { detectionRange: 550, speedBoost: 22, moveSpeed: 200, attackDamage: 21, fireRate: 6 },
    5: { detectionRange: 600, speedBoost: 25, moveSpeed: 200, attackDamage: 24, fireRate: 6.5 },
  },
};

// --- Healer Drone ---

const healerDroneDef: CompanionDef = {
  id: 'healer',
  type: CompanionType.HEALER,
  name: 'Healer Drone',
  description: 'Medical drone that patches hull breaches over time.',
  role: 'healer',
  bestFor: ['drone'],
  baseStats: {
    health: 60,
    healRate: 3.5,
  },
  passivesSummary: ['Continuous healing at 3.5 HP/s', 'Burst heal when HP is critical'],
  abilitySummary: 'Triage Pulse — instant heal when HP drops below 25%.',
  passives: [
    {
      name: 'Continuous Healing',
      description: 'Drone continuously heals player (HP per second).',
      leveledEffect(_instance, stats, level) {
        const rate = scaledStats(healerDroneDef, level).healRate ?? 3.5;
        stats.regenPerSec = (stats.regenPerSec ?? 0) + rate;
      },
    },
    {
      name: 'Emergency Triage',
      description: 'Stores burst heal strength for sub-25% HP triggers.',
      leveledEffect(_instance, stats, level) {
        stats.triageHealPct = 0.12 + level * 0.04;
      },
    },
  ],
  activeAbility: {
    name: 'Triage Pulse',
    description: 'Instantly restores a chunk of HP when activated below 25% hull.',
    cooldown: 18,
    energyCost: 0,
    effect(instance, stats) {
      const maxHp = stats.maxHealth ?? 100;
      const current = stats.currentHealth ?? maxHp;
      if (current / maxHp >= 0.25) return;
      const pct = 0.12 + instance.currentLevel * 0.04;
      const heal = maxHp * pct;
      stats.currentHealth = Math.min(maxHp, current + heal);
    },
  },
  levelScaling: {
    1: { health: 60, healRate: 3.5 },
    2: { health: 70, healRate: 4 },
    3: { health: 80, healRate: 4.5 },
    4: { health: 90, healRate: 5 },
    5: { health: 100, healRate: 5.5 },
  },
};

// --- Gunner Drone ---

const gunnerDroneDef: CompanionDef = {
  id: 'gunner',
  type: CompanionType.GUNNER,
  name: 'Gunner Drone',
  description: 'Attack drone that follows the player and shoots nearby enemies.',
  role: 'offense',
  bestFor: ['interceptor', 'gunship', 'drone'],
  baseStats: {
    health: 80,
    attackDamage: 25,
    fireRate: 6,
    range: 500,
  },
  passivesSummary: [
    'Co-fires at player target',
    '+10% crit vs damaged enemies',
  ],
  abilitySummary: 'Focused Burst — concentrated fire on a designated target.',
  passives: [
    {
      name: 'Co-fire',
      description: 'Shoots at same target player is shooting.',
      leveledEffect(_instance, stats, level) {
        const s = scaledStats(gunnerDroneDef, level);
        stats.companionFireDamage = s.attackDamage ?? 25;
        stats.companionFireRate = s.fireRate ?? 6;
        stats.companionFireRange = s.range ?? 500;
      },
    },
    {
      name: 'Weak Point Detection',
      description: 'Increases crit chance against targets player has damaged by 10%.',
      effect(_instance, stats) {
        stats.critChanceBonus = (stats.critChanceBonus ?? 0) + 0.1;
      },
    },
  ],
  activeAbility: {
    name: 'Focused Burst',
    description: 'Companion fires at 2x rate and damage for 3 seconds.',
    cooldown: 14,
    effect(instance, stats) {
      const mult = instance.currentLevel >= 5 ? 2.5 : 2;
      stats.focusedBurstMult = mult;
      const s = scaledStats(gunnerDroneDef, instance.currentLevel);
      stats.companionFireDamage = (s.attackDamage ?? 25) * mult;
      stats.companionFireRate = (s.fireRate ?? 6) * mult;
    },
  },
  levelScaling: {
    1: { health: 80, attackDamage: 25, fireRate: 6, range: 500 },
    2: { health: 90, attackDamage: 30, fireRate: 7, range: 500 },
    3: { health: 100, attackDamage: 35, fireRate: 8, range: 500 },
    4: { health: 110, attackDamage: 40, fireRate: 9, range: 500 },
    5: { health: 120, attackDamage: 45, fireRate: 10, range: 500 },
  },
};

const RICH_COMPANION_DEFS: Record<CompanionType, CompanionDef> = {
  [CompanionType.GUARDIAN]: guardianDroneDef,
  [CompanionType.SCOUT]: scoutDroneDef,
  [CompanionType.HEALER]: healerDroneDef,
  [CompanionType.GUNNER]: gunnerDroneDef,
};

export const COMPANION_DEFINITIONS: Record<CompanionId, LegacyCompanionDef> = {
  guardian: toLegacyDef(guardianDroneDef),
  scout: toLegacyDef(scoutDroneDef),
  healer: toLegacyDef(healerDroneDef),
  gunner: toLegacyDef(gunnerDroneDef),
};

export const COMPANION_IDS = Object.keys(COMPANION_DEFINITIONS) as CompanionId[];

export function getCompanionDef(type: CompanionType): CompanionDef;
export function getCompanionDef(id: CompanionId): CompanionDef;
export function getCompanionDef(id: string): CompanionDef | null;
export function getCompanionDef(id: CompanionType | CompanionId | string): CompanionDef | null {
  if (id in RICH_COMPANION_DEFS) {
    return RICH_COMPANION_DEFS[id as CompanionType];
  }
  return null;
}

export function createCompanionInstance(
  id: CompanionId,
  level = 1,
  xp = 0,
  isActive = true,
): CompanionInstance {
  const def = getCompanionDef(id);
  if (!def) throw new Error(`Unknown companion: ${id}`);
  const stats = scaledStats(def, level);
  const maxHealth = stats.health ?? 80;
  return {
    id,
    type: def.type,
    currentLevel: Math.max(1, Math.min(COMPANION_MAX_LEVEL, level)),
    currentXP: xp,
    health: maxHealth,
    maxHealth,
    isActive,
    energy: 100,
    abilityCooldownRemaining: 0,
  };
}

export {
  applyCompanionPassives,
  computeCompanionPassiveStats,
  mitigateCompanionIncomingDamage,
  applyCompanionDamageReflect,
} from './companionPassives';

/** Fire active ability if off cooldown; returns false if still cooling down. */
export function useCompanionAbility(
  instance: CompanionInstance,
  playerStats: PlayerCompanionStats,
  dtSec = 0,
): boolean {
  const def = getCompanionDef(instance.type);
  if (!def?.activeAbility || !instance.isActive) return false;

  if (instance.abilityCooldownRemaining && instance.abilityCooldownRemaining > 0) {
    instance.abilityCooldownRemaining = Math.max(0, instance.abilityCooldownRemaining - dtSec);
    return false;
  }

  const cost = def.activeAbility.energyCost ?? 0;
  if (cost > 0 && (instance.energy ?? 0) < cost) return false;

  def.activeAbility.effect(instance, playerStats);
  if (cost > 0) instance.energy = (instance.energy ?? 0) - cost;
  instance.abilityCooldownRemaining = def.activeAbility.cooldown;
  return true;
}

export function tickCompanionTimers(instance: CompanionInstance, dtSec: number): void {
  if (instance.tauntTimer && instance.tauntTimer > 0) {
    instance.tauntTimer = Math.max(0, instance.tauntTimer - dtSec);
    if (instance.tauntTimer <= 0) instance.tauntTimer = undefined;
  }
  if (instance.evasionBurstTimer && instance.evasionBurstTimer > 0) {
    instance.evasionBurstTimer = Math.max(0, instance.evasionBurstTimer - dtSec);
    if (instance.evasionBurstTimer <= 0) instance.evasionBurstTimer = undefined;
  }
  if (instance.abilityCooldownRemaining && instance.abilityCooldownRemaining > 0) {
    instance.abilityCooldownRemaining = Math.max(0, instance.abilityCooldownRemaining - dtSec);
  }
}

export function getCompanionLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = COMPANION_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= COMPANION_XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(COMPANION_MAX_LEVEL, level);
}

export function getCompanionScaling(
  companionId: CompanionId,
  level: number,
): CompanionLevelScaling | null {
  const def = COMPANION_DEFINITIONS[companionId];
  const clamped = Math.max(1, Math.min(COMPANION_MAX_LEVEL, level));
  return def.scaling.find((s) => s.level === clamped) ?? null;
}

export function getScaledCompanionStats(
  companionId: CompanionId,
  level: number,
): CompanionBaseStats | null {
  const def = getCompanionDef(companionId);
  if (!def) return null;
  return scaledStats(def, level);
}

export function getRecommendedCompanion(shipId: ShipId): CompanionId {
  switch (shipId) {
    case 'interceptor':
      return 'scout';
    case 'gunship':
      return 'guardian';
    case 'drone':
      return 'healer';
    default:
      return 'gunner';
  }
}
