import { Howl, Howler } from 'howler';

/** Must run before any `new Howl()` in this module. */
Howler.autoUnlock = true;
(Howler as typeof Howler & { html5PoolSize?: number }).html5PoolSize = 20;

import {
  persistMusicMuted,
  persistMusicVolume,
  persistSfxMuted,
  persistSfxVolume,
  scheduleMusicDuck,
  setChannelMuted,
  setChannelUserVolume,
} from './audioEngine';

const STORAGE_KEY = 'boomBapAudioSettings';

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
}

type MusicKey =
  | 'menuTheme'
  | 'battleStage1'
  | 'battleStage3'
  | 'battleStage5'
  | 'bossTheme'
  | 'victorySfx';

type SfxKey = 'hover' | 'click' | 'scratch' | 'cassette';
type WeaponKey = 'primary' | 'secondary' | 'reload' | 'emptyClick';

interface ManagedSound {
  howl: Howl;
  loaded: boolean;
  failed: boolean;
  baseVolume: number;
  srcLabel: string;
  loop: boolean;
}

const warnedMissingSrc = new Set<string>();

function createManaged(
  src: string[],
  opts: { loop?: boolean; volume: number }
): ManagedSound {
  const srcLabel = src[0] ?? 'unknown';
  const managed: ManagedSound = {
    howl: null as unknown as Howl,
    loaded: false,
    failed: false,
    baseVolume: opts.volume,
    srcLabel,
    loop: opts.loop ?? false,
  };

  try {
    managed.howl = new Howl({
      src,
      loop: opts.loop ?? false,
      volume: opts.volume,
      preload: true,
      /** Web Audio decode — avoids exhausting the small HTML5 `<audio>` pool. */
      html5: false,
      onload: () => {
        managed.loaded = true;
      },
      onloaderror: (_id, error) => {
        managed.failed = true;
        if (!warnedMissingSrc.has(srcLabel)) {
          warnedMissingSrc.add(srcLabel);
          console.warn(`[Audio] File not found or failed to load: ${srcLabel}`, error);
        }
      },
      onplayerror: (_id, error) => {
        if (!warnedMissingSrc.has(`${srcLabel}:play`)) {
          warnedMissingSrc.add(`${srcLabel}:play`);
          console.warn(`[Audio] Playback failed: ${srcLabel}`, error);
        }
      },
    });
  } catch (error) {
    managed.failed = true;
    console.warn(`[Audio] Failed to create Howl for: ${srcLabel}`, error);
  }

  return managed;
}

const MUSIC: Record<MusicKey, ManagedSound> = {
  menuTheme: createManaged(['/audio/music/menu-boombap.mp3'], {
    loop: true,
    volume: 0.5,
  }),
  battleStage1: createManaged(['/audio/music/battle-loop-stage1.mp3'], {
    loop: true,
    volume: 0.4,
  }),
  battleStage3: createManaged(['/audio/music/battle-loop-stage3.mp3'], {
    loop: true,
    volume: 0.4,
  }),
  battleStage5: createManaged(['/audio/music/battle-loop-stage5.mp3'], {
    loop: true,
    volume: 0.4,
  }),
  bossTheme: createManaged(['/audio/music/boss-theme.mp3'], {
    loop: true,
    volume: 0.45,
  }),
  victorySfx: createManaged(['/audio/music/victory-stab.mp3'], {
    volume: 0.7,
  }),
};

const UI_SOUNDS: Record<SfxKey, ManagedSound> = {
  hover: createManaged(['/audio/ui/hihat-hover.wav'], { volume: 0.3 }),
  click: createManaged(['/audio/ui/mpc-click.wav'], { volume: 0.7 }),
  scratch: createManaged(['/audio/ui/vinyl-scratch.wav'], { volume: 0.5 }),
  cassette: createManaged(['/audio/ui/cassette-click.wav'], { volume: 0.4 }),
};

const WEAPON_SOUNDS: Record<WeaponKey, ManagedSound> = {
  primary: createManaged(['/audio/weapons/snare-punch-primary.wav'], {
    volume: 0.6,
  }),
  secondary: createManaged(['/audio/weapons/heavy-bass-secondary.wav'], {
    volume: 0.8,
  }),
  reload: createManaged(['/audio/weapons/reload-mechanical.wav'], {
    volume: 0.5,
  }),
  emptyClick: createManaged(['/audio/weapons/empty-click.wav'], {
    volume: 0.3,
  }),
};

let audioSettings: AudioSettings = {
  masterVolume: 0.9,   // -1 dB headroom on master
  musicVolume: 0.65,   // Music sits under SFX (-3.7 dB relative)
  sfxVolume: 0.85,     // SFX punchy and present
  isMuted: false,
};

let currentMusicKey: MusicKey | null = null;
let duckRestoreTimer: ReturnType<typeof setTimeout> | null = null;

function effectiveMaster(): number {
  return audioSettings.isMuted ? 0 : audioSettings.masterVolume;
}

function musicGain(base: number): number {
  const m = effectiveMaster();
  if (m <= 0) return 0;
  return base * audioSettings.musicVolume * m;
}

function sfxGain(base: number): number {
  const m = effectiveMaster();
  if (m <= 0) return 0;
  return base * audioSettings.sfxVolume * m;
}

function applyManagedVolume(managed: ManagedSound, channel: 'music' | 'sfx'): void {
  if (managed.failed) return;
  const vol =
    channel === 'music'
      ? musicGain(managed.baseVolume)
      : sfxGain(managed.baseVolume);
  managed.howl.volume(vol);
}

function applyVolumes(): void {
  const master = effectiveMaster();
  Howler.volume(master);

  Object.values(MUSIC).forEach((s) => applyManagedVolume(s, 'music'));
  Object.values(UI_SOUNDS).forEach((s) => applyManagedVolume(s, 'sfx'));
  Object.values(WEAPON_SOUNDS).forEach((s) => applyManagedVolume(s, 'sfx'));

  syncLegacyEngine();
}

function syncLegacyEngine(): void {
  setChannelUserVolume('music', audioSettings.musicVolume);
  setChannelUserVolume('sfx', audioSettings.sfxVolume);
  setChannelUserVolume('ui', audioSettings.sfxVolume);
  // Only persist volumes — never write per-channel mute keys here.
  // persistMusicMuted/persistSfxMuted must only be called from the
  // dedicated music/sfx mute handlers to avoid corrupting per-channel state.
  try {
    persistMusicVolume(audioSettings.musicVolume);
    persistSfxVolume(audioSettings.sfxVolume);
  } catch {
    /* ignore */
  }
}

function applyGlobalMute(muted: boolean): void {
  if (muted) {
    setChannelMuted('music', true);
    setChannelMuted('sfx', true);
    setChannelMuted('ui', true);
  } else {
    // Restore per-channel mutes from their own persisted state so that
    // e.g. "SFX only muted" survives a global mute → unmute cycle.
    try {
      const sfxM = localStorage.getItem('sfxMuted') === '1';
      const musicM = localStorage.getItem('musicMuted') === '1';
      setChannelMuted('music', musicM);
      setChannelMuted('sfx', sfxM);
      setChannelMuted('ui', sfxM);
    } catch {
      setChannelMuted('music', false);
      setChannelMuted('sfx', false);
      setChannelMuted('ui', false);
    }
  }
}

function saveAudioSettings(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(audioSettings));
  } catch {
    /* ignore */
  }
}

export function loadBoomBapAudioSettings(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AudioSettings>;
      audioSettings = {
        masterVolume: parsed.masterVolume ?? 0.9,
        musicVolume: parsed.musicVolume ?? 0.65,
        sfxVolume: parsed.sfxVolume ?? 0.85,
        isMuted: parsed.isMuted ?? false,
      };
    }
  } catch {
    /* ignore */
  }
  applyVolumes();
  // Sync the Web Audio channel mutes to match the restored global-mute state.
  applyGlobalMute(audioSettings.isMuted);
}

function canPlay(managed: ManagedSound): boolean {
  return (
    !managed.failed &&
    managed.howl != null &&
    managed.loaded &&
    effectiveMaster() > 0
  );
}

function playManaged(managed: ManagedSound, channel: 'music' | 'sfx'): void {
  if (!canPlay(managed)) return;
  applyManagedVolume(managed, channel);
  try {
    if (!managed.loop && managed.howl.playing()) {
      managed.howl.stop();
    }
    managed.howl.play();
  } catch (error) {
    console.warn(`[Audio] play() failed: ${managed.srcLabel}`, error);
  }
}

function stopManaged(managed: ManagedSound): void {
  if (managed.failed) return;
  managed.howl.stop();
}

function battleKeyForStage(stage: number): MusicKey {
  if (stage <= 2) return 'battleStage1';
  if (stage <= 4) return 'battleStage3';
  return 'battleStage5';
}

const CROSSFADE_MS = 300;

/** Fade-in and play a track that is confirmed loaded and playable. */
function doFadeInPlay(track: ManagedSound, key: MusicKey): void {
  const targetVol = musicGain(track.baseVolume);
  track.howl.volume(0);
  try {
    track.howl.play();
  } catch {
    if (currentMusicKey === key) currentMusicKey = null;
    return;
  }
  let elapsed = 0;
  const step = 16;
  const fade = setInterval(() => {
    elapsed += step;
    const t = Math.min(1, elapsed / CROSSFADE_MS);
    track.howl.volume(targetVol * t);
    if (t >= 1) clearInterval(fade);
  }, step);
}

function playMusicKey(key: MusicKey): void {
  if (currentMusicKey === key) return;

  // Fade out whatever is currently playing.
  if (currentMusicKey) {
    const prev = MUSIC[currentMusicKey];
    if (!prev.failed && prev.howl) {
      const fromVol = prev.howl.volume();
      let elapsed = 0;
      const step = 16;
      const fade = setInterval(() => {
        elapsed += step;
        const t = Math.min(1, elapsed / CROSSFADE_MS);
        prev.howl.volume(fromVol * (1 - t));
        if (t >= 1) {
          clearInterval(fade);
          prev.howl.stop();
        }
      }, step);
    }
  }

  currentMusicKey = key;
  const track = MUSIC[key];

  // Track still loading — keep currentMusicKey set and retry once it loads.
  // This fixes the race where game starts before MP3s finish fetching.
  if (!track.failed && track.howl != null && !track.loaded) {
    track.howl.once('load', () => {
      // Only play if this key is still wanted AND the file is real music
      // (≥ 5 s). Placeholder stubs are ~0.27 s — let procedural synths play.
      if (currentMusicKey === key) {
        if (canPlay(track) && track.howl.duration() >= 5) {
          doFadeInPlay(track, key);
        } else {
          currentMusicKey = null;
        }
      }
    });
    track.howl.once('loaderror', () => {
      if (currentMusicKey === key) currentMusicKey = null;
    });
    return;
  }

  // Placeholder stubs are valid but short (< 5 s). Don't play them; the
  // procedural Web Audio fallback is already running as the real soundtrack.
  if (!canPlay(track) || track.howl.duration() < 5) {
    currentMusicKey = null;
    return;
  }

  doFadeInPlay(track, key);
}

export const AudioManager = {
  /** Console/debug: `AudioManager.MUSIC.menuTheme.howl` */
  MUSIC,
  UI_SOUNDS,
  WEAPON_SOUNDS,

  /**
   * True only when the Howler music pack has REAL audio content.
   * Placeholder stub files (shipped for dev, ~0.27 s each) load successfully
   * but must NOT be treated as ready — the procedural Web Audio fallback
   * should play instead. Threshold: any real music loop is ≥ 5 s.
   */
  useHowlerMusic(): boolean {
    const t = MUSIC.battleStage1;
    return t.loaded && !t.failed && t.howl.duration() >= 5;
  },

  isMusicPackReady(): boolean {
    return AudioManager.useHowlerMusic();
  },

  /** True when the battle-music file has definitively errored (404 / decode fail). */
  isMusicPackFailed(): boolean {
    return MUSIC.battleStage1.failed;
  },

  /**
   * True only when weapon WAVs contain real audio (≥ 130 ms).
   * Dev placeholders are exactly 100 ms of silence; real hit sounds are longer.
   */
  isWeaponPackReady(): boolean {
    const t = WEAPON_SOUNDS.primary;
    return t.loaded && !t.failed && t.howl.duration() >= 0.13;
  },

  isUiPackReady(): boolean {
    const t = UI_SOUNDS.click;
    return t.loaded && !t.failed && t.howl.duration() >= 0.13;
  },

  playMenuTheme: () => {
    playMusicKey('menuTheme');
  },

  playBattleMusic: (stage: number) => {
    playMusicKey(battleKeyForStage(stage));
  },

  playBossTheme: () => {
    playMusicKey('bossTheme');
  },

  playStageClear: () => {
    playManaged(MUSIC.victorySfx, 'music');
  },

  stopAllMusic: () => {
    Object.values(MUSIC).forEach((m) => {
      if (m.failed || !m.howl) return;
      try { m.howl.stop(); } catch { /* ignore */ }
    });
    currentMusicKey = null;
    if (duckRestoreTimer) {
      clearTimeout(duckRestoreTimer);
      duckRestoreTimer = null;
    }
  },

  playUIHover: () => {
    if (!audioSettings.isMuted) playManaged(UI_SOUNDS.hover, 'sfx');
  },

  playUIClick: () => {
    if (!audioSettings.isMuted) playManaged(UI_SOUNDS.click, 'sfx');
  },

  playVinylScratch: () => {
    if (!audioSettings.isMuted) playManaged(UI_SOUNDS.scratch, 'sfx');
  },

  playCassetteClick: () => {
    if (!audioSettings.isMuted) playManaged(UI_SOUNDS.cassette, 'sfx');
  },

  playWeapon1: () => {
    playManaged(WEAPON_SOUNDS.primary, 'sfx');
    AudioManager.duckMusicBriefly(0.15, 100);
  },

  playWeapon2: () => {
    playManaged(WEAPON_SOUNDS.secondary, 'sfx');
    AudioManager.duckMusicBriefly(0.25, 120);
  },

  playReload: () => {
    if (!audioSettings.isMuted) playManaged(WEAPON_SOUNDS.reload, 'sfx');
  },

  playEmpty: () => {
    if (!audioSettings.isMuted) playManaged(WEAPON_SOUNDS.emptyClick, 'sfx');
  },

  /** Sidechain-style duck: Howler music + procedural survival bus. */
  duckMusicBriefly: (duckAmount = 0.2, durationMs = 100) => {
    const factor = Math.max(0, 1 - duckAmount);
    scheduleMusicDuck(factor, durationMs, 0.01, 0.1);

    if (currentMusicKey) {
      const track = MUSIC[currentMusicKey];
      if (canPlay(track)) {
        track.howl.volume(musicGain(track.baseVolume) * factor);
        if (duckRestoreTimer) clearTimeout(duckRestoreTimer);
        duckRestoreTimer = setTimeout(() => {
          if (currentMusicKey) {
            applyManagedVolume(track, 'music');
          }
        }, durationMs);
      }
    }
  },

  setMasterVolume: (vol: number) => {
    audioSettings.masterVolume = Math.max(0, Math.min(1, vol));
    applyVolumes();
    saveAudioSettings();
  },

  setMusicVolume: (vol: number) => {
    audioSettings.musicVolume = Math.max(0, Math.min(1, vol));
    applyVolumes();
    saveAudioSettings();
  },

  setSFXVolume: (vol: number) => {
    audioSettings.sfxVolume = Math.max(0, Math.min(1, vol));
    applyVolumes();
    saveAudioSettings();
  },

  setMuted: (muted: boolean) => {
    audioSettings.isMuted = muted;
    applyVolumes();
    applyGlobalMute(muted);
    saveAudioSettings();
    if (muted) AudioManager.stopAllMusic();
  },

  getSettings: (): AudioSettings => ({ ...audioSettings }),

  preloadAllSounds: (): Promise<void> => {
    const all = [
      ...Object.values(MUSIC),
      ...Object.values(UI_SOUNDS),
      ...Object.values(WEAPON_SOUNDS),
    ];
    return Promise.all(
      all.map(
        (managed) =>
          new Promise<void>((resolve) => {
            if (managed.loaded || managed.failed) {
              resolve();
              return;
            }
            const done = () => resolve();
            if (managed.failed) {
              done();
              return;
            }
            managed.howl.once('load', done);
            managed.howl.once('loaderror', done);
            window.setTimeout(done, 4000);
          })
      )
    ).then(() => undefined);
  },
};
