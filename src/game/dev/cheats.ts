import {
  beginBossWarp,
  BOSS_WARP_SWAP_AT,
  pickRandomBoss,
  restoreMainWorldAfterBoss,
} from '../content/bossArenas';
import { spawnMiniBoss } from '../bosses/miniBossSpawn';
import type { MiniBossId } from '../bosses/miniBossDefs';
import { BOSS_DEFINITIONS, BossDefinition } from '../content/bosses';
import { Entity, EnemyType, GameState } from '../types';

/** Shown in-game when dev cheats are active. */
export const DEV_CHEAT_CONTROLS_HINT =
  'Shift+1–7 boss | Shift+Q–Y miniboss | Shift+B slump | Shift+K kvot | Shift+N warp';

export const DEV_MINI_BOSS_KEYS: { key: string; id: MiniBossId; label: string }[] = [
  { key: 'q', id: 'shockwave_sentinel', label: 'Chockvåg' },
  { key: 'w', id: 'eclipse_dasher', label: 'Eklips' },
  { key: 'e', id: 'void_harbinger', label: 'Tomhet' },
  { key: 'r', id: 'plasma_splitter', label: 'Plasma' },
  { key: 't', id: 'chronos_guardian', label: 'Kronos' },
  { key: 'y', id: 'swarm_overlord', label: 'Svärm' },
];

const DEV_CHEATS_STORAGE_KEY = 'geminigame-dev-cheats';

export function isDevCheatsEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('devCheats') || params.get('dev') === '1') return true;
  try {
    return localStorage.getItem(DEV_CHEATS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function enableDevCheatsInBrowser(): void {
  try {
    localStorage.setItem(DEV_CHEATS_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function resolveDevBoss(idOrIndex: string | number): BossDefinition | null {
  if (typeof idOrIndex === 'number') {
    return BOSS_DEFINITIONS[idOrIndex] ?? null;
  }
  const normalized = idOrIndex.trim().toLowerCase();
  return BOSS_DEFINITIONS.find((b) => b.id === normalized) ?? null;
}

export function readBossIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('boss');
}

/** Force boss hyperspace + arena (Survival only). */
export function triggerDevBossWarp(
  state: GameState,
  boss: BossDefinition,
  viewWidth: number,
  viewHeight: number
): boolean {
  if (state.gameMode !== 'NORMAL') return false;

  if (state.inBossArena || state.bossArenaTransition > 0 || state.bossActive) {
    if (state.inBossArena && state.mainWorldSnapshot) {
      restoreMainWorldAfterBoss(state, viewWidth, viewHeight);
    }
    state.bossActive = false;
    state.bossArenaTransition = 0;
    state.bossArenaSwapped = false;
    state.inBossArena = false;
    state.activeBossId = null;
    state.enemies = state.enemies.filter((e) => e.enemyType !== EnemyType.BOSS);
    state.projectiles = [];
    state.hazards = [];
  }

  state.enemiesToKill = 0;
  state.lastBossId = boss.id;
  beginBossWarp(state, boss);
  return true;
}

export function devClearKillQuota(state: GameState): void {
  state.enemiesToKill = 0;
}

export function devSkipWarpAnimation(state: GameState): void {
  if (state.bossArenaTransition > 0) {
    state.bossArenaTransition = Math.min(state.bossArenaTransition, BOSS_WARP_SWAP_AT - 0.05);
  }
}

export function triggerDevMiniBossSpawn(
  state: GameState,
  miniBossId: MiniBossId,
): Entity | null {
  if (state.gameMode !== 'NORMAL') return null;
  return spawnMiniBoss(state, miniBossId);
}

export interface DevCheatHandlers {
  onBossWarp: (boss: BossDefinition) => void;
  onMiniBossSpawn: (id: MiniBossId) => void;
  onClearQuota: () => void;
  onSkipWarp: () => void;
}

export interface DevCheatKeyResult {
  handled: boolean;
  toast?: string;
}

export function tryDevCheatKeydown(
  e: KeyboardEvent,
  handlers: DevCheatHandlers
): DevCheatKeyResult | null {
  if (!isDevCheatsEnabled()) return null;
  if (!e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return null;
  if (e.repeat) return null;

  const key = e.key.toLowerCase();

  if (key === 'b') {
    e.preventDefault();
    const boss = pickRandomBoss(3);
    handlers.onBossWarp(boss);
    return { handled: true, toast: `Boss-warp: ${boss.name}` };
  }

  if (key === 'k') {
    e.preventDefault();
    handlers.onClearQuota();
    return { handled: true, toast: 'Döda en fiende till — boss-warp triggas' };
  }

  if (key === 'n') {
    e.preventDefault();
    handlers.onSkipWarp();
    return { handled: true, toast: 'Snabb warp' };
  }

  const digit = parseInt(key, 10);
  if (digit >= 1 && digit <= BOSS_DEFINITIONS.length) {
    e.preventDefault();
    const boss = BOSS_DEFINITIONS[digit - 1];
    handlers.onBossWarp(boss);
    return { handled: true, toast: `Boss-warp: ${boss.name}` };
  }

  const miniEntry = DEV_MINI_BOSS_KEYS.find((m) => m.key === key);
  if (miniEntry) {
    e.preventDefault();
    handlers.onMiniBossSpawn(miniEntry.id);
    return { handled: true, toast: `Miniboss: ${miniEntry.label}` };
  }

  return null;
}
