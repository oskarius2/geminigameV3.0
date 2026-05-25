import { useEffect } from 'react';
import { useAudioManager } from '../game/audio/useAudioManager';
import { AudioManager } from '../game/audio/AudioManager';

interface UseAudioLifecycleConfig {
  /** The current app screen — drives which music track plays. */
  screen: string;
  /** Whether the user has muted music (persisted setting). */
  musicMuted: boolean;
}

/**
 * Owns AudioManager initialisation and the screen/music-mute lifecycle.
 * Replaces `useAudioManager()` + the screen/musicMuted useEffect in App.tsx.
 *
 * Rules:
 *  - MENU screen    → play menu theme (unless muted)
 *  - GAME screen    → music is started externally by startGame/startRailsGame;
 *                     this hook only handles mute and non-game screen cleanup.
 *  - Any other screen → stop all music
 *  - musicMuted on  → stop all music immediately regardless of screen
 */
export function useAudioLifecycle({ screen, musicMuted }: UseAudioLifecycleConfig): void {
  // Initialise the AudioManager singleton (preloads sounds, exposes window.audioManager).
  useAudioManager();

  useEffect(() => {
    if (musicMuted) {
      AudioManager.stopAllMusic();
      return;
    }
    if (screen === 'MENU') {
      AudioManager.playMenuTheme();
      return () => AudioManager.stopAllMusic();
    }
    if (screen !== 'GAME') {
      AudioManager.stopAllMusic();
    }
  }, [screen, musicMuted]);
}
