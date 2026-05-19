export function getCardIntervalSeconds(stage: number, _survivalTime: number, passiveCount: number = 0): number {
  const base = 20 + Math.random() * 4; // 20–24s base
  const buffDiscount = Math.min(8, passiveCount * 0.8);
  const stageDiscount = Math.min(6, (stage - 1) * 1.2);
  return Math.max(12, base - buffDiscount - stageDiscount);
}

export function getNextLevelExp(current: number): number {
  return Math.floor(current * 1.8 + 3500); // Higher requirements
}
