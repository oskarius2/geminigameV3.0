import { createExplosion, createImpact } from '../Logic';
import { ARTIFACTS } from '../content/artifacts';
import { Artifact, ArtifactSlot, BuffRarity, GameState } from '../types';

export interface ArtifactAcquiredEvent {
  artifactId: string;
  slot: ArtifactSlot;
  rarity: BuffRarity;
  rarityColor: string;
  statChanges: string[];
  title: string;
  subtitle: string;
  icon: 'artifact';
  flashIntensity: number;
  borderClass: string;
  textClass: string;
  glowClass: string;
  particleClass?: string;
}

export interface ArtifactAcquireDisplay {
  title: string;
  subtitle: string;
  icon: 'artifact';
}

const RARITY_VISUAL: Record<
  BuffRarity,
  { color: string; flash: number; border: string; text: string; glow: string; particle?: string }
> = {
  [BuffRarity.COMMON]: {
    color: '#e2e8f0',
    flash: 4,
    border: 'border-slate-400/50',
    text: 'text-slate-100',
    glow: 'shadow-slate-500/25',
  },
  [BuffRarity.RARE]: {
    color: '#60a5fa',
    flash: 6,
    border: 'border-blue-500/60',
    text: 'text-blue-200',
    glow: 'shadow-blue-500/40',
  },
  [BuffRarity.EPIC]: {
    color: '#c084fc',
    flash: 9,
    border: 'border-purple-500/70',
    text: 'text-purple-200',
    glow: 'shadow-purple-500/50',
    particle: 'artifact-popup-epic-shimmer',
  },
  [BuffRarity.LEGENDARY]: {
    color: '#fbbf24',
    flash: 24,
    border: 'border-amber-400/80',
    text: 'text-amber-200',
    glow: 'shadow-amber-400/60',
    particle: 'artifact-popup-legendary-glow',
  },
  [BuffRarity.EXCLUSIVE]: {
    color: '#22d3ee',
    flash: 16,
    border: 'border-cyan-400/90',
    text: 'text-cyan-100',
    glow: 'shadow-cyan-400/55',
    particle: 'artifact-popup-legendary-glow',
  },
  [BuffRarity.MYSTERY]: {
    color: '#e879f9',
    flash: 8,
    border: 'border-fuchsia-500/60',
    text: 'text-fuchsia-200',
    glow: 'shadow-fuchsia-500/40',
  },
};

export function describeArtifactStatChanges(artifact: Artifact): string[] {
  const lines: string[] = [];
  const s = artifact.stats;

  if (s.damageMod != null) {
    const isMultiplier = s.damageMod > 1 && s.damageMod < 3;
    if (isMultiplier) {
      lines.push(`+${Math.round((s.damageMod - 1) * 100)}% Damage`);
    } else {
      lines.push(`+${s.damageMod} Damage`);
    }
  }
  if (s.healthMod) lines.push(`+${s.healthMod} Health`);
  if (s.speedMod) {
    const pct = Math.round((s.speedMod - 1) * 100);
    lines.push(pct >= 0 ? `+${pct}% Speed` : `${pct}% Speed`);
  }
  if (s.energyMod) lines.push(`+${s.energyMod} Energy`);
  if (s.critMod) lines.push(`+${Math.round(s.critMod * 100)}% Crit`);
  if (s.multiShot) lines.push(`+${s.multiShot} Multishot`);

  return lines;
}

export function formatArtifactAcquire(artifact: Artifact): ArtifactAcquireDisplay {
  const statLines = describeArtifactStatChanges(artifact);
  if (artifact.rarity === BuffRarity.LEGENDARY) {
    return {
      title: `LEGENDARY ARTIFACT ACQUIRED: ${artifact.name}`,
      subtitle: statLines.length > 0 ? statLines.join(' · ') : artifact.description,
      icon: 'artifact',
    };
  }
  return {
    title: `${artifact.rarity} ARTIFACT ACQUIRED: ${artifact.name}`,
    subtitle: statLines.length > 0 ? statLines.join(' · ') : artifact.description,
    icon: 'artifact',
  };
}

/** Screen flash tint, particles at player, floating stat lines (legendary/exclusive). */
export function applyArtifactAcquireJuice(state: GameState, artifact: Artifact): void {
  const visual = getRarityVisual(artifact.rarity);
  state.screenFlash = Math.max(state.screenFlash, visual.flash);
  state.screenFlashColor = visual.color;

  const isMajor =
    artifact.rarity === BuffRarity.LEGENDARY || artifact.rarity === BuffRarity.EXCLUSIVE;
  if (!isMajor) return;

  state.screenshake = Math.max(state.screenshake ?? 0, 10);
  state.pickJuiceTimer = Math.max(state.pickJuiceTimer ?? 0, 30);

  const pos = state.player.pos;
  state.particles.push(...createExplosion(pos, visual.color, 28, 2.2));
  state.particles.push(...createImpact(pos, visual.color, 8));

  describeArtifactStatChanges(artifact).forEach((text, i) => {
    state.damageTexts.push({
      id: `art-acquire-${artifact.id}-${i}-${Date.now()}`,
      pos: pos.clone(),
      text,
      life: 2.2,
      color: visual.color,
    });
  });
}

export function getRarityVisual(rarity: BuffRarity) {
  return RARITY_VISUAL[rarity] ?? RARITY_VISUAL[BuffRarity.COMMON];
}

export function buildArtifactAcquiredEvent(artifact: Artifact): ArtifactAcquiredEvent {
  const visual = getRarityVisual(artifact.rarity);
  const formatted = formatArtifactAcquire(artifact);
  return {
    artifactId: artifact.id,
    slot: artifact.slot,
    rarity: artifact.rarity,
    rarityColor: visual.color,
    statChanges: describeArtifactStatChanges(artifact),
    title: formatted.title,
    subtitle: formatted.subtitle,
    icon: formatted.icon,
    flashIntensity: visual.flash,
    borderClass: visual.border,
    textClass: visual.text,
    glowClass: visual.glow,
    particleClass: visual.particle,
  };
}

export function buildArtifactAcquiredEventFromId(artifactId: string): ArtifactAcquiredEvent | null {
  const artifact = ARTIFACTS[artifactId];
  if (!artifact) return null;
  return buildArtifactAcquiredEvent(artifact);
}

export const ARTIFACT_POPUP_DURATION_MS = 3000;
