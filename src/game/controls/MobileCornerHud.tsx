import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { getShipDef } from '../ships/shipDefs';
import { MiniBossHud } from '../hud/MiniBossHud';
import {
  MobileBottomDock,
  MobileCompanionMini,
  MobileScoreCorner,
  MobileShipCorner,
  MobileThreatCorner,
} from '../hud/mobile/MobileCornerWidgets';
import { buildMobileBuffChips } from '../hud/mobile/mobileBuffChips';
import { getJoystickSize, type HudVariant, type ViewportProfile } from './mobileLayout';
import { HUD_TIMING } from '../hud/hudTokens';
import type { ArtifactSlot, CompanionId, GameState, ShipId } from '../types';

export interface MobileCornerHudProps {
  health: number;
  maxHealth: number;
  survivalTime: number;
  score: number;
  stage: number;
  enemiesToKill: number;
  stageTransition: number;
  bossArenaTransition: number;
  bossActive: boolean;
  gameMode: string;
  onOpenMenu?: () => void;
  onWeaponSwitch?: (slot: 'CANNON_A' | 'CANNON_B') => void;
  activeWeaponSlot: 'CANNON_A' | 'CANNON_B';
  energy: number;
  maxEnergy: number;
  ultimateCharge: number;
  selectedShip?: ShipId;
  companionId: CompanionId | null;
  companionLevel: number;
  companionHealth: number;
  companionMaxHealth: number;
  companionAbilityCooldown: number;
  companionAbilityCooldownMax: number;
  equippedArtifacts: Record<ArtifactSlot, string | null>;
  threatGameState: GameState | null;
  buffs: {
    shield: number;
    overdrive: number;
    magnet: number;
    scoreX: number;
    rapidFire: number;
    timeSlow: number;
    piercing: number;
  };
  extraLifeCharges: number;
  survivalDifficultyLabel?: string;
  miniBossActive: boolean;
  miniBossDisplayName: string;
  miniBossHealth: number;
  miniBossMaxHealth: number;
  miniBossAuraColor: string;
  bossHealth: number;
  bossMaxHealth: number;
  hudVariant: HudVariant;
  viewportProfile: ViewportProfile;
  viewportW: number;
  viewportH: number;
  loadoutExpanded: boolean;
  onToggleLoadout: () => void;
}

export function MobileCornerHud({
  health,
  maxHealth,
  survivalTime,
  score,
  stage,
  enemiesToKill,
  stageTransition,
  bossArenaTransition,
  bossActive,
  gameMode,
  onOpenMenu,
  onWeaponSwitch,
  activeWeaponSlot,
  energy,
  maxEnergy,
  ultimateCharge,
  selectedShip,
  companionId,
  companionLevel,
  companionHealth,
  companionMaxHealth,
  companionAbilityCooldown,
  companionAbilityCooldownMax,
  equippedArtifacts,
  threatGameState,
  buffs,
  extraLifeCharges,
  survivalDifficultyLabel,
  miniBossActive,
  miniBossDisplayName,
  miniBossHealth,
  miniBossMaxHealth,
  miniBossAuraColor,
  bossHealth,
  bossMaxHealth,
  hudVariant,
  viewportProfile,
  viewportW,
  viewportH,
  loadoutExpanded,
  onToggleLoadout,
}: MobileCornerHudProps) {
  const isLandscape = hudVariant === 'landscape';
  const joystickSize = getJoystickSize(viewportProfile, viewportW, viewportH);
  const collapsedInset = joystickSize + 40;
  const expandedInset = joystickSize + (isLandscape ? 88 : 108);
  const dockBottom = loadoutExpanded ? expandedInset : collapsedInset;

  const style = useMemo(
    () =>
      ({
        '--hud-dock-bottom': `${dockBottom}px`,
      }) as React.CSSProperties,
    [dockBottom],
  );

  const ship = selectedShip ? getShipDef(selectedShip) : null;
  const showThreat = gameMode === 'NORMAL' && threatGameState;
  const abilityReady =
    companionAbilityCooldownMax > 0
      ? companionAbilityCooldown <= 0.05
      : companionAbilityCooldown <= 0;

  const buffChipNodes = buildMobileBuffChips(buffs, extraLifeCharges);

  const bossHpPct =
    bossMaxHealth > 0 ? Math.max(0, Math.min(100, (bossHealth / bossMaxHealth) * 100)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: HUD_TIMING.fadeIn }}
      className={`game-hud--corners ${isLandscape ? 'game-hud--landscape' : ''}`}
      style={style}
    >
      <div className="game-hud__corner-tl">
        {ship && <MobileShipCorner ship={ship} playerHP={health} playerMaxHP={maxHealth} />}
        {companionId && companionMaxHealth > 0 && (
          <MobileCompanionMini
            companionId={companionId}
            level={companionLevel}
            abilityReady={abilityReady}
          />
        )}
      </div>

      <div className="game-hud__corner-tr">
        <MobileScoreCorner
          score={score}
          survivalTime={survivalTime}
          stage={stage}
          enemiesToKill={enemiesToKill}
          stageTransition={stageTransition}
          bossArenaTransition={bossArenaTransition}
          bossActive={bossActive}
          gameMode={gameMode}
          survivalDifficultyLabel={survivalDifficultyLabel}
          onOpenMenu={onOpenMenu}
        />
        {showThreat && threatGameState && <MobileThreatCorner state={threatGameState} />}
      </div>

      {(miniBossActive && miniBossMaxHealth > 0 && !bossActive) || (bossActive && bossMaxHealth > 0) ? (
        <div className="game-hud__corner-boss">
          {miniBossActive && miniBossMaxHealth > 0 && !bossActive && (
            <MiniBossHud
              displayName={miniBossDisplayName}
              health={miniBossHealth}
              maxHealth={miniBossMaxHealth}
              auraColor={miniBossAuraColor}
              placement="inline"
            />
          )}
          {bossActive && bossMaxHealth > 0 && (
            <div className="mobile-hud-card p-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-rose-300 mb-1 text-center">
                Boss
              </p>
              <div className="h-2 rounded-full overflow-hidden bg-black/50 border border-white/10">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${bossHpPct}%`,
                    background: 'linear-gradient(90deg, #ef4444, #f97316)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div
        className={`game-hud__corner-bottom ${loadoutExpanded ? 'game-hud__corner-bottom--expanded' : 'game-hud__corner-bottom--collapsed'}`}
      >
        <MobileBottomDock
          equippedArtifacts={equippedArtifacts}
          activeWeaponSlot={activeWeaponSlot}
          onWeaponSwitch={onWeaponSwitch}
          energy={energy}
          maxEnergy={maxEnergy}
          ultimateCharge={ultimateCharge}
          buffChips={buffChipNodes}
          companionHealth={companionHealth}
          companionMaxHealth={companionMaxHealth}
          expanded={loadoutExpanded}
          onToggleExpanded={onToggleLoadout}
          isLandscape={isLandscape}
        />
      </div>
    </motion.div>
  );
}
