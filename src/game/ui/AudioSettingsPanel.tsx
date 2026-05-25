import React from 'react';
import { useAudioSettings } from '../audio/useAudioSettings';
import './audio-settings.css';

export function AudioSettingsPanel() {
  const {
    settings,
    updateMasterVolume,
    updateMusicVolume,
    updateSFXVolume,
    toggleMute,
  } = useAudioSettings();

  return (
    <div className="audio-settings-panel">
      <h2>Sound</h2>

      <div className="volume-control">
        <label htmlFor="master-vol">Master</label>
        <input
          id="master-vol"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.masterVolume}
          onChange={(e) => updateMasterVolume(parseFloat(e.target.value))}
          className="volume-slider"
        />
        <span className="volume-value">{Math.round(settings.masterVolume * 100)}%</span>
      </div>

      <div className="volume-control">
        <label htmlFor="music-vol">Music</label>
        <input
          id="music-vol"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.musicVolume}
          onChange={(e) => updateMusicVolume(parseFloat(e.target.value))}
          className="volume-slider"
        />
        <span className="volume-value">{Math.round(settings.musicVolume * 100)}%</span>
      </div>

      <div className="volume-control">
        <label htmlFor="sfx-vol">SFX</label>
        <input
          id="sfx-vol"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.sfxVolume}
          onChange={(e) => updateSFXVolume(parseFloat(e.target.value))}
          className="volume-slider"
        />
        <span className="volume-value">{Math.round(settings.sfxVolume * 100)}%</span>
      </div>

      <div className="mute-control">
        <button
          type="button"
          className={`mute-button ${settings.isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
        >
          {settings.isMuted ? '🔇 Unmute' : '🔊 Mute All'}
        </button>
      </div>
    </div>
  );
}
