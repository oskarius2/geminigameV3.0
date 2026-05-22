import { Vector2 } from '../utils/vector';
import type { Entity, GameState } from '../types';
import type { CompanionId } from '../types';
import type { CompanionRuntime } from './companionTypes';

/**
 * Live entity view used by companion AI / passives.
 * When built via {@link fromGameState}, this is the same object as the app entity.
 */
export type CompanionEntityRef = Entity;

export interface CompanionPlayerRef {
  id: string;
  pos: Vector2;
  health: number;
  maxHealth: number;
  speed: number;
  velocity: Vector2;
  aimDir?: Vector2;
}

/**
 * Standalone snapshot for companion systems — decoupled from the full GameState type.
 * Convert at boundaries via {@link fromGameState} / {@link applyCompanionGameStateToApp}.
 */
export interface CompanionGameState {
  gameMode: string;
  isPaused: boolean;
  stage: number;
  player: CompanionPlayerRef;
  enemies: CompanionEntityRef[];
  projectiles: CompanionEntityRef[];
  world: { width: number; height: number };
  baseDamage: number;
  activeCompanionId: CompanionId | null;
  companionLevel: number;
  companionXp: number;
  companionsUnlocked: CompanionId[];
  companionGrantedThisRun: boolean;
  selectedShip: string;
  companionRuntime: CompanionRuntime | null;
  /** True while the player is in a mobility dash (NORMAL survival). */
  isPlayerDashing: boolean;
  threatLevel: number;
}

/** Subset written by meta XP / loadout (leveling module). */
export interface CompanionRunSlice {
  activeCompanionId: CompanionId | null;
  companionLevel: number;
  companionXp: number;
  companionsUnlocked: CompanionId[];
  companionGrantedThisRun: boolean;
  selectedShip: string;
}

function copyUnlockedList(state: GameState): CompanionId[] {
  const raw = state.companionsUnlocked;
  return Array.isArray(raw) ? [...raw] : [];
}

/** Build companion view from the live app GameState (shared entity arrays). */
export function fromGameState(state: GameState): CompanionGameState {
  return {
    gameMode: state.gameMode,
    isPaused: state.isPaused,
    stage: state.stage,
    player: {
      id: state.player.id,
      pos: state.player.pos,
      health: state.player.health,
      maxHealth: state.player.maxHealth,
      speed: state.player.speed,
      velocity: state.player.velocity,
      aimDir: state.player.aimDir,
    },
    /** Live arrays — companion combat must push into the same lists the sim uses. */
    enemies: state.enemies,
    projectiles: state.projectiles,
    world: { ...state.world },
    baseDamage: state.baseDamage,
    activeCompanionId: state.activeCompanionId,
    companionLevel: state.companionLevel,
    companionXp: state.companionXp,
    companionsUnlocked: copyUnlockedList(state),
    companionGrantedThisRun: state.companionGrantedThisRun,
    selectedShip: state.selectedShip,
    companionRuntime: state.companionRuntime,
    isPlayerDashing: state.isDashing ?? false,
    threatLevel: state.threatLevel ?? 0,
  };
}

/** Push companion-system mutations back into the app GameState. */
export function applyCompanionGameStateToApp(
  companionState: CompanionGameState,
  app: GameState,
): void {
  app.player.health = companionState.player.health;
  app.player.speed = companionState.player.speed;
  app.baseDamage = companionState.baseDamage;
  app.companionLevel = companionState.companionLevel;
  app.companionXp = companionState.companionXp;
  app.companionsUnlocked = [...companionState.companionsUnlocked];
  app.companionGrantedThisRun = companionState.companionGrantedThisRun;
  app.activeCompanionId = companionState.activeCompanionId;
  app.companionRuntime = companionState.companionRuntime;

  /* enemy/projectile refs are live Entity objects — health/hitTimer already mutated in place */
}

export function sliceRunFromGameState(state: GameState): CompanionRunSlice {
  return {
    activeCompanionId: state.activeCompanionId,
    companionLevel: state.companionLevel,
    companionXp: state.companionXp,
    companionsUnlocked: copyUnlockedList(state),
    companionGrantedThisRun: state.companionGrantedThisRun,
    selectedShip: state.selectedShip,
  };
}

export function applyRunSliceToGameState(slice: CompanionRunSlice, app: GameState): void {
  app.activeCompanionId = slice.activeCompanionId;
  app.companionLevel = slice.companionLevel;
  app.companionXp = slice.companionXp;
  app.companionsUnlocked = [...slice.companionsUnlocked];
  app.companionGrantedThisRun = slice.companionGrantedThisRun;
}

export function applyRunSliceToCompanionState(
  slice: CompanionRunSlice,
  companionState: CompanionGameState,
): void {
  companionState.activeCompanionId = slice.activeCompanionId;
  companionState.companionLevel = slice.companionLevel;
  companionState.companionXp = slice.companionXp;
  companionState.companionsUnlocked = [...slice.companionsUnlocked];
  companionState.companionGrantedThisRun = slice.companionGrantedThisRun;
}

/** True when the value is the full app simulation state (not a placeholder view). */
export function isAppGameState(
  state: GameState | CompanionGameState,
): state is GameState {
  return 'camera' in state;
}

/** Normalize app or placeholder state to the companion view. */
export function toCompanionGameState(
  state: GameState | CompanionGameState,
): CompanionGameState {
  return isAppGameState(state) ? fromGameState(state) : state;
}
