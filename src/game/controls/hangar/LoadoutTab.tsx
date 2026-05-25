import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { GameIcon, getSlotIconName, getShipIconName } from '../../../components/icons';
import { Artifact, ArtifactSlot, ShipId } from '../../types';
import { ARTIFACTS } from '../../content/artifacts';
import { formatArtifactStats } from '../../meta/formatArtifactStats';
import { RARITY_COLORS } from '../../content/rarityColors';
import { HUD_RARITY_HEX } from '../../hud/hudTokens';
import { SHIP_DEFINITIONS } from '../../ships/shipDefs';
import { GhostButton } from '../../../components/ui/GhostButton';

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

const BASELINE_DAMAGE = 18;

function SlotIcon({ slot }: { slot: ArtifactSlot }) {
  return (
    <GameIcon
      name={getSlotIconName(slot)}
      size={18}
      color={SLOT_ICON_COLORS[slot]}
    />
  );
}

const SLOTS: ArtifactSlot[] = ['CANNON_A', 'CANNON_B', 'ULTIMATE', 'ARMOR', 'MOBILITY'];

interface LoadoutTabProps {
  equippedIds: Record<ArtifactSlot, string | null>;
  unlockedArtifacts: Artifact[];
  selectedShipId: ShipId | null;
  onEquip: (slot: ArtifactSlot, id: string | null) => void;
  onPickSlot?: (slot: ArtifactSlot) => void;
  onChangeShip?: () => void;
  onChangeRelics?: () => void;
}

export function LoadoutTab({
  equippedIds,
  unlockedArtifacts,
  selectedShipId,
  onEquip,
  onPickSlot,
  onChangeShip,
  onChangeRelics,
}: LoadoutTabProps) {
  const ship = selectedShipId ? SHIP_DEFINITIONS[selectedShipId] : null;

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

    const baseHp = ship?.baseHP ?? 200;
    const baseDmg = Math.round(BASELINE_DAMAGE * (ship?.baseDamage ?? 1));
    const baseSpd = ship?.baseSpeed ?? 15;

    return {
      damageMod,
      healthMod,
      speedMod,
      finalHp: baseHp + healthMod,
      finalDmg: baseDmg + damageMod,
      finalSpd: Math.round(baseSpd * speedMod * 10) / 10,
      fireRate: ship?.fireRateMultiplier ?? 1,
    };
  }, [equippedIds, ship]);

  const equippedCount = SLOTS.filter((s) => equippedIds[s] != null).length;

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
          Pre-launch review
        </p>
        <h2 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-white mt-1">
          Your Loadout
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ship section */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-widest text-white/50">
              Ship
            </h3>
            {onChangeShip && (
              <button
                type="button"
                onClick={onChangeShip}
                className="text-[10px] font-mono text-cyan-400/60 hover:text-cyan-400 transition-colors uppercase tracking-wider"
                style={{ minHeight: '28px' }}
              >
                Change
              </button>
            )}
          </div>

          {ship ? (
            <div className="flex gap-3 items-center">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border"
                style={{
                  borderColor: `${ship.color}55`,
                  background: `${ship.color}10`,
                  boxShadow: `0 0 20px ${ship.color}22`,
                }}
              >
                <GameIcon name={getShipIconName(ship.id)} size={30} color={ship.color} glow />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-white uppercase tracking-wide">{ship.name}</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase">{ship.uniquePassive.name}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/30 font-mono">No ship selected</p>
          )}
        </div>

        {/* Final stats section */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:p-5">
          <h3 className="font-display text-xs font-bold uppercase tracking-widest text-white/50 mb-3">
            Final Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Health', value: summary.finalHp, mod: summary.healthMod, color: '#4ade80' },
              { label: 'Damage', value: summary.finalDmg, mod: summary.damageMod, color: '#f87171' },
              { label: 'Speed', value: summary.finalSpd, mod: summary.speedMod !== 1 ? Math.round((summary.speedMod - 1) * 100) : 0, color: '#60a5fa' },
              { label: 'Fire Rate', value: `${(summary.fireRate * 10).toFixed(0)}/s`, mod: 0, color: '#fbbf24' },
            ].map(({ label, value, mod, color }) => (
              <div key={label} className="rounded-lg bg-white/5 border border-white/5 p-2.5">
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">{label}</p>
                <p className="text-lg font-black text-white mt-0.5 tabular-nums" style={{ color }}>
                  {value}
                </p>
                {typeof mod === 'number' && mod !== 0 && (
                  <p className={`text-[9px] font-mono ${mod > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {mod > 0 ? `+${mod}` : mod} from relics
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipped relics */}
      <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xs font-bold uppercase tracking-widest text-white/50">
            Relics ({equippedCount}/{SLOTS.length})
          </h3>
          {onChangeRelics && (
            <button
              type="button"
              onClick={onChangeRelics}
              className="text-[10px] font-mono text-cyan-400/60 hover:text-cyan-400 transition-colors uppercase tracking-wider"
              style={{ minHeight: '28px' }}
            >
              Change
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {SLOTS.map((slot) => {
            const artId = equippedIds[slot];
            const art = artId ? unlockedArtifacts.find((a) => a.id === artId) ?? ARTIFACTS[artId] : null;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => art ? onEquip(slot, null) : onPickSlot?.(slot)}
                className="text-left p-3 rounded-lg border border-white/8 bg-white/5 hover:border-hud-accent transition-colors"
                style={{ minHeight: '44px' }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <SlotIcon slot={slot} />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-white/35">
                    {SLOT_LABELS[slot]}
                  </span>
                </div>
                {art ? (
                  <>
                    <p
                      className="text-xs font-bold truncate"
                      style={{ color: HUD_RARITY_HEX[art.rarity] }}
                    >
                      {art.name}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                      {formatArtifactStats(art).join(', ')}
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] text-white/20 font-mono">Empty slot</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
