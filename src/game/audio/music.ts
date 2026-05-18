let ctx: AudioContext | null = null;
let musicMuted = false;
let musicVolume = 0.12;
let duckFactor = 1;
let oscillators: OscillatorNode[] = [];
let gainNode: GainNode | null = null;
let running = false;

function getCtx(): AudioContext | null {
  if (musicMuted) return null;
  if (!ctx && typeof window !== 'undefined') {
    ctx = new AudioContext();
  }
  return ctx;
}

export function loadMusicSettings(): void {
  try {
    musicMuted = localStorage.getItem('musicMuted') === '1';
    const vol = localStorage.getItem('musicVolume');
    if (vol != null) musicVolume = Math.max(0, Math.min(1, parseFloat(vol)));
  } catch {
    /* ignore */
  }
}

export function setMusicMuted(value: boolean): void {
  musicMuted = value;
  try {
    localStorage.setItem('musicMuted', value ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (value) stopMusic();
}

export function setMusicVolume(value: number): void {
  musicVolume = Math.max(0, Math.min(1, value));
  try {
    localStorage.setItem('musicVolume', String(musicVolume));
  } catch {
    /* ignore */
  }
  if (gainNode && ctx) {
    gainNode.gain.setValueAtTime(musicVolume * duckFactor, ctx.currentTime);
  }
}

export function getMusicMuted(): boolean {
  return musicMuted;
}

export function duckMusic(factor: number): void {
  duckFactor = factor;
  if (gainNode && ctx) {
    gainNode.gain.setTargetAtTime(musicVolume * duckFactor, ctx.currentTime, 0.08);
  }
}

export function startMusic(): void {
  const ac = getCtx();
  if (!ac || running) return;
  if (ac.state === 'suspended') void ac.resume();
  running = true;

  gainNode = ac.createGain();
  gainNode.gain.value = musicVolume * duckFactor;
  gainNode.connect(ac.destination);

  const freqs = [55, 82.5, 110];
  oscillators = freqs.map((freq, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    g.gain.value = 0.04 / (i + 1);
    osc.connect(g);
    g.connect(gainNode!);
    osc.start();
    return osc;
  });

  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain);
  lfoGain.connect(oscillators[0].frequency);
  lfo.start();
}

export function stopMusic(): void {
  oscillators.forEach((o) => {
    try {
      o.stop();
    } catch {
      /* already stopped */
    }
  });
  oscillators = [];
  gainNode = null;
  running = false;
}
