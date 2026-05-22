import React from 'react';
import { Sparkles, Zap, Flame, Sword } from 'lucide-react';
import { ARTIFACTS } from '../content/artifacts';
import { RARITY_COLORS } from '../content/rarityColors';
import { ArtifactSlot, BuffRarity } from '../types';
import { HudPanel } from './HudPanel';
import { HUD_RARITY_HEX } from './hudTokens';
import type { HudVariant } from '../controls/mobileLayout';

const SLOT_LABELS: Record<ArtifactSlot, string> = {
  CANNON_A: 'A',
  CANNON_B: 'B',
  ULTIMATE: 'ULT',
  ARMOR: 'ARM',
  MOBILITY: 'MOB',
};

interface EquippedLoadoutStripProps {
  equippedArtifacts: Record<ArtifactSlot, string | null>;
  activeWeaponSlot: 'CANNON_A' | 'CANNON_B';
  onWeaponSwitch?: (slot: 'CANNON_A' | 'CANNON_B') => void;
  energy: number;
  maxEnergy: number;
  ultimateCharge: number;
  hudVariant: HudVariant;
  showWeapons?: boolean;
  /** Hide artifact chips on narrow phones (swipe / secondary UI later) */
  hideArtifacts?: boolean;
  /** Slim single panel for mobile footer (ult + nrg only). */
  slimMobile?: boolean;
}

export function EquippedLoadoutStrip({
  equippedArtifacts,
  activeWeaponSlot,
  onWeaponSwitch,
  energy,
  maxEnergy,
  ultimateCharge,
  hudVariant,
  showWeapons = false,
  hideArtifacts = false,
  slimMobile = false,
}: EquippedLoadoutStripProps) {
  const compact =
    hudVariant === 'compact' || hudVariant === 'landscape' || hudVariant === 'phone-narrow';
  const centerStack =
    hudVariant === 'phone-narrow' || hudVariant === 'compact';
  const slots = (['CANNON_A', 'CANNON_B', 'ULTIMATE', 'ARMOR', 'MOBILITY'] as ArtifactSlot[]).filter(
    (s) => equippedArtifacts[s],
  );

  return (
    <div
      className={`flex flex-col gap-2 ${centerStack ? 'items-center max-w-[17.5rem] w-full' : `items-end ${compact ? 'max-w-[280px]' : 'max-w-[320px]'}`}`}
    >
      {!hideArtifacts && slots.length > 0 && (
        <HudPanel className="p-2 flex flex-wrap gap-1.5 justify-end">
          {slots.map((slot) => {
            const id = equippedArtifacts[slot]!;
            const art = ARTIFACTS[id];
            if (!art) return null;
            const hex = HUD_RARITY_HEX[art.rarity] ?? HUD_RARITY_HEX[BuffRarity.COMMON];
            const rarityCls = RARITY_COLORS[art.rarity];
            return (
              <div
                key={slot}
                title={`${art.name} (${art.rarity})`}
                className={`flex items-center gap-1 rounded-md px-1.5 py-1 border ${rarityCls.border} ${rarityCls.bg}`}
                style={{ boxShadow: `0 0 8px ${hex}33` }}
              >
                <Sparkles size={12} style={{ color: hex }} aria-hidden />
                <span className={`text-[10px] font-mono font-bold uppercase ${rarityCls.text}`}>
                  {compact ? SLOT_LABELS[slot] : art.name.slice(0, 8)}
                </span>
              </div>
            );
          })}
        </HudPanel>
      )}

      <div className={`flex gap-2 ${centerStack ? 'items-center justify-center w-full' : 'items-end'}`}>
        {showWeapons && (
          <HudPanel className="p-1 flex gap-1 pointer-events-auto">
            {(['CANNON_A', 'CANNON_B'] as const).map((slot) => {
              const active = activeWeaponSlot === slot;
              const Icon = slot === 'CANNON_B' ? Flame : Sword;
              return (
                <button
                  key={slot}
                  type="button"
                  aria-label={slot === 'CANNON_A' ? 'Vapen A' : 'Vapen B'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWeaponSwitch?.(slot);
                  }}
                  className="h-11 w-11 rounded-md flex items-center justify-center transition-all"
                  style={
                    active
                      ? {
                          background: 'rgba(0,212,255,0.15)',
                          border: '1px solid rgba(0,212,255,0.5)',
                          boxShadow: '0 0 12px rgba(0,212,255,0.25)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          opacity: 0.55,
                        }
                  }
                >
                  <Icon size={18} className={active ? 'text-cyan-300' : 'text-white/30'} />
                </button>
              );
            })}
          </HudPanel>
        )}

        <HudPanel
          className={`${slimMobile ? 'p-1.5 w-full max-w-[17.5rem]' : `p-2 space-y-1.5 ${compact ? 'w-24' : 'w-28'}`}`}
        >
          <div>
            <div className="flex justify-between text-[9px] font-mono uppercase text-cyan-400/60 mb-0.5">
              <span>Ult</span>
              <span className="tabular-nums">{Math.round(ultimateCharge)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-fuchsia-500 transition-[width] duration-200"
                style={{ width: `${Math.min(100, ultimateCharge)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[9px] font-mono uppercase text-cyan-400/60 mb-0.5">
              <span>Nrg</span>
              <span className="tabular-nums">
                {Math.round(energy)}/{maxEnergy}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-400 transition-[width] duration-200"
                style={{ width: `${maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0}%` }}
              />
            </div>
          </div>
        </HudPanel>
      </div>
    </div>
  );
}
