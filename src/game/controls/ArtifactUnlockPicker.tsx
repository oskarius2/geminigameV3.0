import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameIcon } from '../../components/icons';
import { Artifact, BuffRarity } from '../types';
import { RARITY_COLORS } from '../content/rarityColors';

interface ArtifactUnlockPickerProps {
  show: boolean;
  choices: Artifact[];
  unlocksRemaining: number;
  onSelect: (artifactId: string) => void;
  isMobile?: boolean;
}

export const ArtifactUnlockPicker: React.FC<ArtifactUnlockPickerProps> = ({
  show,
  choices,
  unlocksRemaining,
  onSelect,
  isMobile,
}) => (
  <AnimatePresence>
    {show && choices.length > 0 && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[105] bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] backdrop-blur-xl flex flex-col items-center justify-center p-6 pointer-events-auto"
      >
        <div className="text-center mb-8 mt-12 md:mt-0">
          <GameIcon name="ui.relic" size={48} color="#00e5ff" glow className="mx-auto mb-3" />
          <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            RELIC SALVAGED
          </h2>
          <p className="text-cyan-300/80 text-xs font-mono uppercase tracking-widest mt-2">
            Unlock for Hangar ({unlocksRemaining} left this run)
          </p>
        </div>

        <motion.div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl overflow-y-auto pb-12 pt-2 px-2 items-stretch">
          {choices.map((art) => (
            <motion.button
              key={art.id}
              type="button"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(art.id)}
              className={`group overflow-hidden relative flex-1 p-6 md:p-8 rounded-3xl border-2 text-left backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-colors hover:bg-white/5 min-h-[14rem] flex flex-col justify-between ${RARITY_COLORS[art.rarity].border} ${RARITY_COLORS[art.rarity].bg}`}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <span className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${RARITY_COLORS[art.rarity].text} ${RARITY_COLORS[art.rarity].border} bg-black/30`}>
                {art.rarity}
              </span>
              <div className="flex flex-col">
                <h3 className="text-xl md:text-2xl font-black text-white italic leading-tight break-words pr-16">{art.name}</h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed break-words">{art.description}</p>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest mt-4 shrink-0 ${RARITY_COLORS[art.rarity].text}`}>
                {art.slot.replace('_', ' ')}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
