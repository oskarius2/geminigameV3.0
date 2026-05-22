import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles } from 'lucide-react';
import { SpaceBackground } from '../../components/ui/SpaceBackground';
import { ArtifactSlot } from '../types';
import { ARTIFACTS, artifactPowerScore } from '../content/artifacts';
import { ALL_ARTIFACT_SLOTS } from '../content/artifactsExtra';
import { RARITY_COLORS } from '../content/rarityColors';
import { Panel } from '../../components/ui/Panel';
import { GhostButton } from '../../components/ui/GhostButton';

interface ArtifactInventoryProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedIds: string[];
  metaScrap: number;
  newUnlockIds?: string[];
  isMobile?: boolean;
  onOpenHangar?: () => void;
  onUnlockWithScrap?: (artifactId: string, cost: number) => boolean;
}

export const ArtifactInventory: React.FC<ArtifactInventoryProps> = ({
  isOpen,
  onClose,
  unlockedIds,
  metaScrap,
  newUnlockIds = [],
  onOpenHangar,
  onUnlockWithScrap,
}) => {
  const [filterSlot, setFilterSlot] = useState<ArtifactSlot | 'ALL'>('ALL');

  if (!isOpen) return null;

  const all = Object.values(ARTIFACTS).sort((a, b) => artifactPowerScore(b) - artifactPowerScore(a));
  const filtered = filterSlot === 'ALL' ? all : all.filter((a) => a.slot === filterSlot);
  const ownedCount = unlockedIds.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[700] overflow-hidden flex flex-col pointer-events-auto"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(217,70,239,0.07) 0%, transparent 70%), #020617',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <SpaceBackground scanlines />
      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4 shrink-0">
          <div>
            <h2
              className="font-display font-bold tracking-[0.15em] text-white uppercase"
              style={{
                fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                textShadow: '0 0 40px rgba(217,70,239,0.5), 0 0 80px rgba(217,70,239,0.2)',
              }}
            >
              Relic Vault
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-fuchsia-400/60 mt-1">
              {ownedCount} / {all.length} · {metaScrap.toLocaleString()} scrap
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {onOpenHangar && (
              <GhostButton onClick={onOpenHangar} className="!w-auto min-h-12 px-4 text-cyan-200 border-cyan-500/40">
                Hangar
              </GhostButton>
            )}
            <GhostButton onClick={onClose} className="!w-auto min-h-12 px-4">
              Close
            </GhostButton>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 shrink-0 scrollbar-hide">
          {(['ALL', ...ALL_ARTIFACT_SLOTS] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setFilterSlot(slot)}
              className={`shrink-0 min-h-10 px-3 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
                filterSlot === slot ? 'bg-white/15 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              {slot === 'ALL' ? 'All' : slot.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="grid gap-3 overflow-y-auto flex-1 pr-1 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-4">
          {filtered.map((art) => {
            const owned = unlockedIds.includes(art.id);
            const isNew = newUnlockIds.includes(art.id);
            const cost = art.scrapCost ?? 0;
            const canBuy = !owned && cost > 0 && onUnlockWithScrap && metaScrap >= cost;

            return (
              <Panel
                key={art.id}
                className={`relative p-4 text-left ${owned ? '' : 'opacity-70'}`}
              >
                {isNew && owned && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-black uppercase text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    <Sparkles size={10} /> NEW
                  </span>
                )}
                {!owned && <Lock className="absolute top-4 right-4 text-white/20" size={16} />}
                <span className={`text-xs font-black uppercase tracking-widest ${owned ? RARITY_COLORS[art.rarity].text : 'text-white/30'}`}>
                  {art.rarity}
                </span>
                <h3 className={`text-base font-bold mt-1 ${owned ? 'text-white' : 'text-white/40'}`}>
                  {owned ? art.name : 'Locked'}
                </h3>
                {owned && <p className="text-[11px] text-white/50 mt-2 leading-relaxed">{art.description}</p>}
                {!owned && cost > 0 && (
                  <p className="text-[10px] text-amber-400/90 mt-2 font-mono">{cost} scrap</p>
                )}
                {canBuy && (
                  <button
                    type="button"
                    onClick={() => onUnlockWithScrap(art.id, cost)}
                    className="mt-3 w-full min-h-10 rounded-lg bg-amber-600/30 border border-amber-500/50 text-amber-100 text-[10px] font-bold uppercase tracking-wider"
                  >
                    Unlock
                  </button>
                )}
              </Panel>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
