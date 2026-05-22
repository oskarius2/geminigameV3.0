import { clampLateral } from './geometry';
import { getRailsPlayBounds } from './renderCorridor';

/** Higher = snappier follow toward mouse X (Galaxiga-style). */
export const RAILS_MOUSE_FOLLOW_RATE = 16;

/** Map screen X inside play strip → world lateral offset from centerline. */
export function screenXToTargetLateral(
  screenX: number,
  screenWidth: number,
  corridorHalfWidth: number
): number {
  const bounds = getRailsPlayBounds(screenWidth, 1);
  const x = Math.max(bounds.left, Math.min(bounds.right, screenX));
  const t = (x - bounds.left) / bounds.width;
  return (t - 0.5) * 2 * corridorHalfWidth;
}

/** Exponential smooth toward target lateral (world units). */
export function smoothFollowLateral(
  current: number,
  target: number,
  corridorHalfWidth: number,
  dtSec: number,
  rate = RAILS_MOUSE_FOLLOW_RATE
): number {
  const alpha = 1 - Math.exp(-rate * dtSec);
  return clampLateral(current + (target - current) * alpha, corridorHalfWidth);
}
