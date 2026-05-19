const META_SCRAP_KEY = 'metaScrap';

function writeMetaScrap(value: number): boolean {
  try {
    localStorage.setItem(META_SCRAP_KEY, String(value));
    return true;
  } catch {
    return false;
  }
}

export function getMetaScrap(): number {
  try {
    const raw = localStorage.getItem(META_SCRAP_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

export function addMetaScrap(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return getMetaScrap();
  const next = getMetaScrap() + Math.floor(amount);
  writeMetaScrap(next);
  return next;
}

export function spendMetaScrap(amount: number): boolean {
  const cost = Math.floor(amount);
  if (!Number.isFinite(cost) || cost <= 0) return true;
  const cur = getMetaScrap();
  if (cur < cost) return false;
  return writeMetaScrap(cur - cost);
}
