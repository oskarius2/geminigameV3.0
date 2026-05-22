import { useEffect } from 'react';
import { AudioManager, loadBoomBapAudioSettings } from './AudioManager';

export function useAudioManager(): typeof AudioManager {
  useEffect(() => {
    // Howler pool/unlock configured at AudioManager module load (before MUSIC const).
    loadBoomBapAudioSettings();
    void AudioManager.preloadAllSounds();
  }, []);

  return AudioManager;
}
