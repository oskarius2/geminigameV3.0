import { ARTIFACTS } from '../content/artifacts';
import { Artifact, ArtifactSlot, GameState } from '../types';

/** Apply one artifact's stat modifiers to the current run (stacking). */
export function applySingleArtifactStats(state: GameState, artifact: Artifact): void {
  const stats = artifact.stats;

  if (stats.damageMod) {
    if (stats.damageMod < 10) {
      state.baseDamage += stats.damageMod;
    } else {
      state.baseDamage *= stats.damageMod;
    }
  }

  if (stats.healthMod) {
    state.player.maxHealth += stats.healthMod;
    state.player.health += stats.healthMod;
  }

  if (stats.speedMod) {
    state.player.speed *= stats.speedMod;
  }

  if (stats.energyMod) {
    state.maxEnergy += stats.energyMod;
    state.energy = Math.min(state.energy + stats.energyMod, state.maxEnergy);
  }

  if (stats.critMod) {
    state.critChance += stats.critMod;
  }

  if (stats.multiShot) {
    state.multiShot += stats.multiShot;
  }
}

export function applyEquippedArtifacts(state: GameState): void {
  const artifacts = state.equippedArtifacts;

  for (const slot of ['CANNON_A', 'CANNON_B', 'ULTIMATE', 'ARMOR', 'MOBILITY'] as ArtifactSlot[]) {
    const artifactId = artifacts[slot];
    if (!artifactId) continue;

    const artifact = ARTIFACTS[artifactId];
    if (!artifact) continue;

    applySingleArtifactStats(state, artifact);
  }
}

/** Equip one artifact mid-run and apply its stats once (no full re-apply). */
export function equipRunArtifact(state: GameState, artifactId: string): boolean {
  const artifact = ARTIFACTS[artifactId];
  if (!artifact) return false;

  state.equippedArtifacts[artifact.slot] = artifactId;
  applySingleArtifactStats(state, artifact);
  return true;
}
