import { ARTIFACTS } from '../content/artifacts';
import type { ArtifactSlot } from '../types';

const DEV_LOG = import.meta.env.DEV;

/** Dev-only logging for inventory / loadout open and artifact spawn consistency. */
export function logInventoryOpen(
  source: string,
  equipped: Record<ArtifactSlot, string | null>,
  runUnlocked?: string[],
): void {
  if (!DEV_LOG) return;
  console.log('Opening inventory at', Date.now(), { source });
  logArtifactStateSync(equipped, runUnlocked);
}

export function logArtifactSpawned(artifactId: string): void {
  if (!DEV_LOG) return;
  console.log('Artifact spawned:', artifactId);
}

export function logArtifactStateSync(
  equipped: Record<ArtifactSlot, string | null>,
  runUnlocked?: string[],
): void {
  if (!DEV_LOG) return;
  const equippedIds = (Object.keys(equipped) as ArtifactSlot[])
    .map((slot) => equipped[slot])
    .filter((id): id is string => Boolean(id));
  const run = runUnlocked ?? [];
  const missingCatalog = equippedIds.filter((id) => !ARTIFACTS[id]);
  const equippedNotInRun = equippedIds.filter((id) => !run.includes(id));
  const inRunNotEquipped = run.filter((id) => !equippedIds.includes(id));
  console.log('[inventory] state sync', {
    equippedIds,
    runArtifactsUnlockedThisRun: run,
    missingCatalog,
    equippedNotInRun,
    inRunNotEquipped,
  });
}
