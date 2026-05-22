import React, { useCallback, useState } from 'react';
import { logInventoryOpen } from '../debug/inventoryDebug';
import { motion } from 'motion/react';
import {
  getHudVariant,
  type HudVariant,
  type ViewportProfile,
} from './mobileLayout';
import { ShipHudWidget } from '../../components/ShipHudWidget';
import { getShipDef } from '../ships/shipDefs';
import { ArtifactSlot, GameState, ShipId } from '../types';
import { ScorePanel } from '../hud/ScorePanel';
import { ThreatBar } from '../hud/threatHud';
import { EquippedLoadoutStrip } from '../hud/EquippedLoadoutStrip';
import { ActiveBuffChips } from '../hud/ActiveBuffChips';
import { HUD_COLORS, HUD_TIMING } from '../hud/hudTokens';
import { CompanionHUD } from '../../components/CompanionHUD';
import { MiniBossHud } from '../hud/MiniBossHud';
import { MobileCornerHud } from './MobileCornerHud';
import { useCornerHudLayout } from './mobileLayout';
import type { CompanionId } from '../types';

interface HUDProps {
  health: number;
  maxHealth: number;
  survivalTime?: number;
  threatLevel?: number;
  augmentTier?: number;
  score: number;
  wave?: number;
  stage?: number;
  enemiesToKill?: number;
  stageTransition?: number;
  gameMode?: 'NORMAL' | 'AIM_TRAINER' | 'CAMPAIGN' | 'SURVIVAL' | 'ON_RAILS';
  onOpenMenu?: () => void;
  onWeaponSwitch?: (slot: 'CANNON_A' | 'CANNON_B') => void;
  cardTimer?: number;
  cardInterval?: number;
  activeWeaponSlot?: 'CANNON_A' | 'CANNON_B';
  energy: number;
  maxEnergy: number;
  ultimateCharge: number;
  isMobile?: boolean;
  compactHud?: boolean;
  hudVariant?: HudVariant;
  viewportProfile?: ViewportProfile;
  landscapeHud?: boolean;
  tabletSpacious?: boolean;
  bossArenaTransition?: number;
  bossActive?: boolean;
  bossHealth?: number;
  bossMaxHealth?: number;
  companionId?: CompanionId | null;
  companionLevel?: number;
  companionHealth?: number;
  companionMaxHealth?: number;
  companionAbilityCooldown?: number;
  companionAbilityCooldownMax?: number;
  companionAbilityName?: string;
  companionEnergy?: number;
  selectedShip?: ShipId;
  isPaused?: boolean;
  equippedArtifacts?: Record<ArtifactSlot, string | null>;
  threatGameState?: GameState | null;
  buffs?: {
    shield: number;
    overdrive: number;
    magnet: number;
    scoreX: number;
    rapidFire: number;
    timeSlow: number;
    piercing: number;
  };
  extraLifeCharges?: number;
  miniBossActive?: boolean;
  miniBossDisplayName?: string;
  miniBossHealth?: number;
  miniBossMaxHealth?: number;
  miniBossAuraColor?: string;
  survivalDifficultyLabel?: string;
  miniBossKillsThisRun?: number;
}

export const GameHUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  survivalTime = 0,
  threatLevel = 0,
  augmentTier = 0,
  score,
  wave = 1,
  stage = 1,
  enemiesToKill = 0,
  stageTransition = 0,
  gameMode = 'NORMAL',
  onOpenMenu,
  onWeaponSwitch,
  cardTimer = 60,
  cardInterval = 75,
  activeWeaponSlot = 'CANNON_A',
  energy,
  maxEnergy,
  ultimateCharge,
  compactHud = false,
  isMobile = false,
  hudVariant: hudVariantProp,
  viewportProfile = 'desktop',
  landscapeHud = false,
  bossArenaTransition = 0,
  bossActive = false,
  bossHealth = 0,
  bossMaxHealth = 0,
  companionId = null,
  companionLevel = 1,
  companionHealth = 0,
  companionMaxHealth = 0,
  companionAbilityCooldown = 0,
  companionAbilityCooldownMax = 0,
  companionAbilityName = '',
  companionEnergy,
  selectedShip,
  isPaused = false,
  equippedArtifacts = {
    CANNON_A: null,
    CANNON_B: null,
    ULTIMATE: null,
    ARMOR: null,
    MOBILITY: null,
  },
  threatGameState = null,
  buffs = {
    shield: 0,
    overdrive: 0,
    magnet: 0,
    scoreX: 0,
    rapidFire: 0,
    timeSlow: 0,
    piercing: 0,
  },
  extraLifeCharges = 0,
  miniBossActive = false,
  miniBossDisplayName = '',
  miniBossHealth = 0,
  miniBossMaxHealth = 0,
  miniBossAuraColor = '#a855f7',
  survivalDifficultyLabel,
  miniBossKillsThisRun = 0,
}) => {
  const [loadoutExpanded, setLoadoutExpanded] = useState(false);

  const toggleLoadout = useCallback(() => {
    setLoadoutExpanded((wasExpanded) => {
      const opening = !wasExpanded;
      if (opening) {
        logInventoryOpen(
          'GameHUD.loadout',
          equippedArtifacts,
          threatGameState?.runArtifactsUnlockedThisRun,
        );
      }
      return opening;
    });
  }, [equippedArtifacts, threatGameState]);

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 390;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 844;

  const hudVariant: HudVariant =
    hudVariantProp ??
    (viewportProfile
      ? getHudVariant(viewportProfile, viewportW, viewportH)
      : landscapeHud
        ? 'landscape'
        : compactHud || isMobile
          ? 'compact'
          : 'full');

  const isPhoneNarrow = hudVariant === 'phone-narrow';
  const isLandscape = hudVariant === 'landscape';
  const isTabletCompact =
    hudVariant === 'compact' &&
    (viewportProfile === 'tablet' || viewportProfile === 'phone-portrait');
  const useStackedHud = isPhoneNarrow || isTabletCompact;
  const useCornerHud = useCornerHudLayout(viewportProfile, viewportW, viewportH);
  const isDesktopHud = hudVariant === 'full' || hudVariant === 'tablet-landscape';
  const showThreat = gameMode === 'NORMAL' && threatGameState;
  const showDesktopWeapons = hudVariant === 'full';
  const hideArtifactsDefault = useStackedHud;
  const hudColumnMax = isDesktopHud ? 'max-w-[320px]' : 'max-w-[300px]';
  const showCompanionHud =
    companionId && companionMaxHealth > 0 && gameMode === 'NORMAL';
  const bossHpPct =
    bossMaxHealth > 0 ? Math.max(0, Math.min(100, (bossHealth / bossMaxHealth) * 100)) : 0;

  const scorePanelProps = {
    score,
    survivalTime,
    threatLevel,
    stage,
    enemiesToKill,
    stageTransition,
    bossArenaTransition,
    bossActive,
    gameMode,
    cardTimer,
    cardInterval,
    augmentTier,
    hudVariant,
    onOpenMenu,
    survivalDifficultyLabel,
    miniBossKillsThisRun,
  };

  const shipWidget =
    selectedShip && getShipDef(selectedShip) ? (
      <ShipHudWidget
        ship={getShipDef(selectedShip)!}
        playerHP={health}
        playerMaxHP={maxHealth}
        stage={stage}
        wave={wave}
        isPaused={isPaused}
        hudVariant={hudVariant}
      />
    ) : null;

  const companionBlock =
    showCompanionHud && companionId ? (
      <CompanionHUD
        companionId={companionId}
        level={companionLevel}
        health={companionHealth}
        maxHealth={companionMaxHealth}
        abilityName={companionAbilityName}
        abilityCooldownRemaining={companionAbilityCooldown}
        abilityCooldownMax={companionAbilityCooldownMax}
        energy={companionEnergy}
        hudVariant={hudVariant}
        className={isPhoneNarrow ? 'mt-1' : 'mt-2'}
      />
    ) : null;

  const bottomLoadout = (
    <EquippedLoadoutStrip
      equippedArtifacts={equippedArtifacts}
      activeWeaponSlot={activeWeaponSlot}
      onWeaponSwitch={onWeaponSwitch}
      energy={energy}
      maxEnergy={maxEnergy}
      ultimateCharge={ultimateCharge}
      hudVariant={hudVariant}
      showWeapons={showDesktopWeapons}
      hideArtifacts={hideArtifactsDefault && !loadoutExpanded}
      slimMobile={useStackedHud}
    />
  );

  const buffChips = !useStackedHud ? (
    <ActiveBuffChips buffs={buffs} extraLifeCharges={extraLifeCharges} hudVariant={hudVariant} />
  ) : null;

  const threatBlock =
    showThreat && threatGameState ? (
      <ThreatBar
        state={threatGameState}
        size={useStackedHud ? 'md' : isDesktopHud ? 'lg' : 'md'}
        layout="stacked"
        showTierAboveBar={!useStackedHud}
        className="w-full"
      />
    ) : null;

  const bossBar =
    bossActive && bossMaxHealth > 0 ? (
      <div className={`w-full ${useStackedHud || isLandscape ? '' : 'absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-30 px-4'}`}>
        <div className="rounded-lg border border-rose-500/40 bg-black/60 backdrop-blur-md p-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-rose-300 mb-1 text-center">
            Boss
          </p>
          <div className="h-3 rounded-full overflow-hidden bg-black/50 border border-white/10">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{
                width: `${bossHpPct}%`,
                background: `linear-gradient(90deg, ${HUD_COLORS.danger}, #f97316)`,
              }}
            />
          </div>
        </div>
      </div>
    ) : null;

  /** Mobile / tablet portrait / phone landscape: corner zones. */
  if (useCornerHud) {
    return (
      <MobileCornerHud
        health={health}
        maxHealth={maxHealth}
        survivalTime={survivalTime}
        score={score}
        stage={stage}
        enemiesToKill={enemiesToKill}
        stageTransition={stageTransition}
        bossArenaTransition={bossArenaTransition}
        bossActive={bossActive}
        gameMode={gameMode}
        onOpenMenu={onOpenMenu}
        onWeaponSwitch={onWeaponSwitch}
        activeWeaponSlot={activeWeaponSlot}
        energy={energy}
        maxEnergy={maxEnergy}
        ultimateCharge={ultimateCharge}
        selectedShip={selectedShip}
        companionId={companionId}
        companionLevel={companionLevel}
        companionHealth={companionHealth}
        companionMaxHealth={companionMaxHealth}
        companionAbilityCooldown={companionAbilityCooldown}
        companionAbilityCooldownMax={companionAbilityCooldownMax}
        equippedArtifacts={equippedArtifacts}
        threatGameState={threatGameState}
        buffs={buffs}
        extraLifeCharges={extraLifeCharges}
        survivalDifficultyLabel={survivalDifficultyLabel}
        miniBossActive={miniBossActive}
        miniBossDisplayName={miniBossDisplayName}
        miniBossHealth={miniBossHealth}
        miniBossMaxHealth={miniBossMaxHealth}
        miniBossAuraColor={miniBossAuraColor}
        bossHealth={bossHealth}
        bossMaxHealth={bossMaxHealth}
        hudVariant={hudVariant}
        viewportProfile={viewportProfile}
        viewportW={viewportW}
        viewportH={viewportH}
        loadoutExpanded={loadoutExpanded}
        onToggleLoadout={toggleLoadout}
      />
    );
  }

  /** Desktop / tablet landscape: spread layout. */
  const bottomPad = 'pb-[max(1rem,env(safe-area-inset-bottom))]';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: HUD_TIMING.fadeIn }}
      className="absolute inset-0 pointer-events-none flex flex-col font-sans z-10 p-4 md:p-6"
    >
      {miniBossActive && miniBossMaxHealth > 0 && !bossActive && (
        <MiniBossHud
          displayName={miniBossDisplayName}
          health={miniBossHealth}
          maxHealth={miniBossMaxHealth}
          auraColor={miniBossAuraColor}
        />
      )}

      {bossBar}

      <div className="z-20 flex justify-between items-start gap-3 md:gap-5 w-full">
        <div className={`min-w-0 flex-1 ${hudColumnMax}`}>
          {shipWidget}
          {companionBlock}
        </div>
        <ScorePanel {...scorePanelProps} className="shrink-0" />
      </div>

      <div className="flex-1 min-h-0" aria-hidden />

      {showThreat && isDesktopHud && threatGameState && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-20 w-full max-w-[300px] px-4 ${bottomPad}`}
          style={{ bottom: '5.5rem' }}
        >
          <ThreatBar state={threatGameState} size="lg" layout="stacked" />
        </div>
      )}

      <div className={`z-20 w-full ${bottomPad}`}>
        {isDesktopHud ? (
          <div className="flex items-end justify-end gap-4 md:gap-6 w-full">
            <div className="flex flex-col items-end gap-2 shrink-0">
              {buffChips}
              {bottomLoadout}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            {threatBlock}
            <div className="w-full flex justify-end items-end gap-2 px-1">
              <div className="flex flex-col items-end gap-2 shrink-0">
                {buffChips}
                {bottomLoadout}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
