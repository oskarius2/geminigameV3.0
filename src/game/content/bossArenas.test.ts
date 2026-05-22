import { describe, expect, it } from 'vitest';
import {
  ARENA_OBSTACLE_MAX_ALPHA,
  ARENA_OBSTACLE_MAX_FRAC,
  auditBossArena,
  buildBossArenaLayout,
  getArenaPlayerSpawn,
  getBossArenaWorldSize,
  getBossSpawnPosition,
  maxBossObstacleExtent,
  pickRandomBoss,
  BOSS_WARP_DURATION,
} from './bossArenas';
import { BOSS_DEFINITIONS } from './bosses';

describe('bossArenas', () => {
  it('builds distinct layouts per boss', () => {
    const w = 1200;
    const h = 900;
    const ids = BOSS_DEFINITIONS.map((b) => b.id);
    const layouts = ids.map((id) => buildBossArenaLayout(id, w, h));
    expect(layouts.every((l) => l.length >= 5)).toBe(true);
    expect(layouts[0][0].id).not.toBe(layouts[1][0].id);
  });

  it('picks random bosses from the pool', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      seen.add(pickRandomBoss(3).id);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('arena world is smaller than main survival map', () => {
    const arena = getBossArenaWorldSize(400, 800, 'void_cardinal');
    expect(arena.width).toBeLessThan(400 * 30);
    expect(arena.height).toBeGreaterThan(arena.width * 0.5);
  });

  it('warp duration is long enough for animation', () => {
    expect(BOSS_WARP_DURATION).toBeGreaterThanOrEqual(3);
  });

  it('all boss layouts stay within max obstacle size at real arena scale', () => {
    const viewW = 400;
    const viewH = 800;
    for (const boss of BOSS_DEFINITIONS) {
      const { width, height } = getBossArenaWorldSize(viewW, viewH, boss.id);
      const layout = buildBossArenaLayout(boss.id, width, height);
      const maxExt = maxBossObstacleExtent(layout, width, height);
      expect(maxExt).toBeLessThanOrEqual(Math.min(width, height) * ARENA_OBSTACLE_MAX_FRAC + 1);
    }
  });

  it('void cardinal arena has clear lane without center blocker', () => {
    const w = 1200;
    const h = 2000;
    const layout = buildBossArenaLayout('void_cardinal', w, h);
    expect(layout.some((o) => o.id.includes('core'))).toBe(false);
    const player = getArenaPlayerSpawn('void_cardinal', w, h);
    const boss = getBossSpawnPosition('void_cardinal', w, h);
    expect(player.y).toBeGreaterThan(boss.y);
  });

  it.each(BOSS_DEFINITIONS.map((b) => b.id))(
    'arena audit: clear spawn and capped alpha at mobile viewport (%s)',
    (bossId) => {
      const audit = auditBossArena(bossId, 400, 800);
      expect(audit.laneClear, `${bossId} spawn overlaps ${audit.spawnOverlapCount} obstacles`).toBe(
        true
      );
      expect(audit.obstacleCount).toBeGreaterThanOrEqual(5);

      const layout = buildBossArenaLayout(
        bossId,
        audit.worldWidth,
        audit.worldHeight
      );
      for (const o of layout) {
        const m = o.color.match(/rgba?\([^)]+\)/);
        if (m) {
          const parts = m[0].match(/[\d.]+/g);
          if (parts && parts.length >= 4) {
            expect(parseFloat(parts[3])).toBeLessThanOrEqual(ARENA_OBSTACLE_MAX_ALPHA + 0.01);
          }
        }
      }
    }
  );

  it.each(BOSS_DEFINITIONS.map((b) => b.id))(
    'arena audit: clear spawn at narrow viewport (%s)',
    (bossId) => {
      const audit = auditBossArena(bossId, 390, 844);
      expect(audit.laneClear).toBe(true);
    }
  );

  it('salvage and crimson spawns are in lower lane not map center', () => {
    const w = 3600;
    const h = 3780;
    for (const id of ['salvage_hauler', 'crimson_tyrant'] as const) {
      const spawn = getArenaPlayerSpawn(id, w, h);
      expect(spawn.y).toBeGreaterThan(h * 0.6);
      expect(spawn.y).toBeLessThan(h * 0.75);
    }
  });
});
