import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { CAMPAIGN_LEVELS, CampaignLevel } from '../content/campaignLevels';

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const SAVE_KEY = 'campaign_save';

export interface CampaignSave {
  highestLevelUnlocked: number; // 1-based; 1 = only level 1 unlocked
  completedLevels: string[];    // level ids
}

function loadSave(): CampaignSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw) as CampaignSave;
  } catch {
    // corrupted save — start fresh
  }
  return { highestLevelUnlocked: 1, completedLevels: [] };
}

export function saveCampaignProgress(save: CampaignSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function markLevelComplete(levelId: string): void {
  const save = loadSave();
  if (!save.completedLevels.includes(levelId)) {
    save.completedLevels.push(levelId);
  }
  const level = CAMPAIGN_LEVELS.find((l) => l.id === levelId);
  if (level && level.number + 1 > save.highestLevelUnlocked) {
    save.highestLevelUnlocked = level.number + 1;
  }
  saveCampaignProgress(save);
}

// ---------------------------------------------------------------------------
// Theme colours per level (maps to backgroundTheme 0–4)
// ---------------------------------------------------------------------------

const THEME_COLORS: Record<number, { border: string; glow: string; badge: string; text: string }> = {
  0: { border: 'border-cyan-500/60',   glow: 'shadow-cyan-500/20',   badge: 'bg-cyan-500/20 text-cyan-300',   text: 'text-cyan-300' },
  1: { border: 'border-purple-500/60', glow: 'shadow-purple-500/20', badge: 'bg-purple-500/20 text-purple-300', text: 'text-purple-300' },
  2: { border: 'border-red-500/60',    glow: 'shadow-red-500/20',    badge: 'bg-red-500/20 text-red-300',     text: 'text-red-300' },
  3: { border: 'border-emerald-500/60',glow: 'shadow-emerald-500/20',badge: 'bg-emerald-500/20 text-emerald-300', text: 'text-emerald-300' },
  4: { border: 'border-amber-500/60',  glow: 'shadow-amber-500/20',  badge: 'bg-amber-500/20 text-amber-300', text: 'text-amber-300' },
};

// ---------------------------------------------------------------------------
// LevelCard
// ---------------------------------------------------------------------------

interface LevelCardProps {
  level: CampaignLevel;
  unlocked: boolean;
  completed: boolean;
  index: number;
  onSelect: (id: string) => void;
}

const LevelCard: React.FC<LevelCardProps> = ({ level, unlocked, completed, index, onSelect }) => {
  const theme = THEME_COLORS[level.backgroundTheme];

  if (!unlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07 }}
        className="relative flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 opacity-50 cursor-not-allowed select-none"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Lock size={18} className="text-white/40" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
            Sector {level.number}
          </p>
          <p className="text-white/20 font-bold truncate">— Locked —</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(level.id)}
      className={`relative w-full text-left flex items-center gap-4 rounded-xl border ${theme.border} bg-white/5 p-4 shadow-lg ${theme.glow} hover:bg-white/10 transition-colors focus:outline-none`}
    >
      {/* Level number bubble */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${theme.border} bg-black/30`}>
        <span className={`text-lg font-black ${theme.text}`}>{level.number}</span>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
          Sector {level.number}
        </p>
        <p className="text-white font-bold truncate">{level.name}</p>
        <p className="text-white/40 text-xs truncate mt-0.5 leading-tight">
          {level.flavorIntro.slice(0, 72)}…
        </p>
      </div>

      {/* Badges / chevron */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        {completed && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
            <CheckCircle size={10} />
            Done
          </span>
        )}
        <ChevronRight size={16} className="text-white/30" />
      </div>
    </motion.button>
  );
};

// ---------------------------------------------------------------------------
// CampaignSelect
// ---------------------------------------------------------------------------

interface CampaignSelectProps {
  onStartLevel: (levelId: string) => void;
  onBack: () => void;
}

export const CampaignSelect: React.FC<CampaignSelectProps> = ({ onStartLevel, onBack }) => {
  const [save, setSave] = useState<CampaignSave>({ highestLevelUnlocked: 1, completedLevels: [] });

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const completedCount = save.completedLevels.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[500] bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] flex flex-col items-center justify-start overflow-y-auto p-4 md:p-8"
    >
      {/* Header */}
      <div className="w-full max-w-lg">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm mb-8 focus:outline-none"
        >
          <ArrowLeft size={16} />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-black tracking-tight text-white">
            CAMPAIGN
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {completedCount === 0
              ? 'Five sectors stand between you and the source.'
              : completedCount === CAMPAIGN_LEVELS.length
              ? 'All sectors cleared.'
              : `${completedCount} / ${CAMPAIGN_LEVELS.length} sectors cleared.`}
          </p>
        </motion.div>

        {/* Level list */}
        <div className="flex flex-col gap-3">
          {CAMPAIGN_LEVELS.map((level, i) => (
            <LevelCard
              key={level.id}
              level={level}
              unlocked={level.number <= save.highestLevelUnlocked}
              completed={save.completedLevels.includes(level.id)}
              index={i}
              onSelect={onStartLevel}
            />
          ))}
        </div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/20 text-[10px] uppercase tracking-widest mt-8"
        >
          Complete each sector to unlock the next
        </motion.p>
      </div>
    </motion.div>
  );
};
