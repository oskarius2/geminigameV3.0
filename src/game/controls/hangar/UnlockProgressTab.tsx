import React from 'react';
import { Check, Circle } from 'lucide-react';
import { Panel } from '../../../components/ui/Panel';
import { BuffRarity } from '../../types';
import {
  getArtifactCollectionStats,
  getMetaProgress,
  getMetaUnlockedCompanionIds,
} from '../../meta/metaProgress';
import { estimateStageMilestoneProgress } from '../../meta/unlockSystem';
import { RARITY_COLORS } from '../../content/rarityColors';
import { HUD_RARITY_HEX } from '../../hud/hudTokens';

const RARITY_ORDER: BuffRarity[] = [
  BuffRarity.COMMON,
  BuffRarity.RARE,
  BuffRarity.EPIC,
  BuffRarity.LEGENDARY,
  BuffRarity.EXCLUSIVE,
];

export function UnlockProgressTab() {
  const progress = getMetaProgress();
  const collection = getArtifactCollectionStats(progress);
  const milestones = estimateStageMilestoneProgress(progress);
  const companions = getMetaUnlockedCompanionIds(progress);
  const companionPct = Math.round((companions.length / 4) * 100);
  const relicPct =
    collection.total > 0
      ? Math.round((collection.unlocked / collection.total) * 100)
      : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 overflow-y-auto pr-1 pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
        <Panel className="p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Relic collection</p>
          <p className="text-3xl font-black text-cyan-300 mt-1">{relicPct}%</p>
          <p className="text-xs text-white/50 mt-1">
            {collection.unlocked} / {collection.total} unlocked
          </p>
        </Panel>
        <Panel className="p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Companions</p>
          <p className="text-3xl font-black text-violet-300 mt-1">{companions.length} / 4</p>
          <p className="text-xs text-white/50 mt-1">{companionPct}% deployed roster</p>
        </Panel>
      </div>

      <Panel className="p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">
          By rarity
        </p>
        <ul className="space-y-2">
          {RARITY_ORDER.map((rarity) => {
            const row = collection.byRarity[rarity];
            if (!row) return null;
            const pct = row.total > 0 ? Math.round((row.unlocked / row.total) * 100) : 0;
            const rc = RARITY_COLORS[rarity];
            return (
              <li key={rarity} className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase w-24 shrink-0 ${rc.text}`}>
                  {rarity}
                </span>
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{ width: `${pct}%`, backgroundColor: HUD_RARITY_HEX[rarity] }}
                  />
                </div>
                <span className="text-xs font-mono text-white/60 tabular-nums w-16 text-right">
                  {row.unlocked}/{row.total}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel className="p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">
          Stage milestones
        </p>
        <ul className="space-y-3">
          {milestones.map((m) => (
            <li key={m.stage} className="flex items-start gap-3">
              {m.percent >= 100 ? (
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Circle size={16} className="text-white/25 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-semibold">{m.label}</p>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-500/80"
                    style={{ width: `${m.percent}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-mono text-cyan-400/80 tabular-nums">{m.percent}%</span>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-white/35 mt-4 font-mono">
          Clearing stages permanently unlocks relics. In-run cards, mini-bosses, and rare kills also
          grant unlocks.
        </p>
      </Panel>
    </div>
  );
}
