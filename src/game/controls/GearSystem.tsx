import React from "react";
import { motion } from "motion/react";
import {
  Swords,
  Shield,
  Zap,
  Info,
  Gem,
  Sparkles,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Artifact, ArtifactSlot, BuffRarity } from "../types";
import {
  formatArtifactStats,
  formatArtifactDelta,
} from "../meta/formatArtifactStats";
import { RARITY_COLORS as RARITY_COLOR_MAP } from "../content/rarityColors";

interface GearSystemProps {
  equippedIds: Record<ArtifactSlot, string | null>;
  unlockedArtifacts: Artifact[];
  metaScrap: number;
  onEquip: (slot: ArtifactSlot, id: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const RARITY_COLORS: Record<BuffRarity, string> = {
  [BuffRarity.COMMON]: "border-slate-700 bg-slate-800/10 text-slate-400",
  [BuffRarity.RARE]: "border-cyan-800 bg-cyan-900/10 text-cyan-400",
  [BuffRarity.EPIC]: "border-fuchsia-800 bg-fuchsia-900/10 text-fuchsia-400",
  [BuffRarity.LEGENDARY]: "border-amber-700 bg-amber-900/10 text-amber-500",
  [BuffRarity.EXCLUSIVE]: "border-rose-700 bg-rose-900/10 text-rose-500",
};

const SLOT_ICONS: Record<ArtifactSlot, React.ReactNode> = {
  CANNON_A: <Swords size={24} className="text-cyan-400" />,
  CANNON_B: <Swords size={24} className="text-cyan-400" />,
  ULTIMATE: <Zap size={24} className="text-fuchsia-400" />,
  ARMOR: <Shield size={24} className="text-cyan-400" />,
  MOBILITY: <Zap size={24} className="text-cyan-400" />,
};

const SLOT_LABELS: Record<ArtifactSlot, string> = {
  CANNON_A: "Alpha Cannon",
  CANNON_B: "Beta Cannon",
  ULTIMATE: "Ultimate Relic",
  ARMOR: "Armor Plating",
  MOBILITY: "Mobility Drive",
};

export const GearSystem: React.FC<GearSystemProps> = ({
  equippedIds,
  unlockedArtifacts,
  metaScrap,
  onEquip,
  isOpen,
  onClose,
  isMobile,
}) => {
  if (!isOpen) return null;

  const [selectedSlot, setSelectedSlot] = React.useState<ArtifactSlot>("CANNON_A");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const artifactsForSlot = unlockedArtifacts.filter((a) => a.slot === selectedSlot);
  const equippedForSlot = unlockedArtifacts.find((a) => a.id === equippedIds[selectedSlot]);
  const detailArtifact =
    (selectedId ? unlockedArtifacts.find((a) => a.id === selectedId) : null) ??
    equippedForSlot ??
    null;
  const isDetailEquipped = detailArtifact ? equippedIds[detailArtifact.slot] === detailArtifact.id : false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-[700] bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] backdrop-blur-2xl flex flex-col pointer-events-auto pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] p-4 sm:p-8"
    >
      <div className="flex flex-row justify-between items-center gap-4 mb-4 sm:mb-6 shrink-0">
        <div className="flex flex-col min-w-0">
          <h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] truncate">
            HANGAR
          </h2>
          <span className="text-cyan-500/50 text-[8px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 truncate">
            NANO-TECH INTEGRATION
          </span>
          <span className="text-amber-400/80 text-[10px] font-mono mt-1">{metaScrap.toLocaleString()} scrap</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-rose-900/40 hover:bg-rose-800/60 text-white border border-rose-500/50 hover:border-rose-400 rounded uppercase font-bold text-[10px] sm:text-xs transition-all shrink-0"
        >
          Exit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-8 flex-1 overflow-y-auto lg:overflow-hidden pb-8 lg:pb-0 h-full">
        {/* Left Column: Navigation - Fixed height on mobile to prevent squashing */}
        <div className="col-span-1 lg:col-span-3 flex flex-row lg:flex-col gap-2 sm:gap-3 overflow-x-auto lg:overflow-y-auto pb-4 lg:pb-0 w-full min-w-0 shrink-0 h-auto lg:h-full snap-x scrollbar-none">
          {(
            [
              "CANNON_A",
              "CANNON_B",
              "ULTIMATE",
              "ARMOR",
              "MOBILITY",
            ] as ArtifactSlot[]
          ).map((slot) => (
            <button
              key={slot}
              onClick={() => { setSelectedSlot(slot); setSelectedId(null); }}
              className={`w-24 sm:w-44 lg:w-full p-2 sm:p-4 lg:p-6 rounded-lg lg:rounded-3xl border transition-all flex flex-col gap-1 sm:gap-2 shrink-0 snap-center ${
                selectedSlot === slot
                  ? "bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div
                  className={`p-1 sm:p-2 rounded sm:rounded-xl ${selectedSlot === slot ? "bg-cyan-500/20" : "bg-white/5"} shrink-0`}
                >
                  {React.isValidElement(SLOT_ICONS[slot]) ? 
                    React.cloneElement(SLOT_ICONS[slot] as React.ReactElement<any>, { size: isMobile ? 12 : 24 }) : 
                    SLOT_ICONS[slot]
                  }
                </div>
                <div className="text-[8px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest truncate">
                  {SLOT_LABELS[slot].split(' ')[0]}
                </div>
              </div>
              <div className="text-white/60 font-bold truncate text-[7px] sm:text-sm bg-black/40 p-1 sm:p-2 rounded w-full text-center sm:text-left">
                {equippedIds[slot]
                  ? unlockedArtifacts.find((a) => a.id === equippedIds[slot])
                      ?.name
                  : "---"}
              </div>
            </button>
          ))}
        </div>

        {/* Center Column: List */}
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-3 sm:gap-4 lg:overflow-hidden min-w-0">
          <div className="flex flex-row justify-between items-end gap-2 border-b border-white/10 pb-2 sm:pb-4">
            <h3 className="text-white/50 uppercase text-[8px] sm:text-[10px] font-black tracking-[0.1em] sm:tracking-[0.2em] truncate">
              {SLOT_LABELS[selectedSlot]} COMPONENTS
            </h3>
            <span className="text-white/20 text-[8px] sm:text-[10px] font-bold whitespace-nowrap">
              {artifactsForSlot.length} TOTAL
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3 lg:overflow-y-auto pr-1 sm:pr-2 scrollbar-thin">
            {artifactsForSlot.length === 0 && (
              <p className="text-white/20 text-xs italic text-center py-8">No relics unlocked for this slot.</p>
            )}
            {artifactsForSlot.map((artifact) => {
              const isEquipped = equippedIds[artifact.slot] === artifact.id;
              const isSelected = selectedId === artifact.id;
              return (
                <button
                  key={artifact.id}
                  onClick={() => setSelectedId(isSelected ? null : artifact.id)}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? "bg-white/10 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                      : isEquipped
                      ? "bg-white/5 border-white/20"
                      : "bg-black/40 border-white/5 hover:border-white/15"
                  } ${RARITY_COLORS[artifact.rarity]}`}
                >
                  <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                    <div className="text-[10px] sm:text-xs font-black italic uppercase truncate w-full">
                      {artifact.name}
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-white/30 font-bold uppercase tracking-wider">
                      {artifact.rarity}
                    </div>
                  </div>
                  {isEquipped && (
                    <div className="text-[8px] font-black uppercase bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full shrink-0 border border-green-500/30">
                      Equipped
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="col-span-1 lg:col-span-4 bg-black/60 rounded-3xl sm:rounded-[2.5rem] border border-white/5 p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 shadow-inner mt-2 sm:mt-4 lg:mt-0">
          <h3 className="text-white/20 uppercase text-[8px] sm:text-xs font-black tracking-[0.2em]">
            Relic Detail
          </h3>

          {detailArtifact ? (
            <div className="flex flex-col gap-4 sm:gap-6 flex-1">
              <div className="flex w-full flex-col min-w-0">
                <h4 className="text-xl sm:text-3xl font-black italic uppercase tracking-tight break-words leading-tight">
                  {detailArtifact.name}
                </h4>
                <p className={`text-[9px] sm:text-xs mt-1 uppercase font-black tracking-widest ${RARITY_COLOR_MAP[detailArtifact.rarity].text}`}>
                  {detailArtifact.rarity}
                </p>
                <p className="text-white/50 text-[10px] sm:text-xs mt-3 leading-relaxed">
                  {detailArtifact.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {formatArtifactStats(detailArtifact).map((line, i) => (
                  <div
                    key={i}
                    className="bg-white/5 p-2 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col gap-0.5 sm:gap-1 border border-white/5"
                  >
                    <span className="text-[7px] sm:text-[9px] font-bold uppercase text-white/30">
                      Mod
                    </span>
                    <span className="text-[10px] sm:text-sm font-mono text-cyan-400 truncate">
                      {line}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onEquip(detailArtifact.slot, isDetailEquipped ? null : detailArtifact.id)}
                className={`mt-auto w-full py-3 sm:py-4 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-widest transition-all border ${
                  isDetailEquipped
                    ? "bg-rose-900/30 border-rose-500/40 text-rose-300 hover:bg-rose-800/50"
                    : "bg-cyan-900/40 border-cyan-500/50 text-cyan-200 hover:bg-cyan-800/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                }`}
              >
                {isDetailEquipped ? "Unequip" : "Equip"}
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center opacity-20 italic text-xs sm:text-sm">
              Select a relic to inspect
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
