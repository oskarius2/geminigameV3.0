/** Base interval before threat-based reduction (see applyThreatCardCooldown). */
export function getCardIntervalSeconds(
  stage: number,
  survivalTime: number,
  _passives: string[] | number = [],
): number {
  if (stage === 1) return Infinity;
  if (stage === 2) {
    if (survivalTime < 90) return 90 - survivalTime;
    return 60;
  }
  if (stage === 3) return 50;
  if (stage === 4) return 40;
  return 30;
}

/** Design: base cooldown minus threat scaling, floor 10s. */
export function applyThreatCardCooldown(baseSeconds: number, threatLevel: number): number {
  if (!Number.isFinite(baseSeconds)) return baseSeconds;
  return Math.max(10, baseSeconds - threatLevel * 2);
}

export function getEffectiveCardIntervalSeconds(
  stage: number,
  survivalTime: number,
  passives: string[],
  threatLevel: number,
): number {
  const base = getCardIntervalSeconds(stage, survivalTime, passives);
  return applyThreatCardCooldown(base, threatLevel);
}

export function getNextLevelExp(current: number): number {
  return Math.floor(current * 1.8 + 3500);
}
