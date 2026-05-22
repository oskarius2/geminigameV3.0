import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { CAMPAIGN_LEVELS, CampaignLevel } from '../content/campaignLevels';
import { SpaceBackground, HudCorner } from '../../components/ui/SpaceBackground';

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
        className="relative flex items-center gap-4 rounded-xl p-4 opacity-40 cursor-not-allowed select-none"
        style={{
          background: 'rgba(15,23,42,0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10">
          <Lock size={18} className="text-white/40" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
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
      className={`relative w-full text-left flex items-center gap-4 rounded-xl p-4 focus:outline-none transition-colors`}
      style={{
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.border.replace('border-', '').replace('/60', '')}`,
        boxShadow: `inset 0 0 20px rgba(6,182,212,0.03), 0 8px 32px rgba(0,0,0,0.4)`,
      }}
    >
      <HudCorner position="tl" />
      <HudCorner position="br" />

      {/* Level number bubble */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-black/30"
        style={{ borderColor: 'inherit' }}
      >
        <span className={`text-lg font-black ${theme.text}`}>{level.number}</span>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
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
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${theme.badge}`}>
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
    const refresh = () => setSave(loadSave());
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const completedCount = save.completedLevels.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[500] overflow-hidden flex flex-col"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(6,182,212,0.07) 0%, transparent 70%), #020617',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <SpaceBackground scanlines />

      <div className="relative z-10 flex flex-col items-center overflow-y-auto flex-1 px-4 md:px-8 pb-8">
        <div className="w-full max-w-lg">
          {/* Header bar */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between pt-2 pb-6"
          >
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onBack}
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400/60 hover:text-cyan-300 transition-colors focus:outline-none"
            >
              <ArrowLeft size={14} />
              Back
            </motion.button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/70">Campaign</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <h1
              className="font-display font-bold tracking-[0.1em] text-white"
              style={{
                fontSize: 'clamp(2rem, 6vw, 3rem)',
                textShadow: '0 0 40px rgba(6,182,212,0.5), 0 0 80px rgba(6,182,212,0.2)',
              }}
            >
              CAMPAIGN
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-400/50 mt-1">
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
            className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/20 mt-8"
          >
            Complete each sector to unlock the next
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};
