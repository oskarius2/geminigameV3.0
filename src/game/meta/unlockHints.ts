import { ARTIFACTS } from '../content/artifacts';
import { BuffRarity } from '../types';
import type { CompanionId } from '../types';
import { getCompanionDef } from '../companions/companionDefs';
import { isArtifactUnlocked, isCompanionUnlocked, type MetaProgress } from './metaProgress';

const RARITY_STAGE_HINT: Record<BuffRarity, string> = {
  [BuffRarity.COMMON]: 'Beat Stage 1',
  [BuffRarity.RARE]: 'Beat Stage 2+',
  [BuffRarity.EPIC]: 'Beat Stage 3+',
  [BuffRarity.LEGENDARY]: 'Beat Stage 4+',
  [BuffRarity.EXCLUSIVE]: 'Survive Stage 5+',
  [BuffRarity.MYSTERY]: 'Find in run',
};

export function getArtifactUnlockHint(
  artifactId: string,
  _progress?: MetaProgress,
): string {
  const art = ARTIFACTS[artifactId];
  if (!art) return 'Find in run';
  return `${RARITY_STAGE_HINT[art.rarity] ?? 'Find in run'}, buff cards, bosses, or loot drops`;
}

export function getCompanionUnlockHint(companionId: CompanionId): string {
  const def = getCompanionDef(companionId);
  if (!def) return 'Unlock in run';
  if (companionId === 'guardian') {
    return 'Clear Stage 2 (first companion guaranteed)';
  }
  return 'Random drop from Stage 3+ kills';
}

export function getCompanionDisplayName(companionId: CompanionId): string {
  return getCompanionDef(companionId)?.name ?? companionId;
}

export function countLockedArtifacts(progress: MetaProgress): number {
  return Object.keys(ARTIFACTS).filter((id) => !isArtifactUnlocked(id, progress)).length;
}

export function countLockedCompanions(progress: MetaProgress): number {
  const ids: CompanionId[] = ['guardian', 'scout', 'healer', 'gunner'];
  return ids.filter((id) => !isCompanionUnlocked(id, progress)).length;
}
