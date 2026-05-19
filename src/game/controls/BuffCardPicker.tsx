import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Target, Shield, Flame, Magnet, Activity, HeartPulse, ShieldCheck, Bomb, Swords, CircleIcon, MoveRight, RotateCcw, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { SpaceBackground } from '../../components/ui/SpaceBackground';
import { PassiveBuff, BuffRarity } from '../types';
import { getBuffStacksForDisplay } from '../buffs/pickBuffs';
import type { ViewportProfile } from './mobileLayout';

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap />,
  Target: <Target />,
  Shield: <Shield />,
  Flame: <Flame />,
  Magnet: <Magnet />,
  Activity: <Activity />,
  HeartPulse: <HeartPulse />,
  ShieldCheck: <ShieldCheck />,
  Bomb: <Bomb />,
  Swords: <Swords />,
  CircleIcon: <CircleIcon />,
  MoveRight: <MoveRight />,
  RotateCcw: <RotateCcw />,
  Trophy: <Trophy />,
};

const RARITY_STYLE: Record<BuffRarity, { border: string; bg: string; glow: string; text: string; label: string }> = {
  [BuffRarity.COMMON]: { border: 'border-slate-500/40', bg: 'bg-slate-500/10', glow: 'shadow-slate-500/20', text: 'text-slate-300', label: 'COMMON' },
  [BuffRarity.RARE]: { border: 'border-blue-500/50', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/30', text: 'text-blue-300', label: 'RARE' },
  [BuffRarity.EPIC]: { border: 'border-purple-500/60', bg: 'bg-purple-500/15', glow: 'shadow-purple-500/40', text: 'text-purple-300', label: 'EPIC' },
  [BuffRarity.LEGENDARY]: { border: 'border-amber-400/70', bg: 'bg-amber-400/15', glow: 'shadow-amber-400/50', text: 'text-amber-300', label: 'LEGENDARY' },
  [BuffRarity.EXCLUSIVE]: {
    border: 'border-cyan-400/90',
    bg: 'bg-linear-to-br from-cyan-500/20 via-amber-500/10 to-fuchsia-500/20',
    glow: 'shadow-[0_0_40px_rgba(34,211,238,0.45)]',
    text: 'text-cyan-200',
    label: 'EXCLUSIVE',
  },
};

interface BuffCardPickerProps {
  show: boolean;
  buffs: PassiveBuff[];
  passives: string[];
  onSelect: (buffId: string) => void;
  isMobile?: boolean;
  viewportProfile?: ViewportProfile;
}

function BuffCard({
  buff,
  passives,
  onSelect,
  isMobile,
  landscapeCards,
  index,
}: {
  buff: PassiveBuff;
  passives: string[];
  onSelect: (id: string) => void;
  isMobile: boolean;
  landscapeCards: boolean;
  index: number;
}) {
  const compactCard = isMobile || landscapeCards;
  const style = RARITY_STYLE[buff.rarity];
  const stacks = getBuffStacksForDisplay(passives, buff.id);
  const isExclusive = buff.rarity === BuffRarity.EXCLUSIVE || buff.exclusive;
  const isLegendary = buff.rarity === BuffRarity.LEGENDARY;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 32, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.12, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={isMobile ? undefined : { scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onSelect(buff.id)}
      className={`group relative w-full ${compactCard ? 'min-h-[140px] flex-row items-center p-0.5' : 'min-h-[240px] md:min-h-[340px] p-1 flex-col'} rounded-3xl border-2 ${style.bg} ${style.border} ${style.glow} hover:shadow-2xl text-left overflow-hidden flex ${
        isExclusive ? 'ring-2 ring-cyan-400/50' : ''
      } ${isLegendary || isExclusive ? 'animate-pulse' : ''}`}
    >
      {isExclusive && (
        <div className="absolute inset-0 bg-linear-to-r from-cyan-500/10 via-transparent to-fuchsia-500/10 pointer-events-none" />
      )}
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: isExclusive ? 1.8 : isLegendary ? 2.5 : 4, ease: 'linear' }}
      />

      {compactCard ? (
        // Mobile / landscape compact horizontal layout
        <div className="relative z-10 flex flex-row items-center w-full h-full p-4 gap-4">
          <motion.div
            className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${style.bg} ${style.border} ${style.text}`}
            animate={isExclusive ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {React.cloneElement((ICON_MAP[buff.icon] || <Zap />) as React.ReactElement, {
              size: 32,
              strokeWidth: 1.5,
            })}
          </motion.div>

          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${style.text} bg-black/50 border ${style.border}`}>
                {isExclusive ? 'EXCLUSIVE' : style.label}
              </span>
              {stacks > 0 && (
                <span className="text-[10px] font-black text-white/80 bg-white/10 px-1.5 py-0.5 rounded-full shrink-0">
                  x{stacks + 1}
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-black text-white italic uppercase leading-tight tracking-tight truncate">
              {buff.name}
            </h3>
            
            {buff.stackSummary && (
              <p className={`mt-0.5 text-xs font-black uppercase tracking-wide ${style.text} truncate`}>
                {buff.stackSummary}
              </p>
            )}
            
            <p className="mt-1 text-slate-400 text-xs leading-snug line-clamp-2">
              {buff.description}
            </p>
          </div>
        </div>
      ) : (
        // Desktop standard vertical layout
        <div className="relative z-10 flex flex-col h-full p-5 md:p-7 w-full">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${style.text} bg-black/50 border ${style.border}`}
            >
              {isExclusive ? 'EXCLUSIVE' : style.label}
            </span>
            {stacks > 0 && (
              <span className="text-xs font-black text-white/80 bg-white/10 px-2 py-0.5 rounded-full">
                x{stacks + 1}
              </span>
            )}
          </div>

          <motion.div
            className={`mt-5 mb-4 w-18 h-18 md:w-22 md:h-22 rounded-2xl flex items-center justify-center border-2 ${style.bg} ${style.border} ${style.text}`}
            animate={isExclusive ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {React.cloneElement((ICON_MAP[buff.icon] || <Zap />) as React.ReactElement, {
              size: 48,
              strokeWidth: 1.5,
            })}
          </motion.div>

          <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase leading-tight tracking-tight">
            {buff.name}
          </h3>

          {buff.stackSummary && (
            <p className={`mt-2 text-sm md:text-base font-black uppercase tracking-wide ${style.text}`}>
              {buff.stackSummary}
            </p>
          )}

          <p className="mt-3 text-slate-400 text-sm md:text-base leading-snug flex-1">{buff.description}</p>

          <motion.div
            className="mt-5 py-3 rounded-xl bg-white/10 border border-white/20 text-center font-black text-white uppercase text-sm tracking-widest group-hover:bg-cyan-500/30 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            Equip
          </motion.div>
        </div>
      )}
    </motion.button>
  );
}

export const BuffCardPicker: React.FC<BuffCardPickerProps> = ({
  show,
  buffs,
  passives,
  onSelect,
  isMobile = false,
  viewportProfile = 'desktop',
}) => {
  const hasExclusive = buffs.some((b) => b.rarity === BuffRarity.EXCLUSIVE || b.exclusive);
  const landscapeCards = viewportProfile === 'phone-landscape';
  const stackVertical = isMobile && !landscapeCards;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[200] overflow-hidden flex flex-col items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-auto overflow-y-auto"
          style={{ background: 'rgba(2,6,23,0.92)' }}
        >
          <SpaceBackground />
          <div className="relative z-10 w-full flex flex-col items-center">
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-6 px-4 shrink-0"
          >
            <h2 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-b from-white via-cyan-200 to-cyan-600 tracking-tighter italic uppercase">
              {hasExclusive ? 'Exclusive Augment' : 'Augment'}
            </h2>
            <p className="text-cyan-400 font-mono tracking-[0.25em] text-[10px] md:text-xs mt-2 uppercase">
              {hasExclusive ? 'One choice. Maximum power.' : 'Choose one upgrade'}
            </p>
          </motion.div>

          <motion.div 
            layout 
            className={`flex w-full max-w-6xl justify-center items-stretch gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4 pb-8 sm:pb-0 sm:mt-4 scrollbar-hide ${
              stackVertical
                ? 'flex-col overflow-y-auto'
                : landscapeCards
                  ? 'flex-row overflow-x-auto snap-x snap-mandatory'
                  : 'flex-row overflow-x-auto sm:overflow-x-visible'
            }`}
          >
            {buffs.map((buff, i) => (
              <motion.div
                key={`${buff.id}-${i}`}
                className={`shrink-0 ${stackVertical ? 'w-full' : landscapeCards ? 'w-[min(72vw,280px)] snap-center' : 'w-full sm:flex-1 sm:max-w-sm'}`}
              >
                <BuffCard buff={buff} passives={passives} onSelect={onSelect} isMobile={isMobile} landscapeCards={landscapeCards} index={i} />
              </motion.div>
            ))}
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
