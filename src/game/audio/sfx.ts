let ctx: AudioContext | null = null;
let muted = false;
let sfxVolume = 0.7;

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (!ctx && typeof window !== 'undefined') {
    ctx = new AudioContext();
  }
  return ctx;
}

export function resumeAudio(): void {
  const ac = getCtx();
  if (ac?.state === 'suspended') void ac.resume();
}

export function setSfxMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem('sfxMuted', value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function setSfxVolume(value: number) {
  sfxVolume = Math.max(0, Math.min(1, value));
  try {
    localStorage.setItem('sfxVolume', String(sfxVolume));
  } catch {
    /* ignore */
  }
}

export function getSfxVolume(): number {
  return sfxVolume;
}

export function loadSfxMuted(): boolean {
  try {
    muted = localStorage.getItem('sfxMuted') === '1';
    const vol = localStorage.getItem('sfxVolume');
    if (vol != null) sfxVolume = Math.max(0, Math.min(1, parseFloat(vol)));
  } catch {
    muted = false;
  }
  return muted;
}

function tone(freq: number, duration: number, type: OscillatorType = 'square', gain = 0.08) {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const vol = gain * sfxVolume;
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export type SfxEvent =
  | 'augment'
  | 'exclusive'
  | 'boss'
  | 'lowHp'
  | 'artifact'
  | 'hit'
  | 'crit'
  | 'shield'
  | 'shoot_a'
  | 'shoot_b'
  | 'shoot_c'
  | 'levelUp'
  | 'cardFlip'
  | 'pickup'
  | 'gameOver'
  | 'switchWeapon';

export function playSfx(event: SfxEvent) {
  switch (event) {
    case 'switchWeapon':
      tone(600, 0.05, 'square', 0.03);
      setTimeout(() => tone(900, 0.08, 'square', 0.03), 40);
      break;
    case 'exclusive':
      tone(880, 0.12, 'sawtooth', 0.1);
      setTimeout(() => tone(1320, 0.15, 'sawtooth', 0.09), 80);
      setTimeout(() => tone(1760, 0.2, 'square', 0.07), 160);
      break;
    case 'augment':
      tone(520, 0.08, 'triangle', 0.06);
      setTimeout(() => tone(780, 0.1, 'triangle', 0.05), 60);
      break;
    case 'boss':
      tone(110, 0.4, 'sawtooth', 0.12);
      break;
    case 'lowHp':
      tone(200, 0.15, 'sine', 0.05);
      break;
    case 'artifact':
      tone(660, 0.1, 'triangle', 0.07);
      setTimeout(() => tone(990, 0.12, 'triangle', 0.06), 90);
      break;
    case 'hit':
      tone(240, 0.04, 'square', 0.03);
      break;
    case 'crit':
      tone(520, 0.06, 'sawtooth', 0.06);
      setTimeout(() => tone(780, 0.08, 'square', 0.05), 40);
      break;
    case 'shield':
      tone(320, 0.08, 'sine', 0.05);
      setTimeout(() => tone(480, 0.1, 'triangle', 0.04), 50);
      break;
    case 'shoot_a':
      tone(420, 0.03, 'square', 0.025);
      break;
    case 'shoot_b':
      tone(180, 0.08, 'sawtooth', 0.04);
      break;
    case 'shoot_c':
      tone(120, 0.15, 'sawtooth', 0.06);
      setTimeout(() => tone(880, 0.2, 'sine', 0.04), 60);
      break;
    case 'levelUp':
      tone(440, 0.1, 'triangle', 0.06);
      setTimeout(() => tone(660, 0.12, 'triangle', 0.05), 80);
      setTimeout(() => tone(880, 0.15, 'triangle', 0.05), 160);
      break;
    case 'cardFlip':
      tone(300, 0.05, 'square', 0.03);
      setTimeout(() => tone(400, 0.05, 'square', 0.025), 50);
      break;
    case 'pickup':
      tone(600, 0.06, 'sine', 0.04);
      setTimeout(() => tone(900, 0.08, 'sine', 0.03), 50);
      break;
    case 'gameOver':
      tone(220, 0.3, 'sawtooth', 0.08);
      setTimeout(() => tone(165, 0.4, 'sine', 0.06), 200);
      break;
    default:
      break;
  }
}
