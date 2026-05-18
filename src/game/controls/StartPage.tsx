import React from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, Swords, Shield, Zap, Wind, Map } from 'lucide-react';
import { ArtifactSlot, Artifact, Trait } from '../types';
import { ARTIFACTS } from '../Logic';

interface StartPageProps {
  onStart: () => void;
  onCampaign: () => void;
  onOpenGear: () => void;
  onOpenInventory: () => void;
  relicCount: number;
  equippedArtifactIds: Record<ArtifactSlot, string | null>;
  activeTraits: Trait[];
}

const SlotIcon = ({ slot, size = 16 }: { slot: ArtifactSlot; size?: number }) => {
  switch (slot) {
    case 'CANNON_A': return <Swords size={size} className="text-white/80" />;
    case 'CANNON_B': return <Swords size={size} className="text-white/80" />;
    case 'ARMOR': return <Shield size={size} className="text-white/80" />;
    case 'MOBILITY': return <Wind size={size} className="text-white/80" />;
    case 'ULTIMATE': return <Zap size={size} className="text-fuchsia-400" />;
    default: return <Sparkles size={size} />;
  }
};

export const StartPage: React.FC<StartPageProps> = ({
  onStart,
  onCampaign,
  onOpenGear,
  onOpenInventory,
  relicCount,
  equippedArtifactIds,
  activeTraits
}) => {
  const equippedList = Object.entries(equippedArtifactIds)
    .filter(([_, id]) => id !== null)
    .map(([slot, id]) => ({
      slot: slot as ArtifactSlot,
      artifact: ARTIFACTS[id as string]
    }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[500] bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] flex flex-col items-center justify-start overflow-y-auto p-4 md:p-8 text-center bg-noise"
    >
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 1, ease: 'easeOut' }}
            className="mt-16 md:mt-24"
        >
            <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                SPACEHERO
            </h1>
            <p className="text-white/40 text-[9px] sm:text-xs md:text-sm font-sans uppercase tracking-[0.4em] font-medium mt-4">
                The Next Generation Simulation
            </p>
        </motion.div>

        {/* Loadout & Traits Display */}
        <div className="mt-12 md:mt-16 flex flex-col items-center gap-6 md:gap-8 w-full max-w-4xl px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {equippedList.length > 0 ? (
              equippedList.map(({ slot, artifact }) => (
                <div 
                  key={slot} 
                  className="group flex flex-col items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-xl transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1"
                >
                  <div className="p-2 md:p-2.5 bg-black/40 rounded-full border border-white/10 group-hover:scale-110 transition-transform shadow-inner">
                    <SlotIcon slot={slot} size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] md:text-[9px] uppercase font-sans tracking-[0.2em] font-medium text-white/40">{slot.replace('_', ' ')}</span>
                    <span className="text-xs md:text-sm font-display font-medium text-white/90 whitespace-nowrap">{artifact?.name || 'Empty'}</span>
                  </div>
                </div>
              ))
            ) : (
               <div className="text-white/30 italic font-sans text-sm md:text-base">No gear equipped</div>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3 border-t border-white/10 pt-6 md:pt-8"
          >
             {activeTraits.map((trait) => (
               <div 
                 key={trait.id}
                 className={`flex flex-col items-center p-3 md:p-4 rounded-xl border ${trait.isPositive ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'} min-w-[140px] max-w-[200px] backdrop-blur-md`}
               >
                 <span className={`text-[11px] font-sans font-bold uppercase tracking-[0.1em] ${trait.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {trait.name}
                 </span>
                 <span className="text-[10px] text-white/50 leading-relaxed mt-1.5 group-hover:text-white/70">
                   {trait.description}
                 </span>
               </div>
             ))}
          </motion.div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs md:max-w-md px-4 md:px-0 mt-16 pb-24 z-10">
            <button
                onClick={onStart}
                className="group relative bg-white text-black font-display font-bold py-5 px-8 rounded-xl text-base md:text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_1.5s_infinite]" />
                <Play size={20} fill="currentColor" /> INITIATE BOOT
            </button>

            <button
                onClick={onCampaign}
                className="group relative bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 font-display font-bold py-4 px-8 rounded-xl text-base md:text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
                <Map size={18} /> CAMPAIGN
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <button onClick={onOpenGear} className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-sans font-medium py-4 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] backdrop-blur-md">
                  <Swords size={18} className="text-white/60 group-hover:text-white transition-colors" /> LOADOUT
              </button>

              <button onClick={onOpenInventory} className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-sans font-medium py-4 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] backdrop-blur-md">
                  <Sparkles size={18} className="text-white/60 group-hover:text-amber-400 transition-colors" /> VAULT ({relicCount})
              </button>
            </div>
        </div>
        
        <div className="absolute bottom-8 text-white/30 flex flex-col items-center gap-2 pointer-events-none">
            <span className="text-[10px] font-sans uppercase tracking-[0.3em] font-medium">System Core v2.0</span>
        </div>
    </motion.div>
  );
};

