import { PASSIVE_BUFFS } from '../content/buffs';
import { BuffRarity, GameState, PassiveBuff } from '../types';

export function countPassiveStacks(passives: string[], buffId: string): number {
  return passives.filter((id) => id === buffId).length;
}

function isExclusiveBuff(b: PassiveBuff): boolean {
  return b.exclusive === true || b.rarity === BuffRarity.EXCLUSIVE;
}

function rollRarity(): BuffRarity {
  const rand = Math.random();
  if (rand < 0.02) return BuffRarity.EXCLUSIVE;
  if (rand < 0.05) return BuffRarity.LEGENDARY;
  if (rand < 0.15) return BuffRarity.EPIC;
  if (rand < 0.4) return BuffRarity.RARE;
  return BuffRarity.COMMON;
}

function pickOneFromPool(pool: PassiveBuff[], preferHighThreat: boolean): PassiveBuff {
  if (pool.length === 0) throw new Error('empty pool');
  if (preferHighThreat) {
    const sorted = [...pool].sort((a, b) => (b.threatWeight ?? 0) - (a.threatWeight ?? 0));
    const top = sorted.slice(0, Math.min(4, sorted.length));
    return top[Math.floor(Math.random() * top.length)];
  }
  let rarityTarget = rollRarity();
  let options = pool.filter((b) => b.rarity === rarityTarget);
  if (options.length === 0) options = pool;
  return options[Math.floor(Math.random() * options.length)];
}

export function pickBuffs(state: GameState, count = 3): PassiveBuff[] {
  const all = Object.values(PASSIVE_BUFFS);
  const available = all.filter((b) => {
    const stacks = countPassiveStacks(state.passives, b.id);
    const max = b.maxStacks ?? 99;
    return stacks < max;
  });

  const exclusivePool = available.filter(isExclusiveBuff);
  const normalPool = available.filter((b) => !isExclusiveBuff(b));

  const selected: PassiveBuff[] = [];
  const usedIds = new Set<string>();

  const takeFrom = (pool: PassiveBuff[], preferHighThreat = false) => {
    const remaining = pool.filter((b) => !usedIds.has(b.id));
    if (remaining.length === 0) return null;
    const buff = pickOneFromPool(remaining, preferHighThreat);
    usedIds.add(buff.id);
    return buff;
  };

  const needExclusive =
    state.augmentPityExclusive >= 2 ||
    (state.threatLevel >= 25 && exclusivePool.length > 0);

  const preferBroken = state.threatLevel > 60;

  if (needExclusive && exclusivePool.length > 0) {
    const ex = takeFrom(exclusivePool, preferBroken);
    if (ex) selected.push(ex);
  }

  while (selected.length < count) {
    const pool = normalPool.length > 0 ? normalPool : available;
    const buff = takeFrom(pool.filter((b) => !isExclusiveBuff(b) || selected.length === 0), false);
    if (!buff) {
      const fallback = takeFrom(available, false);
      if (!fallback) break;
      selected.push(fallback);
    } else {
      selected.push(buff);
    }
  }

  if (selected.length < count) {
    for (const b of available) {
      if (selected.length >= count) break;
      if (!usedIds.has(b.id)) {
        usedIds.add(b.id);
        selected.push(b);
      }
    }
  }

  const gotExclusive = selected.some(isExclusiveBuff);
  if (gotExclusive) {
    state.augmentPityExclusive = 0;
  } else {
    state.augmentPityExclusive += 1;
  }

  return selected;
}

export function getBuffStacksForDisplay(passives: string[], buffId: string): number {
  return countPassiveStacks(passives, buffId);
}
