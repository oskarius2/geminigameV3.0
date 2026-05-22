import {
  COMPANION_IDS,
  getRecommendedCompanion,
  type CompanionId,
} from '../companions/companionDefs';
import {
  applyCompanionProgressToGameState,
  grantCompanionKillXp,
  resolveFirstCompanionGrant,
} from '../companions/companionLeveling';
import { ARTIFACTS } from '../content/artifacts';
import { getUnlockedArtifactIds, isCompanionUnlocked } from '../meta/metaProgress';
import { pickRandomLockedArtifact } from '../meta/unlockSystem';
import { getBossSpec } from '../bosses/bossSpecs';
import { getEffectiveArtifactDropChance } from '../shop/shopEffects';
import { GameState } from '../types';
import {
  getArtifactDropChance,
  getCompanionDropChance,
  pickLootPool,
  LOOT_VARIANT_COUNTS,
} from './dropLogic';
import {
  CROSS_SHIP_LOOT,
  getShipLootPool,
  getShipLootDef,
  UNIVERSAL_LOOT_IDS,
  type ShipLootDef,
  type UniversalLootId,
} from './shipLootDefs';

export { LOOT_VARIANT_COUNTS, getArtifactDropChance, getCompanionDropChance, pickLootPool } from './dropLogic';

export type LootDropKind =
  | 'ship_artifact'
  | 'cross_ship'
  | 'universal'
  | 'companion'
  | 'vault_artifact';

export interface LootDropResult {
  kind: LootDropKind;
  lootId: string;
  name: string;
  description?: string;
}

export function shouldGrantFirstCompanion(state: GameState): boolean {
  return (
    state.stage >= 2 &&
    state.activeCompanionId === null &&
    !state.companionGrantedThisRun
  );
}

function pickFromPool<T>(items: T[], rng = Math.random()): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(rng * items.length)];
}

function pickShipArtifact(
  state: GameState,
  rng = Math.random(),
): ShipLootDef | null {
  const pool = getShipLootPool(state.selectedShip).filter(
    (l) => !state.collectedShipLoot.includes(l.id),
  );
  const fallback = getShipLootPool(state.selectedShip);
  return pickFromPool(pool.length > 0 ? pool : fallback, rng);
}

function pickCrossShipArtifact(
  state: GameState,
  rng = Math.random(),
): ShipLootDef | null {
  const pool = CROSS_SHIP_LOOT.filter((l) => !state.collectedShipLoot.includes(l.id));
  return pickFromPool(pool.length > 0 ? pool : CROSS_SHIP_LOOT, rng);
}

function pickUniversalLoot(rng = Math.random()): UniversalLootId {
  return UNIVERSAL_LOOT_IDS[Math.floor(rng * UNIVERSAL_LOOT_IDS.length)];
}

function pickCompanionUnlock(state: GameState, rng = Math.random()): CompanionId {
  const locked = COMPANION_IDS.filter(
    (id) => !state.companionsUnlocked.includes(id) && !isCompanionUnlocked(id),
  );
  if (locked.length === 0) {
    return pickFromPool(COMPANION_IDS, rng) ?? getRecommendedCompanion(state.selectedShip);
  }
  return pickFromPool(locked, rng) ?? getRecommendedCompanion(state.selectedShip);
}

/**
 * Roll loot on enemy kill. Returns null if no drop.
 * Gameplay wiring (spawn entity / apply effect) lives in App.tsx later.
 */
export function rollLootOnKill(
  state: GameState,
  rng = Math.random(),
): LootDropResult | null {
  if (shouldGrantFirstCompanion(state)) {
    const companionId = resolveFirstCompanionGrant(state);
    return {
      kind: 'companion',
      lootId: companionId,
      name: companionId,
      description: 'First companion unlocked.',
    };
  }

  const companionRoll = rng;
  const companionChance = getCompanionDropChance(state.stage);
  if (
    state.stage >= 2 &&
    companionRoll < companionChance &&
    state.companionsUnlocked.length < COMPANION_IDS.length
  ) {
    const companionId = pickCompanionUnlock(state, companionRoll);
    if (!state.companionsUnlocked.includes(companionId)) {
      return {
        kind: 'companion',
        lootId: companionId,
        name: companionId,
        description: 'New companion type unlocked.',
      };
    }
  }

  const artifactRoll = Math.random();
  const artifactChance = getEffectiveArtifactDropChance(state);
  if (artifactRoll >= artifactChance) return null;

  const vaultId = pickRandomLockedArtifact(
    getUnlockedArtifactIds(),
    undefined,
    () => artifactRoll,
  );
  if (vaultId && ARTIFACTS[vaultId]) {
    return {
      kind: 'vault_artifact',
      lootId: vaultId,
      name: ARTIFACTS[vaultId].name,
      description: ARTIFACTS[vaultId].description,
    };
  }

  const poolKind = pickLootPool(Math.random()) as LootDropKind;

  if (poolKind === 'ship_artifact') {
    const loot = pickShipArtifact(state, rng);
    if (!loot) return null;
    return {
      kind: 'ship_artifact',
      lootId: loot.id,
      name: loot.name,
      description: loot.description,
    };
  }

  if (poolKind === 'cross_ship') {
    const loot = pickCrossShipArtifact(state, rng);
    if (!loot) return null;
    return {
      kind: 'cross_ship',
      lootId: loot.id,
      name: loot.name,
      description: loot.description,
    };
  }

  const universalId = pickUniversalLoot(rng);
  const labels: Record<UniversalLootId, string> = {
    health_pickup: 'Health Pickup',
    xp_orb: 'Experience Orb',
    scrap_bundle: 'Scrap Bundle',
  };
  return {
    kind: 'universal',
    lootId: universalId,
    name: labels[universalId],
  };
}

/** Apply a resolved loot drop to run state (collection tracking only for now). */
export function applyLootDrop(state: GameState, drop: LootDropResult): void {
  if (drop.kind === 'companion') {
    const id = drop.lootId as CompanionId;
    if (!state.companionsUnlocked.includes(id)) {
      state.companionsUnlocked.push(id);
    }
    if (state.activeCompanionId === null) {
      state.activeCompanionId = id;
    }
    state.companionGrantedThisRun = true;
    applyCompanionProgressToGameState(state);
    return;
  }

  if (drop.kind === 'ship_artifact' || drop.kind === 'cross_ship') {
    if (!state.collectedShipLoot.includes(drop.lootId)) {
      state.collectedShipLoot.push(drop.lootId);
    }
    const def = getShipLootDef(drop.lootId);
    if (def && !state.passives.includes(def.effectId)) {
      state.passives.push(def.effectId);
    }
  }
}

/**
 * Guaranteed bonus loot roll when a survival stage boss is defeated.
 * Returns null if roll fails or catalog exhausted.
 */
export function rollBossLoot(
  state: GameState,
  bossId: string | null,
  rng = Math.random(),
): LootDropResult | null {
  if (!bossId) return null;
  const spec = getBossSpec(bossId);
  const chance = spec?.lootBonusChance ?? 0.5;
  if (rng > chance) return null;

  const boosted = { ...state, stage: Math.max(state.stage, 3) };
  const artifactChance = getEffectiveArtifactDropChance(boosted) + 0.25;
  if (Math.random() < Math.min(0.95, artifactChance)) {
    const vaultId = pickRandomLockedArtifact(
      getUnlockedArtifactIds(),
      undefined,
      () => rng,
    );
    if (vaultId && ARTIFACTS[vaultId]) {
      return {
        kind: 'vault_artifact',
        lootId: vaultId,
        name: ARTIFACTS[vaultId].name,
        description: ARTIFACTS[vaultId].description,
      };
    }
  }

  return rollLootOnKill(boosted, rng);
}

export { grantCompanionKillXp } from '../companions/companionLeveling';
