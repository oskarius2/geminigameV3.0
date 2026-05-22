import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GameIcon } from '../../../components/icons';
import { ARTIFACTS } from '../../content/artifacts';
import { RARITY_COLORS } from '../../content/rarityColors';
import { HUD_RARITY_HEX } from '../hudTokens';
import { BuffRarity, type ArtifactSlot } from '../../types';

const SLOT_LABELS: Record<ArtifactSlot, string> = {
  CANNON_A: 'A',
  CANNON_B: 'B',
  ULTIMATE: 'ULT',
  ARMOR: 'ARM',
  MOBILITY: 'MOB',
};

const ALL_SLOTS: ArtifactSlot[] = ['CANNON_A', 'CANNON_B', 'ULTIMATE', 'ARMOR', 'MOBILITY'];

export interface MobileBottomDockProps {
  equippedArtifacts: Record<ArtifactSlot, string | null>;
  activeWeaponSlot: 'CANNON_A' | 'CANNON_B';
  onWeaponSwitch?: (slot: 'CANNON_A' | 'CANNON_B') => void;
  energy: number;
  maxEnergy: number;
  ultimateCharge: number;
  buffChips: React.ReactNode[];
  companionHealth: number;
  companionMaxHealth: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  isLandscape: boolean;
}

export function MobileBottomDock({
  equippedArtifacts,
  activeWeaponSlot,
  onWeaponSwitch,
  energy,
  maxEnergy,
  ultimateCharge,
  buffChips,
  companionHealth,
  companionMaxHealth,
  expanded,
  onToggleExpanded,
  isLandscape,
}: MobileBottomDockProps) {
  const filledSlots = ALL_SLOTS.filter((s) => equippedArtifacts[s]);
  const hpPct =
    companionMaxHealth > 0
      ? Math.max(0, Math.min(100, (companionHealth / companionMaxHealth) * 100))
      : 0;
  const ultPct = Math.min(100, ultimateCharge);
  const nrgPct = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0;
  const relicCount = filledSlots.length;

  const gridItems: { key: string; label: React.ReactNode; active?: boolean; onClick?: () => void }[] =
    [
      {
        key: 'wpn-a',
        label: 'A',
        active: activeWeaponSlot === 'CANNON_A',
        onClick: () => onWeaponSwitch?.('CANNON_A'),
      },
      {
        key: 'wpn-b',
        label: 'B',
        active: activeWeaponSlot === 'CANNON_B',
        onClick: () => onWeaponSwitch?.('CANNON_B'),
      },
    ];

  for (const chip of buffChips.slice(0, 2)) {
    gridItems.push({ key: `buff-${gridItems.length}`, label: chip });
  }

  while (gridItems.length < 4) {
    gridItems.push({ key: `empty-${gridItems.length}`, label: '—' });
  }

  return (
    <div
      className={`mobile-dock ${expanded ? 'mobile-dock--expanded' : 'mobile-dock--collapsed'} ${isLandscape ? 'mobile-dock--landscape' : ''}`}
    >
      {!expanded ? (
        <div className="mobile-dock-collapsed-bar pointer-events-auto">
          <div className="mobile-dock-collapsed-bar__weapons">
            <button
              type="button"
              className={`mobile-dock-collapsed-bar__wpn ${activeWeaponSlot === 'CANNON_A' ? 'mobile-dock-collapsed-bar__wpn--active' : ''}`}
              onClick={() => onWeaponSwitch?.('CANNON_A')}
              aria-label="Weapon A"
              aria-pressed={activeWeaponSlot === 'CANNON_A'}
            >
              A
            </button>
            <button
              type="button"
              className={`mobile-dock-collapsed-bar__wpn ${activeWeaponSlot === 'CANNON_B' ? 'mobile-dock-collapsed-bar__wpn--active' : ''}`}
              onClick={() => onWeaponSwitch?.('CANNON_B')}
              aria-label="Weapon B"
              aria-pressed={activeWeaponSlot === 'CANNON_B'}
            >
              B
            </button>
          </div>

          <div className="mobile-dock-collapsed-bar__meters" aria-hidden>
            <span className="mobile-dock-collapsed-bar__meter">
              <span
                className="mobile-dock-collapsed-bar__meter-fill mobile-dock-collapsed-bar__meter-fill--ult"
                style={{ width: `${ultPct}%` }}
              />
            </span>
            <span className="mobile-dock-collapsed-bar__meter">
              <span
                className="mobile-dock-collapsed-bar__meter-fill mobile-dock-collapsed-bar__meter-fill--nrg"
                style={{ width: `${nrgPct}%` }}
              />
            </span>
          </div>

          {companionMaxHealth > 0 && (
            <div className="mobile-dock-collapsed-bar__companion" aria-hidden>
              <span
                className="mobile-dock-collapsed-bar__companion-fill"
                style={{ width: `${hpPct}%` }}
              />
            </div>
          )}

          <button
            type="button"
            className="mobile-dock-collapsed-bar__expand"
            onClick={onToggleExpanded}
            aria-expanded={false}
            aria-label="Expand loadout and inventory"
          >
            {relicCount > 0 ? `${relicCount} reliker` : 'Loadout'}
            <ChevronUp size={14} aria-hidden />
          </button>
        </div>
      ) : (
        <div className="mobile-dock-panel mobile-hud-card pointer-events-auto">
          <button
            type="button"
            className="mobile-dock-panel__collapse"
            onClick={onToggleExpanded}
            aria-expanded
            aria-label="Collapse loadout"
          >
            Minimera
            <ChevronDown size={14} aria-hidden />
          </button>

          <div className="mobile-dock-energy">
            <div>
              <span className="mobile-dock-energy__label">Ult {Math.round(ultimateCharge)}%</span>
              <div className="mobile-dock-energy__bar">
                <div
                  className="mobile-dock-energy__fill bg-fuchsia-500"
                  style={{ width: `${ultPct}%` }}
                />
              </div>
            </div>
            <div>
              <span className="mobile-dock-energy__label">
                Nrg {Math.round(energy)}/{maxEnergy}
              </span>
              <div className="mobile-dock-energy__bar">
                <div
                  className="mobile-dock-energy__fill bg-cyan-400"
                  style={{ width: `${nrgPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className={`mobile-buff-grid ${isLandscape ? 'mobile-buff-grid--row' : ''}`}>
            {gridItems.slice(0, 4).map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={!item.onClick && item.label === '—'}
                className={`mobile-buff-grid__btn ${item.active ? 'mobile-buff-grid__btn--active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick?.();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filledSlots.length > 0 && (
            <div className="mobile-dock-relics" role="list" aria-label="Equipped relics">
              {filledSlots.map((slot) => {
                const id = equippedArtifacts[slot]!;
                const art = ARTIFACTS[id];
                if (!art) return null;
                const cls = RARITY_COLORS[art.rarity] ?? RARITY_COLORS[BuffRarity.COMMON];
                const hex = HUD_RARITY_HEX[art.rarity] ?? HUD_RARITY_HEX[BuffRarity.COMMON];
                return (
                  <div
                    key={slot}
                    role="listitem"
                    className={`mobile-dock-relics__chip ${cls.border} ${cls.bg}`}
                    title={art.name}
                  >
                    <GameIcon name="ui.relic" size={12} color={hex} />
                    <span className={`mobile-dock-relics__slot ${cls.text}`}>{SLOT_LABELS[slot]}</span>
                    <span className="mobile-dock-relics__name">{art.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {companionMaxHealth > 0 && (
            <div className="mobile-companion-hp" title="Companion hull">
              <div
                className="mobile-companion-hp__fill"
                style={{
                  width: `${hpPct}%`,
                  background: 'linear-gradient(90deg, #60a5fa, #22d3ee)',
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
