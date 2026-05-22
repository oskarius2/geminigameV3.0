import React, { useMemo, useState } from 'react';
import { Artifact, ArtifactSlot } from '../../types';
import { ARTIFACTS, artifactPowerScore } from '../../content/artifacts';
import { ALL_ARTIFACT_SLOTS } from '../../content/artifactsExtra';
import { getArtifactUnlockHint } from '../../meta/unlockHints';
import { getMetaProgress } from '../../meta/metaProgress';
import { RelicCard } from '../../../components/relic/RelicCard';

type SortMode = 'power' | 'rarity' | 'alpha' | 'new' | 'locked';

const RARITY_ORDER: Record<string, number> = {
  LEGENDARY: 0,
  EPIC: 1,
  RARE: 2,
  COMMON: 3,
  EXCLUSIVE: 4,
  MYSTERY: 5,
};

const CASCADE_STAGGER_MS = 45;

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
    <div className="flex flex-col flex-1 min-h-0 gap-[var(--primitive-space-lg)]">
      <div className="relic-vault-toolbar">
        <div className="flex gap-[var(--primitive-space-sm)] overflow-x-auto scrollbar-hide flex-1">
          {(['ALL', ...ALL_ARTIFACT_SLOTS] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setFilterSlot(slot)}
              className={`relic-vault-chip ${filterSlot === slot ? 'relic-vault-chip--active' : ''}`}
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
        />
      </div>

      <div
        key={gridKey}
        className="relic-vault-grid overflow-y-auto flex-1 pr-1 pb-[var(--primitive-space-lg)]"
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
  );
}
