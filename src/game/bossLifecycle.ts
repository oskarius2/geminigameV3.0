import { EnemyType, Entity, GameState } from './types';

/** Snapshot for dev-only boss transition debugging. */
export interface BossLifecycleSnapshot {
  bossActive: boolean;
  activeBossId: string | null;
  inBossArena: boolean;
  bossArenaTransition: number;
  bossArenaSwapped: boolean;
  pendingArenaRestore: boolean;
  stageTransition: number;
  bossInEnemies: number;
  liveBossInEnemies: number;
  stage: number;
  enemiesToKill: number;
}

export function countBossesInState(state: GameState): { total: number; live: number } {
  let total = 0;
  let live = 0;
  for (const e of state.enemies) {
    if (e.enemyType !== EnemyType.BOSS) continue;
    total += 1;
    if (e.health > 0) live += 1;
  }
  return { total, live };
}

export function getBossLifecycleSnapshot(state: GameState): BossLifecycleSnapshot {
  const { total, live } = countBossesInState(state);
  return {
    bossActive: state.bossActive,
    activeBossId: state.activeBossId,
    inBossArena: state.inBossArena,
    bossArenaTransition: state.bossArenaTransition,
    bossArenaSwapped: state.bossArenaSwapped,
    pendingArenaRestore: state.pendingArenaRestore,
    stageTransition: state.stageTransition,
    bossInEnemies: total,
    liveBossInEnemies: live,
    stage: state.stage,
    enemiesToKill: state.enemiesToKill,
  };
}

/** True while boss death / arena restore / warp / stage intermission — no spawns. */
export function isBossTransitioning(state: GameState): boolean {
  return (
    state.stageTransition > 0 ||
    state.pendingArenaRestore ||
    state.bossArenaTransition > 0
  );
}

export function hasLiveBoss(state: GameState): boolean {
  return countBossesInState(state).live > 0;
}

/**
 * Single source of truth when a survival boss entity dies.
 * Prevents bossActive staying true with no live boss (endless minion/boss respawn).
 */
export function applyBossDefeatState(state: GameState): void {
  state.bossActive = false;
  state.activeBossId = null;
  state.inBossArena = false;
  state.pendingArenaRestore = true;
  state.stageTransition = 90;
  state.runBossesDefeated = (state.runBossesDefeated ?? 0) + 1;
  state.enemies = state.enemies.filter(
    (e) => !(e.enemyType === EnemyType.BOSS && e.health <= 0)
  );
}

export function logBossLifecycle(state: GameState, tag: string): void {
  if (!import.meta.env.DEV) return;
  console.log('[BOSS LIFECYCLE]', tag, getBossLifecycleSnapshot(state));
}
