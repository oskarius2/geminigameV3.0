import { CompanionAIState, CompanionType } from './companionTypes';

/** Normalized 0..1 oscillators for companion visuals. */
export function companionAnimPhase(visualTime: number, hz: number): number {
  return (Math.sin(visualTime * Math.PI * 2 * hz) + 1) * 0.5;
}

export function companionRotationRad(
  type: CompanionType,
  visualTime: number,
  aiState: CompanionAIState,
): number {
  const speed =
    aiState === CompanionAIState.COMBAT
      ? 2.2
      : aiState === CompanionAIState.THREAT
        ? 1.6
        : 0.55;
  const base =
    type === CompanionType.GUARDIAN
      ? visualTime * speed
      : type === CompanionType.GUNNER
        ? visualTime * (speed * 1.4)
        : visualTime * (speed * 0.9);
  return base % (Math.PI * 2);
}

export function companionBobOffset(
  type: CompanionType,
  visualTime: number,
): { x: number; y: number } {
  if (type === CompanionType.SCOUT) {
    return {
      x: Math.sin(visualTime * 4.1) * 2 + Math.sin(visualTime * 7.3) * 1,
      y: Math.cos(visualTime * 5.7) * 1.5,
    };
  }
  if (type === CompanionType.HEALER) {
    return { x: 0, y: Math.sin(visualTime * Math.PI) * 3 };
  }
  if (type === CompanionType.GUARDIAN) {
    return { x: 0, y: Math.sin(visualTime * 1.2) * 1.5 };
  }
  return { x: Math.sin(visualTime * 3) * 1, y: Math.cos(visualTime * 2.5) * 1 };
}

export function glowIntensity(
  aiState: CompanionAIState,
  abilityReady: boolean,
  abilityPulse: number,
): number {
  let base =
    aiState === CompanionAIState.COMBAT
      ? 1
      : aiState === CompanionAIState.THREAT
        ? 0.75
        : aiState === CompanionAIState.PLAYER_DISTRESSED
          ? 0.9
          : aiState === CompanionAIState.LOW_HP
            ? 0.45
            : 0.35;
  if (abilityReady) base = Math.min(1, base + 0.25);
  if (abilityPulse > 0) base = Math.min(1, base + abilityPulse * 0.5);
  if (aiState === CompanionAIState.LOW_HP) {
    base *= 0.6 + Math.sin(Date.now() / 80) * 0.2;
  }
  return base;
}
