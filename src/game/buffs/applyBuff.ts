import { PASSIVE_BUFFS } from '../content/buffs';
import { BuffRarity, GameState } from '../types';
import { computeThreatLevel } from '../balance/threat';
import { grantExtraLife } from '../balance/extraLife';
import { countPassiveStacks } from './pickBuffs';

export function applyBuff(state: GameState, choiceId: string): void {
  const def = PASSIVE_BUFFS[choiceId];
  if (!def) return;

  const max = def.maxStacks ?? 99;
  if (countPassiveStacks(state.passives, choiceId) >= max) return;

  state.passives.push(choiceId);

  switch (choiceId) {
    case 'dmg_up':
      state.baseDamage *= 1.25;
      break;
    case 'crit_up':
      state.critChance += 0.12;
      break;
    case 'health_up':
      state.player.maxHealth += 60;
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 80);
      break;
    case 'speed_up':
      state.player.speed *= 1.18;
      break;
    case 'energy_up':
      state.maxEnergy += 40;
      state.energy = state.maxEnergy;
      break;
    case 'magnet_up':
      state.buffs.magnet = Math.max(state.buffs.magnet, 720);
      break;
    case 'regen_up':
      state.regen += 4;
      break;
    case 'bounce_up':
      state.bounceCount += 1;
      break;
    case 'lifesteal_up':
      state.lifeSteal += 0.08;
      break;
    case 'shield_up':
      grantExtraLife(state);
      break;
    case 'explosive':
      state.explosiveChance += 0.15;
      break;
    case 'multishot_up':
      state.multiShot += 1;
      state.multiShotFireRatePenalty = (state.multiShotFireRatePenalty ?? 1) * 0.92;
      break;
    case 'overdrive_p':
      state.permanentOverdrive = true;
      state.baseDamage *= 0.85;
      break;
    case 'time_slow_p':
      state.permanentTimeSlow = true;
      state.player.speed *= 0.85;
      break;
    case 'orbital':
      state.orbitalCount += 1;
      break;
    case 'lighting':
      state.hasLighting = true;
      break;
    case 'pierce_up':
      state.permanentPiercing = true;
      break;
    case 'gravity_well':
      state.hasGravityWell = true;
      break;
    case 'backshot':
      state.hasBackshot = true;
      break;
    case 'spiral_shot':
      state.hasSpiralShot = true;
      break;
    case 'burn_dot':
      state.burnOnCrit = true;
      break;
    case 'frost_slow':
      state.frostSlowStrength += 0.15;
      break;
    case 'thorns':
      state.thornsDamage += 12;
      break;
    case 'dash_iframes':
      state.dashIFrames = true;
      break;
    case 'combo_boost':
      state.comboDamageMult += 0.25;
      break;
    case 'score_burst':
      state.buffs.scoreX = Math.max(state.buffs.scoreX, 600);
      break;
    case 'emergency_shield':
      grantExtraLife(state);
      break;
    case 'ricochet_plus':
      state.smartRicochet = true;
      break;
    case 'vampiric_burst':
      state.vampiricBurstStacks += 1;
      break;
    case 'chain_crit':
      state.chainCritBonus += 0.08;
      break;
    case 'wide_arc':
      state.multiShot += 1;
      state.wideArcStacks += 1;
      break;
    case 'overcharge_dash':
      state.dashEnergyDiscount += 7;
      break;
    case 'volatile_death':
      state.volatileDeath = true;
      break;
    case 'time_dilation':
      state.hasTimeDilation = true;
      state.timeDilationCooldown = 0;
      break;
    case 'hunter_mark':
      state.hunterMarkBonus += 0.2;
      break;
    case 'multishot_apocalypse':
      state.multiShot += 5;
      state.wideArcStacks += 1;
      break;
    case 'bullet_storm':
      state.bulletStormMult = 1.8;
      state.baseDamage *= 0.9;
      break;
    case 'infinity_pierce':
      state.hasInfinityPierce = true;
      state.permanentPiercing = true;
      state.bounceCount += 1;
      break;
    case 'orbital_legion':
      state.orbitalCount += 3;
      break;
    case 'chain_god':
      state.hasLighting = true;
      state.chainCritBonus += 0.15;
      break;
    case 'glass_cannon_omega':
      state.baseDamage *= 1.8;
      state.player.maxHealth = Math.floor(state.player.maxHealth * 0.75);
      state.player.health = Math.min(state.player.health, state.player.maxHealth);
      break;
    case 'kill_satellite':
      state.killSatelliteCounter = 0;
      break;
    case 'void_rift':
      state.hasVoidRift = true;
      state.hasGravityWell = true;
      state.voidRiftCooldown = 0;
      break;
    case 'cursed_ammo':
      state.baseDamage *= 0.7;
      break;
    case 'neon_blood':
      state.player.maxHealth += 200;
      state.player.health += 200;
      break;
    case 'chrono_glitch':
      // Handled entirely dynamically in App.tsx when hitting damage
      break;
    case 'carlsson_mode':
      state.hasHoming = true;
      state.permanentRapidFire = true;
      state.permanentOverdrive = true;
      state.player.speed *= 1.35;
      state.baseDamage *= 2;
      break;
    case 'boss_slayer':
      state.baseDamage *= 1.12;
      break;
    case 'arena_stabilizer':
      state.player.maxHealth += 80;
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 80);
      state.regen += 5;
      break;
    case 'hive_bulwark':
      state.dashEnergyDiscount = Math.min(0.6, state.dashEnergyDiscount + 0.15);
      break;
    case 'void_hunter':
      state.critChance += 0.18;
      break;
    case 'crimson_overdrive':
      state.buffs.overdrive = Math.max(state.buffs.overdrive, 480);
      break;
    default:
      break;
  }

  state.augmentCount += 1;
  const defRarity = def.rarity;
  if (def.exclusive || defRarity === BuffRarity.EXCLUSIVE) {
    state.screenFlash = Math.max(state.screenFlash, 18);
    state.pickJuiceTimer = 45;
    state.screenshake = Math.max(state.screenshake, 15);
  }
  state.threatLevel = computeThreatLevel(state);
  state.threatPeak = Math.max(state.threatPeak, state.threatLevel);
}

export function hasPermanentOverdrive(state: GameState): boolean {
  return state.permanentOverdrive || state.buffs.overdrive > 0;
}

export function hasPermanentRapidFire(state: GameState): boolean {
  return state.permanentRapidFire || state.buffs.rapidFire > 0;
}

export function hasPermanentPiercing(state: GameState): boolean {
  return state.permanentPiercing || state.buffs.piercing > 0;
}

export function hasTimeSlowEffect(state: GameState): boolean {
  return state.permanentTimeSlow || state.buffs.timeSlow > 0;
}
