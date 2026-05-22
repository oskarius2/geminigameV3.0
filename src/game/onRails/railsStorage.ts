const STORAGE_KEY = 'railsHighScores';

export function getRailsHighScores(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, number>;
    }
  } catch {
    // ignore
  }
  return {};
}

export function saveRailsHighScore(levelId: string, score: number): number {
  const all = getRailsHighScores();
  const prev = all[levelId] ?? 0;
  if (score > prev) {
    all[levelId] = score;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return score;
  }
  return prev;
}

export function getRailsMedal(
  score: number,
  kills: number
): 'bronze' | 'silver' | 'gold' {
  if (score >= 8000 || kills >= 25) return 'gold';
  if (score >= 4000 || kills >= 12) return 'silver';
  return 'bronze';
}
