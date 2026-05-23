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
import type { WeaponState } from '../weapons/weaponState';
import { WeaponHUD } from '../hud/WeaponHUD';

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
  weaponState?: WeaponState | null;
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
  weaponState = null,
}: MobileCornerHudProps) {
  const isLandscape = hudVariant === 'landscape';
  const joystickSize = getJoystickSize(viewportProfile, viewportW, viewportH);
  // The joystick container sits at (joystickSize + 12)px from screen bottom.
  // The joystick circle itself extends joystickSize px upward from there.
  // So the top of the joystick circle = 2*joystickSize + 12 from screen bottom.
  // Add 16px gap so the dock clears the joystick circle cleanly.
  const collapsedInset = 2 * joystickSize + 28;
  const expandedInset = 2 * joystickSize + (isLandscape ? 76 : 96);
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
            <div className="boss-hp-hud w-full">
              <p className="boss-hp-hud__label">Boss</p>
              <div className="boss-hp-hud__track">
                <div
                  className="boss-hp-hud__fill"
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
        {(gameMode === 'NORMAL' || gameMode === 'SURVIVAL') && (
          <div className="pointer-events-auto mb-2 flex justify-center w-full px-2">
            <WeaponHUD
              weaponState={weaponState}
              gameMode={gameMode as GameState['gameMode']}
              onSwitch={onWeaponSwitch}
              activeWeaponSlot={activeWeaponSlot}
              compact
            />
          </div>
        )}
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
