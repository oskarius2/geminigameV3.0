import { ARTIFACTS, artifactPowerScore } from '../content/artifacts';
import { Artifact, BuffRarity } from '../types';

function rarityWeight(art: Artifact, totalUnlocked: number): number {
  const power = artifactPowerScore(art);
  let w = 1;
  if (art.rarity === BuffRarity.LEGENDARY && totalUnlocked < 8) w *= 0.35;
  else if (art.rarity === BuffRarity.EPIC && totalUnlocked < 5) w *= 0.6;
  if (power > 80) w *= 0.7;
  return w;
}

export function pickArtifactUnlockChoices(unlockedIds: string[], count = 2): Artifact[] {
  const locked = Object.values(ARTIFACTS).filter((a) => !unlockedIds.includes(a.id));
  if (locked.length === 0) return [];

  const pool = locked.map((art) => ({
    art,
    w: rarityWeight(art, unlockedIds.length),
  }));

  const picked: Artifact[] = [];
  const remaining = [...pool];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalW = remaining.reduce((s, p) => s + p.w, 0);
    let roll = Math.random() * totalW;
    let idx = 0;
    for (let j = 0; j < remaining.length; j++) {
      roll -= remaining[j].w;
      if (roll <= 0) {
        idx = j;
        break;
      }
    }
    picked.push(remaining[idx].art);
    remaining.splice(idx, 1);
  }

  return picked;
}
