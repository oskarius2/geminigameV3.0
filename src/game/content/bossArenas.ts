import { EnemyType, GameState, Obstacle } from '../types';
import { Vector2 } from '../utils/vector';
import { BOSS_DEFINITIONS, BossDefinition } from './bosses';

/** Seconds of hyperspace warp before the arena loads. */
export const BOSS_WARP_DURATION = 3.5;

/** When remaining transition time drops below this, swap to the arena map. */
export const BOSS_WARP_SWAP_AT = BOSS_WARP_DURATION * 0.45;

export interface MainWorldSnapshot {
  world: { width: number; height: number };
  obstacles: Obstacle[];
  playerPos: Vector2;
  camera: Vector2;
}

const ARENA_BASE_MULT = 9;

export function getBossArenaWorldSize(
  viewWidth: number,
  viewHeight: number,
  bossId: string
): { width: number; height: number } {
  const base = Math.min(viewWidth, viewHeight);
  const shape: Record<string, { w: number; h: number }> = {
    salvage_hauler: { w: 1.75, h: 1.05 },
    hive_regent: { w: 1.15, h: 1.15 },
    void_cardinal: { w: 0.85, h: 1.55 },
    crimson_tyrant: { w: 1.35, h: 1.35 },
  };
  const s = shape[bossId] ?? shape.salvage_hauler;
  return {
    width: base * ARENA_BASE_MULT * s.w,
    height: base * ARENA_BASE_MULT * s.h,
  };
}

function obs(
  id: string,
  type: 'RECT' | 'CIRCLE',
  x: number,
  y: number,
  w: number,
  h: number,
  rotation: number,
  color: string
): Obstacle {
  return {
    id: `boss_${id}`,
    type,
    pos: new Vector2(x, y),
    size: new Vector2(w, h),
    rotation,
    color,
  };
}

function layoutSalvageHauler(w: number, h: number): Obstacle[] {
  const cx = w / 2;
  const cy = h / 2;
  const o: Obstacle[] = [];
  o.push(
    obs('hull_a', 'RECT', cx - w * 0.32, cy, w * 0.22, h * 0.55, -0.15, 'rgba(51, 65, 85, 0.92)'),
    obs('hull_b', 'RECT', cx + w * 0.28, cy - h * 0.08, w * 0.2, h * 0.48, 0.2, 'rgba(71, 85, 105, 0.9)'),
    obs('hull_c', 'RECT', cx, cy + h * 0.28, w * 0.55, h * 0.12, 0, 'rgba(30, 41, 59, 0.95)')
  );
  for (let i = 0; i < 14; i++) {
    const t = i / 14;
    o.push(
      obs(
        `debris_${i}`,
        Math.random() > 0.45 ? 'CIRCLE' : 'RECT',
        w * 0.08 + t * w * 0.84,
        h * 0.12 + (i % 5) * (h * 0.14),
        35 + (i % 4) * 18,
        35 + (i % 3) * 12,
        Math.random() * Math.PI,
        'rgba(100, 116, 139, 0.75)'
      )
    );
  }
  o.push(
    obs('crane', 'RECT', cx - w * 0.08, cy - h * 0.35, 40, h * 0.35, 0.05, 'rgba(251, 191, 36, 0.25)')
  );
  return o;
}

function layoutHiveRegent(w: number, h: number): Obstacle[] {
  const cx = w / 2;
  const cy = h / 2;
  const o: Obstacle[] = [];
  const rings = [
    { r: 0.22, count: 10, size: 42 },
    { r: 0.38, count: 16, size: 52 },
    { r: 0.52, count: 12, size: 38 },
  ];
  rings.forEach((ring, ri) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + ri * 0.2;
      if (i % 4 === 0) continue;
      const x = cx + Math.cos(angle) * w * ring.r;
      const y = cy + Math.sin(angle) * h * ring.r;
      o.push(
        obs(
          `hive_${ri}_${i}`,
          'CIRCLE',
          x,
          y,
          ring.size,
          0,
          0,
          'rgba(34, 197, 94, 0.35)'
        )
      );
    }
  });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    o.push(
      obs(
        `spore_${i}`,
        'CIRCLE',
        cx + Math.cos(angle) * w * 0.12,
        cy + Math.sin(angle) * h * 0.12,
        28,
        0,
        0,
        'rgba(74, 222, 128, 0.5)'
      )
    );
  }
  return o;
}

function layoutVoidCardinal(w: number, h: number): Obstacle[] {
  const cx = w / 2;
  const cy = h / 2;
  const o: Obstacle[] = [];
  const wallW = w * 0.14;
  o.push(
    obs('wall_l', 'RECT', w * 0.12, cy, wallW, h * 0.85, 0, 'rgba(88, 28, 135, 0.88)'),
    obs('wall_r', 'RECT', w * 0.88, cy, wallW, h * 0.85, 0, 'rgba(88, 28, 135, 0.88)'),
    obs('bend_top', 'RECT', cx, h * 0.18, w * 0.5, h * 0.1, 0.35, 'rgba(109, 40, 217, 0.75)'),
    obs('bend_bot', 'RECT', cx, h * 0.82, w * 0.5, h * 0.1, -0.35, 'rgba(109, 40, 217, 0.75)')
  );
  for (let i = 0; i < 8; i++) {
    const y = h * 0.25 + (i / 7) * h * 0.5;
    const side = i % 2 === 0 ? w * 0.28 : w * 0.72;
    o.push(
      obs(`rift_${i}`, 'CIRCLE', side, y, 55 + (i % 3) * 15, 0, 0, 'rgba(167, 139, 250, 0.4)')
    );
  }
  o.push(
    obs('core', 'CIRCLE', cx, cy, 90, 0, 0, 'rgba(139, 92, 246, 0.2)')
  );
  return o;
}

function layoutCrimsonTyrant(w: number, h: number): Obstacle[] {
  const cx = w / 2;
  const cy = h / 2;
  const o: Obstacle[] = [];
  const corners = [
    [0.18, 0.18],
    [0.82, 0.18],
    [0.18, 0.82],
    [0.82, 0.82],
  ];
  corners.forEach(([px, py], i) => {
    o.push(
      obs(
        `pillar_${i}`,
        'RECT',
        w * px,
        h * py,
        w * 0.14,
        h * 0.14,
        Math.PI / 4,
        'rgba(127, 29, 29, 0.92)'
      )
    );
  });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    o.push(
      obs(
        `ring_${i}`,
        'RECT',
        cx + Math.cos(angle) * w * 0.28,
        cy + Math.sin(angle) * h * 0.28,
        70,
        35,
        angle,
        'rgba(185, 28, 28, 0.55)'
      )
    );
  }
  o.push(
    obs('brand', 'CIRCLE', cx, cy, 120, 0, 0, 'rgba(239, 68, 68, 0.12)')
  );
  return o;
}

const LAYOUT_BUILDERS: Record<string, (w: number, h: number) => Obstacle[]> = {
  salvage_hauler: layoutSalvageHauler,
  hive_regent: layoutHiveRegent,
  void_cardinal: layoutVoidCardinal,
  crimson_tyrant: layoutCrimsonTyrant,
};

export function buildBossArenaLayout(bossId: string, width: number, height: number): Obstacle[] {
  const build = LAYOUT_BUILDERS[bossId] ?? layoutSalvageHauler;
  return build(width, height);
}

export function pickRandomBoss(stage: number = 1, excludeId?: string | null): BossDefinition {
  let pool = [...BOSS_DEFINITIONS];
  if (excludeId) {
    const filtered = pool.filter((b) => b.id !== excludeId);
    if (filtered.length > 0) pool = filtered;
  }
  const weights = pool.map((_, i) => 1.2 + stage * 0.15 + i * 0.35);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function beginBossWarp(state: GameState, boss: BossDefinition): void {
  state.activeBossId = boss.id;
  state.bossArenaTransition = BOSS_WARP_DURATION;
  state.bossArenaSwapped = false;
  state.enemies = state.enemies.filter((e) => e.enemyType !== EnemyType.BOSS);
  state.projectiles = [];
  state.player.velocity = new Vector2(0, 0);
  state.screenshake = 10;
  state.screenFlash = 8;
}

export function applyBossArenaWarp(
  state: GameState,
  viewWidth: number,
  viewHeight: number
): void {
  const bossId = state.activeBossId;
  if (!bossId || state.bossArenaSwapped) return;

  const { width, height } = getBossArenaWorldSize(viewWidth, viewHeight, bossId);

  state.mainWorldSnapshot = {
    world: { ...state.world },
    obstacles: state.obstacles.filter((o) => !o.id.startsWith('boss_')),
    playerPos: state.player.pos.clone(),
    camera: state.camera.clone(),
  };

  state.world = { width, height };
  state.obstacles = buildBossArenaLayout(bossId, width, height);
  state.player.pos = new Vector2(width / 2, height / 2);
  state.player.velocity = new Vector2(0, 0);
  state.camera.x = width / 2 - viewWidth / 2;
  state.camera.y = height / 2 - viewHeight / 2;
  state.enemies = [];
  state.projectiles = [];
  state.items = [];
  state.hazards = [];
  state.inBossArena = true;
  state.bossArenaSwapped = true;
  state.bossActive = true;
}

export function restoreMainWorldAfterBoss(
  state: GameState,
  viewWidth: number,
  viewHeight: number
): void {
  const snap = state.mainWorldSnapshot;
  if (!snap) {
    state.inBossArena = false;
    return;
  }

  state.world = { ...snap.world };
  state.obstacles = snap.obstacles;
  state.player.pos = snap.playerPos.clone();
  state.camera = snap.camera.clone();
  state.mainWorldSnapshot = null;
  state.inBossArena = false;
  state.bossArenaSwapped = false;
  state.activeBossId = null;

  state.camera.x = Math.max(
    0,
    Math.min(state.world.width - viewWidth, state.player.pos.x - viewWidth / 2)
  );
  state.camera.y = Math.max(
    0,
    Math.min(state.world.height - viewHeight, state.player.pos.y - viewHeight / 2)
  );
}

/** 0 at start of warp, 1 when arena is live. */
export function getBossWarpProgress(state: GameState): number {
  if (state.bossArenaTransition <= 0) return state.inBossArena ? 1 : 0;
  return 1 - state.bossArenaTransition / BOSS_WARP_DURATION;
}
