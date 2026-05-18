import { Artifact } from '../types';

function pct(mod: number): string {
  if (mod >= 1 && mod < 10) return `+${Math.round((mod - 1) * 100)}%`;
  if (mod > 0 && mod < 1) return `${Math.round((mod - 1) * 100)}%`;
  return mod > 0 ? `+${mod}` : String(mod);
}

export function formatArtifactStats(art: Artifact): string[] {
  const lines: string[] = [];
  const s = art.stats;
  if (s.damageMod != null) {
    lines.push(s.damageMod > 5 ? `+${s.damageMod} skada` : pct(s.damageMod) + ' skada');
  }
  if (s.healthMod != null) lines.push(`+${s.healthMod} HP`);
  if (s.speedMod != null) lines.push(pct(s.speedMod) + ' hastighet');
  if (s.energyMod != null) lines.push(`+${s.energyMod} energi`);
  if (s.expMod != null) lines.push(pct(s.expMod) + ' XP');
  if (s.critMod != null) lines.push(`+${Math.round(s.critMod * 100)}% krit`);
  return lines;
}

export function formatArtifactDelta(art: Artifact, equipped: Artifact | null): string[] {
  if (!equipped || equipped.id === art.id) return formatArtifactStats(art);
  const lines: string[] = [];
  const a = art.stats;
  const e = equipped.stats;
  if (a.damageMod != null || e.damageMod != null) {
    const diff = (a.damageMod ?? 0) - (e.damageMod ?? 0);
    if (diff !== 0) lines.push(diff > 0 ? `+${diff > 5 ? diff : Math.round(diff * 100) + '%'} skada vs utrustad` : 'lägre skada');
  }
  if (a.healthMod != null || e.healthMod != null) {
    const diff = (a.healthMod ?? 0) - (e.healthMod ?? 0);
    if (diff !== 0) lines.push(diff > 0 ? `+${diff} HP` : `${diff} HP`);
  }
  if (a.speedMod != null || e.speedMod != null) {
    const diff = (a.speedMod ?? 1) - (e.speedMod ?? 1);
    if (Math.abs(diff) > 0.01) lines.push(diff > 0 ? `+${Math.round(diff * 100)}% hastighet` : `${Math.round(diff * 100)}% hastighet`);
  }
  if (lines.length === 0) return formatArtifactStats(art);
  return lines;
}
