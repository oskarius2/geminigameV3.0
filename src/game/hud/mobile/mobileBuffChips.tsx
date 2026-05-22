import React from 'react';
import { Shield, Zap, Target, Trophy, Flame, RotateCcw, Swords } from 'lucide-react';

interface BuffState {
  shield: number;
  overdrive: number;
  magnet: number;
  scoreX: number;
  rapidFire: number;
  timeSlow: number;
  piercing: number;
}

function chip(label: string, icon: React.ReactNode): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1 truncate">
      {icon}
      {label}
    </span>
  );
}

/** Up to 4 compact labels for the bottom 2x2 buff grid. */
export function buildMobileBuffChips(
  buffs: BuffState,
  extraLifeCharges: number,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  if (extraLifeCharges > 0) {
    out.push(chip('LIV', <Shield size={12} />));
  }
  if (buffs.overdrive > 0) {
    out.push(chip(`OD`, <Zap size={12} />));
  }
  if (buffs.rapidFire > 0) {
    out.push(chip(`RF`, <Flame size={12} />));
  }
  if (buffs.magnet > 0) {
    out.push(chip(`MAG`, <Target size={12} />));
  }
  if (buffs.scoreX > 0) {
    out.push(chip(`2X`, <Trophy size={12} />));
  }
  if (buffs.timeSlow > 0) {
    out.push(chip(`SLW`, <RotateCcw size={12} />));
  }
  if (buffs.piercing > 0) {
    out.push(chip(`PRC`, <Swords size={12} />));
  }
  return out;
}
