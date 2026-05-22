import { RailPoint } from './types';

export interface RailSample {
  x: number;
  y: number;
  tangentX: number;
  tangentY: number;
  normalX: number;
  normalY: number;
  distance: number;
}

function segmentLength(a: RailPoint, b: RailPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Cumulative distance at each centerline vertex (same length as centerline). */
export function buildCumulativeLengths(centerline: readonly RailPoint[]): number[] {
  const cum: number[] = [0];
  for (let i = 1; i < centerline.length; i++) {
    cum.push(cum[i - 1] + segmentLength(centerline[i - 1], centerline[i]));
  }
  return cum;
}

export function getRailTotalLength(cumulative: readonly number[]): number {
  return cumulative.length > 0 ? cumulative[cumulative.length - 1] : 0;
}

/** Unit normal pointing left of travel direction (lateral + = this side). */
export function normalVector(tangentX: number, tangentY: number): { x: number; y: number } {
  const len = Math.hypot(tangentX, tangentY) || 1;
  return { x: -tangentY / len, y: tangentX / len };
}

export function clampLateral(lateral: number, corridorHalfWidth: number): number {
  return Math.max(-corridorHalfWidth, Math.min(corridorHalfWidth, lateral));
}

/**
 * Position + tangent on the piecewise-linear centerline at `distance` (world units).
 */
export function sampleRailAt(
  centerline: readonly RailPoint[],
  cumulative: readonly number[],
  distance: number
): RailSample {
  const total = getRailTotalLength(cumulative);
  const d = Math.max(0, Math.min(total, distance));

  if (centerline.length === 0) {
    return {
      x: 0,
      y: 0,
      tangentX: 0,
      tangentY: 1,
      normalX: -1,
      normalY: 0,
      distance: d,
    };
  }

  if (centerline.length === 1) {
    const n = normalVector(0, 1);
    return {
      x: centerline[0].x,
      y: centerline[0].y,
      tangentX: 0,
      tangentY: 1,
      normalX: n.x,
      normalY: n.y,
      distance: d,
    };
  }

  let seg = 0;
  for (let i = 1; i < cumulative.length; i++) {
    if (d <= cumulative[i] || i === cumulative.length - 1) {
      seg = i - 1;
      break;
    }
  }

  const p0 = centerline[seg];
  const p1 = centerline[Math.min(seg + 1, centerline.length - 1)];
  const segStart = cumulative[seg];
  const segEnd = cumulative[seg + 1];
  const segLen = Math.max(1e-6, segEnd - segStart);
  const t = (d - segStart) / segLen;

  const x = p0.x + (p1.x - p0.x) * t;
  const y = p0.y + (p1.y - p0.y) * t;
  const tx = p1.x - p0.x;
  const ty = p1.y - p0.y;
  const tLen = Math.hypot(tx, ty) || 1;
  const tangentX = tx / tLen;
  const tangentY = ty / tLen;
  const n = normalVector(tangentX, tangentY);

  return {
    x,
    y,
    tangentX,
    tangentY,
    normalX: n.x,
    normalY: n.y,
    distance: d,
  };
}

export function worldFromRail(
  sample: RailSample,
  lateral: number,
  forward = 0
): { x: number; y: number } {
  return {
    x: sample.x + sample.normalX * lateral + sample.tangentX * forward,
    y: sample.y + sample.normalY * lateral + sample.tangentY * forward,
  };
}

export function clampRailsForward(forward: number, corridorHalfWidth: number): number {
  const range = corridorHalfWidth * 0.5;
  return Math.max(-range, Math.min(range, forward));
}
