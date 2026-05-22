import { Howl, Howler } from 'howler';
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
}

function createManaged(
  src: string[],
  opts: { loop?: boolean; volume: number }
): ManagedSound {
  const managed: ManagedSound = {
    howl: null as unknown as Howl,
    loaded: false,
    failed: false,
    baseVolume: opts.volume,
  };
  managed.howl = new Howl({
    src,
    loop: opts.loop ?? false,
    volume: opts.volume,
    preload: true,
    html5: src.some((s) => s.endsWith('.mp3')),
    onload: () => {
      managed.loaded = true;
    },
    onloaderror: () => {
      managed.failed = true;
    },
  });
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
  masterVolume: 1,
  musicVolume: 0.7,
  sfxVolume: 0.8,
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
  setChannelMuted('music', audioSettings.isMuted);
  setChannelMuted('sfx', audioSettings.isMuted);
  setChannelMuted('ui', audioSettings.isMuted);
  try {
    persistMusicVolume(audioSettings.musicVolume);
    persistSfxVolume(audioSettings.sfxVolume);
    persistMusicMuted(audioSettings.isMuted);
    persistSfxMuted(audioSettings.isMuted);
  } catch {
    /* ignore */
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
        masterVolume: parsed.masterVolume ?? 1,
        musicVolume: parsed.musicVolume ?? 0.7,
        sfxVolume: parsed.sfxVolume ?? 0.8,
        isMuted: parsed.isMuted ?? false,
      };
    }
  } catch {
    /* ignore */
  }
  applyVolumes();
}

function canPlay(managed: ManagedSound): boolean {
  return managed.loaded && !managed.failed && effectiveMaster() > 0;
}

function playManaged(managed: ManagedSound, channel: 'music' | 'sfx'): void {
  if (!canPlay(managed)) return;
  applyManagedVolume(managed, channel);
  managed.howl.play();
}

function stopManaged(managed: ManagedSound): void {
  managed.howl.stop();
}

function battleKeyForStage(stage: number): MusicKey {
  if (stage <= 2) return 'battleStage1';
  if (stage <= 4) return 'battleStage3';
  return 'battleStage5';
}

function playMusicKey(key: MusicKey): void {
  if (currentMusicKey === key) return;
  AudioManager.stopAllMusic();
  const track = MUSIC[key];
  if (!canPlay(track)) {
    currentMusicKey = null;
    return;
  }
  playManaged(track, 'music');
  currentMusicKey = key;
}

export const AudioManager = {
  useHowlerMusic(): boolean {
    return (
      MUSIC.battleStage1.loaded &&
      !MUSIC.battleStage1.failed
    );
  },

  isMusicPackReady(): boolean {
    return AudioManager.useHowlerMusic();
  },

  isWeaponPackReady(): boolean {
    return (
      WEAPON_SOUNDS.primary.loaded &&
      !WEAPON_SOUNDS.primary.failed
    );
  },

  isUiPackReady(): boolean {
    return UI_SOUNDS.click.loaded && !UI_SOUNDS.click.failed;
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
    Object.values(MUSIC).forEach(stopManaged);
    currentMusicKey = null;
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
            managed.howl.once('load', done);
            managed.howl.once('loaderror', done);
            window.setTimeout(done, 4000);
          })
      )
    ).then(() => undefined);
  },
};
