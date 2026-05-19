import React from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, Swords, Shield, Zap, Wind, Map } from 'lucide-react';
import { ArtifactSlot, Artifact, Trait } from '../types';
import { ARTIFACTS } from '../Logic';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { GhostButton } from '../../components/ui/GhostButton';
import { Panel } from '../../components/ui/Panel';

interface StartPageProps {
  onStart: () => void;
  onCampaign: () => void;
  onOpenGear: () => void;
  onOpenInventory: () => void;
  relicCount: number;
  metaScrap: number;
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
  metaScrap,
  equippedArtifactIds,
  activeTraits,
}) => {
  const equippedList = Object.entries(equippedArtifactIds)
    .filter(([_, id]) => id !== null)
    .map(([slot, id]) => ({
      slot: slot as ArtifactSlot,
      artifact: ARTIFACTS[id as string],
    }));

  return (
    <ScreenShell className="min-h-[100dvh] justify-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:gap-12 w-full py-8 lg:py-12"
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-1 text-center lg:text-left"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-6xl font-display font-bold tracking-tight text-white">
            SPACEHERO
          </h1>
          <p className="text-amber-400/90 text-sm font-mono mt-4 tabular-nums">
            {metaScrap.toLocaleString()} scrap in hangar
          </p>

          <Panel className="mt-8 p-4 md:p-6 w-full lg:max-w-xl">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Loadout</p>
            <motion.div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {equippedList.length > 0 ? (
                equippedList.map(({ slot, artifact }) => (
                  <motion.div
                    key={slot}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                  >
                    <SlotIcon slot={slot} size={14} />
                    <span className="text-xs text-white/90">{artifact?.name}</span>
                  </motion.div>
                ))
              ) : (
                <span className="text-white/40 text-sm">No loadout equipped</span>
              )}
            </motion.div>
            {activeTraits.length > 0 && (
              <motion.div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-4 pt-4 border-t border-white/10">
                {activeTraits.map((trait) => (
                  <span
                    key={trait.id}
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                      trait.isPositive
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                        : 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {trait.name}
                  </span>
                ))}
              </motion.div>
            )}
          </Panel>
        </motion.div>

        <motion.div className="flex flex-col gap-3 w-full max-w-sm lg:max-w-md mt-10 lg:mt-0 lg:shrink-0 lg:sticky lg:top-8">
          <PrimaryButton onClick={onStart} className="!bg-white !text-black !shadow-none border-0 min-h-12">
            <span className="flex items-center justify-center gap-2">
              <Play size={18} fill="currentColor" /> Start Survival
            </span>
          </PrimaryButton>
          <GhostButton onClick={onCampaign} className="border-cyan-500/30 text-cyan-200">
            <span className="flex items-center justify-center gap-2">
              <Map size={16} /> Campaign
            </span>
          </GhostButton>
          <motion.div className="grid grid-cols-2 gap-3">
            <GhostButton onClick={onOpenGear}>
              <span className="flex items-center justify-center gap-2">
                <Swords size={16} /> Hangar
              </span>
            </GhostButton>
            <GhostButton onClick={onOpenInventory}>
              <span className="flex items-center justify-center gap-2">
                <Sparkles size={16} /> Vault ({relicCount})
              </span>
            </GhostButton>
          </motion.div>
        </motion.div>
      </motion.div>
    </ScreenShell>
  );
};
