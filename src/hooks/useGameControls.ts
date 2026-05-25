import { useRef, useEffect, type MutableRefObject, type RefObject } from 'react';
import { loadKeybinds, keyMatches, type KeybindAction } from '../game/settings/keybinds';
import type { GameState } from '../game/types';
import { tryDevCheatKeydown, type DevCheatHandlers } from '../game/dev/cheats';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ControlState {
  move: { x: number; y: number };
  aim: { x: number; y: number };
  isFiring: boolean;
  wantDash: boolean;
  wantUltimate: boolean;
  wantCompanionAbility: boolean;
  mousePos: { x: number; y: number };
  keys: Set<string>;
}

interface GameControlsCallbacks {
  /** Called when the game state should be synced to React UI state. */
  syncUi: () => void;
  /** Show a temporary dev-cheat toast message. */
  showDevCheatToast: (msg: string) => void;
  /** Toggle whether the in-run achievement list is visible. */
  toggleAchievementsVisible: () => void;
  /** Toggle game pause (reads/writes gameStateRef internally). */
  togglePause: () => void;
  /** Close the options overlay (Escape while options is open). */
  closeOptions: () => void;
}

interface UseGameControlsConfig {
  /** The current app screen. Keyboard handling is active only on 'GAME'. */
  screen: string;
  isOptionsOpen: boolean;
  devCheatsActive: boolean;
  showLevelUp: boolean;
  showArtifactUnlock: boolean;
  unlockToastsCount: number;
  /** Stable ref to the live game state (mutated each frame). */
  gameStateRef: RefObject<GameState | null>;
  /** Stable ref to dev-cheat handlers (wired up from App.tsx). */
  devCheatHandlersRef: RefObject<DevCheatHandlers>;
  callbacks: GameControlsCallbacks;
}

export interface GameControlsResult {
  /** Mutable ref containing the current input state — read each frame by the game loop. */
  controls: MutableRefObject<ControlState>;
  /** Mutable ref to the current keybindings — updated when the user changes settings. */
  keybindsRef: ReturnType<typeof useRef<ReturnType<typeof loadKeybinds>>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const MOVEMENT_ACTIONS: KeybindAction[] = [
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
];

/**
 * Owns the raw input control ref and all keyboard/mouse/pointer event
 * listeners. Replaces ~120 lines of event-listener boilerplate in App.tsx.
 *
 * Uses a "live deps ref" pattern: the event handlers are registered once on
 * mount but always read the latest state/callbacks from a ref, avoiding stale
 * closures without needing to re-register listeners on every render.
 */
export function useGameControls({
  screen,
  isOptionsOpen,
  devCheatsActive,
  showLevelUp,
  showArtifactUnlock,
  unlockToastsCount,
  gameStateRef,
  devCheatHandlersRef,
  callbacks,
}: UseGameControlsConfig): GameControlsResult {
  const controls = useRef<ControlState>({
    move: { x: 0, y: 0 },
    aim: { x: 0, y: 0 },
    isFiring: false,
    wantDash: false,
    wantUltimate: false,
    wantCompanionAbility: false,
    mousePos: { x: 0, y: 0 },
    keys: new Set<string>(),
  });

  const keybindsRef = useRef(loadKeybinds());

  // Single ref that's updated every render so event handlers always see fresh
  // values without needing to be re-registered.
  const liveRef = useRef({
    screen,
    isOptionsOpen,
    devCheatsActive,
    showLevelUp,
    showArtifactUnlock,
    unlockToastsCount,
  });
  const callbacksRef = useRef(callbacks);

  // Update every render — no deps array intentional.
  liveRef.current = { screen, isOptionsOpen, devCheatsActive, showLevelUp, showArtifactUnlock, unlockToastsCount };
  callbacksRef.current = callbacks;

  useEffect(() => {
    const syncMovementKeys = (e: KeyboardEvent, down: boolean) => {
      const binds = keybindsRef.current;
      for (const action of MOVEMENT_ACTIONS) {
        if (!keyMatches(binds[action], e)) continue;
        if (down) controls.current.keys.add(action);
        else controls.current.keys.delete(action);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        screen: s,
        isOptionsOpen: optOpen,
        devCheatsActive: cheats,
        showLevelUp: lvlUp,
        showArtifactUnlock: artUnlock,
        unlockToastsCount: toastCount,
      } = liveRef.current;
      const { syncUi, showDevCheatToast, toggleAchievementsVisible, togglePause, closeOptions } =
        callbacksRef.current;

      if (optOpen) {
        if (e.key === 'Escape') closeOptions();
        return;
      }

      if (s === 'GAME' && cheats) {
        const cheat = tryDevCheatKeydown(e, devCheatHandlersRef.current!);
        if (cheat?.handled) {
          if (cheat.toast) showDevCheatToast(cheat.toast);
          syncUi();
          return;
        }
      }

      const binds = keybindsRef.current;
      syncMovementKeys(e, true);

      if (keyMatches(binds.dash, e)) {
        if (gameStateRef.current?.gameMode === 'ON_RAILS') {
          controls.current.isFiring = true;
        } else {
          controls.current.wantDash = true;
        }
      }
      if (keyMatches(binds.ultimate, e)) controls.current.wantUltimate = true;
      if (keyMatches(binds.companionAbility, e)) controls.current.wantCompanionAbility = true;
      if (keyMatches(binds.weaponSwap, e)) controls.current.keys.add('weaponSwap');
      if (keyMatches(binds.weaponA, e)) controls.current.keys.add('weaponA');
      if (keyMatches(binds.weaponB, e)) controls.current.keys.add('weaponB');

      const canToggleAchievements = toastCount > 0 && !lvlUp && !artUnlock;
      if (canToggleAchievements && keyMatches(binds.achievements, e)) {
        e.preventDefault();
        toggleAchievementsVisible();
        return;
      }

      if (s === 'GAME' && keyMatches(binds.pause, e)) {
        e.preventDefault();
        togglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const { isOptionsOpen: optOpen } = liveRef.current;
      if (optOpen) return;
      syncMovementKeys(e, false);
      const binds = keybindsRef.current;
      if (keyMatches(binds.dash, e) && gameStateRef.current?.gameMode === 'ON_RAILS') {
        controls.current.isFiring = false;
      }
      if (keyMatches(binds.weaponSwap, e)) controls.current.keys.delete('weaponSwap');
      if (keyMatches(binds.weaponA, e)) controls.current.keys.delete('weaponA');
      if (keyMatches(binds.weaponB, e)) controls.current.keys.delete('weaponB');
    };

    const handlePointerMove = (e: PointerEvent) => {
      controls.current.mousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        controls.current.isFiring = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && gameStateRef.current?.gameMode !== 'ON_RAILS') {
        controls.current.isFiring = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — handlers read fresh values from liveRef/callbacksRef

  return { controls, keybindsRef };
}

