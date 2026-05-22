import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Bot, Trophy } from 'lucide-react';
import { ARTIFACTS } from '../content/artifacts';
import { HUD_RARITY_HEX } from '../hud/hudTokens';
import { getCompanionDef } from '../companions/companionDefs';
import type { CompanionId } from '../types';
import { BuffRarity } from '../types';

export type UnlockToast =
  | { type: 'artifact'; artifactId: string }
  | { type: 'companion'; companionId: CompanionId }
  | { type: 'personal_best'; metric: 'score' | 'time'; previous: number; current: number };

interface UnlockToastStackProps {
  toasts: UnlockToast[];
  onDismiss: (index: number) => void;
}

export function UnlockToastStack({ toasts, onDismiss }: UnlockToastStackProps) {
  useEffect(() => {
    if (toasts.length === 0) return;
    const t = window.setTimeout(() => onDismiss(0), 3000);
    return () => window.clearTimeout(t);
  }, [toasts.length, onDismiss]);

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[180] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast, i) => (
          <motion.div
            key={`${toast.type}-${i}-${'artifactId' in toast ? toast.artifactId : 'companionId' in toast ? toast.companionId : toast.metric}`}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-amber-400/40 bg-black/80 backdrop-blur-md p-4 shadow-[0_0_24px_rgba(251,191,36,0.2)]"
          >
            {toast.type === 'artifact' && <ArtifactUnlockToast artifactId={toast.artifactId} />}
            {toast.type === 'companion' && <CompanionUnlockToast companionId={toast.companionId} />}
            {toast.type === 'personal_best' && (
              <PersonalBestToast
                metric={toast.metric}
                previous={toast.previous}
                current={toast.current}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ArtifactUnlockToast({ artifactId }: { artifactId: string }) {
  const art = ARTIFACTS[artifactId];
  if (!art) return null;
  const color = HUD_RARITY_HEX[art.rarity] ?? '#00d4ff';
  return (
    <div className="flex items-start gap-3">
      <Sparkles size={20} className="text-amber-400 shrink-0" />
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
          New artifact unlocked
        </p>
        <p className="font-display font-bold text-white uppercase mt-0.5" style={{ color }}>
          {art.name}
        </p>
        <p className="text-[10px] uppercase font-mono mt-0.5" style={{ color }}>
          {art.rarity}
        </p>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{art.description}</p>
      </div>
    </div>
  );
}

function CompanionUnlockToast({ companionId }: { companionId: CompanionId }) {
  const def = getCompanionDef(companionId);
  if (!def) return null;
  return (
    <div className="flex items-start gap-3">
      <Bot size={20} className="text-violet-400 shrink-0" />
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-violet-300">
          New companion unlocked
        </p>
        <p className="font-display font-bold text-white uppercase mt-0.5">{def.name}</p>
        <p className="text-xs text-slate-400 mt-1">{def.description}</p>
      </div>
    </div>
  );
}

function PersonalBestToast({
  metric,
  previous,
  current,
}: {
  metric: 'score' | 'time';
  previous: number;
  current: number;
}) {
  const label = metric === 'score' ? 'High score' : 'Longest run';
  const fmt = (v: number) =>
    metric === 'score' ? v.toLocaleString() : formatTime(v);
  return (
    <div className="flex items-start gap-3">
      <Trophy size={20} className="text-amber-400 shrink-0" />
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
          New personal best
        </p>
        <p className="font-display font-bold text-white mt-0.5">{label}</p>
        <p className="text-xs font-mono text-slate-400 mt-1">
          {fmt(previous)} → <span className="text-emerald-400">{fmt(current)}</span>
        </p>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function buildArtifactUnlockToast(artifactId: string): UnlockToast {
  return { type: 'artifact', artifactId };
}

export function buildCompanionUnlockToast(companionId: CompanionId): UnlockToast {
  return { type: 'companion', companionId };
}

export function buildPersonalBestToast(
  metric: 'score' | 'time',
  previous: number,
  current: number,
): UnlockToast {
  return { type: 'personal_best', metric, previous, current };
}
