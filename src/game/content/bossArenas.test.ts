import { describe, expect, it } from 'vitest';
import {
  buildBossArenaLayout,
  getBossArenaWorldSize,
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
});
