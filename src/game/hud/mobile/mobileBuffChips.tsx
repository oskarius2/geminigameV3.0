import React from 'react';
import { GameIconFromKey } from '../../../components/icons';

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
    out.push(chip('LIFE', <GameIconFromKey iconKey="Shield" size={12} color="#67e8f9" />));
  }
  if (buffs.overdrive > 0) {
    out.push(chip(`OD`, <GameIconFromKey iconKey="Zap" size={12} color="#fda4af" />));
  }
  if (buffs.rapidFire > 0) {
    out.push(chip(`RF`, <GameIconFromKey iconKey="Flame" size={12} color="#fcd34d" />));
  }
  if (buffs.magnet > 0) {
    out.push(chip(`MAG`, <GameIconFromKey iconKey="Magnet" size={12} color="#67e8f9" />));
  }
  if (buffs.scoreX > 0) {
    out.push(chip(`2X`, <GameIconFromKey iconKey="Trophy" size={12} color="#e879f9" />));
  }
  if (buffs.timeSlow > 0) {
    out.push(chip(`SLW`, <GameIconFromKey iconKey="RotateCcw" size={12} color="#a5b4fc" />));
  }
  if (buffs.piercing > 0) {
    out.push(chip(`PRC`, <GameIconFromKey iconKey="Swords" size={12} color="#f9a8d4" />));
  }
  return out;
}
