import { ARTIFACTS } from '../content/artifacts';

export function getNextUnlockGoal(lockedIds: string[]): { label: string; name: string } | null {
  const all = Object.values(ARTIFACTS);
  const locked = all.filter((a) => !lockedIds.includes(a.id));
  if (locked.length === 0) return null;
  const pick = locked.sort((a, b) => {
    const order = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3, EXCLUSIVE: 4 };
    return (order[a.rarity] ?? 0) - (order[b.rarity] ?? 0);
  })[0];
  return { label: '1 boss till', name: pick.name };
}
