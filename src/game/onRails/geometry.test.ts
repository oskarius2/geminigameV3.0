import { describe, expect, it } from 'vitest';
import { buildCumulativeLengths, clampLateral, sampleRailAt } from './geometry';

describe('onRails geometry', () => {
  const line = [
    { x: 100, y: 0 },
    { x: 100, y: 1000 },
  ];
  const cum = buildCumulativeLengths(line);

  it('samples mid segment', () => {
    const s = sampleRailAt(line, cum, 500);
    expect(s.x).toBeCloseTo(100, 0);
    expect(s.y).toBeCloseTo(500, 0);
    expect(Math.hypot(s.tangentX, s.tangentY)).toBeCloseTo(1, 2);
  });

  it('clamps lateral', () => {
    expect(clampLateral(400, 320)).toBe(320);
    expect(clampLateral(-400, 320)).toBe(-320);
  });
});
