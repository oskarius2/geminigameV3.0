import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Target, Shield, Flame, Magnet, Activity, HeartPulse,
  ShieldCheck, Bomb, Swords, CircleIcon, MoveRight, RotateCcw, Trophy, Sparkles,
} from 'lucide-react';
import { SpaceBackground } from '../../components/ui/SpaceBackground';
import { PassiveBuff, BuffRarity, Artifact } from '../types';
import { getBuffStacksForDisplay } from '../buffs/pickBuffs';
import type { SurvivalCardChoice } from '../buffs/pickSurvivalCards';
import type { ViewportProfile } from './mobileLayout';

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap />, Target: <Target />, Shield: <Shield />, Flame: <Flame />,
  Magnet: <Magnet />, Activity: <Activity />, HeartPulse: <HeartPulse />,
  ShieldCheck: <ShieldCheck />, Bomb: <Bomb />, Swords: <Swords />,
  CircleIcon: <CircleIcon />, MoveRight: <MoveRight />, RotateCcw: <RotateCcw />, Trophy: <Trophy />,
};

interface RarityStyle {
  borderColor: string;
  bg: string;
  glowShadow: string;
  textColor: string;
  label: string;
  barColor: string;
  iconBg: string;
  equipBg: string;
  equipText: string;
}

const RARITY_STYLE: Record<BuffRarity, RarityStyle> = {
  [BuffRarity.COMMON]: {
    borderColor: 'rgba(100,116,139,0.5)',
    bg: 'rgba(6,10,24,0.94)',
    glowShadow: '0 8px 32px rgba(0,0,0,0.6)',
    textColor: '#94a3b8',
    label: 'COMMON',
    barColor: '#64748b',
    iconBg: 'rgba(100,116,139,0.1)',
    equipBg: 'rgba(100,116,139,0.1)',
    equipText: '#94a3b8',
  },
  [BuffRarity.RARE]: {
    borderColor: 'rgba(37,99,235,0.65)',
    bg: 'rgba(6,10,28,0.95)',
    glowShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 40px rgba(37,99,235,0.2)',
    textColor: '#93c5fd',
    label: 'RARE',
    barColor: '#2563eb',
    iconBg: 'rgba(37,99,235,0.1)',
    equipBg: 'rgba(37,99,235,0.12)',
    equipText: '#93c5fd',
  },
  [BuffRarity.EPIC]: {
    borderColor: 'rgba(139,43,226,0.7)',
    bg: 'rgba(8,6,24,0.96)',
    glowShadow: '0 8px 48px rgba(0,0,0,0.65), 0 0 60px rgba(139,43,226,0.25)',
    textColor: '#c084fc',
    label: 'EPIC',
    barColor: '#8b2be2',
    iconBg: 'rgba(139,43,226,0.1)',
    equipBg: 'rgba(139,43,226,0.14)',
    equipText: '#c084fc',
  },
  [BuffRarity.LEGENDARY]: {
    borderColor: 'rgba(255,196,0,0.8)',
    bg: 'rgba(10,8,2,0.96)',
    glowShadow: '0 8px 48px rgba(0,0,0,0.7), 0 0 80px rgba(255,196,0,0.3), 0 0 140px rgba(255,196,0,0.1)',
    textColor: '#fbbf24',
    label: 'LEGENDARY',
    barColor: '#ffc400',
    iconBg: 'rgba(255,196,0,0.08)',
    equipBg: 'rgba(255,196,0,0.12)',
    equipText: '#fbbf24',
  },
  [BuffRarity.EXCLUSIVE]: {
    borderColor: 'rgba(0,229,255,0.9)',
    bg: 'rgba(2,10,20,0.97)',
    glowShadow: '0 8px 56px rgba(0,0,0,0.7), 0 0 80px rgba(0,229,255,0.35), 0 0 160px rgba(0,229,255,0.12)',
    textColor: '#67e8f9',
    label: 'EXCLUSIVE',
    barColor: '#00e5ff',
    iconBg: 'rgba(0,229,255,0.08)',
    equipBg: 'rgba(0,229,255,0.14)',
    equipText: '#67e8f9',
  },
  [BuffRarity.MYSTERY]: {
    borderColor: 'rgba(192,38,211,0.7)',
    bg: 'rgba(10,4,14,0.96)',
    glowShadow: '0 8px 48px rgba(0,0,0,0.65), 0 0 60px rgba(192,38,211,0.25)',
    textColor: '#e879f9',
    label: '???',
    barColor: '#c026d3',
    iconBg: 'rgba(192,38,211,0.1)',
    equipBg: 'rgba(192,38,211,0.14)',
    equipText: '#e879f9',
  },
};

const CARD_CLIP = 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 16px)';
const CARD_CLIP_COMPACT = 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)';
const EQUIP_CLIP = 'polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)';

function RarityBar({ color }: { color: string }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-[2px] z-10">
      <div className="h-full w-full" style={{ background: color, boxShadow: `0 0 8px ${color}, 0 0 16px ${color}80` }} />
    </div>
  );
}

function CornerBracket({ pos }: { pos: 'tl' | 'br' }) {
  const base: React.CSSProperties = { position: 'absolute', width: 12, height: 12, zIndex: 10 };
  const style: React.CSSProperties =
    pos === 'tl'
      ? { ...base, top: 6, left: 6, borderTop: '1.5px solid currentColor', borderLeft: '1.5px solid currentColor' }
      : { ...base, bottom: 6, right: 6, borderBottom: '1.5px solid currentColor', borderRight: '1.5px solid currentColor' };
  return <span className="pointer-events-none opacity-60" style={style} />;
}

function SweepShimmer({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-y-0 w-1/3 pointer-events-none z-0"
      animate={{ x: ['-100%', '400%'] }}
      transition={{ repeat: Infinity, duration: 3.5, ease: 'linear', repeatDelay: 1 }}
      style={{
        background: `linear-gradient(90deg, transparent, ${color}18, transparent)`,
        transform: 'skewX(-8deg)',
      }}
    />
  );
}

function BuffCard({
  buff, passives, onSelect, isMobile, landscapeCards, index,
}: {
  buff: PassiveBuff;
  passives: string[];
  onSelect: (id: string) => void;
  isMobile: boolean;
  landscapeCards: boolean;
  index: number;
}) {
  const compact = isMobile || landscapeCards;
  const s = RARITY_STYLE[buff.rarity];
  const stacks = getBuffStacksForDisplay(passives, buff.id);
  const isExclusive = buff.rarity === BuffRarity.EXCLUSIVE || buff.exclusive;
  const isLegendary = buff.rarity === BuffRarity.LEGENDARY;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.08 + index * 0.1, type: 'spring', stiffness: 280, damping: 24 }}
      whileHover={isMobile ? undefined : { scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(buff.id)}
      className="group relative w-full text-left overflow-hidden flex"
      style={{
        background: s.bg,
        border: `1px solid ${s.borderColor}`,
        clipPath: compact ? CARD_CLIP_COMPACT : CARD_CLIP,
        boxShadow: s.glowShadow,
        color: s.textColor,
        minHeight: compact ? 140 : 280,
        flexDirection: compact ? 'row' : 'column',
      }}
    >
      <RarityBar color={s.barColor} />
      <SweepShimmer color={s.barColor} />
      <CornerBracket pos="tl" />
      <CornerBracket pos="br" />

      {/* Exclusive aura */}
      {isExclusive && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(0,229,255,0.06) 0%, transparent 70%)' }}
        />
      )}

      {compact ? (
        /* --- Compact horizontal layout (mobile / landscape) --- */
        <div className="relative z-10 flex flex-row items-center w-full h-full p-3 gap-3 pt-4">
          <motion.div
            className="shrink-0 w-14 h-14 flex items-center justify-center"
            style={{
              background: s.iconBg,
              border: `1px solid ${s.borderColor}`,
              clipPath: 'polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)',
            }}
            animate={isExclusive ? { scale: [1, 1.07, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.6 }}
          >
            {React.cloneElement((ICON_MAP[buff.icon] || <Zap />) as React.ReactElement, {
              size: 28, strokeWidth: 1.5, color: s.textColor,
            })}
          </motion.div>

          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-[0.2em]"
                style={{
                  color: s.textColor,
                  background: `${s.barColor}18`,
                  border: `1px solid ${s.borderColor}`,
                  clipPath: 'polygon(3px 0%, 100% 0%, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%, 0% 3px)',
                }}
              >
                {isExclusive ? 'EXCLUSIVE' : s.label}
              </span>
              {stacks > 0 && (
                <span
                  className="text-[10px] font-mono font-bold shrink-0"
                  style={{ color: s.textColor, background: `${s.barColor}20`, padding: '0 6px', borderRadius: 2 }}
                >
                  ×{stacks + 1}
                </span>
              )}
            </div>

            <h3
              className="font-display font-black uppercase leading-tight tracking-tight truncate"
              style={{ fontSize: 16, color: '#f0f8ff' }}
            >
              {buff.name}
            </h3>

            {buff.stackSummary && (
              <p className="mt-0.5 text-[11px] font-mono font-bold uppercase tracking-wide truncate" style={{ color: s.textColor }}>
                {buff.stackSummary}
              </p>
            )}

            <p className="mt-1 text-[12px] leading-snug line-clamp-2" style={{ color: 'rgba(148,163,184,0.85)' }}>
              {buff.description}
            </p>
          </div>
        </div>
      ) : (
        /* --- Desktop vertical layout --- */
        <div className="relative z-10 flex flex-col h-full w-full p-5 md:p-6 pt-6">
          <div className="flex items-start justify-between gap-2">
            <span
              className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.25em]"
              style={{
                color: s.textColor,
                background: `${s.barColor}15`,
                border: `1px solid ${s.borderColor}`,
                clipPath: EQUIP_CLIP,
              }}
            >
              {isExclusive ? 'EXCLUSIVE' : s.label}
            </span>
            {stacks > 0 && (
              <span
                className="text-xs font-mono font-bold px-2 py-0.5"
                style={{ color: s.textColor, background: `${s.barColor}18`, border: `1px solid ${s.borderColor}80` }}
              >
                ×{stacks + 1}
              </span>
            )}
          </div>

          <motion.div
            className="mt-5 mb-4 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center"
            style={{
              background: s.iconBg,
              border: `1px solid ${s.borderColor}`,
              clipPath: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)',
              boxShadow: `0 0 24px ${s.barColor}30`,
            }}
            animate={isExclusive ? { scale: [1, 1.07, 1] } : isLegendary ? { scale: [1, 1.04, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.8 }}
          >
            {React.cloneElement((ICON_MAP[buff.icon] || <Zap />) as React.ReactElement, {
              size: 40, strokeWidth: 1.5, color: s.textColor,
            })}
          </motion.div>

          <h3
            className="font-display font-black uppercase leading-tight tracking-tight"
            style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', color: '#f0f8ff' }}
          >
            {buff.name}
          </h3>

          {buff.stackSummary && (
            <p className="mt-2 text-sm font-mono font-bold uppercase tracking-wide" style={{ color: s.textColor }}>
              {buff.stackSummary}
            </p>
          )}

          <p className="mt-3 text-sm leading-relaxed flex-1" style={{ color: 'rgba(148,163,184,0.8)' }}>
            {buff.description}
          </p>

          <motion.div
            className="mt-4 py-3 flex items-center justify-center gap-2 font-display font-bold uppercase text-sm tracking-[0.2em] transition-colors duration-200 group-hover:brightness-125"
            style={{
              background: s.equipBg,
              border: `1px solid ${s.borderColor}`,
              clipPath: EQUIP_CLIP,
              color: s.equipText,
            }}
            whileTap={{ scale: 0.97 }}
          >
            EQUIP
          </motion.div>
        </div>
      )}
    </motion.button>
  );
}

function ArtifactCard({
  artifact, onSelect, isMobile, landscapeCards, index,
}: {
  artifact: Artifact;
  onSelect: (id: string) => void;
  isMobile: boolean;
  landscapeCards: boolean;
  index: number;
}) {
  const compact = isMobile || landscapeCards;
  const s = RARITY_STYLE[artifact.rarity];
  const isLegendary = artifact.rarity === BuffRarity.LEGENDARY;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.08 + index * 0.1, type: 'spring', stiffness: 280, damping: 24 }}
      whileHover={isMobile ? undefined : { scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(artifact.id)}
      className="group relative w-full text-left overflow-hidden flex flex-col"
      style={{
        background: s.bg,
        border: `1px solid ${s.borderColor}`,
        clipPath: compact ? CARD_CLIP_COMPACT : CARD_CLIP,
        boxShadow: s.glowShadow,
        color: s.textColor,
        minHeight: compact ? 140 : 280,
      }}
    >
      <RarityBar color={s.barColor} />
      <SweepShimmer color={s.barColor} />
      <CornerBracket pos="tl" />
      <CornerBracket pos="br" />

      <div className="relative z-10 flex flex-col h-full w-full p-5 md:p-6 pt-6">
        <span
          className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.25em] w-fit"
          style={{
            color: s.textColor,
            background: `${s.barColor}15`,
            border: `1px solid ${s.borderColor}`,
            clipPath: EQUIP_CLIP,
          }}
        >
          ARTIFACT · {s.label}
        </span>

        <div
          className="mt-5 mb-4 w-16 h-16 flex items-center justify-center"
          style={{
            background: s.iconBg,
            border: `1px solid ${s.borderColor}`,
            clipPath: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)',
            boxShadow: `0 0 24px ${s.barColor}28`,
          }}
        >
          <Sparkles size={36} color={s.textColor} strokeWidth={1.5} />
        </div>

        <h3
          className="font-display font-black uppercase leading-tight tracking-tight"
          style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', color: '#f0f8ff' }}
        >
          {artifact.name}
        </h3>
        <p className="mt-3 text-sm leading-relaxed flex-1" style={{ color: 'rgba(148,163,184,0.8)' }}>
          {artifact.description}
        </p>

        <motion.div
          className="mt-4 py-3 flex items-center justify-center gap-2 font-display font-bold uppercase text-sm tracking-[0.2em] transition-colors duration-200 group-hover:brightness-125"
          style={{
            background: s.equipBg,
            border: `1px solid ${s.borderColor}`,
            clipPath: EQUIP_CLIP,
            color: s.equipText,
          }}
          whileTap={{ scale: 0.97 }}
        >
          EQUIP ARTIFACT
        </motion.div>
      </div>
    </motion.button>
  );
}

interface BuffCardPickerProps {
  show: boolean;
  /** @deprecated use choices */
  buffs?: PassiveBuff[];
  choices?: SurvivalCardChoice[];
  passives: string[];
  onSelect: (choiceId: string) => void;
  isMobile?: boolean;
  viewportProfile?: ViewportProfile;
}

export const BuffCardPicker: React.FC<BuffCardPickerProps> = ({
  show, buffs, choices: choicesProp, passives, onSelect, isMobile = false, viewportProfile = 'desktop',
}) => {
  const choices: SurvivalCardChoice[] =
    choicesProp ?? (buffs ?? []).map((buff) => ({ kind: 'buff' as const, buff }));
  const hasExclusive = choices.some(
    (c) => c.kind === 'buff' && (c.buff.rarity === BuffRarity.EXCLUSIVE || c.buff.exclusive),
  );
  const hasArtifact = choices.some((c) => c.kind === 'artifact');
  const landscapeCards = viewportProfile === 'phone-landscape';
  const stackVertical = isMobile && !landscapeCards;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] overflow-hidden flex flex-col items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-auto overflow-y-auto touch-manipulation"
          style={{ background: 'rgba(3,5,14,0.92)' }}
        >
          <SpaceBackground scanlines />

          {/* Scan line */}
          <div
            className="pointer-events-none absolute inset-x-0 z-[1] h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent)',
              animation: 'scan-line 3.5s linear infinite',
            }}
          />

          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-6 px-4 shrink-0"
            >
              <div
                className="inline-flex items-center gap-2 mb-3 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.4em]"
                style={{
                  color: 'rgba(0,229,255,0.6)',
                  border: '1px solid rgba(0,229,255,0.2)',
                  background: 'rgba(0,229,255,0.05)',
                  clipPath: 'polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)',
                }}
              >
                <span className="data-blink">▸</span>
                {hasExclusive
                  ? 'EXCLUSIVE AUGMENT AVAILABLE'
                  : hasArtifact
                    ? 'ARTIFACT ACQUISITION'
                    : 'AUGMENT SELECTION'}
              </div>

              <h2
                className="font-display font-black uppercase tracking-tight"
                style={{
                  fontSize: 'clamp(2rem, 8vw, 4.5rem)',
                  lineHeight: 1,
                  color: '#f0f8ff',
                  textShadow: hasExclusive
                    ? '0 0 40px rgba(0,229,255,0.8), 0 0 80px rgba(0,229,255,0.3)'
                    : hasArtifact
                      ? '0 0 40px rgba(255,196,0,0.6), 0 0 80px rgba(255,196,0,0.2)'
                      : '0 0 30px rgba(0,229,255,0.4)',
                }}
              >
                {hasExclusive ? 'EXCLUSIVE' : hasArtifact ? 'RELIC' : 'AUGMENT'}
              </h2>

              <p
                className="mt-2 font-mono text-[11px] md:text-xs uppercase tracking-[0.35em]"
                style={{ color: 'rgba(0,229,255,0.55)' }}
              >
                {hasExclusive
                  ? 'One choice · Maximum power'
                  : hasArtifact
                    ? 'Select an artifact or augment'
                    : 'Select one upgrade for this run'}
              </p>
            </motion.div>

            {/* Cards */}
            <motion.div
              layout
              className={`flex w-full justify-center items-stretch gap-3 sm:gap-4 md:gap-5 px-2 sm:px-4 pb-8 sm:pb-0 sm:mt-2 ${
                stackVertical
                  ? 'flex-col overflow-y-auto max-w-[500px] mx-auto'
                  : landscapeCards
                    ? 'flex-row overflow-x-auto snap-x snap-mandatory max-w-6xl'
                    : 'flex-row overflow-x-auto sm:overflow-x-visible max-w-5xl'
              }`}
            >
              {choices.map((choice, i) => (
                <motion.div
                  key={choice.kind === 'artifact' ? `art-${choice.artifact.id}-${i}` : `buff-${choice.buff.id}-${i}`}
                  className={`shrink-0 ${stackVertical ? 'w-full' : landscapeCards ? 'w-[min(72vw,280px)] snap-center' : 'w-full sm:flex-1 sm:max-w-sm'}`}
                >
                  {choice.kind === 'artifact' ? (
                    <ArtifactCard
                      artifact={choice.artifact}
                      onSelect={onSelect}
                      isMobile={isMobile}
                      landscapeCards={landscapeCards}
                      index={i}
                    />
                  ) : (
                    <BuffCard
                      buff={choice.buff}
                      passives={passives}
                      onSelect={onSelect}
                      isMobile={isMobile}
                      landscapeCards={landscapeCards}
                      index={i}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
