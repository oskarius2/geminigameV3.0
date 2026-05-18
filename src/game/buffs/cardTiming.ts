export function getCardIntervalSeconds(stage: number, survivalTime: number, passiveCount: number = 0): number {
  const base = 31 + Math.random() * 3; // 31–34s base
  const buffDiscount = Math.min(12, passiveCount * 1.2); // up to -12s with 10+ buffs
  const stageDiscount = Math.min(6, (stage - 1) * 1.2);  // up to -6s at stage 6+
  return Math.max(18, base - buffDiscount - stageDiscount);
}

export function getNextLevelExp(current: number): number {
  return Math.floor(current * 1.8 + 3500); // Higher requirements
}
