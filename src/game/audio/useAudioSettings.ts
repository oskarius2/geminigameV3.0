import { useCallback, useState } from 'react';
import { AudioManager, type AudioSettings } from './AudioManager';

export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(AudioManager.getSettings());

  const refresh = useCallback(() => {
    setSettings(AudioManager.getSettings());
  }, []);

  const updateMasterVolume = useCallback(
    (vol: number) => {
      AudioManager.setMasterVolume(vol);
      refresh();
    },
    [refresh]
  );

  const updateMusicVolume = useCallback(
    (vol: number) => {
      AudioManager.setMusicVolume(vol);
      refresh();
    },
    [refresh]
  );

  const updateSFXVolume = useCallback(
    (vol: number) => {
      AudioManager.setSFXVolume(vol);
      refresh();
    },
    [refresh]
  );

  const toggleMute = useCallback(() => {
    const next = !AudioManager.getSettings().isMuted;
    AudioManager.setMuted(next);
    refresh();
  }, [refresh]);

  return {
    settings,
    updateMasterVolume,
    updateMusicVolume,
    updateSFXVolume,
    toggleMute,
  };
}
