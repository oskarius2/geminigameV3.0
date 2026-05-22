import { EntityType, GameState } from '../types';
import { Vector2 } from '../utils/vector';
import { clampLateral, sampleRailAt, worldFromRail } from './geometry';
import { spawnPowerupCollectParticles } from './powerupVisuals';
import type { RailsRunState } from './types';

export type RailsPowerupKind =
  | 'SHIELD_BUBBLE'
  | 'RAPID_FIRE'
  | 'SLOW_TIME'
  | 'HEALTH_RESTORE'
  | 'SCORE_MULTIPLIER'
  | 'INVINCIBILITY'
  | 'MEGA_BLAST';

export interface RailsPowerupDef {
  kind: RailsPowerupKind;
  color: string;
  label: string;
  /** Duration in seconds; 0 = instant / single use. */
  durationSec: number;
  icon: 'shield' | 'gun' | 'clock' | 'heart' | 'star' | 'bolt' | 'bomb';
}

export const RAILS_POWERUP_DEFS: Record<RailsPowerupKind, RailsPowerupDef> = {
  SHIELD_BUBBLE: {
    kind: 'SHIELD_BUBBLE',
    color: '#00FFFF',
    label: 'Shield',
    durationSec: 0,
    icon: 'shield',
  },
  RAPID_FIRE: {
    kind: 'RAPID_FIRE',
    color: '#FF6347',
    label: 'Rapid',
    durationSec: 8,
    icon: 'gun',
  },
  SLOW_TIME: {
    kind: 'SLOW_TIME',
    color: '#6A0DAD',
    label: 'Slow',
    durationSec: 4,
    icon: 'clock',
  },
  HEALTH_RESTORE: {
    kind: 'HEALTH_RESTORE',
    color: '#32CD32',
    label: '+HP',
    durationSec: 0,
    icon: 'heart',
  },
  SCORE_MULTIPLIER: {
    kind: 'SCORE_MULTIPLIER',
    color: '#FFD700',
    label: '2x',
    durationSec: 10,
    icon: 'star',
  },
  INVINCIBILITY: {
    kind: 'INVINCIBILITY',
    color: '#FF69B4',
    label: 'Invuln',
    durationSec: 3,
    icon: 'bolt',
  },
  MEGA_BLAST: {
    kind: 'MEGA_BLAST',
    color: '#FF4500',
    label: 'Blast',
    durationSec: 0,
    icon: 'bomb',
  },
};

export const RAILS_POWERUP_KINDS = Object.keys(RAILS_POWERUP_DEFS) as RailsPowerupKind[];

/** Weighted drop on enemy kill (spec percentages). */
const POWERUP_KILL_WEIGHTS: { kind: RailsPowerupKind; weight: number }[] = [
  { kind: 'SHIELD_BUBBLE', weight: 20 },
  { kind: 'RAPID_FIRE', weight: 15 },
  { kind: 'HEALTH_RESTORE', weight: 15 },
  { kind: 'SLOW_TIME', weight: 10 },
  { kind: 'SCORE_MULTIPLIER', weight: 12 },
  { kind: 'INVINCIBILITY', weight: 8 },
  { kind: 'MEGA_BLAST', weight: 5 },
];

export function pickWeightedRailsPowerupOnKill(): RailsPowerupKind | null {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const entry of POWERUP_KILL_WEIGHTS) {
    acc += entry.weight;
    if (roll < acc) return entry.kind;
  }
  return null;
}

export function pickRandomRailsPowerup(): RailsPowerupKind {
  return (
    pickWeightedRailsPowerupOnKill() ??
    RAILS_POWERUP_KINDS[Math.floor(Math.random() * RAILS_POWERUP_KINDS.length)]
  );
}

/** Apply collected powerup to run state. */
export function applyRailsPowerup(
  rails: RailsRunState,
  kind: RailsPowerupKind,
  player: GameState['player'],
  nowSec: number
): void {
  switch (kind) {
    case 'SHIELD_BUBBLE':
      rails.shieldBubbleHits = 1;
      break;
    case 'RAPID_FIRE':
      rails.rapidFireUntil = Math.max(rails.rapidFireUntil, nowSec + 8);
      break;
    case 'SLOW_TIME':
      rails.slowTimeUntil = Math.max(rails.slowTimeUntil, nowSec + 4);
      rails.enemySlowMult = 0.5;
      break;
    case 'HEALTH_RESTORE':
      player.health = Math.min(100, player.maxHealth, player.health + 50);
      break;
    case 'SCORE_MULTIPLIER':
      rails.scoreMultUntil = Math.max(rails.scoreMultUntil, nowSec + 10);
      break;
    case 'INVINCIBILITY':
      rails.invincibleUntil = Math.max(rails.invincibleUntil, nowSec + 3);
      break;
    case 'MEGA_BLAST':
      rails.megaBlastCharges += 1;
      break;
  }
}

export function syncRailsPowerupTimers(rails: RailsRunState, nowSec: number): void {
  if (rails.slowTimeUntil <= nowSec) {
    rails.enemySlowMult = 1;
  }
}

export function railsFireIntervalMult(rails: RailsRunState, nowSec: number): number {
  if (rails.rapidFireUntil > nowSec) return 1 / 3;
  return 1;
}

export function railsScoreMult(rails: RailsRunState, nowSec: number): number {
  return rails.scoreMultUntil > nowSec ? 2 : 1;
}

export function isRailsInvincible(rails: RailsRunState, nowSec: number): boolean {
  return rails.invincibleUntil > nowSec;
}

export function consumeRailsShield(rails: RailsRunState): boolean {
  if (rails.shieldBubbleHits > 0) {
    rails.shieldBubbleHits -= 1;
    return true;
  }
  return false;
}

export function consumeRailsMegaBlast(rails: RailsRunState): boolean {
  if (rails.megaBlastCharges > 0) {
    rails.megaBlastCharges -= 1;
    return true;
  }
  return false;
}

export function spawnRailsPowerupPickup(
  state: GameState,
  spawnDistance: number,
  lateralNorm: number,
  kind?: RailsPowerupKind
): void {
  const rails = state.rails!;
  const def = RAILS_POWERUP_DEFS[kind ?? pickRandomRailsPowerup()];
  const lateral = clampLateral(
    lateralNorm * rails.corridorHalfWidth,
    rails.corridorHalfWidth
  );
  const sample = sampleRailAt(
    rails.centerline,
    rails.cumulativeLengths,
    spawnDistance
  );
  const pos = worldFromRail(sample, lateral);

  state.items.push({
    id: `rails_pu_${Math.random().toString(36).slice(2)}`,
    type: EntityType.ITEM,
    pos: new Vector2(pos.x, pos.y - 120),
    radius: 18,
    health: 1,
    maxHealth: 1,
    speed: 0,
    velocity: new Vector2(0, 40),
    color: def.color,
    railsPowerup: def.kind,
    railsPickupAnim: 0,
  });
}

/** Weighted roll after enemy kill (max 85% cumulative per spec). */
export function trySpawnPowerupOnKill(state: GameState): void {
  if (!state.rails || state.rails.outcome !== 'active') return;
  const kind = pickWeightedRailsPowerupOnKill();
  if (!kind) return;
  const rails = state.rails;
  const lateralNorm = Math.random() * 2 - 1;
  const dist = rails.distance + 400 + Math.random() * 200;
  spawnRailsPowerupPickup(state, dist, lateralNorm, kind);
}

export function updateRailsPowerupPickups(state: GameState, dtSec: number): void {
  const rails = state.rails;
  if (!rails) return;

  const scroll = rails.scrollSpeed;
  for (const item of state.items) {
    if (!item.railsPowerup) continue;
    item.railsPickupAnim = Math.min(1, (item.railsPickupAnim ?? 0) + dtSec * 2.5);
    const spin = item.railsPickupAnim * Math.PI * 4;
    const shrink = 1 - item.railsPickupAnim * 0.15;
    item.pos.y += (40 - scroll * 0.15) * dtSec;
    item.pos.x += Math.sin(spin) * 8 * dtSec;
    item.radius = 18 * shrink;
  }
}

export function collectRailsPowerupPickups(
  state: GameState,
  nowSec: number,
  hudTargetX = 48,
  hudTargetY = 48
): void {
  const rails = state.rails;
  if (!rails) return;
  const player = state.player;

  state.items = state.items.filter((item) => {
    if (!item.railsPowerup) return true;
    const dist = player.pos.distanceTo(item.pos);
    if (dist > player.radius + item.radius + 8) return true;
    const kind = item.railsPowerup as RailsPowerupKind;
    applyRailsPowerup(rails, kind, player, nowSec);
    spawnPowerupCollectParticles(state, kind, item.pos, hudTargetX, hudTargetY);
    return false;
  });
}
