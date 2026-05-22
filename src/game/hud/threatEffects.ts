import { getThreatTier, getThreatVisualConfig } from '../balance/threat';
import { GameState, Particle } from '../types';

const THREAT_MILESTONES = [25, 50, 75, 100] as const;

const MILESTONE_FLASH: Record<(typeof THREAT_MILESTONES)[number], number> = {
  25: 3,
  50: 5,
  75: 8,
  100: 12,
};

const TIER_PULSE_FLASH: Record<ReturnType<typeof getThreatTier>, number> = {
  calm: 0,
  pressure: 2,
  danger: 4,
  critical: 6,
};

const AMBIENT_SHAKE: Record<ReturnType<typeof getThreatTier>, number> = {
  calm: 0,
  pressure: 0.15,
  danger: 0.35,
  critical: 0.65,
};

let lastTrackedTier: ReturnType<typeof getThreatTier> | null = null;
let lastTrackedMilestone = 0;
let vignetteAccumulator = 0;

export function resetThreatEffectTracking(): void {
  lastTrackedTier = null;
  lastTrackedMilestone = 0;
  vignetteAccumulator = 0;
}

function spawnVignetteParticle(state: GameState, color: string): void {
  const margin = 48;
  const w = state.world.width;
  const h = state.world.height;
  const cam = state.camera;
  const edge = Math.floor(Math.random() * 4);
  let x = cam.x;
  let y = cam.y;

  if (edge === 0) {
    x += Math.random() * w - w * 0.5;
    y -= h * 0.5 + margin * Math.random();
  } else if (edge === 1) {
    x += Math.random() * w - w * 0.5;
    y += h * 0.5 + margin * Math.random();
  } else if (edge === 2) {
    x -= w * 0.5 + margin * Math.random();
    y += Math.random() * h - h * 0.5;
  } else {
    x += w * 0.5 + margin * Math.random();
    y += Math.random() * h - h * 0.5;
  }

  const particle: Particle = {
    id: `threat-v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    pos: { x, y },
    velocity: { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4 },
    life: 0.6 + Math.random() * 0.4,
    maxLife: 1,
    color,
    size: 2 + Math.random() * 3,
    particleType: 'dot',
  };

  state.particles.push(particle);
  if (state.particles.length > 120) {
    state.particles.splice(0, state.particles.length - 120);
  }
}

export function applyThreatVisualEffects(state: GameState, dt: number): void {
  const threatLevel = state.threatLevel ?? 0;
  const tier = getThreatTier(threatLevel);
  const config = getThreatVisualConfig(tier);

  for (const milestone of THREAT_MILESTONES) {
    if (threatLevel >= milestone && lastTrackedMilestone < milestone) {
      state.screenFlash = Math.max(state.screenFlash, MILESTONE_FLASH[milestone]);
      lastTrackedMilestone = milestone;
    }
  }

  if (lastTrackedTier !== null && lastTrackedTier !== tier) {
    const pulse = TIER_PULSE_FLASH[tier];
    if (pulse > 0) {
      state.screenFlash = Math.max(state.screenFlash, pulse);
    }
  }
  lastTrackedTier = tier;

  const ambientShake = AMBIENT_SHAKE[tier];
  if (ambientShake > 0) {
    const pulse =
      tier === 'critical'
        ? ambientShake * (0.85 + 0.15 * Math.sin(state.survivalTime * 8))
        : ambientShake;
    state.screenshake = Math.max(state.screenshake, pulse);
  }

  const baseRate = 2 * config.particleMultiplier;
  vignetteAccumulator += dt * baseRate;
  while (vignetteAccumulator >= 1) {
    vignetteAccumulator -= 1;
    spawnVignetteParticle(state, config.hudColor);
  }
}
