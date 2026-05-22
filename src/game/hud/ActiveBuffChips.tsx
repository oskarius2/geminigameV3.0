import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Target, Trophy, Flame, RotateCcw, Swords } from 'lucide-react';
import { HudPanel } from './HudPanel';
import type { HudVariant } from '../controls/mobileLayout';

interface BuffState {
  shield: number;
  overdrive: number;
  magnet: number;
  scoreX: number;
  rapidFire: number;
  timeSlow: number;
  piercing: number;
}

interface ActiveBuffChipsProps {
  buffs: BuffState;
  extraLifeCharges: number;
  hudVariant: HudVariant;
}

function Chip({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'cyan' | 'rose' | 'amber' | 'fuchsia';
}) {
  const tones = {
    cyan: 'border-cyan-500/50 text-cyan-300 bg-cyan-950/50',
    rose: 'border-rose-500/50 text-rose-300 bg-rose-950/40',
    amber: 'border-amber-500/50 text-amber-300 bg-amber-950/40',
    fuchsia: 'border-fuchsia-500/50 text-fuchsia-300 bg-fuchsia-950/40',
  };
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${tones[tone]}`}
    >
      {icon}
      <span className="truncate max-w-[88px]">{label}</span>
    </motion.div>
  );
}

export function ActiveBuffChips({ buffs, extraLifeCharges, hudVariant }: ActiveBuffChipsProps) {
  const compact = hudVariant === 'compact' || hudVariant === 'landscape';
  const chips: React.ReactNode[] = [];

  if (extraLifeCharges > 0) {
    chips.push(
      <Chip key="life" icon={<Shield size={12} />} label={compact ? 'EXTRA' : 'EXTRA LIV'} tone="cyan" />,
    );
  }
  if (buffs.overdrive > 0) {
    chips.push(
      <Chip key="od" icon={<Zap size={12} />} label={`OD ${Math.ceil(buffs.overdrive / 60)}s`} tone="rose" />,
    );
  }
  if (buffs.magnet > 0) {
    chips.push(
      <Chip key="mag" icon={<Target size={12} />} label={`MAG ${Math.ceil(buffs.magnet / 60)}s`} tone="cyan" />,
    );
  }
  if (buffs.scoreX > 0) {
    chips.push(
      <Chip key="sx" icon={<Trophy size={12} />} label={`2X ${Math.ceil(buffs.scoreX / 60)}s`} tone="fuchsia" />,
    );
  }
  if (buffs.rapidFire > 0) {
    chips.push(
      <Chip key="rf" icon={<Flame size={12} />} label={`RAP ${Math.ceil(buffs.rapidFire / 60)}s`} tone="amber" />,
    );
  }
  if (buffs.timeSlow > 0) {
    chips.push(
      <Chip key="ts" icon={<RotateCcw size={12} />} label={`SLOW ${Math.ceil(buffs.timeSlow / 60)}s`} tone="cyan" />,
    );
  }
  if (buffs.piercing > 0) {
    chips.push(
      <Chip key="pr" icon={<Swords size={12} />} label={`PRC ${Math.ceil(buffs.piercing / 60)}s`} tone="fuchsia" />,
    );
  }

  if (chips.length === 0) return null;

  return (
    <HudPanel className="p-1.5 flex flex-wrap gap-1 justify-end max-w-[300px]">
      {chips}
    </HudPanel>
  );
}
