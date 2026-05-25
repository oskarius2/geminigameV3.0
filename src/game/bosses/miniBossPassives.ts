import { BuffRarity, Entity, GameState, PassiveBuff } from '../types';

const LEGENDARY_PASSIVE_CHANCE = 0.05;
const HEALTH_SNAPSHOT_INTERVAL = 2;

/** Run-scoped passives dropped by mini-bosses (optional 25% bonus). */
export const MINI_BOSS_PASSIVES: Record<string, PassiveBuff> = {
  mb_fortified: {
    id: 'mb_fortified',
    name: 'Fortified',
    description: '15% less damage for 10s after miniboss.',
    rarity: BuffRarity.RARE,
    icon: 'shield',
    maxStacks: 1,
  },
  mb_shockwave_echo: {
    id: 'mb_shockwave_echo',
    name: 'Shockwave Echo',
    description: 'Next shot creates a shockwave on hit.',
    rarity: BuffRarity.RARE,
    icon: 'wave',
    maxStacks: 1,
  },
  mb_momentum: {
    id: 'mb_momentum',
    name: 'Momentum',
    description: '+20% speed for 8s after miniboss.',
    rarity: BuffRarity.RARE,
    icon: 'speed',
    maxStacks: 1,
  },
  mb_phantom_strike: {
    id: 'mb_phantom_strike',
    name: 'Phantom Strike',
    description: 'Next attack deals double damage.',
    rarity: BuffRarity.EPIC,
    icon: 'strike',
    maxStacks: 1,
  },
  mb_void_walker: {
    id: 'mb_void_walker',
    name: 'Void Walker',
    description: 'Partially invisible for 6s after miniboss.',
    rarity: BuffRarity.EPIC,
    icon: 'ghost',
    maxStacks: 1,
  },
  mb_void_drain: {
    id: 'mb_void_drain',
    name: 'Void Drain',
    description: 'Heals 15% of damage dealt to miniboss.',
    rarity: BuffRarity.EPIC,
    icon: 'drain',
    maxStacks: 1,
  },
  mb_apex_predator: {
    id: 'mb_apex_predator',
    name: 'Apex Predator',
    description: '+50% damage for 5s (15s internal cooldown).',
    rarity: BuffRarity.LEGENDARY,
    icon: 'apex',
    maxStacks: 1,
  },
  mb_temporal_anchor: {
    id: 'mb_temporal_anchor',
    name: 'Temporal Anchor',
    description: 'Restores HP from 2s ago on death (once).',
    rarity: BuffRarity.LEGENDARY,
    icon: 'time',
    maxStacks: 1,
  },
};

export interface MiniBossPassiveRuntime {
  damageReductionMult: number;
  damageReductionTimer: number;
  speedBoostMult: number;
  speedBoostTimer: number;
  nextShotShockwave: boolean;
  phantomStrikePending: boolean;
  voidWalkerTimer: number;
  apexPredatorTimer: number;
  apexPredatorCooldown: number;
  temporalAnchorUsed: boolean;
}

export function ensureMiniBossPassiveRuntime(state: GameState): MiniBossPassiveRuntime {
  if (!state.miniBossPassiveRuntime) {
    state.miniBossPassiveRuntime = {
      damageReductionMult: 1,
      damageReductionTimer: 0,
      speedBoostMult: 1,
      speedBoostTimer: 0,
      nextShotShockwave: false,
      phantomStrikePending: false,
      voidWalkerTimer: 0,
      apexPredatorTimer: 0,
      apexPredatorCooldown: 0,
      temporalAnchorUsed: false,
    };
  }
  return state.miniBossPassiveRuntime;
}

export function grantMiniBossPassive(state: GameState, passiveId: string): PassiveBuff | null {
  const def = MINI_BOSS_PASSIVES[passiveId];
  if (!def) return null;
  if (!state.passives.includes(passiveId)) {
    state.passives.push(passiveId);
  }
  const rt = ensureMiniBossPassiveRuntime(state);
  switch (passiveId) {
    case 'mb_fortified':
      rt.damageReductionMult = 0.85;
      rt.damageReductionTimer = 10;
      break;
    case 'mb_shockwave_echo':
      rt.nextShotShockwave = true;
      break;
    case 'mb_momentum':
      rt.speedBoostMult = 1.2;
      rt.speedBoostTimer = 8;
      state.player.speed *= 1.2;
      break;
    case 'mb_phantom_strike':
      rt.phantomStrikePending = true;
      break;
    case 'mb_void_walker':
      rt.voidWalkerTimer = 6;
      break;
    case 'mb_void_drain':
      break;
    case 'mb_apex_predator':
      if (rt.apexPredatorCooldown <= 0) {
        rt.apexPredatorTimer = 5;
        rt.apexPredatorCooldown = 15;
      }
      break;
    case 'mb_temporal_anchor':
      rt.temporalAnchorUsed = false;
      state.healthSnapshot = {
        survivalTime: state.survivalTime,
        health: state.player.health,
      };
      break;
    default:
      break;
  }
  return def;
}

export function tickHealthSnapshot(state: GameState): void {
  if (!state.passives.includes('mb_temporal_anchor')) return;
  const snap = state.healthSnapshot;
  if (!snap || state.survivalTime - snap.survivalTime >= HEALTH_SNAPSHOT_INTERVAL) {
    state.healthSnapshot = {
      survivalTime: state.survivalTime,
      health: state.player.health,
    };
  }
}

/** Saves the player from death once via Temporal Anchor. */
export function tryTemporalAnchor(state: GameState, player: Entity): boolean {
  if (!state.passives.includes('mb_temporal_anchor')) return false;
  const rt = ensureMiniBossPassiveRuntime(state);
  if (rt.temporalAnchorUsed) return false;

  rt.temporalAnchorUsed = true;
  const snapHp = state.healthSnapshot?.health;
  player.health = Math.max(
    state.player.maxHealth * 0.2,
    snapHp ?? state.player.maxHealth * 0.45,
  );
  state.miniBossPopupTimer = 1.8;
  state.miniBossPopupText = 'TIDSANKARE';
  state.miniBossPopupSubtext = 'Tiden spolas tillbaka';
  state.miniBossPopupColor = '#a78bfa';
  state.screenFlash = Math.max(state.screenFlash, 8);
  state.screenFlashColor = '#a78bfa';
  state.playerIFrameTimer = 90;
  return true;
}

export function tickMiniBossPassiveRuntime(state: GameState, dtSec: number): void {
  tickHealthSnapshot(state);
  const rt = state.miniBossPassiveRuntime;
  if (!rt) return;

  if (rt.damageReductionTimer > 0) {
    rt.damageReductionTimer -= dtSec;
    if (rt.damageReductionTimer <= 0) {
      rt.damageReductionMult = 1;
      rt.damageReductionTimer = 0;
    }
  }

  if (rt.speedBoostTimer > 0) {
    rt.speedBoostTimer -= dtSec;
    if (rt.speedBoostTimer <= 0) {
      if (rt.speedBoostMult !== 1) {
        state.player.speed /= rt.speedBoostMult;
      }
      rt.speedBoostMult = 1;
      rt.speedBoostTimer = 0;
    }
  }

  if (rt.voidWalkerTimer > 0) {
    rt.voidWalkerTimer -= dtSec;
  }

  if (rt.apexPredatorTimer > 0) {
    rt.apexPredatorTimer -= dtSec;
    if (rt.apexPredatorTimer <= 0) rt.apexPredatorTimer = 0;
  }
  if (rt.apexPredatorCooldown > 0) {
    rt.apexPredatorCooldown -= dtSec;
    if (rt.apexPredatorCooldown < 0) rt.apexPredatorCooldown = 0;
  }
}

export function getMiniBossIncomingDamageMult(state: GameState): number {
  const rt = state.miniBossPassiveRuntime;
  if (!rt || rt.damageReductionTimer <= 0) return 1;
  return rt.damageReductionMult;
}

export function getMiniBossOutgoingDamageMult(state: GameState): number {
  const rt = state.miniBossPassiveRuntime;
  if (rt && rt.apexPredatorTimer > 0) return 1.5;
  return 1;
}

export function isVoidWalkerActive(state: GameState): boolean {
  const rt = state.miniBossPassiveRuntime;
  return (rt?.voidWalkerTimer ?? 0) > 0;
}

export function rollLegendaryMiniBossPassive(rng = Math.random()): string | null {
  if (rng >= LEGENDARY_PASSIVE_CHANCE) return null;
  return rng < 0.5 ? 'mb_apex_predator' : 'mb_temporal_anchor';
}
