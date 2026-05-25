import { EntityType, EnemyType, GameState } from '../types';
import { Vector2 } from '../utils/vector';
import { clampLateral, sampleRailAt, worldFromRail } from './geometry';
import { beginBossEntrance } from './bossEntranceAnimations';
import { beginRailsBossDeath } from './bossDeathAnimations';
import { updateRailsWeakPointGlow } from './bossWeakPointGlow';

export { railsWeakPointDamageMult as railsBossDamageMult } from './bossWeakPointGlow';
import type { RailsRunState } from './types';

export type RailsBossId = 'sentinel_core' | 'iron_titan' | 'void_phantom';

export interface RailsBossDef {
  id: RailsBossId;
  name: string;
  health: number;
  colors: [string, string];
  /** Half screen width fraction for boss radius. */
  sizeScreenFrac: number;
  weakPointDamageMult: number;
  /** Player touch damage (normal / weak point collision). */
  touchDamage: number;
  touchDamageWeak: number;
}

export const RAILS_BOSS_DEFS: Record<RailsBossId, RailsBossDef> = {
  sentinel_core: {
    id: 'sentinel_core',
    name: 'Sentinel Core',
    health: 300,
    colors: ['#22d3ee', '#a855f7'],
    sizeScreenFrac: 0.22,
    weakPointDamageMult: 2.67,
    touchDamage: 50,
    touchDamageWeak: 150,
  },
  iron_titan: {
    id: 'iron_titan',
    name: 'Iron Titan',
    health: 400,
    colors: ['#ea580c', '#78716c'],
    sizeScreenFrac: 0.28,
    weakPointDamageMult: 3.33,
    touchDamage: 50,
    touchDamageWeak: 150,
  },
  void_phantom: {
    id: 'void_phantom',
    name: 'Void Phantom',
    health: 350,
    colors: ['#c084fc', '#f8fafc'],
    sizeScreenFrac: 0.24,
    weakPointDamageMult: 3,
    touchDamage: 50,
    touchDamageWeak: 150,
  },
};

const LEVEL_BOSS: Record<string, RailsBossId> = {
  tunnel_01: 'sentinel_core',
  asteroid_belt: 'iron_titan',
  void_run: 'void_phantom',
};

export function getRailsBossForLevel(levelId: string): RailsBossId | null {
  return LEVEL_BOSS[levelId] ?? null;
}

export function getBossPhase(health: number, maxHealth: number): 1 | 2 | 3 {
  const ratio = health / maxHealth;
  if (ratio > 0.66) return 1;
  if (ratio > 0.33) return 2;
  return 3;
}

export function getBossAttackRateMult(phase: 1 | 2 | 3): number {
  if (phase === 1) return 1;
  if (phase === 2) return 1.5;
  return 2.2;
}

export function spawnRailsBoss(state: GameState, bossId: RailsBossId): void {
  const rails = state.rails!;
  const def = RAILS_BOSS_DEFS[bossId];
  const spawnDist = rails.distance + 900;
  const sample = sampleRailAt(
    rails.centerline,
    rails.cumulativeLengths,
    spawnDist
  );
  const pos = worldFromRail(sample, 0);
  const radius = rails.corridorHalfWidth * 1.6;

  state.enemies = state.enemies.filter((e) => e.enemyType !== EnemyType.BOSS);

  state.enemies.push({
    id: `rails_boss_${bossId}`,
    type: EntityType.ENEMY,
    active: true,
    pos: new Vector2(pos.x, pos.y),
    radius,
    health: def.health,
    maxHealth: def.health,
    speed: 0,
    velocity: new Vector2(0, 0),
    color: def.colors[0],
    enemyType: EnemyType.BOSS,
    railsBossId: bossId,
    railsDistance: spawnDist,
    railsLateral: 0,
    railsLateralTarget: 0,
    railsWeakPointOpen: false,
    aiTimer: 0,
    aiState: 'strafe',
    behaviorSeed: Math.random() * 100,
  });

  rails.bossSpawned = true;
  rails.weakPointOpen = false;
  rails.weakPointPhase = 0;
  rails.weakPointWasOpen = false;
  beginBossEntrance(rails, bossId);
  state.bossActive = true;
  state.activeBossId = bossId;
}

function bossSpreadShot(
  state: GameState,
  enemy: GameState['enemies'][0],
  player: GameState['player'],
  count: number,
  speed: number,
  spread: number,
  damage: number
): void {
  const base = Math.atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : (i / (count - 1) - 0.5) * spread;
    const angle = base + t;
    state.projectiles.push({
      id: `boss_${Math.random().toString(36).slice(2)}`,
      type: EntityType.PROJECTILE,
      active: true,
      pos: enemy.pos.clone(),
      radius: 8,
      health: 1,
      maxHealth: 1,
      speed,
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      color: enemy.color,
      ownerId: enemy.id,
      damage,
    });
  }
}

function ironTitanDebris(state: GameState, enemy: GameState['enemies'][0]): void {
  const rails = state.rails!;
  const lateral = (Math.random() * 2 - 1) * rails.corridorHalfWidth * 0.9;
  const dist = rails.distance + 600 + Math.random() * 400;
  const sample = sampleRailAt(rails.centerline, rails.cumulativeLengths, dist);
  const pos = worldFromRail(sample, lateral);
  state.projectiles.push({
    id: `debris_${Math.random().toString(36).slice(2)}`,
    type: EntityType.PROJECTILE,
    active: true,
    pos: new Vector2(pos.x, pos.y - 200),
    radius: 14,
    health: 1,
    maxHealth: 1,
    speed: 6,
    velocity: new Vector2(0, 10),
    color: '#a8a29e',
    ownerId: enemy.id,
    damage: 20,
  });
}

export function updateRailsBosses(state: GameState, dtSec: number): void {
  const rails = state.rails;
  if (!rails?.bossSpawned) return;

  for (const enemy of state.enemies) {
    if (enemy.enemyType !== EnemyType.BOSS || !enemy.railsBossId) continue;
    if (enemy.health <= 0 && !rails.bossDeath) {
      beginRailsBossDeath(state, enemy);
      return;
    }
  }

  if (rails.bossDeath) return;
  if (!rails.bossCombatActive) return;

  const player = state.player;
  const scroll = rails.scrollSpeed;

  for (const enemy of state.enemies) {
    if (enemy.enemyType !== EnemyType.BOSS || !enemy.railsBossId) continue;

    updateRailsWeakPointGlow(rails, enemy, dtSec, state.survivalTime);

    const def = RAILS_BOSS_DEFS[enemy.railsBossId as RailsBossId];
    const phase = getBossPhase(enemy.health, enemy.maxHealth);
    const rateMult = getBossAttackRateMult(phase);

    if (enemy.railsDistance === undefined) {
      enemy.railsDistance = rails.distance + 800;
    }

    enemy.railsDistance += -scroll * dtSec * (phase === 3 ? 0.35 : 0.15);

    const sweep =
      def.id === 'sentinel_core'
        ? Math.sin(state.survivalTime * 0.6) * rails.corridorHalfWidth * 0.35
        : def.id === 'iron_titan'
          ? Math.sin(state.survivalTime * 0.4) * rails.corridorHalfWidth * 0.5
          : (Math.random() - 0.5) * rails.corridorHalfWidth * 0.8;

    if (def.id === 'void_phantom' && phase >= 2 && Math.random() < dtSec * (phase === 3 ? 2.5 : 1.2)) {
      enemy.railsLateralTarget = sweep;
    } else {
      enemy.railsLateralTarget = sweep;
    }

    enemy.railsLateral = clampLateral(
      enemy.railsLateral! + (enemy.railsLateralTarget - enemy.railsLateral!) * dtSec * 2,
      rails.corridorHalfWidth * 0.85
    );

    syncBossWorld(state, enemy);

    enemy.aiTimer = (enemy.aiTimer ?? 0) - dtSec;
    if (enemy.aiTimer > 0) continue;

    const baseCd = def.id === 'void_phantom' ? 0.85 : 1.1;
    enemy.aiTimer = baseCd / rateMult;

    if (def.id === 'sentinel_core') {
      bossSpreadShot(state, enemy, player, 3, 9, 0.55, 20);
      if (phase >= 2) bossSpreadShot(state, enemy, player, 3, 10, 0.35, 20);
    } else if (def.id === 'iron_titan') {
      bossSpreadShot(state, enemy, player, phase >= 2 ? 2 : 1, 11, 0.08, 25);
      if (Math.random() < 0.45) ironTitanDebris(state, enemy);
      if (phase >= 3 && Math.random() < 0.5) ironTitanDebris(state, enemy);
    } else {
      const homing = {
        id: `vp_${Math.random().toString(36).slice(2)}`,
        type: EntityType.PROJECTILE,
        active: true,
        pos: enemy.pos.clone(),
        radius: 7,
        health: 1,
        maxHealth: 1,
        speed: 7,
        velocity: new Vector2(0, 0),
        color: '#e9d5ff',
        ownerId: enemy.id,
        damage: 18,
        homing: true,
      };
      const dx = player.pos.x - enemy.pos.x;
      const dy = player.pos.y - enemy.pos.y;
      const len = Math.hypot(dx, dy) || 1;
      homing.velocity = new Vector2((dx / len) * 7, (dy / len) * 7);
      state.projectiles.push(homing);
      if (phase >= 2) bossSpreadShot(state, enemy, player, 2, 8, 0.4, 18);
    }
  }
}

function syncBossWorld(state: GameState, enemy: GameState['enemies'][0]): void {
  const rails = state.rails!;
  const dist = enemy.railsDistance ?? rails.distance;
  const sample = sampleRailAt(rails.centerline, rails.cumulativeLengths, dist);
  const pos = worldFromRail(sample, enemy.railsLateral ?? 0);
  enemy.pos.x = pos.x;
  enemy.pos.y = pos.y;
}

export function railsBossTouchDamage(enemy: GameState['enemies'][0]): number {
  if (enemy.enemyType !== EnemyType.BOSS || !enemy.railsBossId) return 0;
  const def = RAILS_BOSS_DEFS[enemy.railsBossId as RailsBossId];
  return enemy.railsWeakPointOpen ? def.touchDamageWeak : def.touchDamage;
}

export function checkRailsBossDefeated(state: GameState): boolean {
  const rails = state.rails;
  if (!rails?.bossSpawned) return false;
  if (rails.bossDeath && !rails.bossDeath.finished) return false;
  if (rails.bossDefeated) return true;
  const bossAlive = state.enemies.some(
    (e) => e.enemyType === EnemyType.BOSS && e.health > 0
  );
  if (!bossAlive && !rails.bossDeath) {
    const boss = state.enemies.find((e) => e.enemyType === EnemyType.BOSS);
    if (boss) beginRailsBossDeath(state, boss);
    return false;
  }
  return rails.bossDefeated;
}
