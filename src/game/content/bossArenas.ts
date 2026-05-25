import { EnemyType, GameState, Obstacle } from '../types';
import { Vector2 } from '../utils/vector';
import { pickBossForSurvivalStage } from '../bosses/bossSpecs';
import { BOSS_DEFINITIONS, BossDefinition } from './bosses';

/** Seconds of hyperspace warp before the arena loads. */
export const BOSS_WARP_DURATION = 3.5;

/** When remaining transition time drops below this, swap to the arena map. */
export const BOSS_WARP_SWAP_AT = BOSS_WARP_DURATION * 0.45;

/** Max circle radius / rect edge as fraction of min(world w, h). */
export const ARENA_OBSTACLE_MAX_FRAC = 0.12;

/** Obstacle fill alpha cap (prevents solid-color wash on screen). */
export const ARENA_OBSTACLE_MAX_ALPHA = 0.55;

export interface MainWorldSnapshot {
  world: { width: number; height: number };
  obstacles: Obstacle[];
  playerPos: Vector2;
  camera: Vector2;
}

// Smaller arena = intimate "enclosed" fight (was 9 → now 5.5 ≈ 60% of old size).
const ARENA_BASE_MULT = 5.5;

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
    colossus: { w: 1.55, h: 1.25 },
    hive_queen: { w: 1.2, h: 1.2 },
    wraith_lord: { w: 0.9, h: 1.5 },
  };
  const s = shape[bossId] ?? shape.salvage_hauler;
  return {
    width: base * ARENA_BASE_MULT * s.w,
    height: base * ARENA_BASE_MULT * s.h,
  };
}

interface ArenaMetrics {
  w: number;
  h: number;
  s: number;
  cx: number;
  cy: number;
}

function arenaMetrics(w: number, h: number): ArenaMetrics {
  const s = Math.min(w, h);
  return { w, h, s, cx: w / 2, cy: h / 2 };
}

/** Deterministic 0..1 from index (no Math.random in layouts). */
function hash01(i: number, salt = 0): number {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function clampColorAlpha(color: string, maxAlpha: number): string {
  const match = color.match(/rgba?\(\s*([^)]+)\s*\)/);
  if (!match) return color;
  const parts = match[1].split(',').map((p) => p.trim());
  if (parts.length !== 4) return color;
  const a = Math.min(maxAlpha, Math.max(0, parseFloat(parts[3]) || maxAlpha));
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${a})`;
}

function obs(
  id: string,
  type: 'RECT' | 'CIRCLE',
  x: number,
  y: number,
  sizeW: number,
  sizeH: number,
  rotation: number,
  color: string
): Obstacle {
  return {
    id: `boss_${id}`,
    type,
    pos: new Vector2(x, y),
    size: new Vector2(sizeW, sizeH),
    rotation,
    color: clampColorAlpha(color, ARENA_OBSTACLE_MAX_ALPHA),
  };
}

function circle(m: ArenaMetrics, id: string, x: number, y: number, rFrac: number, color: string): Obstacle {
  const r = Math.min(m.s * rFrac, m.s * ARENA_OBSTACLE_MAX_FRAC);
  return obs(id, 'CIRCLE', x, y, r, 0, 0, color);
}

function rect(
  m: ArenaMetrics,
  id: string,
  x: number,
  y: number,
  wFrac: number,
  hFrac: number,
  rotation: number,
  color: string
): Obstacle {
  const rw = Math.min(m.s * wFrac, m.s * ARENA_OBSTACLE_MAX_FRAC);
  const rh = Math.min(m.s * hFrac, m.s * ARENA_OBSTACLE_MAX_FRAC);
  return obs(id, 'RECT', x, y, rw, rh, rotation, color);
}

/** Per-boss arena color palettes for obstacle tinting + renderer background. */
export const BOSS_ARENA_COLORS: Record<string, {
  wallColor: string;
  accentColor: string;
  bgGradient: [string, string];
}> = {
  salvage_hauler: {
    wallColor: 'rgba(51, 65, 85, 0.55)',
    accentColor: 'rgba(251, 191, 36, 0.3)',
    bgGradient: ['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.85)'],
  },
  hive_regent: {
    wallColor: 'rgba(22, 101, 52, 0.55)',
    accentColor: 'rgba(74, 222, 128, 0.4)',
    bgGradient: ['rgba(5, 46, 22, 0.95)', 'rgba(20, 83, 45, 0.85)'],
  },
  void_cardinal: {
    wallColor: 'rgba(88, 28, 135, 0.6)',
    accentColor: 'rgba(167, 139, 250, 0.4)',
    bgGradient: ['rgba(30, 10, 60, 0.95)', 'rgba(76, 29, 149, 0.85)'],
  },
  crimson_tyrant: {
    wallColor: 'rgba(127, 29, 29, 0.6)',
    accentColor: 'rgba(239, 68, 68, 0.35)',
    bgGradient: ['rgba(50, 10, 10, 0.95)', 'rgba(127, 29, 29, 0.85)'],
  },
  colossus: {
    wallColor: 'rgba(30, 41, 59, 0.7)',
    accentColor: 'rgba(148, 163, 184, 0.3)',
    bgGradient: ['rgba(15, 23, 42, 0.95)', 'rgba(51, 65, 85, 0.9)'],
  },
  hive_queen: {
    wallColor: 'rgba(22, 101, 52, 0.55)',
    accentColor: 'rgba(250, 204, 21, 0.35)',
    bgGradient: ['rgba(5, 46, 22, 0.95)', 'rgba(101, 63, 9, 0.85)'],
  },
  wraith_lord: {
    wallColor: 'rgba(30, 27, 75, 0.65)',
    accentColor: 'rgba(129, 140, 248, 0.35)',
    bgGradient: ['rgba(15, 10, 50, 0.95)', 'rgba(49, 46, 129, 0.85)'],
  },
};

/** Shared boundary walls — encloses the arena on all 4 sides.
 *  Wall IDs start with `boss_bw_` so the audit can skip the max-size check. */
function addArenaBoundaryWalls(m: ArenaMetrics, o: Obstacle[], bossId: string): void {
  const colors = BOSS_ARENA_COLORS[bossId] ?? BOSS_ARENA_COLORS.salvage_hauler;
  const wallW = m.s * 0.035;
  // Boundary walls use `obs()` directly with `bw_` prefix (exempt from obstacle cap).
  o.push(obs('bw_top', 'RECT', m.cx, wallW / 2, m.w, wallW, 0, colors.wallColor));
  o.push(obs('bw_bot', 'RECT', m.cx, m.h - wallW / 2, m.w, wallW, 0, colors.wallColor));
  o.push(obs('bw_left', 'RECT', wallW / 2, m.cy, wallW, m.h, 0, colors.wallColor));
  o.push(obs('bw_right', 'RECT', m.w - wallW / 2, m.cy, wallW, m.h, 0, colors.wallColor));

  // Corner energy nodes for "sealed" feel
  const inset = m.s * 0.06;
  const nodeR = m.s * 0.018;
  const corners: [number, number][] = [
    [inset, inset], [m.w - inset, inset],
    [inset, m.h - inset], [m.w - inset, m.h - inset],
  ];
  corners.forEach(([x, y], i) => {
    o.push(circle(m, `corner_${i}`, x, y, nodeR / m.s, colors.accentColor));
  });
}

function layoutSalvageHauler(w: number, h: number): Obstacle[] {
  const m = arenaMetrics(w, h);
  const o: Obstacle[] = [];
  o.push(
    rect(m, 'hull_a', m.cx - m.w * 0.28, m.cy - m.h * 0.08, 0.18, 0.38, -0.15, 'rgba(51, 65, 85, 0.5)'),
    rect(m, 'hull_b', m.cx + m.w * 0.26, m.cy - m.h * 0.12, 0.16, 0.32, 0.2, 'rgba(71, 85, 105, 0.48)'),
    rect(m, 'hull_c', m.cx, m.cy + m.h * 0.28, 0.38, 0.07, 0, 'rgba(30, 41, 59, 0.5)')
  );
  for (let i = 0; i < 14; i++) {
    const t = i / 14;
    const isCircle = hash01(i) > 0.45;
    const size = 0.02 + hash01(i, 1) * 0.035;
    const px = m.w * 0.1 + t * m.w * 0.8;
    const py = m.h * 0.14 + (i % 5) * (m.h * 0.12);
    if (isCircle) {
      o.push(circle(m, `debris_${i}`, px, py, size, 'rgba(100, 116, 139, 0.75)'));
    } else {
      o.push(
        rect(m, `debris_${i}`, px, py, size, size * 0.7, hash01(i, 2) * Math.PI, 'rgba(100, 116, 139, 0.75)')
      );
    }
  }
  o.push(rect(m, 'crane', m.cx - m.w * 0.06, m.cy - m.h * 0.32, 0.04, 0.14, 0.05, 'rgba(251, 191, 36, 0.25)'));
  addArenaBoundaryWalls(m, o, 'salvage_hauler');
  return o;
}

function layoutHiveRegent(w: number, h: number): Obstacle[] {
  const m = arenaMetrics(w, h);
  const o: Obstacle[] = [];
  const rings = [
    { r: 0.22, count: 10, size: 0.035 },
    { r: 0.38, count: 16, size: 0.042 },
    { r: 0.52, count: 12, size: 0.03 },
  ];
  rings.forEach((ring, ri) => {
    for (let i = 0; i < ring.count; i++) {
      if (i % 4 === 0) continue;
      const angle = (i / ring.count) * Math.PI * 2 + ri * 0.2;
      o.push(
        circle(
          m,
          `hive_${ri}_${i}`,
          m.cx + Math.cos(angle) * m.w * ring.r,
          m.cy + Math.sin(angle) * m.h * ring.r,
          ring.size,
          'rgba(34, 197, 94, 0.35)'
        )
      );
    }
  });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    o.push(
      circle(
        m,
        `spore_${i}`,
        m.cx + Math.cos(angle) * m.s * 0.1,
        m.cy + Math.sin(angle) * m.s * 0.1,
        0.022,
        'rgba(74, 222, 128, 0.35)'
      )
    );
  }
  addArenaBoundaryWalls(m, o, 'hive_regent');
  return o;
}

function layoutVoidCardinal(w: number, h: number): Obstacle[] {
  const m = arenaMetrics(w, h);
  const o: Obstacle[] = [];
  o.push(
    rect(m, 'wall_l', m.w * 0.1, m.cy, 0.08, 0.55, 0, 'rgba(88, 28, 135, 0.45)'),
    rect(m, 'wall_r', m.w * 0.9, m.cy, 0.08, 0.55, 0, 'rgba(88, 28, 135, 0.45)'),
    rect(m, 'bend_top', m.cx, m.h * 0.14, 0.28, 0.05, 0.35, 'rgba(109, 40, 217, 0.75)'),
    rect(m, 'bend_bot', m.cx, m.h * 0.86, 0.28, 0.05, -0.35, 'rgba(109, 40, 217, 0.75)')
  );
  for (let i = 0; i < 6; i++) {
    const y = m.h * 0.28 + (i / 5) * m.h * 0.44;
    const side = i % 2 === 0 ? m.w * 0.22 : m.w * 0.78;
    o.push(circle(m, `rift_${i}`, side, y, 0.028 + (i % 2) * 0.008, 'rgba(167, 139, 250, 0.35)'));
  }
  addArenaBoundaryWalls(m, o, 'void_cardinal');
  return o;
}

function layoutCrimsonTyrant(w: number, h: number): Obstacle[] {
  const m = arenaMetrics(w, h);
  const o: Obstacle[] = [];
  const corners: [number, number][] = [
    [0.2, 0.2],
    [0.8, 0.2],
    [0.2, 0.8],
    [0.8, 0.8],
  ];
  corners.forEach(([px, py], i) => {
    o.push(
      rect(m, `pillar_${i}`, m.w * px, m.h * py, 0.1, 0.1, Math.PI / 4, 'rgba(127, 29, 29, 0.75)')
    );
  });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    o.push(
      rect(
        m,
        `ring_${i}`,
        m.cx + Math.cos(angle) * m.s * 0.22,
        m.cy + Math.sin(angle) * m.s * 0.22,
        0.055,
        0.028,
        angle,
        'rgba(185, 28, 28, 0.45)'
      )
    );
  }
  o.push(circle(m, 'brand', m.cx, m.cy, 0.045, 'rgba(239, 68, 68, 0.1)'));
  addArenaBoundaryWalls(m, o, 'crimson_tyrant');
  return o;
}

function layoutColossus(w: number, h: number): Obstacle[] {
  const m = arenaMetrics(w, h);
  const o: Obstacle[] = [];
  o.push(
    rect(m, 'keel', m.cx, m.h * 0.1, 0.55, 0.06, 0, 'rgba(30, 41, 59, 0.95)'),
    rect(m, 'keel_rim', m.cx, m.h * 0.9, 0.5, 0.05, 0, 'rgba(51, 65, 85, 0.9)'),
    rect(m, 'plate_l', m.w * 0.14, m.cy, 0.1, 0.38, 0.08, 'rgba(71, 85, 105, 0.92)'),
    rect(m, 'plate_r', m.w * 0.86, m.cy, 0.1, 0.38, -0.08, 'rgba(71, 85, 105, 0.92)'),
    rect(m, 'core', m.cx - m.s * 0.14, m.cy - m.s * 0.04, 0.12, 0.22, -0.2, 'rgba(100, 116, 139, 0.88)'),
    rect(m, 'core_b', m.cx + m.s * 0.14, m.cy + m.s * 0.03, 0.11, 0.2, 0.15, 'rgba(100, 116, 139, 0.88)')
  );
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    o.push(
      circle(
        m,
        `rivet_${i}`,
        m.cx + (i % 2 === 0 ? -1 : 1) * m.s * 0.07,
        m.h * 0.22 + t * m.h * 0.38,
        0.024 + (i % 3) * 0.006,
        'rgba(148, 163, 184, 0.55)'
      )
    );
  }
  for (let i = 0; i < 4; i++) {
    const x = m.w * (0.3 + (i % 2) * 0.4);
    const y = m.h * (0.38 + Math.floor(i / 2) * 0.22);
    o.push(rect(m, `mass_${i}`, x, y, 0.08, 0.065, (i * Math.PI) / 6, 'rgba(51, 65, 85, 0.85)'));
  }
  o.push(circle(m, 'glow', m.cx, m.cy, 0.04, 'rgba(148, 163, 184, 0.1)'));
  addArenaBoundaryWalls(m, o, 'colossus');
  return o;
}

function layoutHiveQueen(w: number, h: number): Obstacle[] {
  const m = arenaMetrics(w, h);
  const o: Obstacle[] = [];
  const throneY = m.h * 0.28;
  o.push(
    circle(m, 'throne', m.cx, throneY, 0.045, 'rgba(251, 191, 36, 0.35)'),
    circle(m, 'throne_ring', m.cx, throneY, 0.065, 'rgba(34, 197, 94, 0.15)'),
    rect(m, 'chitin_n', m.cx, m.h * 0.14, 0.34, 0.05, 0, 'rgba(22, 101, 52, 0.45)'),
    rect(m, 'chitin_s', m.cx, m.h * 0.86, 0.34, 0.05, 0, 'rgba(22, 101, 52, 0.45)')
  );
  for (let i = 0; i < 10; i++) {
    if (i % 3 === 0) continue;
    const angle = (i / 10) * Math.PI * 2;
    if (Math.sin(angle) > 0.25) continue;
    o.push(
      circle(
        m,
        `pod_${i}`,
        m.cx + Math.cos(angle) * m.s * 0.32,
        m.cy + Math.sin(angle) * m.s * 0.32,
        0.032 + (i % 2) * 0.01,
        'rgba(74, 222, 128, 0.38)'
      )
    );
  }
  for (let i = 0; i < 4; i++) {
    const angle = -Math.PI * 0.85 + (i / 3) * Math.PI * 0.7;
    o.push(
      rect(
        m,
        `royal_spine_${i}`,
        m.cx + Math.cos(angle) * m.s * 0.18,
        m.h * 0.32 + Math.sin(angle) * m.s * 0.06,
        0.05,
        0.028,
        angle,
        'rgba(180, 83, 9, 0.5)'
      )
    );
  }
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI * 0.75 + (i / 5) * Math.PI * 0.5;
    o.push(
      circle(
        m,
        `larva_${i}`,
        m.cx + Math.cos(angle) * m.s * 0.14,
        m.h * 0.38 + Math.sin(angle) * m.s * 0.05,
        0.014,
        'rgba(250, 204, 21, 0.32)'
      )
    );
  }
  addArenaBoundaryWalls(m, o, 'hive_queen');
  return o;
}

function layoutWraithLord(w: number, h: number): Obstacle[] {
  const m = arenaMetrics(w, h);
  const o: Obstacle[] = [];
  o.push(
    rect(m, 'veil_l', m.w * 0.08, m.cy, 0.07, 0.52, 0, 'rgba(30, 27, 75, 0.72)'),
    rect(m, 'veil_r', m.w * 0.92, m.cy, 0.07, 0.52, 0, 'rgba(30, 27, 75, 0.72)'),
    rect(m, 'arch', m.cx, m.h * 0.12, 0.24, 0.045, 0, 'rgba(67, 56, 202, 0.45)')
  );
  for (let i = 0; i < 5; i++) {
    const y = m.h * 0.26 + (i / 4) * m.h * 0.48;
    const offset = (i % 2 === 0 ? -1 : 1) * m.s * 0.18;
    o.push(
      rect(
        m,
        `phantom_${i}`,
        m.cx + offset,
        y,
        0.055,
        0.08,
        i % 2 === 0 ? 0.35 : -0.35,
        'rgba(129, 140, 248, 0.32)'
      )
    );
  }
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + 0.5;
    o.push(
      circle(
        m,
        `echo_${i}`,
        m.cx + Math.cos(angle) * m.s * 0.26,
        m.cy + Math.sin(angle) * m.s * 0.26,
        0.02 + (i % 3) * 0.006,
        'rgba(165, 180, 252, 0.2)'
      )
    );
  }
  for (let i = 0; i < 4; i++) {
    o.push(
      rect(
        m,
        `rift_trace_${i}`,
        m.cx + (i - 1.5) * m.s * 0.14,
        m.cy - m.h * 0.08,
        0.035,
        0.12,
        (i - 1.5) * 0.25,
        'rgba(99, 102, 241, 0.22)'
      )
    );
  }
  o.push(circle(m, 'well', m.cx, m.h * 0.76, 0.038, 'rgba(79, 70, 229, 0.12)'));
  addArenaBoundaryWalls(m, o, 'wraith_lord');
  return o;
}

/** Player spawn per arena — keeps start clear of boss lane */
export function getArenaPlayerSpawn(bossId: string, width: number, height: number): Vector2 {
  switch (bossId) {
    case 'void_cardinal':
    case 'wraith_lord':
      return new Vector2(width * 0.5, height * 0.72);
    case 'hive_regent':
      return new Vector2(width * 0.5, height * 0.58);
    case 'hive_queen':
      return new Vector2(width * 0.5, height * 0.64);
    case 'colossus':
      return new Vector2(width * 0.5, height * 0.68);
    case 'salvage_hauler':
    case 'crimson_tyrant':
      return new Vector2(width * 0.5, height * 0.68);
    default:
      return new Vector2(width * 0.5, height * 0.62);
  }
}

/** Boss spawn per arena — opposite end of the lane from the player */
export function getBossSpawnPosition(bossId: string, width: number, height: number): Vector2 {
  switch (bossId) {
    case 'void_cardinal':
    case 'wraith_lord':
      return new Vector2(width * 0.5, height * 0.2);
    case 'salvage_hauler':
      return new Vector2(width * 0.5, height * 0.28);
    case 'hive_regent':
    case 'hive_queen':
      return new Vector2(width * 0.5, height * 0.3);
    case 'crimson_tyrant':
      return new Vector2(width * 0.5, height * 0.35);
    case 'colossus':
      return new Vector2(width * 0.5, height * 0.22);
    default:
      return new Vector2(width / 2, height * 0.25);
  }
}

const LAYOUT_BUILDERS: Record<string, (w: number, h: number) => Obstacle[]> = {
  salvage_hauler: layoutSalvageHauler,
  hive_regent: layoutHiveRegent,
  void_cardinal: layoutVoidCardinal,
  crimson_tyrant: layoutCrimsonTyrant,
  colossus: layoutColossus,
  hive_queen: layoutHiveQueen,
  wraith_lord: layoutWraithLord,
};

export function buildBossArenaLayout(bossId: string, width: number, height: number): Obstacle[] {
  const build = LAYOUT_BUILDERS[bossId] ?? layoutSalvageHauler;
  return build(width, height);
}

export interface BossArenaAudit {
  bossId: string;
  worldWidth: number;
  worldHeight: number;
  obstacleCount: number;
  maxExtent: number;
  spawnOverlapCount: number;
  laneClear: boolean;
}

function obstacleOverlapsPoint(
  o: Obstacle,
  px: number,
  py: number,
  entityRadius: number
): boolean {
  if (o.type === 'CIRCLE') {
    const dx = px - o.pos.x;
    const dy = py - o.pos.y;
    const r = o.size.x + entityRadius;
    return dx * dx + dy * dy < r * r;
  }
  const hw = o.size.x / 2 + entityRadius;
  const hh = o.size.y / 2 + entityRadius;
  return (
    px >= o.pos.x - hw &&
    px <= o.pos.x + hw &&
    py >= o.pos.y - hh &&
    py <= o.pos.y + hh
  );
}

/** Validates layout at real viewport scale (spawn clearance, size caps). */
export function auditBossArena(
  bossId: string,
  viewWidth: number,
  viewHeight: number,
  playerRadius = 20
): BossArenaAudit {
  const { width, height } = getBossArenaWorldSize(viewWidth, viewHeight, bossId);
  const layout = buildBossArenaLayout(bossId, width, height);
  const spawn = getArenaPlayerSpawn(bossId, width, height);
  let spawnOverlapCount = 0;
  for (const o of layout) {
    if (obstacleOverlapsPoint(o, spawn.x, spawn.y, playerRadius)) {
      spawnOverlapCount++;
    }
  }
  return {
    bossId,
    worldWidth: width,
    worldHeight: height,
    obstacleCount: layout.length,
    maxExtent: maxBossObstacleExtent(layout, width, height),
    spawnOverlapCount,
    laneClear: spawnOverlapCount === 0,
  };
}

/** Ensures no obstacle covers the whole viewport when scaled to real arena sizes.
 *  Boundary walls (id contains `bw_`) are exempt — they are arena borders. */
export function maxBossObstacleExtent(layout: Obstacle[], worldW: number, worldH: number): number {
  const cap = Math.min(worldW, worldH) * ARENA_OBSTACLE_MAX_FRAC;
  let max = 0;
  for (const o of layout) {
    if (o.id.includes('bw_')) continue;
    const ext = o.type === 'CIRCLE' ? o.size.x : Math.max(o.size.x, o.size.y) / 2;
    max = Math.max(max, ext);
    if (ext > cap + 1) {
      throw new Error(`Obstacle ${o.id} too large: ${ext} > ${cap}`);
    }
  }
  return max;
}

const SURVIVAL_BOSS_IDS = new Set([
  'salvage_hauler',
  'hive_regent',
  'void_cardinal',
  'crimson_tyrant',
  'colossus',
  'hive_queen',
  'wraith_lord',
]);

export function pickRandomBoss(stage: number = 1, excludeId?: string | null): BossDefinition {
  const picked = pickBossForSurvivalStage(stage, excludeId);
  if (SURVIVAL_BOSS_IDS.has(picked.id)) return picked;
  let pool = BOSS_DEFINITIONS.filter((b) => SURVIVAL_BOSS_IDS.has(b.id));
  if (excludeId) {
    const filtered = pool.filter((b) => b.id !== excludeId);
    if (filtered.length > 0) pool = filtered;
  }
  return pool[0] ?? picked;
}

export function beginBossWarp(state: GameState, boss: BossDefinition): void {
  state.activeBossId = boss.id;
  state.bossArenaTransition = BOSS_WARP_DURATION;
  state.bossArenaSwapped = false;
  state.enemies = [];
  state.projectiles = [];
  state.hazards = [];
  state.player.velocity = new Vector2(0, 0);
  state.screenshake = 10;
  state.screenFlash = 4;
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
  const playerSpawn = getArenaPlayerSpawn(bossId, width, height);
  state.player.pos = playerSpawn;
  state.player.velocity = new Vector2(0, 0);
  state.camera.x = playerSpawn.x - viewWidth / 2;
  state.camera.y = playerSpawn.y - viewHeight / 2;
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
  state.bossActive = false;
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
