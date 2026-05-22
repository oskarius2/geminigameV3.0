import { describe, expect, it, beforeEach } from 'vitest';
import { applyThreatVisualEffects, resetThreatEffectTracking } from './threatEffects';
import { GameState } from '../types';

function makeState(threatLevel: number): GameState {
  return {
    threatLevel,
    survivalTime: 10,
    screenshake: 0,
    screenFlash: 0,
    particles: [],
    world: { width: 800, height: 600 },
    camera: { x: 400, y: 300 },
  } as GameState;
}

describe('applyThreatVisualEffects', () => {
  beforeEach(() => {
    resetThreatEffectTracking();
  });

  it('flashes on milestone thresholds', () => {
    const state = makeState(0);
    applyThreatVisualEffects(state, 0.016);
    expect(state.screenFlash).toBe(0);

    state.threatLevel = 25;
    applyThreatVisualEffects(state, 0.016);
    expect(state.screenFlash).toBeGreaterThan(0);
  });

  it('adds ambient screenshake at higher tiers', () => {
    const state = makeState(80);
    applyThreatVisualEffects(state, 0.016);
    expect(state.screenshake).toBeGreaterThan(0);
  });

  it('spawns vignette particles scaled by tier', () => {
    const low = makeState(10);
    const high = makeState(90);

    for (let i = 0; i < 30; i++) {
      applyThreatVisualEffects(low, 0.5);
      applyThreatVisualEffects(high, 0.5);
    }

    expect(high.particles.length).toBeGreaterThan(low.particles.length);
  });
});
