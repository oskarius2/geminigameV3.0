import { describe, it, expect } from 'vitest';
import { computeBossEnrage } from './bossSurvivalAI';

/**
 * Soft-enrage curve verification.
 *
 * Design intent (Game Design: Boss Soft Enrage — Prevent Bullet Sponge):
 *   - 0 → 180s: no enrage (boss vanilla)
 *   - 180 → 240s: ramp begins, level 0 → 1
 *   - 240 → 300s: continue ramping, level 1 → 2
 *   - 300s+:     CAPPED at level 2 (dam 2.0×, speed 1.6×) — fight stays winnable
 *
 *   damMult   = 1 + level × 0.5
 *   speedMult = 1 + level × 0.3
 */
describe('Boss soft enrage curve', () => {
  it('returns neutral multipliers before the 180s threshold', () => {
    expect(computeBossEnrage(0).level).toBe(0);
    expect(computeBossEnrage(90).damMult).toBe(1);
    expect(computeBossEnrage(180).speedMult).toBe(1);
  });

  it('crosses level 0 at exactly 180s (enrage start)', () => {
    expect(computeBossEnrage(180).level).toBe(0);
    expect(computeBossEnrage(180).damMult).toBe(1.0);
    expect(computeBossEnrage(180).speedMult).toBe(1.0);
  });

  it('reaches level 1 at 240s — design spec checkpoint', () => {
    const e = computeBossEnrage(240);
    expect(e.level).toBe(1);
    expect(e.damMult).toBeCloseTo(1.5, 5);
    expect(e.speedMult).toBeCloseTo(1.3, 5);
  });

  it('reaches level 2 at 300s — design spec checkpoint', () => {
    const e = computeBossEnrage(300);
    expect(e.level).toBe(2);
    expect(e.damMult).toBeCloseTo(2.0, 5);
    expect(e.speedMult).toBeCloseTo(1.6, 5);
  });

  it('CAPS at level 2 past 300s — boss does not become impossible', () => {
    const at300 = computeBossEnrage(300);
    const at600 = computeBossEnrage(600);
    const at3600 = computeBossEnrage(3600);
    expect(at600.level).toBe(at300.level);
    expect(at3600.damMult).toBe(at300.damMult);
    expect(at3600.speedMult).toBe(at300.speedMult);
  });

  it('ramps monotonically between 180s and 300s', () => {
    const samples = [180, 195, 210, 225, 240, 255, 270, 285, 300];
    let prevDam = -Infinity;
    let prevSpeed = -Infinity;
    for (const t of samples) {
      const e = computeBossEnrage(t);
      expect(e.damMult).toBeGreaterThanOrEqual(prevDam);
      expect(e.speedMult).toBeGreaterThanOrEqual(prevSpeed);
      prevDam = e.damMult;
      prevSpeed = e.speedMult;
    }
  });

  it('halfway between 180s and 240s yields half a level', () => {
    const e = computeBossEnrage(210);
    expect(e.level).toBeCloseTo(0.5, 5);
    expect(e.damMult).toBeCloseTo(1.25, 5);
    expect(e.speedMult).toBeCloseTo(1.15, 5);
  });
});
