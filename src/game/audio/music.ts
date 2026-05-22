/**
 * Music API — survival mode uses layered VOID PURSUIT director.
 */

import {
  duckMusic,
  getChannelUserVolume,
  isMusicMuted,
  loadAudioSettings,
  persistMusicMuted,
  persistMusicVolume,
  setChannelMuted,
  setChannelUserVolume,
} from './audioEngine';
import {
  isSurvivalMusicRunning,
  startSurvivalMusic,
  stopSurvivalMusic,
} from './survivalMusic';

export function loadMusicSettings(): void {
  loadAudioSettings();
}

export function setMusicMuted(value: boolean): void {
  persistMusicMuted(value);
  setChannelMuted('music', value);
  if (value) stopMusic();
}

export function setMusicVolume(value: number): void {
  persistMusicVolume(value);
  setChannelUserVolume('music', value);
}

export function getMusicMuted(): boolean {
  return isMusicMuted();
}

export { duckMusic };

export function startMusic(): void {
  if (isMusicMuted()) return;
  if (!isSurvivalMusicRunning()) startSurvivalMusic();
}

export function stopMusic(): void {
  stopSurvivalMusic();
}

export function getMusicVolume(): number {
  loadAudioSettings();
  return getChannelUserVolume('music');
}
