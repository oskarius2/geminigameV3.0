import React, { useMemo } from 'react';
import { GameIcon, getSlotIconName } from '../../../components/icons';
import { Artifact, ArtifactSlot } from '../../types';
import { ARTIFACTS } from '../../content/artifacts';
import { formatArtifactStats } from '../../meta/formatArtifactStats';
import { RARITY_COLORS } from '../../content/rarityColors';
import { HUD_RARITY_HEX } from '../../hud/hudTokens';

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

function SlotIcon({ slot }: { slot: ArtifactSlot }) {
  return (
    <GameIcon
      name={getSlotIconName(slot)}
      size={22}
      color={SLOT_ICON_COLORS[slot]}
    />
  );
}

const SLOTS: ArtifactSlot[] = ['CANNON_A', 'CANNON_B', 'ULTIMATE', 'ARMOR', 'MOBILITY'];

interface LoadoutTabProps {
  equippedIds: Record<ArtifactSlot, string | null>;
  unlockedArtifacts: Artifact[];
  onEquip: (slot: ArtifactSlot, id: string | null) => void;
  onPickSlot?: (slot: ArtifactSlot) => void;
}

export function LoadoutTab({
  equippedIds,
  unlockedArtifacts,
  onEquip,
  onPickSlot,
}: LoadoutTabProps) {
  const summary = useMemo(() => {
    let damageMod = 0;
    let healthMod = 0;
    let speedMod = 1;
    SLOTS.forEach((slot) => {
      const id = equippedIds[slot];
      if (!id || !ARTIFACTS[id]) return;
      const s = ARTIFACTS[id].stats;
      if (s.damageMod) damageMod += s.damageMod < 10 ? s.damageMod : 0;
      if (s.healthMod) healthMod += s.healthMod;
      if (s.speedMod) speedMod *= s.speedMod;
    });
    return { damageMod, healthMod, speedMod };
  }, [equippedIds]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
      <div className="lg:w-[400px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 shrink-0">
        {SLOTS.map((slot) => {
          const artId = equippedIds[slot];
          const art = artId ? unlockedArtifacts.find((a) => a.id === artId) ?? ARTIFACTS[artId] : null;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onPickSlot?.(slot)}
              className="min-h-[100px] p-4 rounded-xl border border-white/10 bg-black/40 text-left hover:border-[var(--hud-accent)]/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-cyan-400/70">
                <SlotIcon slot={slot} />
                {SLOT_LABELS[slot]}
              </div>
              {art ? (
                <>
                  <p
                    className="mt-2 font-bold text-white text-sm truncate"
                    style={{ color: HUD_RARITY_HEX[art.rarity] }}
                  >
                    {art.name}
                  </p>
                  <p className={`text-[10px] uppercase ${RARITY_COLORS[art.rarity].text}`}>
                    {art.rarity}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEquip(slot, null);
                    }}
                    className="relic-card__btn relic-card__btn--unequip mt-3 w-full"
                  >
                    Unequip
                  </button>
                </>
              ) : (
                <p className="mt-3 text-sm text-white/30 font-mono">Empty slot</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-4 md:p-6">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/50 mb-4">
          Loadout Summary
        </h3>
        <table className="w-full font-mono text-sm">
          <tbody>
            <tr className="border-b border-white/5">
              <td className="py-2 text-slate-400 uppercase text-xs">Offense</td>
              <td className="py-2 text-right text-white">Damage bonus</td>
              <td
                className={`py-2 text-right font-bold ${
                  summary.damageMod > 0 ? 'text-emerald-400' : 'text-white/50'
                }`}
              >
                {summary.damageMod > 0 ? `+${summary.damageMod}` : '—'}
              </td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 text-slate-400 uppercase text-xs">Defense</td>
              <td className="py-2 text-right text-white">Max health</td>
              <td
                className={`py-2 text-right font-bold ${
                  summary.healthMod > 0 ? 'text-emerald-400' : 'text-white/50'
                }`}
              >
                {summary.healthMod > 0 ? `+${summary.healthMod}` : '—'}
              </td>
            </tr>
            <tr>
              <td className="py-2 text-slate-400 uppercase text-xs">Mobility</td>
              <td className="py-2 text-right text-white">Speed mult</td>
              <td
                className={`py-2 text-right font-bold ${
                  summary.speedMod !== 1
                    ? summary.speedMod > 1
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                    : 'text-white/50'
                }`}
              >
                {summary.speedMod !== 1 ? `x${summary.speedMod.toFixed(2)}` : '—'}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Equipped details</p>
          {SLOTS.map((slot) => {
            const id = equippedIds[slot];
            if (!id || !ARTIFACTS[id]) return null;
            const art = ARTIFACTS[id];
            return (
              <div key={slot} className="text-xs text-white/60 border-t border-white/5 pt-2">
                <span className="text-cyan-400/80 font-mono uppercase">{SLOT_LABELS[slot]}:</span>{' '}
                {art.name} — {formatArtifactStats(art).join(', ')}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
