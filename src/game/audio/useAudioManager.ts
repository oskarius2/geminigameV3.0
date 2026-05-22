import { useEffect } from 'react';
import { AudioManager, loadBoomBapAudioSettings } from './AudioManager';

export function useAudioManager(): typeof AudioManager {
  useEffect(() => {
    loadBoomBapAudioSettings();
    void AudioManager.preloadAllSounds();
  }, []);

  return AudioManager;
}
