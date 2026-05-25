import { useEffect } from 'react';
import { AudioManager, loadBoomBapAudioSettings } from './AudioManager';
import { resumeAudioContext } from './audioEngine';

// Expose as a global for browser-console debugging: window.audioManager.*
declare global {
  interface Window {
    audioManager: typeof AudioManager;
  }
}

// Assign at module scope so window.audioManager is available immediately on
// import — before any React render or useEffect fires.
if (typeof window !== 'undefined') {
  window.audioManager = AudioManager;
}

/**
 * Resume all suspended AudioContexts on first user interaction.
 * Critical for iOS Safari, which suspends AudioContext until a user gesture.
 */
function ensureAudioContextsRunning(): void {
  // Resume the Web Audio context (procedural music/sfx)
  resumeAudioContext();

  // Resume Howler's AudioContext if it exists and is suspended
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const howlerCtx = (window as any).Howler?.ctx;
  if (howlerCtx && howlerCtx.state === 'suspended') {
    void howlerCtx.resume();
  }
}

export function useAudioManager(): typeof AudioManager {
  useEffect(() => {
    // Howler pool/unlock configured at AudioManager module load (before MUSIC const).
    loadBoomBapAudioSettings();
    void AudioManager.preloadAllSounds();
    // Redundant but explicit — keeps the assignment here for future readers.
    window.audioManager = AudioManager;

    // iOS Safari: Resume AudioContext on first touch/click
    // Use capture phase to ensure we catch it before any other handlers
    const resumeOnInteraction = () => {
      ensureAudioContextsRunning();
    };

    // Listen for both touchstart (mobile) and click (desktop/fallback)
    document.addEventListener('touchstart', resumeOnInteraction, {
      once: true,
      capture: true,
    });
    document.addEventListener('click', resumeOnInteraction, {
      once: true,
      capture: true,
    });

    // Also resume on page visibility change (iOS Safari background/foreground)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        ensureAudioContextsRunning();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('touchstart', resumeOnInteraction, { capture: true });
      document.removeEventListener('click', resumeOnInteraction, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return AudioManager;
}
