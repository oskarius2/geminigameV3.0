import React, { useMemo, useState } from 'react';
import { Artifact, ArtifactSlot } from '../../types';
import { ARTIFACTS, artifactPowerScore } from '../../content/artifacts';
import { ALL_ARTIFACT_SLOTS } from '../../content/artifactsExtra';
import { getArtifactUnlockHint } from '../../meta/unlockHints';
import { getMetaProgress } from '../../meta/metaProgress';
import { RelicCard } from '../../../components/relic/RelicCard';
import { formatArtifactStats } from '../../meta/formatArtifactStats';
import { GameIcon, getSlotIconName } from '../../../components/icons';

type SortMode = 'power' | 'rarity' | 'alpha' | 'new' | 'locked';

const RARITY_ORDER: Record<string, number> = {
  LEGENDARY: 0,
  EPIC: 1,
  RARE: 2,
  COMMON: 3,
  EXCLUSIVE: 4,
  MYSTERY: 5,
};

const SLOT_LABELS: Record<ArtifactSlot, string> = {
  CANNON_A: 'Cannon A',
  CANNON_B: 'Cannon B',
  ULTIMATE: 'Ultimate',
  ARMOR: 'Armor',
  MOBILITY: 'Mobility',
};

const SLOT_ICON_COLORS: Record<ArtifactSlot, string> = {
  CANNON_A: '#00e5ff',
  CANNON_B: '#7df9ff',
  ULTIMATE: '#ff2d9b',
  ARMOR: '#60a5fa',
  MOBILITY: '#2dd4bf',
};

const CASCADE_STAGGER_MS = 40;

interface RelicVaultTabProps {
  unlockedIds: string[];
  equippedIds: Record<ArtifactSlot, string | null>;
  newUnlockIds?: string[];
  onEquip: (slot: ArtifactSlot, id: string | null) => void;
}

export function RelicVaultTab({
  unlockedIds,
  equippedIds,
  newUnlockIds = [],
  onEquip,
}: RelicVaultTabProps) {
  const [filterSlot, setFilterSlot] = useState<ArtifactSlot | 'ALL'>('ALL');
  const [sort, setSort] = useState<SortMode>('new');
  const [search, setSearch] = useState('');
  const progress = getMetaProgress();
  const pendingNew = newUnlockIds.length > 0 ? newUnlockIds : progress.pendingNewArtifacts;

  const equippedCount = ALL_ARTIFACT_SLOTS.filter((s) => equippedIds[s] != null).length;

  const all = useMemo(() => {
    let list = Object.values(ARTIFACTS);
    if (filterSlot !== 'ALL') list = list.filter((a) => a.slot === filterSlot);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }

    const owned = (id: string) => unlockedIds.includes(id);
    const isNew = (id: string) => pendingNew.includes(id);

    if (sort === 'new') {
      list.sort((a, b) => {
        const aNew = isNew(a.id) ? 0 : 1;
        const bNew = isNew(b.id) ? 0 : 1;
        if (aNew !== bNew) return aNew - bNew;
        return artifactPowerScore(b) - artifactPowerScore(a);
      });
    } else if (sort === 'locked') {
      list.sort((a, b) => {
        const aLocked = owned(a.id) ? 1 : 0;
        const bLocked = owned(b.id) ? 1 : 0;
        if (aLocked !== bLocked) return aLocked - bLocked;
        return (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9);
      });
    } else if (sort === 'power') {
      list.sort((a, b) => artifactPowerScore(b) - artifactPowerScore(a));
    } else if (sort === 'rarity') {
      list.sort(
        (a, b) =>
          (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9) ||
          a.name.localeCompare(b.name),
      );
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filterSlot, sort, search, unlockedIds, pendingNew]);

  const gridKey = `${filterSlot}-${sort}-${search}`;

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
      {/* Main relic grid */}
      <div className="flex-1 flex flex-col min-h-0 gap-3">
        {/* Toolbar */}
        <div className="relic-vault-toolbar">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1">
            {(['ALL', ...ALL_ARTIFACT_SLOTS] as const).map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setFilterSlot(slot)}
                className={`relic-vault-chip ${filterSlot === slot ? 'relic-vault-chip--active' : ''}`}
                style={{ minHeight: '44px' }}
              >
                {slot === 'ALL' ? 'All' : slot.replace('_', ' ')}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="relic-vault-select"
            aria-label="Sort relics"
            style={{ minHeight: '44px' }}
          >
            <option value="new">New first</option>
            <option value="locked">Locked first</option>
            <option value="power">Power</option>
            <option value="rarity">Rarity</option>
            <option value="alpha">Alphabetical</option>
          </select>
          <input
            type="search"
            placeholder="Search relics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="relic-vault-search"
            style={{ minHeight: '44px' }}
          />
        </div>

        {/* Grid */}
        <div
          key={gridKey}
          className="relic-vault-grid overflow-y-auto flex-1 pr-1 pb-8 min-h-0"
        >
          {all.map((art, index) => {
            const owned = unlockedIds.includes(art.id);
            const equipped = equippedIds[art.slot] === art.id;
            const isNew = owned && pendingNew.includes(art.id);
            const description = owned
              ? art.description
              : getArtifactUnlockHint(art.id, progress);

            return (
              <RelicCard
                key={art.id}
                artifact={art}
                owned={owned}
                equipped={equipped}
                isNew={isNew}
                description={description}
                enterDelayMs={index * CASCADE_STAGGER_MS}
                onEquip={
                  owned
                    ? () => onEquip(art.slot, equipped ? null : art.id)
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>

      {/* Live loadout preview sidebar */}
      <div className="lg:w-[280px] xl:w-[300px] shrink-0 rounded-xl border border-white/10 bg-black/40 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xs font-bold uppercase tracking-widest text-white/50">
            Your loadout
          </h3>
          <span className="text-[10px] font-mono text-cyan-400/60 tabular-nums">
            {equippedCount}/{ALL_ARTIFACT_SLOTS.length} slots
          </span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto">
          {ALL_ARTIFACT_SLOTS.map((slot) => {
            const artId = equippedIds[slot];
            const art = artId ? ARTIFACTS[artId] : null;

            return (
              <div
                key={slot}
                className={`rounded-lg border p-2.5 transition-colors ${
                  art
                    ? 'border-white/10 bg-white/5'
                    : 'border-dashed border-white/8 bg-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GameIcon
                    name={getSlotIconName(slot)}
                    size={16}
                    color={SLOT_ICON_COLORS[slot]}
                  />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-white/40 flex-1">
                    {SLOT_LABELS[slot]}
                  </span>
                  {art && (
                    <button
                      type="button"
                      onClick={() => onEquip(slot, null)}
                      className="text-[9px] font-mono text-rose-400/60 hover:text-rose-400 transition-colors"
                      style={{ minWidth: '44px', minHeight: '28px' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                {art ? (
                  <div className="mt-1.5">
                    <p className="text-xs font-bold text-white truncate">{art.name}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">
                      {formatArtifactStats(art).join(' · ')}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-white/20 mt-1 font-mono">Empty</p>
                )}
              </div>
            );
          })}
        </div>

        {equippedCount === 0 && (
          <p className="text-[10px] text-white/25 font-mono text-center mt-3">
            Equip relics from the grid
          </p>
        )}
      </div>
    </div>
  );
}
