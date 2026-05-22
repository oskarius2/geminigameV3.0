import { GameState } from '../types';
import { Vector2 } from '../utils/vector';
import { sampleRailAt } from './geometry';

/** Fixed upward fire — vertical arcade shooter (Galaxiga-style). */
export function getRailsShootDirection(state: GameState): Vector2 {
  const rails = state.rails;
  if (!rails) return new Vector2(0, -1);

  const sample = sampleRailAt(
    rails.centerline,
    rails.cumulativeLengths,
    rails.distance
  );
  return new Vector2(sample.tangentX, sample.tangentY).normalize();
}
