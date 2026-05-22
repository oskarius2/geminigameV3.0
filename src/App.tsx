import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Play, RotateCcw, Shield, Swords, Zap, Trophy, Target } from 'lucide-react';
import { StartPage } from './game/controls/StartPage';
import { Joystick } from './game/controls/Joystick';
import { GameHUD } from './game/controls/GameHUD';
import { BuffCardPicker } from './game/controls/BuffCardPicker';
import { ArtifactUnlockPicker } from './game/controls/ArtifactUnlockPicker';
import {
  getViewportSnapshot,
  subscribeViewport,
  getJoystickSize,
  getTouchActionSize,
  getSynergyBarLayout,
  type ViewportProfile,
} from './game/controls/mobileLayout';
import { getAugmentTier, getTierModifiers } from './game/balance/augmentTiers';
import {
  resetWaveSpawnState,
  tickSurvivalWaveSpawns,
} from './game/balance/waveSpawnController';
import { spawnMiniBoss } from './game/bosses/miniBossSpawn';
import type { MiniBossId } from './game/bosses/miniBossDefs';
import { getMiniBossDef } from './game/bosses/miniBossDefs';
import {
  applyMiniBossDefeatRewards,
  applyMiniBossDefeatJuice,
} from './game/bosses/miniBossLoot';
import {
  getMiniBossIncomingDamageMult,
  getMiniBossOutgoingDamageMult,
  tryTemporalAnchor,
  tickMiniBossPassiveRuntime,
} from './game/bosses/miniBossPassives';
import { applyMiniBossSpawnJuice } from './game/bosses/miniBossJuice';
import { playMiniBossDefeatSfx, playMiniBossSpawnSfx } from './game/bosses/miniBossSfx';
import {
  applyPlasmaExplosion,
  fireMiniBossShockwave,
  tickMiniBossWorldEffects,
} from './game/bosses/miniBossAI';
import {
  computeThreatLevel,
  getThreatTier,
  getThreatVisualConfig,
} from './game/balance/threat';
import {
  getSurvivalDifficultyLabelSv,
  getSurvivalSpawnModifiers,
} from './game/balance/miniBossDifficulty';
import { getEffectiveCardIntervalSeconds } from './game/buffs/cardTiming';
import { applyThreatVisualEffects, resetThreatEffectTracking } from './game/hud/threatEffects';
import {
  ensureCompanionRuntime,
  getCompanionHudSnapshot,
  updateCompanionAI,
} from './game/companions/companionAI';
import {
  applyCompanionLoadout,
  grantCompanionKillXp,
  persistCompanionRunProgress,
  reconcileAllCompanionProgress,
  unlockCompanionMeta,
} from './game/companions/companionLeveling';
import { CompanionSelectScreen } from './components/CompanionSelectScreen';
import { PreRunShop } from './components/PreRunShop';
import {
  applyCompanionHpShopBoost,
  applyShopEffects,
  applyShopThreat,
  getExperienceGainMultiplier,
  onShopStageAdvanced,
  tickShopRunFlags,
} from './game/shop/shopEffects';
import type { ShopItemId } from './game/shop/shopTypes';
import type { CompanionId } from './game/types';
import { notifyCompanionPlayerHit } from './game/companions/companionBehavior';
import {
  applyCompanionDamageReflect,
  mitigateCompanionIncomingDamage,
} from './game/companions/companionPassives';
import {
  getKillQuotaForSpawn,
  getLevelProgress,
  getMaxAliveEnemies,
  getSpawnChance,
  getStageQuota,
} from './game/balance/spawnCurve';
import { pickEnemyTypeForThreat } from './game/balance/spawnComposition';
import {
  getCombatDensityTier,
  shouldApplyHitTimer,
  shouldApplyKnockback,
  shouldForceLowQuality,
  shouldTriggerHitFeedback,
} from './game/balance/combatDensity';
import { grantExtraLife, tryTriggerExtraLife } from './game/balance/extraLife';
import {
  computeBossScrapBonus,
  computeRunEndScrap,
  computeStageClearScrap,
  scrapFromKill,
} from './game/balance/scrapRewards';
import { BOSS_DEFINITIONS, BossDefinition } from './game/content/bosses';
import { DevCheatsHud } from './game/controls/DevCheatsHud';
import {
  devClearKillQuota,
  devSkipWarpAnimation,
  isDevCheatsEnabled,
  readBossIdFromUrl,
  resolveDevBoss,
  triggerDevBossWarp,
  triggerDevMiniBossSpawn,
  tryDevCheatKeydown,
} from './game/dev/cheats';
import { getRailsShootDirection } from './game/onRails/aim';
import { startRailsRun } from './game/onRails/initRun';
import { updateOnRails } from './game/onRails/update';
import { applyRailsPlayerHit } from './game/onRails/railsDamage';
import { isBossEntranceActive } from './game/onRails/bossEntranceAnimations';
import { isRailsBossDeathActive } from './game/onRails/bossDeathAnimations';
import { beginRailsEnemyDeath } from './game/onRails/enemyDeathAnimations';
import { triggerWeakPointHitFx } from './game/onRails/bossWeakPointGlow';
import {
  railsFireIntervalMult,
  railsScoreMult,
  isRailsInvincible,
  consumeRailsShield,
  consumeRailsMegaBlast,
  trySpawnPowerupOnKill,
} from './game/onRails/powerups';
import { railsBossDamageMult, railsBossTouchDamage } from './game/onRails/bosses';
import { railsEnemyBodyDamage, railsEnemyKillScore } from './game/onRails/enemies';
import {
  getNextRailsLevelId,
  getRailsLevel,
  RAILS_LEVELS,
} from './game/onRails/railsLevels';
import {
  getRailsHighScores,
  getRailsMedal,
  saveRailsHighScore,
} from './game/onRails/railsStorage';
import { HangarScreen, type HangarEntry } from './game/controls/HangarScreen';
import { recordSurvivalRun, getSurvivalHighScore, getLongestSurvivalSeconds } from './game/meta/survivalStats';
import {
  getMetaProgress,
  getUnlockedArtifactIds,
  migrateFromLegacyStorage,
  startRunTracking,
  unlockArtifact,
  unlockCompanion,
  recordStatDelta,
  clearNewUnlockBadges,
  getPendingNewCount,
  getRunUnlocks,
} from './game/meta/metaProgress';
import { grantStageMilestoneUnlocks, metaUnlockArtifactFromRun } from './game/meta/unlockSystem';
import {
  UnlockToastStack,
  buildArtifactUnlockToast,
  buildCompanionUnlockToast,
  buildPersonalBestToast,
  type UnlockToast,
} from './game/meta/unlockNotifications';
import { rollLootOnKill, applyLootDrop, rollBossLoot } from './game/loot/lootDropController';
import { BossVictoryBanner } from './game/controls/BossVictoryBanner';
import { getRecommendedCompanion } from './game/companions/companionDefs';
import { applyShipStats, getShipDef } from './game/ships/shipDefs';
import { getProjectileRenderData, getImpactEffectData, shouldTriggerScreenFlash, WEAPON_SIGNATURES } from './game/weaponEffects';
import { RailsVictoryScreen } from './components/RailsVictoryScreen';
import { RailsLevelSelect } from './components/RailsLevelSelect';
import { RailsHUD } from './game/controls/RailsHUD';
import {
  applyBossArenaWarp,
  beginBossWarp,
  BOSS_WARP_SWAP_AT,
  pickRandomBoss,
  restoreMainWorldAfterBoss,
} from './game/content/bossArenas';
import { countPassiveStacks } from './game/buffs/pickBuffs';
import {
  pickSurvivalCardChoices,
  isArtifactChoiceId,
  type SurvivalCardChoice,
} from './game/buffs/pickSurvivalCards';
import { equipRunArtifact } from './game/artifacts/applyArtifactStats';
import {
  applyArtifactAcquireJuice,
  buildArtifactAcquiredEvent,
  ARTIFACT_POPUP_DURATION_MS,
  type ArtifactAcquiredEvent,
} from './game/hud/artifactPopup';
import { ArtifactAcquireOverlay } from './game/hud/ArtifactAcquireOverlay';
import { addMetaScrap, getMetaScrap, spendMetaScrap } from './lib/metaStore';
import {
  playSfx,
  playArtifactAcquireSfx,
  loadSfxMuted,
  setSfxMuted,
  setSfxVolume,
  getSfxVolume,
  resumeAudio,
} from './game/audio/sfx';
import { startMusic, stopMusic, duckMusic, loadMusicSettings, setMusicMuted, setMusicVolume } from './game/audio/music';
import { spawnDamageNumber } from './game/juice/damageNumbers';
import {
  applyPlayerDamageGlitch,
  triggerHitFeedback,
  shootSfxForSlot,
  isBossHit,
  GAMEPLAY_HITSTOP_THRESHOLD,
} from './game/juice/hitFeedback';
import { getActiveSynergies, countTag } from './game/buffs/synergies';
import { SynergyBar } from './game/controls/SynergyBar';
import { RunSummary } from './game/controls/RunSummary';
import { BossWarpOverlay } from './game/controls/BossWarpOverlay';
import { StageIntroOverlay } from './game/controls/StageIntroOverlay';
import { PASSIVE_BUFFS } from './game/content/buffs';
import { getCampaignLevel, pickCampaignEnemyType, getSpawnPosAlongPath, samplePath, samplePathTangent, PORTAL_TRIGGER_RADIUS } from './game/content/campaignLevels';
import { CampaignSelect, markLevelComplete } from './game/controls/CampaignSelect';
import { BuffRarity } from './game/types';
import { Vector2 } from './game/utils/vector';
import { Artifact, ArtifactSlot, PassiveBuff, EntityType, GameState, ItemType, EnemyType, Entity, Hazard, RandomEvent, ShipId } from './game/types';
import {
  INITIAL_STATE,
  spawnEnemy,
  updateProjectiles,
  updateEnemies,
  checkCollision,
  createExplosion,
  createImpact,
  updateParticles,
  updateHazards,
  spawnHazard,
  spawnItem,
  createItemSparkle,
  createImplosion,
  spawnXpOrb,
  resolveObstacleCollision,
  checkProjectileObstacleCollision,
  generateObstaclesForStage,
  pickBuffs,
  ARTIFACTS,
} from './game/Logic';
import { applyBuff, hasPermanentOverdrive, hasPermanentPiercing, hasPermanentRapidFire } from './game/buffs/applyBuff';
import { applyHangarLoadout } from './game/runSetup';
import { applyEquippedArtifacts, applySingleArtifactStats } from './game/artifacts/applyArtifactStats';
import { pickArtifactUnlockChoices } from './game/meta/artifactUnlock';
import { render } from './game/Renderer';

import { RandomEventDialog } from './game/controls/RandomEventDialog';
import {
  TRAITS,
  handleEventChoice,
  pickRandomTraits,
  RANDOM_EVENTS,
  ENEMY_SPATIAL_CELL_SIZE,
} from './game/Logic';
import {
  applyBossDefeatState,
  hasLiveBoss,
  isBossTransitioning,
  logBossLifecycle,
} from './game/bossLifecycle';
import { missionController } from './game/missionController';

function findNearestEnemyInGrid(
  grid: Map<string, Entity[]>,
  origin: Vector2,
  excludeId: string,
  radius: number,
  cellSize: number
): Entity | null {
  const gx = Math.floor(origin.x / cellSize);
  const gy = Math.floor(origin.y / cellSize);
  const cellRadius = Math.ceil(radius / cellSize);
  let nearest: Entity | null = null;
  let minDist = radius;

  for (let ox = -cellRadius; ox <= cellRadius; ox++) {
    for (let oy = -cellRadius; oy <= cellRadius; oy++) {
      const cell = grid.get(`${gx + ox},${gy + oy}`);
      if (!cell) continue;
      for (const other of cell) {
        if (other.id === excludeId || other.health <= 0) continue;
        const d = other.pos.distanceTo(origin);
        if (d < minDist) {
          minDist = d;
          nearest = other;
        }
      }
    }
  }
  return nearest;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  
  // RNG Traits for the next run
  const [nextRunTraits, setNextRunTraits] = useState<string[]>(() => pickRandomTraits());

  const [uiState, setUiState] = useState<{
    health: number;
    maxHealth: number;
    survivalTime: number;
    threatLevel: number;
    threatPeak: number;
    score: number;
    wave: number;
    stage: number;
    enemiesToKill: number;
    stageTransition: number;
    energy: number;
    maxEnergy: number;
    velocityMag: number;
    playerSpeed: number;
    isGameOver: boolean;
    isPaused: boolean;
    gameMode: GameState['gameMode'];
    cardTimer: number;
    passives: string[];
    buffs: {
      shield: number;
      overdrive: number;
      magnet: number;
      scoreX: number;
      rapidFire: number;
      timeSlow: number;
      piercing: number;
    };
    screenFlash?: number; 
    ultimateCharge: number;
    activeWeaponSlot: 'CANNON_A',
    equippedArtifacts: Record<ArtifactSlot, string | null>;
    runScrapEarned: number;
    bossArenaTransition: number;
    activeBossId: string | null;
    bossActive: boolean;
    lastBossDefeatedId: string | null;
    bossVictoryBannerTimer: number;
    pendingEvent: RandomEvent | null;
    extraLifeCharges: number;
    selectedShip: ShipId;
    companionId: CompanionId | null;
    companionLevel: number;
    companionHealth: number;
    companionMaxHealth: number;
    companionAbilityCooldown: number;
    companionAbilityCooldownMax: number;
    companionAbilityName: string;
    companionEnergy?: number;
  } | null>(null);

  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [screen, setScreen] = useState<
    'MENU' | 'HANGAR' | 'COMPANION_SELECT' | 'PRE_RUN_SHOP' | 'CAMPAIGN_SELECT' | 'RAILS_SELECT' | 'GAME'
  >('MENU');
  const [pendingLaunchShipId, setPendingLaunchShipId] = useState<ShipId | null>(null);
  const [pendingLaunchCompanionId, setPendingLaunchCompanionId] = useState<CompanionId | null>(null);
  const [hangarEntry, setHangarEntry] = useState<HangarEntry>('survival');
  const [hangarInitialTab, setHangarInitialTab] = useState<
    'ship' | 'vault' | 'loadout' | 'progress'
  >('ship');
  const [lastRunPersonalBest, setLastRunPersonalBest] = useState({
    score: false,
    time: false,
  });
  const [survivalMetaKey, setSurvivalMetaKey] = useState(0);
  const [railsHighScores, setRailsHighScores] = useState<Record<string, number>>(
    () => getRailsHighScores()
  );
  const [devCheatToast, setDevCheatToast] = useState<string | null>(null);
  const devCheatsActive = isDevCheatsEnabled();
  const devCheatToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  const [stageIntroStage, setStageIntroStage] = useState<number | null>(null);
  const [stageIntroKey, setStageIntroKey] = useState(0);
  const clearStageIntro = useCallback(() => setStageIntroStage(null), []);
  
  const [unlockedArtifactIds, setUnlockedArtifactIds] = useState<string[]>(() => {
    migrateFromLegacyStorage();
    return getUnlockedArtifactIds();
  });
  
  const [equippedArtifactIds, setEquippedArtifactIds] = useState<Record<ArtifactSlot, string | null>>(() => {
    try {
      const saved = localStorage.getItem('equippedArtifacts');
      if (saved) return JSON.parse(saved);
    } catch {
      // corrupted save
    }
    return {
      CANNON_A: 'iron_sights',
      CANNON_B: 'backup_cannon',
      CANNON_C: null,
      ULTIMATE: null,
      ARMOR: 'basic_hull',
      MOBILITY: 'basic_thrusters',
    };
  });

  const [artifactUnlockChoices, setArtifactUnlockChoices] = useState<Artifact[]>([]);
  const [showArtifactUnlock, setShowArtifactUnlock] = useState(false);
  const [viewportProfile, setViewportProfile] = useState<ViewportProfile>('desktop');
  const [compactHud, setCompactHud] = useState(false);
  const [landscapeHud, setLandscapeHud] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);
  const viewportProfileRef = useRef<ViewportProfile>('desktop');
  const reducedEffectsRef = useRef(false);
  const isMobile = viewportProfile !== 'desktop';
  const [newUnlockIds, setNewUnlockIds] = useState<string[]>(
    () => getMetaProgress().pendingNewArtifacts,
  );
  const [unlockToasts, setUnlockToasts] = useState<UnlockToast[]>([]);
  const playtimeAccumRef = useRef(0);
  const prevHighScoreRef = useRef(getSurvivalHighScore());
  const prevLongestRef = useRef(getLongestSurvivalSeconds());

  const syncMetaUnlockState = useCallback(() => {
    const p = getMetaProgress();
    const ids = getUnlockedArtifactIds(p);
    setUnlockedArtifactIds(ids);
    setNewUnlockIds([...p.pendingNewArtifacts]);
  }, []);

  const persistArtifactUnlock = useCallback(
    (artifactId: string, showFeedback = true) => {
      const result = metaUnlockArtifactFromRun(artifactId);
      if (result.newlyUnlocked) {
        if (showFeedback) {
          const art = ARTIFACTS[artifactId];
          if (art) {
            playArtifactAcquireSfx(art.rarity);
            setUnlockToasts((prev) => [...prev, buildArtifactUnlockToast(artifactId)]);
          }
        }
      }
      syncMetaUnlockState();
      return result.newlyUnlocked;
    },
    [syncMetaUnlockState],
  );

  const persistCompanionUnlock = useCallback(
    (companionId: CompanionId) => {
      const result = unlockCompanion(companionId);
      if (result.newlyUnlocked) {
        setUnlockToasts((prev) => [...prev, buildCompanionUnlockToast(companionId)]);
        playSfx('artifact');
      }
      syncMetaUnlockState();
      return result.newlyUnlocked;
    },
    [syncMetaUnlockState],
  );
  
  // Audio state
  const [sfxMuted, setSfxMutedState] = useState(false);
  const [musicMuted, setMusicMutedState] = useState(false);
  const [sfxVol, setSfxVol] = useState(0.7);
  const [musicVol, setMusicVol] = useState(0.5);

  // Mobile settings
  const [mobileLayout, setMobileLayout] = useState<'RIGHT_HANDED' | 'LEFT_HANDED'>(() => {
    const saved = localStorage.getItem('mobileLayout');
    return (saved as any) || 'RIGHT_HANDED';
  });
  const [joystickDeadZone, setJoystickDeadZone] = useState<number>(() => {
    const saved = localStorage.getItem('joystickDeadZone');
    return saved ? parseFloat(saved) : 0.1;
  });
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('hapticsEnabled');
    return saved ? saved === 'true' : true;
  });


  useEffect(() => {
    localStorage.setItem('mobileLayout', mobileLayout);
    localStorage.setItem('joystickDeadZone', joystickDeadZone.toString());
    localStorage.setItem('hapticsEnabled', hapticsEnabled.toString());
  }, [mobileLayout, joystickDeadZone, hapticsEnabled]);

  useEffect(() => {
    localStorage.setItem('equippedArtifacts', JSON.stringify(equippedArtifactIds));
  }, [equippedArtifactIds]);

  const controls = useRef({
    move: { x: 0, y: 0 },
    aim: { x: 0, y: 0 },
    isFiring: false,
    wantDash: false,
    wantUltimate: false,
    mousePos: { x: 0, y: 0 },
    keys: new Set<string>(),
  });

  const lastFireTime = useRef(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const unlockedArtifactIdsRef = useRef(unlockedArtifactIds);
  const equippedArtifactIdsRef = useRef(equippedArtifactIds);
  const joystickDeadZoneRef = useRef(joystickDeadZone);
  const hapticsEnabledRef = useRef(hapticsEnabled);
  const musicMutedRef = useRef(musicMuted);
  const showLevelUpRef = useRef(showLevelUp);
  const showArtifactUnlockRef = useRef(showArtifactUnlock);
  const pendingArtifactUnlockRef = useRef<Artifact[] | null>(null);
  const [metaScrap, setMetaScrap] = useState(() => getMetaScrap());
  const [lastRunScrapEarned, setLastRunScrapEarned] = useState(0);
  const [currentBuffs, setCurrentBuffs] = useState<PassiveBuff[]>([]);
  const [currentCardChoices, setCurrentCardChoices] = useState<SurvivalCardChoice[]>([]);
  const [artifactAcquirePopup, setArtifactAcquirePopup] = useState<ArtifactAcquiredEvent | null>(
    null,
  );
  const artifactPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reconcileAllCompanionProgress();
    loadSfxMuted();
    loadMusicSettings();
    setSfxMutedState(localStorage.getItem('sfxMuted') === '1');
    setMusicMutedState(localStorage.getItem('musicMuted') === '1');
    setSfxVol(getSfxVolume());
    const applyViewport = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const snap = getViewportSnapshot(w, h);
      const prev = viewportProfileRef.current;
      setDimensions({ width: w, height: h });
      setViewportProfile(snap.profile);
      setCompactHud(snap.compactHud);
      setLandscapeHud(snap.landscapeHud);
      setShowTouchControls(snap.showTouchControls);
      viewportProfileRef.current = snap.profile;
      reducedEffectsRef.current = snap.reducedEffects;
      if (prev !== snap.profile) {
        controls.current.move = { x: 0, y: 0 };
        controls.current.aim = { x: 0, y: 0 };
        controls.current.isFiring = false;
      }
    };
    applyViewport();
    return subscribeViewport(applyViewport);
  }, []);

  useEffect(() => {
    unlockedArtifactIdsRef.current = unlockedArtifactIds;
  }, [unlockedArtifactIds]);

  useEffect(() => {
    equippedArtifactIdsRef.current = equippedArtifactIds;
  }, [equippedArtifactIds]);

  useEffect(() => {
    joystickDeadZoneRef.current = joystickDeadZone;
  }, [joystickDeadZone]);

  useEffect(() => {
    hapticsEnabledRef.current = hapticsEnabled;
  }, [hapticsEnabled]);

  useEffect(() => {
    musicMutedRef.current = musicMuted;
  }, [musicMuted]);

  useEffect(() => {
    showLevelUpRef.current = showLevelUp;
  }, [showLevelUp]);

  useEffect(() => {
    showArtifactUnlockRef.current = showArtifactUnlock;
  }, [showArtifactUnlock]);

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (hapticsEnabledRef.current && typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }, []);

  const showArtifactAcquireFeedback = useCallback((artifact: Artifact) => {
    const live = gameStateRef.current;
    if (live) {
      applyArtifactAcquireJuice(live, artifact);
    }
    playArtifactAcquireSfx(artifact.rarity);

    if (artifact.rarity === BuffRarity.LEGENDARY) {
      const event = buildArtifactAcquiredEvent(artifact);
      setArtifactAcquirePopup(event);
      if (artifactPopupTimerRef.current) clearTimeout(artifactPopupTimerRef.current);
      artifactPopupTimerRef.current = setTimeout(() => {
        setArtifactAcquirePopup(null);
      }, ARTIFACT_POPUP_DURATION_MS);
    }
  }, []);

  const openBuffPicker = (state: GameState) => {
    state.isPaused = true;
    const choices = pickSurvivalCardChoices(state, unlockedArtifactIdsRef.current, 3);
    setCurrentCardChoices(choices);
    setCurrentBuffs(choices.filter((c) => c.kind === 'buff').map((c) => c.buff));
    setShowLevelUp(true);
    playSfx('cardFlip');
    duckMusic(0.3);
  };

  const MYSTERY_BUFF_IDS = ['mys_dmg_burst', 'mys_hp_drain', 'mys_speed_curse', 'mys_shield_gift', 'mys_scrap_tax', 'mys_multishot'];
  const openMysteryCard = (state: GameState) => {
    state.isPaused = true;
    const id = MYSTERY_BUFF_IDS[Math.floor(Math.random() * MYSTERY_BUFF_IDS.length)];
    setCurrentBuffs([PASSIVE_BUFFS[id]]);
    setShowLevelUp(true);
    playSfx('cardFlip');
    duckMusic(0.3);
  };

  const startGame = (
    shipId: ShipId = 'interceptor',
    companionId?: CompanionId,
    shopIds: ShopItemId[] = [],
    shopSpent = 0,
  ) => {
    const initialState = INITIAL_STATE(dimensions.width, dimensions.height, shipId);
    const ship = getShipDef(shipId);
    if (ship) {
      applyShipStats(initialState, ship);
    }
    
    // Overwrite with the traits the player saw on menu
    initialState.activeTraits = nextRunTraits;
    // Apply them again specifically for this state
    nextRunTraits.forEach(tId => {
      switch(tId) {
        case 'agile': initialState.player.speed *= 1.2; break;
        case 'hard_hitter': initialState.baseDamage *= 1.25; break;
        case 'hull_plating': 
          initialState.player.maxHealth += 150; 
          initialState.player.health += 150; 
          break;
        case 'frail': 
          initialState.player.maxHealth = Math.max(50, initialState.player.maxHealth - 100);
          initialState.player.health = Math.min(initialState.player.health, initialState.player.maxHealth);
          break;
        case 'clunky': initialState.player.speed *= 0.85; break;
        case 'glass_cannon': 
          initialState.player.maxHealth *= 0.7;
          initialState.player.health *= 0.7;
          initialState.baseDamage *= 1.15;
          break;
      }
    });

    applyHangarLoadout(initialState, equippedArtifactIds);
    if (companionId) {
      applyCompanionLoadout(initialState, companionId);
    }
    if (shopIds.length > 0) {
      applyShopEffects(initialState, shopIds);
      initialState.shopScrapSpent = shopSpent;
    }
    if (initialState.activeCompanionId) {
      ensureCompanionRuntime(initialState);
      applyCompanionHpShopBoost(initialState);
    }
    applyEquippedArtifacts(initialState);
    if (ship?.startingArtifact && ARTIFACTS[ship.startingArtifact]) {
      const art = ARTIFACTS[ship.startingArtifact];
      if (!initialState.equippedArtifacts[art.slot]) {
        initialState.equippedArtifacts[art.slot] = ship.startingArtifact;
        applySingleArtifactStats(initialState, art);
      }
    }
    initialState.player.health = initialState.player.maxHealth;
    
    // Visual feedback for equipped artifacts
    const equippedCount = Object.values(equippedArtifactIds).filter(a => a !== null).length;
    if (equippedCount > 0) {
      showNotification(`${equippedCount} artefakt(er) utrustad`, 'info');
      playSfx('artifact');
    }
    if (shopSpent > 0) {
      showNotification(`Loadout shop: −${shopSpent} scrap`, 'info');
    }
    
    initialState.gameMode = 'NORMAL';
    initialState.rails = null;
    initialState.campaignLevelId = null;
    initialState.campaignZoom = null;
    initialState.campaignCameraAngle = null;
    initialState.campaignCameraPos = null;
    initialState.isGameOver = false;
    applyShopThreat(initialState);
    initialState.threatPeak = initialState.threatLevel;
    initialState.runStartTime = Date.now();
    initialState.runArtifactsUnlockedThisRun = [];
    startRunTracking();
    playtimeAccumRef.current = 0;
    prevHighScoreRef.current = getSurvivalHighScore();
    prevLongestRef.current = getLongestSurvivalSeconds();
    initialState.cardTimer = getEffectiveCardIntervalSeconds(
      initialState.stage,
      initialState.survivalTime,
      initialState.passives,
      initialState.threatLevel,
    );
    initialState.spawnRampTimer = 3.5;
    resetThreatEffectTracking();
    initialState.activeBossId = null;
    initialState.bossArenaTransition = 0;
    initialState.bossArenaSwapped = false;
    initialState.inBossArena = false;
    initialState.mainWorldSnapshot = null;
    initialState.lastBossId = null;
    initialState.lastBossDefeatedId = null;
    initialState.bossVictoryBannerTimer = 0;
    initialState.pendingArenaRestore = false;
    initialState.runScrapEarned = 0;
    initialState.postBossBuffPick = false;
    initialState.miniBossKillsThisRun = 0;
    resetWaveSpawnState(initialState);
    gameStateRef.current = initialState;
    setLastRunScrapEarned(0);
    setLastRunPersonalBest({ score: false, time: false });
    setNewUnlockIds([]);
    setShowArtifactUnlock(false);
    setArtifactUnlockChoices([]);
    syncUi();
    setScreen('GAME');
    setIsPauseMenuOpen(false);
    setStageIntroKey((k) => k + 1);
    setStageIntroStage(1);
    resumeAudio();
    if (!musicMuted) startMusic();

    if (devCheatsActive) {
      const bossId = readBossIdFromUrl();
      if (bossId) {
        const boss = resolveDevBoss(bossId);
        if (boss) {
          window.setTimeout(() => {
            const live = gameStateRef.current;
            if (!live) return;
            if (triggerDevBossWarp(live, boss, dimensions.width, dimensions.height)) {
              showDevCheatToast(`URL ?boss=${boss.id}`);
              syncUi();
            }
          }, 700);
        } else {
          showDevCheatToast(`Okänd boss: ${bossId}`);
        }
      }
    }

    // Prepare traits for the run AFTER this one
    setNextRunTraits(pickRandomTraits());
  };

  const startRailsGame = (levelId: string) => {
    const initialState = INITIAL_STATE(dimensions.width, dimensions.height);
    initialState.activeTraits = nextRunTraits;
    nextRunTraits.forEach((tId) => {
      switch (tId) {
        case 'agile':
          initialState.player.speed *= 1.2;
          break;
        case 'hard_hitter':
          initialState.baseDamage *= 1.25;
          break;
        case 'hull_plating':
          initialState.player.maxHealth += 150;
          initialState.player.health += 150;
          break;
        case 'frail':
          initialState.player.maxHealth = Math.max(50, initialState.player.maxHealth - 100);
          initialState.player.health = Math.min(initialState.player.health, initialState.player.maxHealth);
          break;
        case 'clunky':
          initialState.player.speed *= 0.85;
          break;
        case 'glass_cannon':
          initialState.player.maxHealth *= 0.7;
          initialState.player.health *= 0.7;
          initialState.baseDamage *= 1.15;
          break;
      }
    });
    applyHangarLoadout(initialState, equippedArtifactIds);
    applyEquippedArtifacts(initialState);
    initialState.player.health = initialState.player.maxHealth;
    if (!startRailsRun(initialState, levelId, dimensions.width, dimensions.height)) {
      return;
    }
    initialState.threatLevel = computeThreatLevel(initialState);
    initialState.threatPeak = initialState.threatLevel;
    initialState.runStartTime = Date.now();
    gameStateRef.current = initialState;
    controls.current.move = { x: 0, y: 0 };
    controls.current.aim = { x: 0, y: 0 };
    controls.current.mousePos = {
      x: dimensions.width / 2,
      y: dimensions.height * 0.78,
    };
    setLastRunScrapEarned(0);
    setShowLevelUp(false);
    setShowArtifactUnlock(false);
    syncUi();
    setScreen('GAME');
    setIsPauseMenuOpen(false);
    resumeAudio();
    if (!musicMuted) startMusic();
    setNextRunTraits(pickRandomTraits());
  };

  /** New Run from summary — restart the same mode the player just finished. */
  const restartAfterRun = () => {
    const prev = gameStateRef.current;
    const mode = prev?.gameMode;
    const campaignLevelId = prev?.campaignLevelId;
    gameStateRef.current = null;

    if (mode === 'ON_RAILS') {
      const levelId = prev?.rails?.levelId ?? 'tunnel_01';
      startRailsGame(levelId);
    } else if (mode === 'CAMPAIGN' && campaignLevelId) {
      startCampaignLevel(campaignLevelId);
    } else {
      startGame(prev?.selectedShip ?? 'interceptor');
    }
  };

  const startCampaignLevel = (levelId: string) => {
    const level = getCampaignLevel(levelId);
    if (!level) return;
    const initialState = INITIAL_STATE(dimensions.width, dimensions.height);
    applyHangarLoadout(initialState, equippedArtifactIds);
    applyEquippedArtifacts(initialState);
    initialState.player.health = initialState.player.maxHealth;
    initialState.gameMode = 'CAMPAIGN';
    initialState.rails = null;
    initialState.campaignLevelId = levelId;
    initialState.enemiesToKill = level.enemiesToKill;
    initialState.obstacles = level.obstacles.map((spec, i) => ({
      id: `camp_obs_${i}`,
      type: spec.type,
      pos: new Vector2(spec.x * initialState.world.width, spec.y * initialState.world.height),
      size: new Vector2(spec.radius, spec.radius),
      rotation: 0,
      color: spec.color,
    }));
    initialState.qualityLevel = 'high';
    initialState.threatLevel = computeThreatLevel(initialState);
    initialState.threatPeak = initialState.threatLevel;
    initialState.runStartTime = Date.now();
    initialState.runArtifactsUnlockedThisRun = [];
    initialState.cardTimer = 30;
    initialState.spawnRampTimer = 5;
    initialState.postBossBuffPick = false;
    gameStateRef.current = initialState;
    setNewUnlockIds([]);
    setShowArtifactUnlock(false);
    setArtifactUnlockChoices([]);
    syncUi();
    setScreen('GAME');
    setIsPauseMenuOpen(false);
    resumeAudio();
    if (!musicMuted) startMusic();
  };

  const syncUi = () => {
    const state = gameStateRef.current;
    if (!state) return;
    setUiState({
      health: state.player.health,
      maxHealth: state.player.maxHealth,
      survivalTime: state.survivalTime,
      threatLevel: state.threatLevel,
      threatPeak: state.threatPeak,
      score: state.score,
      wave: state.wave,
      stage: state.stage,
      enemiesToKill: state.enemiesToKill,
      stageTransition: state.stageTransition,
      energy: state.energy,
      maxEnergy: state.maxEnergy,
      velocityMag: state.player.velocity.magnitude(),
      playerSpeed: state.player.speed,
      isGameOver: state.isGameOver,
      isPaused: state.isPaused,
      gameMode: state.gameMode,
      buffs: { ...state.buffs },
      screenFlash: state.screenFlash,
      ultimateCharge: state.ultimateCharge,
      cardTimer: state.cardTimer,
      activeWeaponSlot: state.activeWeaponSlot,
      equippedArtifacts: { ...state.equippedArtifacts },
      runScrapEarned: state.runScrapEarned,
      bossArenaTransition: state.bossArenaTransition,
      activeBossId: state.activeBossId,
      bossActive: state.bossActive,
      lastBossDefeatedId: state.lastBossDefeatedId,
      bossVictoryBannerTimer: state.bossVictoryBannerTimer,
      pendingEvent: state.pendingEvent,
      extraLifeCharges: state.extraLifeCharges,
      passives: [...state.passives],
      selectedShip: state.selectedShip,
      ...(() => {
        const snap = getCompanionHudSnapshot(state);
        if (!snap) {
          return {
            companionId: null as CompanionId | null,
            companionLevel: 1,
            companionHealth: 0,
            companionMaxHealth: 0,
            companionAbilityCooldown: 0,
            companionAbilityCooldownMax: 0,
            companionAbilityName: '',
            companionEnergy: undefined,
          };
        }
        return {
          companionId: snap.companionId,
          companionLevel: snap.level,
          companionHealth: snap.health,
          companionMaxHealth: snap.maxHealth,
          companionAbilityCooldown: snap.abilityCooldownRemaining,
          companionAbilityCooldownMax: snap.abilityCooldownMax,
          companionAbilityName: snap.abilityName,
          companionEnergy: snap.energy,
        };
      })(),
    });
  };

  const handleFatalDamage = (next: GameState, player: Entity): boolean => {
    if (player.health > 0) return false;
    if (next.isGameOver) return false;
    if (tryTemporalAnchor(next, player)) return true;
    if (tryTriggerExtraLife(next, player)) return true;
    next.isGameOver = true;
    if (next.gameMode === 'NORMAL') {
      persistCompanionRunProgress(next);
      recordStatDelta({ playtimeSeconds: playtimeAccumRef.current });
      const mbKills = next.miniBossKillsThisRun ?? 0;
      if (mbKills > 0) recordStatDelta({ miniBossKills: mbKills });
      playtimeAccumRef.current = 0;
      const pb = recordSurvivalRun(next.score, next.survivalTime);
      setLastRunPersonalBest({ score: pb.newHighScore, time: pb.newLongestRun });
      if (pb.newHighScore) {
        setUnlockToasts((prev) => [
          ...prev,
          buildPersonalBestToast('score', prevHighScoreRef.current, next.score),
        ]);
        prevHighScoreRef.current = next.score;
      }
      if (pb.newLongestRun) {
        setUnlockToasts((prev) => [
          ...prev,
          buildPersonalBestToast('time', prevLongestRef.current, next.survivalTime),
        ]);
        prevLongestRef.current = next.survivalTime;
      }
      setSurvivalMetaKey((k) => k + 1);
    }
    const banked = next.runScrapEarned + computeRunEndScrap(next);
    if (banked > 0) {
      addMetaScrap(banked);
      recordStatDelta({ scrap: banked });
      setMetaScrap(getMetaScrap());
    }
    setLastRunScrapEarned(banked);
    playSfx('gameOver');
    stopMusic();
    applyPlayerDamageGlitch(next, player, 'fatal');
    return true;
  };

  const handleLevelUpChoice = (choiceId: string) => {
    const next = gameStateRef.current;
    if (!next) return;

    if (isArtifactChoiceId(choiceId)) {
      const artifact = ARTIFACTS[choiceId];
      if (artifact && equipRunArtifact(next, choiceId)) {
        persistArtifactUnlock(choiceId, false);
        if (!next.runArtifactsUnlockedThisRun.includes(choiceId)) {
          next.runArtifactsUnlockedThisRun.push(choiceId);
        }
        showArtifactAcquireFeedback(artifact);
      }
    } else {
      applyBuff(next, choiceId);
      const def = PASSIVE_BUFFS[choiceId];
      if (def?.exclusive || def?.rarity === BuffRarity.EXCLUSIVE) playSfx('exclusive');
      else playSfx('augment');
    }

    setShowLevelUp(false);
    next.isPaused = false;
    controls.current.isFiring = false;
    duckMusic(1);
    syncUi();
  };

  const handleArtifactUnlockChoice = (artifactId: string) => {
    persistArtifactUnlock(artifactId, true);
    const next = gameStateRef.current;
    if (next) {
      next.runArtifactUnlocks += 1;
      if (!next.runArtifactsUnlockedThisRun.includes(artifactId)) {
        next.runArtifactsUnlockedThisRun.push(artifactId);
      }
      if (equipRunArtifact(next, artifactId)) {
        const artifact = ARTIFACTS[artifactId];
        if (artifact) showArtifactAcquireFeedback(artifact);
      }
      next.isPaused = false;
    }
    setShowArtifactUnlock(false);
    setArtifactUnlockChoices([]);
    syncUi();
  };

  const showDevCheatToast = useCallback((message: string) => {
    setDevCheatToast(message);
    if (devCheatToastTimerRef.current) clearTimeout(devCheatToastTimerRef.current);
    devCheatToastTimerRef.current = setTimeout(() => setDevCheatToast(null), 2600);
  }, []);

  const showNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setNotification({ message, type });
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    notificationTimerRef.current = setTimeout(() => setNotification(null), 3000);
  }, []);

  const devCheatHandlersRef = useRef({
    onBossWarp: (_boss: BossDefinition) => {},
    onMiniBossSpawn: (_id: MiniBossId) => {},
    onClearQuota: () => {},
    onSkipWarp: () => {},
  });

  useEffect(() => {
    devCheatHandlersRef.current = {
      onBossWarp: (boss) => {
        const next = gameStateRef.current;
        if (!next) return;
        if (!triggerDevBossWarp(next, boss, dimensions.width, dimensions.height)) {
          showDevCheatToast('Boss-cheat: endast Survival (Start Survival)');
        }
      },
      onMiniBossSpawn: (id) => {
        const next = gameStateRef.current;
        if (!next) return;
        const entity = triggerDevMiniBossSpawn(next, id);
        if (!entity) {
          showDevCheatToast('Miniboss-cheat: endast Survival');
          return;
        }
        applyMiniBossSpawnJuice(next, id);
        playMiniBossSpawnSfx(id);
        next.enemies.push(entity);
      },
      onClearQuota: () => {
        const next = gameStateRef.current;
        if (!next) return;
        devClearKillQuota(next);
      },
      onSkipWarp: () => {
        const next = gameStateRef.current;
        if (!next) return;
        devSkipWarpAnimation(next);
      },
    };
  }, [dimensions.width, dimensions.height, showDevCheatToast]);

  const togglePause = () => {
    const next = gameStateRef.current;
    if (!next) return;
    next.isPaused = !next.isPaused;
    if (next.isPaused) controls.current.isFiring = false;
    setIsPauseMenuOpen(next.isPaused);
    duckMusic(next.isPaused ? 0.3 : 1);
    syncUi();
  };

  useEffect(() => {
    const duck = showLevelUp || showArtifactUnlock || isPauseMenuOpen;
    duckMusic(duck ? 0.3 : 1);
  }, [showLevelUp, showArtifactUnlock, isPauseMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen === 'GAME' && devCheatsActive) {
        const cheat = tryDevCheatKeydown(e, devCheatHandlersRef.current);
        if (cheat?.handled) {
          if (cheat.toast) showDevCheatToast(cheat.toast);
          syncUi();
          return;
        }
      }
      controls.current.keys.add(e.key.toLowerCase());
      if (e.key === ' ') {
        if (gameStateRef.current?.gameMode === 'ON_RAILS') {
          controls.current.isFiring = true;
        } else {
          controls.current.wantDash = true;
        }
      }
      if (e.key.toLowerCase() === 'e') controls.current.wantUltimate = true;
      if (e.key === 'p' || e.key === 'Escape') togglePause();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      controls.current.keys.delete(e.key.toLowerCase());
      if (e.key === ' ' && gameStateRef.current?.gameMode === 'ON_RAILS') {
        controls.current.isFiring = false;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      controls.current.mousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        controls.current.isFiring = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && gameStateRef.current?.gameMode !== 'ON_RAILS') {
        controls.current.isFiring = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // Cleanup notification timers
      if (devCheatToastTimerRef.current) clearTimeout(devCheatToastTimerRef.current);
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
      if (artifactPopupTimerRef.current) clearTimeout(artifactPopupTimerRef.current);
    };
  }, [screen, devCheatsActive, showDevCheatToast, syncUi]);

  useEffect(() => {
    if (screen !== 'GAME' || !gameStateRef.current) return;

    let animId: number;
    let lastUiSync = 0;
    let lastTime = performance.now();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // FPS tracking â€” rolling average over 30 frames
    const FPS_WINDOW = 30;
    const fpsBuffer: number[] = [];
    let fpsMeasured = 0;

    const loop = (currentTime: number) => {
      const next = gameStateRef.current;

      // Calculate delta time
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // dt is normalized to 60fps (16.67ms per frame), scaled by 0.75 to slow down the action
      const dt = Math.min(deltaTime / 16.67, 4) * 0.70;

      // Rolling FPS average â€” update quality every FPS_WINDOW frames
      if (deltaTime > 0 && deltaTime < 500) {
        fpsBuffer.push(1000 / deltaTime);
        if (fpsBuffer.length > FPS_WINDOW) fpsBuffer.shift();
        fpsMeasured = fpsBuffer.reduce((a, b) => a + b, 0) / fpsBuffer.length;
        if (next && fpsBuffer.length === FPS_WINDOW) {
          if (shouldForceLowQuality(getCombatDensityTier(next.enemies.length))) {
            next.qualityLevel = 'low';
          } else if (fpsMeasured < 50 && next.qualityLevel === 'high') {
            next.qualityLevel = 'low';
          } else if (fpsMeasured > 55 && next.qualityLevel === 'low') {
            next.qualityLevel = 'high';
          }
        }
      }

      // Arena restore must run even while paused (artifact pick after boss kill).
      if (next?.pendingArenaRestore) {
        restoreMainWorldAfterBoss(next, dimensions.width, dimensions.height);
        next.pendingArenaRestore = false;
        next.bossActive = false;
        next.activeBossId = null;
        next.inBossArena = false;
        next.enemies = [];
        next.projectiles = [];
        next.items = [];
        next.spawnRampTimer = 5.0;
        next.screenFlash = Math.max(next.screenFlash, 15);
        logBossLifecycle(next, 'arena-restored');
        playSfx('augment');
      }

      // Boss warp + stage intermission must tick even while paused (buff/artifact UI).
      if (next?.bossArenaTransition > 0) {
        next.enemies = [];
        next.projectiles = [];
        next.hazards = [];
        next.bossArenaTransition -= dt * (16.67 / 1000);
        next.player.velocity = new Vector2(0, 0);
        if (
          next.bossArenaTransition <= BOSS_WARP_SWAP_AT &&
          !next.bossArenaSwapped &&
          next.activeBossId
        ) {
          applyBossArenaWarp(next, dimensions.width, dimensions.height);
          if (next.passives.includes('crimson_overdrive')) {
            next.buffs.overdrive = Math.max(next.buffs.overdrive, 480);
          }
          playSfx('augment');
        }
        if (next.bossArenaTransition <= 0) {
          next.bossArenaTransition = 0;
          next.bossActive = true;
        }
      }

      if (next?.gameMode === 'NORMAL' && next.stageTransition > 0) {
        next.stageTransition -= dt;
        if (next.stageTransition <= 0) {
          const clearedStage = next.stage;
          next.stage++;
          onShopStageAdvanced(next);
          const milestoneArts = grantStageMilestoneUnlocks(clearedStage);
          for (const artId of milestoneArts) {
            const art = ARTIFACTS[artId];
            if (art) {
              playArtifactAcquireSfx(art.rarity);
              setUnlockToasts((prev) => [...prev, buildArtifactUnlockToast(artId)]);
            }
          }
          if (clearedStage === 1) {
            const firstId = getRecommendedCompanion(next.selectedShip);
            persistCompanionUnlock(firstId);
            unlockCompanionMeta(firstId);
          }
          syncMetaUnlockState();
          next.cardTimer = getEffectiveCardIntervalSeconds(
            next.stage,
            next.survivalTime,
            next.passives,
            next.threatLevel,
          );
          next.enemiesToKill = getStageQuota(next.stage);
          next.bossActive = false;
          next.activeBossId = null;
          next.bossArenaTransition = 0;
          next.bossArenaSwapped = false;
          next.inBossArena = false;
          next.pendingArenaRestore = false;
          next.mainWorldSnapshot = null;
          logBossLifecycle(next, 'stage-advanced');
          next.obstacles = generateObstaclesForStage(
            next.stage,
            next.world.width,
            next.world.height
          );
          next.runScrapEarned += computeStageClearScrap(next.stage - 1);
          next.enemies = [];
          next.projectiles = [];
          next.items = [];
          next.spawnRampTimer = 6.0;
          resetWaveSpawnState(next);
          next.player.health = Math.min(
            next.player.maxHealth,
            next.player.health + next.player.maxHealth * 0.3
          );
          next.screenFlash = 20;
          openBuffPicker(next);
          playSfx('augment');
        }
      }

      if (!next || next.isPaused || showLevelUpRef.current || showArtifactUnlockRef.current) {
        if (next?.bossArenaTransition > 0 || next?.stageTransition > 0) {
          syncUi();
        }
        if (next) render(ctx, next, dimensions.width, dimensions.height, { isMobile: reducedEffectsRef.current });
        animId = requestAnimationFrame(loop);
        return;
      }

      if (next.isGameOver) {
        // Only update particles for death explosion
        next.particles = updateParticles(next.particles, dt, next.player.pos);
        if (next.screenshake > 0) next.screenshake *= Math.pow(0.9, dt);
        render(ctx, next, dimensions.width, dimensions.height, { isMobile: reducedEffectsRef.current });
        animId = requestAnimationFrame(loop);
        return;
      }

      // Hit-stop: only freeze gameplay for heavy hits (crit/boss/shield), not every bullet
      if (next.hitStop > 0) {
        next.hitStop -= dt;
      }
      if (next.hitStop >= GAMEPLAY_HITSTOP_THRESHOLD) {
        next.particles = updateParticles(next.particles, dt * 0.1, next.player.pos);
        if (next.screenshake > 0) next.screenshake *= Math.pow(0.9, dt);
        render(ctx, next, dimensions.width, dimensions.height, { isMobile: reducedEffectsRef.current });
        animId = requestAnimationFrame(loop);
        return;
      }

      const { player } = next;
      const dtSec = dt * (16.67 / 1000);

      // Update Hit Timers
      if (player.hitTimer && player.hitTimer > 0) player.hitTimer -= dt;
      next.enemies.forEach(e => {
        if (e.hitTimer && e.hitTimer > 0) e.hitTimer -= dt;
      });

      // Update Damage Texts
      next.damageTexts = next.damageTexts.filter(dtxt => {
        dtxt.life -= 0.02 * dt;
        dtxt.pos.y -= 0.5 * dt;
        return dtxt.life > 0;
      });

      // Energy Regen
      if (!next.isDashing && next.energy < next.maxEnergy) {
        next.energy = Math.min(next.maxEnergy, next.energy + 0.3 * dt);
      }


      if (next.gameMode === 'NORMAL' && !next.isPaused) {
        next.survivalTime += dtSec;
        if (next.gameMode === 'NORMAL' && !next.isPaused) {
          playtimeAccumRef.current += dtSec;
        }
        next.threatLevel = computeThreatLevel(next);
        applyShopThreat(next);
        next.threatPeak = Math.max(next.threatPeak, next.threatLevel);
        applyThreatVisualEffects(next, dtSec);
        tickShopRunFlags(next, dtSec);
        updateCompanionAI(next, dtSec);
        tickMiniBossPassiveRuntime(next, dtSec);
        tickMiniBossWorldEffects(next, dtSec);
        if ((next.miniBossPopupTimer ?? 0) > 0) {
          next.miniBossPopupTimer = Math.max(0, (next.miniBossPopupTimer ?? 0) - dtSec);
        }
        if ((next.miniBossSpawnPopupTimer ?? 0) > 0) {
          next.miniBossSpawnPopupTimer = Math.max(0, (next.miniBossSpawnPopupTimer ?? 0) - dtSec);
        }
        if ((next.miniBossIncomingTimer ?? 0) > 0) {
          next.miniBossIncomingTimer = Math.max(0, (next.miniBossIncomingTimer ?? 0) - dtSec);
        }
        if ((next.bossVictoryBannerTimer ?? 0) > 0) {
          next.bossVictoryBannerTimer = Math.max(0, (next.bossVictoryBannerTimer ?? 0) - dt);
        }
      }

      if (next.pickJuiceTimer > 0) next.pickJuiceTimer -= dt;

      if (next.hasVoidRift) {
        next.voidRiftCooldown -= dt * (16.67 / 1000);
        if (next.voidRiftCooldown <= 0) {
          next.voidRiftCooldown = 720;
          const pulseR = 220;
          next.enemies.forEach((e) => {
            if (e.pos.distanceTo(player.pos) < pulseR) {
              const pull = player.pos.sub(e.pos).normalize().mul(35);
              e.pos = e.pos.add(pull);
              e.health -= 25 + next.threatLevel * 0.3;
              e.hitTimer = 5;
            }
          });
          next.screenFlash = Math.max(next.screenFlash, 4);
        }
      }

      // Card Timer Logic (disabled in ON_RAILS — uses its own powerup drops)
      if (
        next.gameMode !== 'ON_RAILS' &&
        next.bossArenaTransition <= 0 &&
        next.stageTransition <= 0
      ) {
        const cardInterval = getEffectiveCardIntervalSeconds(
          next.stage,
          next.survivalTime,
          next.passives,
          next.threatLevel,
        );
        if (next.stage !== 1 && Number.isFinite(cardInterval)) {
          next.cardTimer -= dt * (16.67 / 1000);
          if (next.cardTimer <= 0) {
            next.cardTimer = cardInterval;
            if (Math.random() < 0.2) {
              openMysteryCard(next);
            } else {
              openBuffPicker(next);
            }
            playSfx('levelUp');
            next.screenshake = 5;
            syncUi();
          }
        }
      }

      if (next.playerIFrameTimer > 0) next.playerIFrameTimer -= dt;
      if (next.dashIFrameTimer > 0) next.dashIFrameTimer -= dt;

      if (next.hasTimeDilation) {
        next.timeDilationCooldown -= dt * (16.67 / 1000);
        if (next.timeDilationCooldown <= 0) {
          next.buffs.timeSlow = Math.max(next.buffs.timeSlow, 360);
          next.timeDilationCooldown = 2400;
        }
      }

      // Buffs decay (skip permanents)
      if (!next.permanentOverdrive && next.buffs.overdrive > 0) next.buffs.overdrive -= dt;
      if (next.buffs.magnet > 0) next.buffs.magnet -= dt;
      if (next.buffs.scoreX > 0) next.buffs.scoreX -= dt;
      if (!next.permanentRapidFire && next.buffs.rapidFire > 0) next.buffs.rapidFire -= dt;
      if (!next.permanentTimeSlow && next.buffs.timeSlow > 0) next.buffs.timeSlow -= dt;
      if (!next.permanentPiercing && next.buffs.piercing > 0) next.buffs.piercing -= dt;
      
      if (next.comboTimer > 0) {
        next.comboTimer -= dt * (16.67 / 1000);
        if (next.comboTimer <= 0) next.combo = 0;
      }

      if (next.screenFlash > 0) {
        next.screenFlash -= dt;
        if (next.screenFlash <= 0) next.screenFlashColor = null;
      }
      
      const effectiveMagnetRange = next.buffs.magnet > 0 ? 800 : next.magnetRange;
      const xpMagnetRange = 120;

      const onRailsActive = next.gameMode === 'ON_RAILS' && next.rails?.outcome === 'active';

      // Passive Regen (not in ON_RAILS — fixed 3 HP)
      if (!onRailsActive) {
        if (next.regen > 0 && player.health < player.maxHealth) {
          player.health = Math.min(player.maxHealth, player.health + (next.regen / 60) * dt);
        }
        if (player.health < player.maxHealth) {
          player.health = Math.min(player.maxHealth, player.health + 0.01 * dt);
        }
      }

      const prevFrameHealth = player.health;

      // Process Input: Keyboard takes priority over Joystick
      let kx = 0;
      let ky = 0;
      const warpLocked = next.bossArenaTransition > 0;

      if (!onRailsActive) {
        if (controls.current.keys.has('w')) ky -= 1;
        if (controls.current.keys.has('s')) ky += 1;
        if (controls.current.keys.has('a')) kx -= 1;
        if (controls.current.keys.has('d')) kx += 1;
      }

      if (onRailsActive) {
        const keys = controls.current.keys;
        const railsEnded = updateOnRails(
          next,
          dtSec,
          {
            pointerScreenX: controls.current.mousePos.x,
            moveForward:
              keys.has('w') ||
              keys.has('arrowup') ||
              keys.has(' '),
            moveBack: keys.has('s') || keys.has('arrowdown'),
            moveLeft: keys.has('a') || keys.has('arrowleft'),
            moveRight: keys.has('d') || keys.has('arrowright'),
          },
          dimensions.width,
          dimensions.height
        );
        if (railsEnded) {
          if (player.health <= 0) handleFatalDamage(next, player);
          if (next.rails?.outcome === 'cleared') {
            saveRailsHighScore(next.rails.levelId, next.score);
            setRailsHighScores(getRailsHighScores());
          }
          if (next.rails?.outcome === 'failed') {
            playSfx('gameOver');
            stopMusic();
          }
          syncUi();
        }
      }

      // Weapon Switch
      const triggerWeaponSwitch = (slot: 'CANNON_A' | 'CANNON_B') => {
        if (next.activeWeaponSlot !== slot) {
          next.activeWeaponSlot = slot;
          playSfx('switchWeapon');
          syncUi();
        }
      };

      if (controls.current.keys.has('q')) {
        const slots: ('CANNON_A' | 'CANNON_B')[] = ['CANNON_A', 'CANNON_B'];
        const currentIdx = slots.indexOf(next.activeWeaponSlot);
        triggerWeaponSwitch(slots[(currentIdx + 1) % slots.length]);
        controls.current.keys.delete('q'); // One-shot
      }
      if (controls.current.keys.has('1')) triggerWeaponSwitch('CANNON_A');
      if (controls.current.keys.has('2')) triggerWeaponSwitch('CANNON_B');

      let moveDir: Vector2 = new Vector2(0, 0);
      const joystickMag = Math.hypot(controls.current.move.x, controls.current.move.y);
      if (kx !== 0 || ky !== 0) {
        moveDir = new Vector2(kx, ky).normalize();
      } else if (joystickMag > joystickDeadZoneRef.current) {
        const dz = joystickDeadZoneRef.current;
        const mappedMag = Math.min(1, (joystickMag - dz) / (1 - dz));
        const dir = new Vector2(controls.current.move.x, controls.current.move.y).normalize();
        moveDir = dir.mul(mappedMag);
      }
      
      // Calculate Aim: Joystick takes priority for aiming if actively moved
      let aimDir: Vector2;
      if (onRailsActive) {
        aimDir = getRailsShootDirection(next);
      } else {
        const aimMag = Math.hypot(controls.current.aim.x, controls.current.aim.y);
        if (aimMag > joystickDeadZoneRef.current) {
          aimDir = new Vector2(controls.current.aim.x, controls.current.aim.y).normalize();
        } else {
          const zoom = next.campaignZoom ?? 0.5;
          const playerScreenX = (player.pos.x - next.camera.x) * zoom;
          const playerScreenY = (player.pos.y - next.camera.y) * zoom;
          aimDir = new Vector2(
            controls.current.mousePos.x - playerScreenX,
            controls.current.mousePos.y - playerScreenY
          );
          if (aimDir.magnitude() < 5) aimDir = new Vector2(1, 0);
          else aimDir = aimDir.normalize();
        }
      }
      
      // Dash Initiation
      const dashCost = Math.max(12, 30 - next.dashEnergyDiscount);
      if (
        !warpLocked &&
        next.gameMode !== 'CAMPAIGN' &&
        !onRailsActive &&
        controls.current.wantDash &&
        next.energy >= dashCost &&
        !next.isDashing
      ) {
        next.isDashing = true;
        next.dashDuration = 10;
        next.energy -= dashCost;
        if (next.dashIFrames) next.dashIFrameTimer = 18;
        controls.current.wantDash = false;
        triggerHaptic(40);
        
        // Fix: Better direction capturing
        let dDir: Vector2;
        if (moveDir.magnitude() > 0.05) {
          dDir = moveDir.normalize();
        } else if (aimDir.magnitude() > 0.05) {
          dDir = aimDir.normalize();
        } else {
          // Dash in the direction the ship is currently "facing" (velocity)
          dDir = player.velocity.magnitude() > 0.1 ? player.velocity.normalize() : new Vector2(1, 0);
        }
        
        // Instant Velocity Spike for dash
        player.velocity = dDir.mul(player.speed * 12 * dt);

        next.screenshake = 2;
      }

      // Apply Movement
      let targetVelocity = moveDir.mul(player.speed * dt);
      
      // Ultimate Initiation
      if (controls.current.wantUltimate && next.ultimateCharge >= 100) {
        next.ultimateCharge = 0;
        const dmg = 200 + next.threatLevel * 2;
        next.enemies.forEach((en) => {
          en.health -= dmg;
        });
        next.screenshake = 10;
        next.screenFlash = 4;
        triggerHaptic([50, 50, 100]);
        // Visual blast effect centered on player
        next.particles.push(...createImplosion(player.pos, '#f0abfc', 30));
        next.particles.push(...createExplosion(player.pos, '#d946ef', 40, 2.5));
        controls.current.wantUltimate = false;
      } else {
        controls.current.wantUltimate = false;
      }
      
      if (next.isDashing) {
        next.dashDuration -= dt;
        if (next.dashDuration <= 0) next.isDashing = false;
        
        // Smooth falloff from spike
        player.velocity = player.velocity.lerp(targetVelocity, 0.08 * dt);
        
        if (Math.random() > 0.4) {
          next.particles.push({
            id: Math.random().toString(),
            pos: player.pos.clone(),
            velocity: player.velocity.mul(-0.5),
            life: 0.4,
            maxLife: 0.4,
            color: 'rgba(255,255,255,0.4)',
            size: 5
          });
        }
      } else if (warpLocked || onRailsActive) {
        player.velocity = new Vector2(0, 0);
      } else {
        if (moveDir.magnitude() > 0.05) {
          // Rapid acceleration, almost 1-frame, but allows some lean tracking
          player.velocity = player.velocity.lerp(targetVelocity, 0.4 * dt);
        } else {
          // Decelerate with subtle drift
          player.velocity = player.velocity.lerp(new Vector2(0, 0), 0.15 * dt);
          
          if (player.velocity.magnitude() > 0.5 && Math.random() < 0.3) {
            next.particles.push({
              id: Math.random().toString(),
              pos: player.pos.clone(),
              velocity: player.velocity.mul(-0.2).add(new Vector2((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)),
              life: 0.3,
              maxLife: 0.3,
              color: 'rgba(96, 165, 250, 0.3)',
              size: 4
            });
          }
        }
      }

      if (!onRailsActive) {
        player.pos = player.pos.add(player.velocity);
      }
      player.aimDir = aimDir;
      const preObsPos = player.pos.clone();
      resolveObstacleCollision(player, next.obstacles);
      // If push-out moved the player, they were touching an obstacle â†’ damage
      if (next.gameMode === 'CAMPAIGN' && next.playerIFrameTimer <= 0) {
        const pushed = player.pos.sub(preObsPos).magnitude();
        if (pushed > 0.5) {
          player.health -= 8;
          next.playerIFrameTimer = 40;
          next.screenshake = 4;
        }
      }
      player.pos.x = Math.max(player.radius, Math.min(next.world.width - player.radius, player.pos.x));
      player.pos.y = Math.max(player.radius, Math.min(next.world.height - player.radius, player.pos.y));

      // Campaign corridor: hard lateral clamp + zoom + camera
      if (next.gameMode === 'CAMPAIGN' && next.campaignLevelId) {
        const corrLevel = getCampaignLevel(next.campaignLevelId);
        if (corrLevel) {
          next.campaignZoom = Math.min(0.75, Math.max(0.2, (dimensions.width * 0.85) / (corrLevel.corridorHalfWidth * 2)));

          // Hard lateral clamp: player cannot cross visual walls
          const corrProgress = Math.max(0, 1 - next.enemiesToKill / corrLevel.enemiesToKill);
          const corrCenter = samplePath(corrLevel, corrProgress, next.world.width, next.world.height);
          const corrTangent = samplePathTangent(corrLevel, corrProgress, next.world.width, next.world.height);
          const corrNormal = { x: -corrTangent.y, y: corrTangent.x };
          const offX = player.pos.x - corrCenter.x;
          const offY = player.pos.y - corrCenter.y;
          const lateral = offX * corrNormal.x + offY * corrNormal.y;
          const forward = offX * corrTangent.x + offY * corrTangent.y;
          const clampedLateral = Math.max(-corrLevel.corridorHalfWidth, Math.min(corrLevel.corridorHalfWidth, lateral));
          player.pos.x = corrCenter.x + clampedLateral * corrNormal.x + forward * corrTangent.x;
          player.pos.y = corrCenter.y + clampedLateral * corrNormal.y + forward * corrTangent.y;

          next.campaignCameraPos = { x: player.pos.x, y: player.pos.y };
          next.campaignCameraAngle = Math.atan2(corrTangent.y, corrTangent.x);
        }
      } else {
        next.campaignCameraPos = null;
        next.campaignZoom = null;
        next.campaignCameraAngle = null;
      }

      const fireIntervalBase = 120; // Super rapid fire base
      let fireInterval = hasPermanentOverdrive(next) ? fireIntervalBase * 0.4 : fireIntervalBase;
      if (next.buffs.overdrive > 0 && !next.permanentOverdrive) fireInterval *= 0.4;
      
      // Weapon-specific fire rates
      if (next.activeWeaponSlot === 'CANNON_B') fireInterval *= 3.0; // Rockets are slower, bigger
      
      if (hasPermanentRapidFire(next) || next.buffs.rapidFire > 0) fireInterval *= 0.4;
      if (onRailsActive && next.rails) {
        fireInterval *= railsFireIntervalMult(next.rails, next.survivalTime);
      }
      if (next.fireRateMultiplier > 0) fireInterval /= next.fireRateMultiplier;
      if (next.multiShotFireRatePenalty < 1) fireInterval /= next.multiShotFireRatePenalty;
      if (next.bulletStormMult > 1) fireInterval /= next.bulletStormMult;
      
      const railsCinematicLock =
        onRailsActive &&
        next.rails &&
        (isBossEntranceActive(next.rails) || isRailsBossDeathActive(next.rails));

      if (
        !railsCinematicLock &&
        controls.current.isFiring &&
        currentTime - lastFireTime.current > fireInterval
      ) {
        lastFireTime.current = currentTime;

        if (countTag(next, 'damage') >= 2 && countTag(next, 'fire') >= 1) {
          next.nextShotBurns = true;
        }

        let numProjectiles = next.multiShot || 1;
        let spread = Math.min(Math.PI / 4, 0.1 * numProjectiles);
        if (onRailsActive) spread = Math.min(spread, 0.08);
        
          const totalCritChance = (next.critChance || 0.15) + next.pendingCritBonus;

        // Weapon damage modifier
        let weaponDmgMod = 1;
        const activeArtId = next.equippedArtifacts[next.activeWeaponSlot];
        if (activeArtId && ARTIFACTS[activeArtId]) {
          const art = ARTIFACTS[activeArtId];
          if (art.stats.damageMod) weaponDmgMod = art.stats.damageMod;
        }

        if (next.passives.includes('cursed_ammo')) {
          weaponDmgMod *= 0.7;
          numProjectiles += 6;
        }

        // Special Tuning per Slot
        let projectileSpeed = 10;
        let pRadius = 5;
        
        // Ship-specific weapon signature colors
        const weaponSignature = WEAPON_SIGNATURES[next.selectedShip];
        let pColor = weaponSignature.projectileColor;
        let pPiercing = next.bounceCount;
        if (hasPermanentPiercing(next) || next.hasInfinityPierce) pPiercing += 1000;

        if (next.activeWeaponSlot === 'CANNON_B') {
          projectileSpeed = 7.5;
          pRadius = 12; // Bigger rockets
          pColor = '#10b981'; // Emerald Green for contrast (rockets keep distinct color)
          // Rockets are inherently more powerful per shot
          weaponDmgMod *= 4.5; 
        }

        // Tesla Procs - Optimized (no dt in Math.random for consistency)
        if ((next.hasLighting || next.passives.includes('lighting') || next.passives.includes('chain_god')) && Math.random() < 0.08) {
          const nearest = next.enemies[Math.floor(Math.random() * next.enemies.length)];
          if (nearest && nearest.pos.distanceTo(player.pos) < 400) {
            nearest.health -= 50;
            if (next.qualityLevel === 'high') next.particles.push(...createImpact(nearest.pos, '#60a5fa', 2));
            if (next.passives.includes('chain_god')) {
              let chains = 0;
              for (const other of next.enemies) {
                if (chains >= 2) break;
                if (other.id !== nearest.id && other.health > 0 && other.pos.distanceTo(nearest.pos) < 180) {
                  other.health -= 40;
                  chains++;
                }
              }
            }
          }
        }

        for (let i = 0; i < numProjectiles; i++) {
          let finalAngle = Math.atan2(aimDir.y, aimDir.x);
          if (numProjectiles > 1) {
            finalAngle += ((i / (numProjectiles - 1)) - 0.5) * spread;
          }
          
          const velX = Math.cos(finalAngle) * projectileSpeed;
          const velY = Math.sin(finalAngle) * projectileSpeed;
          
        const isCrit = Math.random() < totalCritChance;
          const damageMult = isCrit ? 2.5 : 1;
          
          let baseDmg = next.baseDamage * (1 + Math.min(next.combo * 0.05, 2.0)); // Up to +200% damage from combo
          if (weaponDmgMod > 5) baseDmg += weaponDmgMod;
          else baseDmg *= weaponDmgMod;

          let finalDamage = Math.floor(baseDmg * damageMult * getMiniBossOutgoingDamageMult(next));
          if (onRailsActive && next.rails && consumeRailsMegaBlast(next.rails)) {
            finalDamage = 50;
          }

          // Weapon damage is applied in the projectile
          next.projectiles.push({
            id: Math.random().toString(),
            type: EntityType.PROJECTILE,
            pos: player.pos.clone(),
            radius: isCrit ? pRadius * 1.5 : pRadius,
            health: 1,
            maxHealth: 1,
            speed: projectileSpeed,
            velocity: new Vector2(velX, velY),
            color: isCrit ? '#fca5a5' : pColor,
            ownerId: 'player',
            damage: finalDamage,
            bounceCount: pPiercing, 
            itemType: next.activeWeaponSlot === 'CANNON_B' ? ItemType.BOMB : undefined
          });
        }
        
        shootSfxForSlot(next.activeWeaponSlot);
        const muzzlePos = player.pos.add(aimDir.normalize().mul(player.radius + 5));
        
        // Muzzle Flash Particle
        next.particles.push({
           id: Math.random().toString(),
           pos: muzzlePos.clone(),
           velocity: new Vector2(0, 0),
           life: 1.0,
           maxLife: 1.0,
           color: '#fef08a', // bright yellow
           size: 18,
           decay: 5.0 // fast decay
        });
        
        // Small screenshake for shooting (adds weight to attacks)
        next.screenshake = Math.min(next.screenshake + 0.35, 1.5);
        
        // Bullet casing particle ejecting to the side
        const currentAimAngle = Math.atan2(aimDir.y, aimDir.x);
        const sideAngle = currentAimAngle + (Math.PI / 2) * (Math.random() > 0.5 ? 1 : -1) + (Math.random() - 0.5);
        next.particles.push({
           id: Math.random().toString(),
           pos: player.pos.clone(),
           velocity: new Vector2(Math.cos(sideAngle) * 6, Math.sin(sideAngle) * 6),
           life: 1.0,
           maxLife: 1.0,
           color: '#fbbf24', // golden casing
           size: 3,
           decay: 1.0
        });

        if (next.activeWeaponSlot === 'CANNON_C') {
          // Cannon particles are larger
          next.screenshake = Math.min(next.screenshake + 1.0, 3.5);
        }

        if (next.hasBackshot) {
          const backAngle = Math.atan2(-aimDir.y, -aimDir.x);
          const bvx = Math.cos(backAngle) * projectileSpeed;
          const bvy = Math.sin(backAngle) * projectileSpeed;
          next.projectiles.push({
            id: Math.random().toString(),
            type: EntityType.PROJECTILE,
            pos: player.pos.clone(),
            radius: pRadius * 0.8,
            health: 1,
            maxHealth: 1,
            speed: projectileSpeed,
            velocity: new Vector2(bvx, bvy),
            color: pColor,
            ownerId: 'player',
            damage: Math.floor(next.baseDamage * 0.7),
            bounceCount: pPiercing,
          });
        }
      }

      // Orbitals Logic
      if (next.orbitalCount > 0) {
        const orbitRadius = 100;
        const orbitSpeed = 0.05;
        for (let i = 0; i < next.orbitalCount; i++) {
          const angle = (currentTime * orbitSpeed + (i * 2 * Math.PI) / next.orbitalCount);
          const orbitX = player.pos.x + Math.cos(angle) * orbitRadius;
          const orbitY = player.pos.y + Math.sin(angle) * orbitRadius;
          const orbitPos = new Vector2(orbitX, orbitY);
          
          // Debug/Visual only in renderer, but check collision here
          next.enemies.forEach(e => {
            if (e.pos.distanceTo(orbitPos) < 25) {
              e.health -= 2 * dt;
              e.hitTimer = 3;
              if (Math.random() < 0.1) next.particles.push(...createImpact(e.pos, '#8b5cf6', 1));
            }
          });
        }
      }

      if (next.enemies.length > 0) {
        next.projectiles.forEach(p => {
          if (
            !p?.pos ||
            !p?.velocity ||
            p.type !== EntityType.PROJECTILE ||
            p.ownerId !== 'player' ||
            (!next.hasHoming && !p.homing)
          ) {
            return;
          }
            let bestDist = 800;
            let target: Entity | null = null;
            next.enemies.forEach(e => {
              const d = e.pos.distanceTo(p.pos);
              if (d < bestDist) {
                bestDist = d;
                target = e;
              }
            });
            if (target) {
              const toTarget = target.pos.sub(p.pos).normalize();
              const steerRate = 0.12 * dt;
              const currentSpeed = p.velocity.magnitude();
              p.velocity = p.velocity.normalize().add(toTarget.mul(steerRate)).normalize().mul(currentSpeed);
            }
        });
      }

      next.projectiles = updateProjectiles(next.projectiles, next.world.width, next.world.height, dt, next.bounceCount);
      updateHazards(next, dt);
      if (next.gameMode !== 'ON_RAILS') {
        updateEnemies(next, dt);
      }
      next.particles = updateParticles(next.particles, dt, next.player.pos);
      const PARTICLE_CAP = next.qualityLevel === 'low' ? 20 : 30;
      if (next.particles.length > PARTICLE_CAP) {
        next.particles.splice(0, next.particles.length - PARTICLE_CAP);
      }

      // Campaign portal-trigger detection
      if (next.gameMode === 'CAMPAIGN' && next.campaignLevelId && !next.bossActive) {
        const portalLevel = getCampaignLevel(next.campaignLevelId);
        if (portalLevel && next.enemiesToKill <= 0) {
          const pw = portalLevel.portalPos;
          const portalWorldX = pw.x * next.world.width;
          const portalWorldY = pw.y * next.world.height;
          const dx = next.player.pos.x - portalWorldX;
          const dy = next.player.pos.y - portalWorldY;
          if (Math.sqrt(dx * dx + dy * dy) < PORTAL_TRIGGER_RADIUS) {
            next.bossActive = true;
            next.screenshake = 8;
            next.screenFlash = 6;
            playSfx('augment');
          }
        }
      }

      // Spawning logic
      if (next.gameMode === 'AIM_TRAINER') {
        if (next.enemies.length < 15) {
          next.enemies.push({
            id: Math.random().toString(),
            type: EntityType.ENEMY,
            pos: new Vector2(Math.random() * next.world.width, Math.random() * next.world.height),
            radius: 12,
            health: 1,
            maxHealth: 1,
            speed: 4,
            velocity: new Vector2(0, 0),
            color: '#facc15',
          });
        }
      } else if (
        next.gameMode !== 'ON_RAILS' &&
        next.stageTransition <= 0 &&
        next.bossArenaTransition <= 0
      ) {
        // Hazard spawning
        if (Math.random() < 0.002) {
          next.hazards.push(spawnHazard(next));
        }

        if (next.spawnRampTimer > 0) next.spawnRampTimer -= dt * (16.67 / 1000);

        const mobile = reducedEffectsRef.current;
        const tierMods = getTierModifiers(getAugmentTier(next.passives.length));
        const threatFactor = tierMods.threatFactor;

        const campaignLevel = next.gameMode === 'CAMPAIGN' && next.campaignLevelId
          ? getCampaignLevel(next.campaignLevelId)
          : null;

        const totalToKill = getKillQuotaForSpawn(
          next.gameMode,
          next.stage,
          campaignLevel?.enemiesToKill ?? null
        );
        let levelProgress = getLevelProgress(next.enemiesToKill, totalToKill);
        if (
          next.gameMode === 'NORMAL' &&
          !next.bossActive &&
          !isBossTransitioning(next)
        ) {
          levelProgress = Math.min(1, levelProgress + next.survivalTime / 600);
        }

        const isRamping = next.spawnRampTimer > 0;
        const bossTransitioning = isBossTransitioning(next);
        const liveBoss = hasLiveBoss(next);

        const survivalMods =
          next.gameMode === 'NORMAL' ? getSurvivalSpawnModifiers() : null;

        const maxEnemies = Math.floor(
          getMaxAliveEnemies({
            levelProgress,
            threatFactor,
            isRamping,
            mobile,
            stage: next.gameMode === 'NORMAL' ? next.stage : undefined,
          }) * (survivalMods?.maxEnemiesMult ?? 1)
        );

        const spawnChance =
          getSpawnChance({
            levelProgress,
            threatFactor,
            survivalTime: next.survivalTime,
            mobile,
          }) *
          tierMods.spawnChanceMult *
          (survivalMods?.spawnChanceMult ?? 1);

        const spawnOne = (): Entity | null => {
          if (campaignLevel) {
            const typeOv = pickCampaignEnemyType(campaignLevel, levelProgress);
            const posOv = getSpawnPosAlongPath(campaignLevel, next.enemiesToKill, next.world.width, next.world.height);
            return spawnEnemy(next, typeOv, posOv);
          }
          const pick = pickEnemyTypeForThreat(next, levelProgress);
          if (pick === null) return null;
          return spawnEnemy(next, pick);
        };

        const pushSpawn = (entity: Entity | null) => {
          if (!entity) return;
          if (entity.miniBossId) {
            const mbId = entity.miniBossId as MiniBossId;
            applyMiniBossSpawnJuice(next, mbId);
            playMiniBossSpawnSfx(mbId);
          }
          next.enemies.push(entity);
          if (entity.enemyType === EnemyType.SWARM_V2 && next.enemies.length < maxEnemies - 3) {
            const packSize = 2 + Math.floor(Math.random() * 3);
            for (let pk = 0; pk < packSize && next.enemies.length < maxEnemies; pk++) {
              const packAngle = Math.random() * Math.PI * 2;
              const packDist = 25 + Math.random() * 70;
              const mate = spawnEnemy(next, 16);
              if (mate) {
                mate.pos.x = Math.max(0, Math.min(next.world.width, entity.pos.x + Math.cos(packAngle) * packDist));
                mate.pos.y = Math.max(0, Math.min(next.world.height, entity.pos.y + Math.sin(packAngle) * packDist));
                next.enemies.push(mate);
              }
            }
          }
        };

        // No spawns during boss death, arena restore, warp, or stage intermission.
        if (!bossTransitioning) {
          if (!next.bossActive && next.enemiesToKill > 0 && next.enemies.length < maxEnemies) {
            if (next.gameMode === 'NORMAL') {
              const entity = tickSurvivalWaveSpawns(
                next,
                dtSec,
                maxEnemies,
                (pick) => spawnEnemy(next, pick),
                (id) => spawnMiniBoss(next, id),
              );
              if (entity) pushSpawn(entity);
            } else {
              if (Math.random() < spawnChance) {
                pushSpawn(spawnOne());
              }

              if (!isRamping) {
                if (spawnChance > 0.1 && Math.random() < spawnChance * 0.7 && next.enemies.length < maxEnemies) {
                  pushSpawn(spawnOne());
                }
                if (spawnChance > 0.25 && Math.random() < spawnChance * 0.6 && next.enemies.length < maxEnemies) {
                  pushSpawn(spawnOne());
                  pushSpawn(spawnOne());
                }
                if (!campaignLevel && levelProgress > 0.5 && Math.random() < 0.05 && next.enemies.length < maxEnemies) {
                  const burstCount = Math.min(3, 1 + Math.floor(threatFactor));
                  for (let h = 0; h < burstCount; h++) {
                    if (next.enemies.length >= maxEnemies) break;
                    pushSpawn(spawnOne());
                  }
                }
              }
            }
          } else if (
            next.bossActive &&
            next.inBossArena &&
            !liveBoss &&
            next.bossArenaTransition <= 0
          ) {
            // One boss spawn when arena is live and boss entity is missing.
            pushSpawn(spawnEnemy(next));
            if (next.activeBossId === 'hive_queen') {
              for (let m = 0; m < 3; m++) {
                const minion = spawnEnemy(next, 3);
                if (minion) {
                  const mAngle = (m / 3) * Math.PI * 2;
                  minion.pos = new Vector2(
                    Math.max(80, Math.min(next.world.width - 80, next.player.pos.x + Math.cos(mAngle) * 320)),
                    Math.max(80, Math.min(next.world.height - 80, next.player.pos.y + Math.sin(mAngle) * 320))
                  );
                  next.enemies.push(minion);
                }
              }
            }
          }
          // Boss arenas should be 1v1 - no additional enemy spawns during boss fights
        }

        // Hard trim: remove oldest non-boss enemies if over absolute limit
        const HARD_CAP = mobile ? 25 : 40;
        if (next.enemies.length > HARD_CAP) {
          let toRemove = next.enemies.length - HARD_CAP;
          next.enemies = next.enemies.filter(e => {
            if (toRemove > 0 && e.enemyType !== EnemyType.BOSS) { toRemove--; return false; }
            return true;
          });
        }
      }

      // Camera follow
      const zoom = next.campaignZoom ?? 0.5;
      const viewW = dimensions.width / zoom;
      const viewH = dimensions.height / zoom;
      const camFocus = next.campaignCameraPos ?? player.pos;
      const targetCamX = camFocus.x - viewW / 2;
      const targetCamY = camFocus.y - viewH / 2;
      next.camera.x = targetCamX; // snap in campaign; lerp otherwise handled below
      next.camera.y = targetCamY;
      if (!next.campaignCameraPos) {
        next.camera.x += (targetCamX - next.camera.x) * 0.4 * dt;
        next.camera.y += (targetCamY - next.camera.y) * 0.4 * dt;
      }
      next.camera.x = Math.max(0, Math.min(next.world.width - viewW, next.camera.x));
      next.camera.y = Math.max(0, Math.min(next.world.height - viewH, next.camera.y));

      // Spatial grid for projectile hits (after updateEnemies + spawn)
      const grid = new Map<string, Entity[]>();
      const cellSize = ENEMY_SPATIAL_CELL_SIZE;
      for (let i = 0; i < next.enemies.length; i++) {
        const e = next.enemies[i];
        if (e.health <= 0) continue;
        const gx = Math.floor(e.pos.x / cellSize);
        const gy = Math.floor(e.pos.y / cellSize);
        const key = `${gx},${gy}`;
        let cell = grid.get(key);
        if (!cell) {
          cell = [];
          grid.set(key, cell);
        }
        cell.push(e);
      }

      // Collision
      for (let i = next.projectiles.length - 1; i >= 0; i--) {
        const p = next.projectiles[i];
        if (!p?.pos) continue;

        // vs Obstacles
        let hitObs = false;
        for (const obs of next.obstacles) {
          if (!obs?.pos || !obs?.size) continue;
          if (checkProjectileObstacleCollision(p, obs)) {
            hitObs = true;
            if (next.qualityLevel === 'high') next.particles.push(...createImpact(p.pos, p.color, 2));
            break;
          }
        }
        if (hitObs) {
          if (p.explosiveRadius && p.ownerId !== 'player') {
            applyPlasmaExplosion(next, p.pos, p.damage ?? 20, p.explosiveRadius);
          }
          p.health = 0;
          continue;
        }

        // Enemy projectiles vs Player
        if (p.ownerId !== 'player' && next.bossArenaTransition <= 0) {
          if (checkCollision(p, player)) {
            if (next.gameMode === 'ON_RAILS' && next.rails) {
              p.health = 0;
              if (applyRailsPlayerHit(next, next.survivalTime)) {
                playSfx('gameOver');
                stopMusic();
                next.particles.push(...createImpact(player.pos, '#ef4444', 6));
                if (next.isGameOver) syncUi();
              }
              continue;
            }
            if (next.dashIFrameTimer > 0 || next.playerIFrameTimer > 0) {
              if (next.qualityLevel === 'high') next.particles.push(...createImpact(player.pos, '#ffffff', 2));
              p.health = 0;
              continue;
            }
            let takenDmg = (p.damage || 10) * 1.5 * getMiniBossIncomingDamageMult(next);
            if (next.gameMode === 'NORMAL' && next.activeCompanionId) {
              takenDmg = mitigateCompanionIncomingDamage(next, takenDmg);
              applyCompanionDamageReflect(next, takenDmg);
            }
            player.health -= takenDmg;
            if (next.companionRuntime && takenDmg > 0) {
              notifyCompanionPlayerHit(next.companionRuntime);
            }
            next.playerIFrameTimer = 45;
            next.particles.push(...createImpact(player.pos, '#ffffff', 5));
            if (p.explosiveRadius) {
              applyPlasmaExplosion(next, p.pos, p.damage ?? 20, p.explosiveRadius);
            }

            if (handleFatalDamage(next, player)) {
              if (next.isGameOver) syncUi();
            }
            p.health = 0;
            continue;
          }
        }

        // Player projectiles vs Enemies
        if (p.ownerId === 'player') {
          const gx = Math.floor(p.pos.x / cellSize);
          const gy = Math.floor(p.pos.y / cellSize);
          
          let collided = false;
          // Check bullet cell and 8 neighbors
          for (let ox = -1; ox <= 1; ox++) {
            for (let oy = -1; oy <= 1; oy++) {
              const key = `${gx + ox},${gy + oy}`;
              const cellEnemies = grid.get(key);
              if (!cellEnemies) continue;

              for (let j = cellEnemies.length - 1; j >= 0; j--) {
                const e = cellEnemies[j];
                if (checkCollision(p, e)) {
                  let critRoll = (next.critChance || 0) + next.pendingCritBonus;
                  const isCrit = Math.random() < critRoll;
                  next.pendingCritBonus = isCrit ? Math.min(0.35, next.chainCritBonus) : 0;
                  let damage = (p.damage || 10) * (isCrit ? 2.5 : 1);
                  if (e.enemyType === EnemyType.SHIELDED && e.damageResist && e.damageResist > 0.5) {
                    // Each hit chips the shield
                    e.shieldHealth = (e.shieldHealth ?? 10) - 1;
                    if ((e.shieldHealth ?? 0) <= 0) {
                      e.damageResist = 0;
                      e.aiState = 'recharge';
                      e.aiTimer = 300; // 5s recharge at 60fps
                    }
                    damage *= 0.15; // shield absorbs most damage
                  } else if (e.damageResist && e.damageResist > 0) {
                    damage *= 1 - e.damageResist;
                  }
                  if (e.health < e.maxHealth * 0.5 && next.hunterMarkBonus > 0) {
                    damage *= 1 + next.hunterMarkBonus;
                  }
                  if (next.gameMode === 'ON_RAILS') {
                    damage *= railsBossDamageMult(e);
                  }
                  if (next.frostSlowStrength > 0) {
                    e.frostTimer = Math.max(e.frostTimer || 0, 45 * next.frostSlowStrength);
                  }

                  const mbRt = next.miniBossPassiveRuntime;
                  if (mbRt?.phantomStrikePending) {
                    damage *= 2;
                    mbRt.phantomStrikePending = false;
                  }
                  if (e.miniBossId && e.aiState === 'invisible') {
                    damage *= 0.08;
                  }
                  if (mbRt?.nextShotShockwave) {
                    mbRt.nextShotShockwave = false;
                    fireMiniBossShockwave(next, e);
                  }

                  e.health -= damage;
                  if (
                    e.miniBossId === 'void_harbinger' &&
                    next.passives.includes('mb_void_drain') &&
                    damage > 0
                  ) {
                    const heal = damage * 0.15;
                    player.health = Math.min(player.maxHealth, player.health + heal);
                  }
                  const densityTier = getCombatDensityTier(next.enemies.length);
                  const isKillHit = e.health <= 0;
                  if (shouldApplyHitTimer(densityTier, isCrit, isKillHit)) {
                    e.hitTimer = 3;
                  }

                  // Lifesteal
                  if (next.lifeSteal > 0 && e.health <= 0) {
                    player.health = Math.min(player.maxHealth, player.health + e.maxHealth * next.lifeSteal);
                  }

                  // Explosive Rounds & Cannon B Rockets
                  const isRocket = p.itemType === ItemType.BOMB;
                  if (isRocket || (next.explosiveChance > 0 && Math.random() < next.explosiveChance)) {
                    // Hit nearby enemies - Optimized with Grid
                    const explosionRadius = isRocket ? 150 : 100;
                    const egx = Math.floor(e.pos.x / cellSize);
                    const egy = Math.floor(e.pos.y / cellSize);
                    
                    const explosionDamage = isRocket ? damage * 1.5 : damage * 0.5;
                    
                    for (let ox = -1; ox <= 1; ox++) {
                      for (let oy = -1; oy <= 1; oy++) {
                        const cell = grid.get(`${egx + ox},${egy + oy}`);
                        if (cell) {
                          cell.forEach(other => {
                            if (other !== e && other.pos.distanceTo(e.pos) < explosionRadius) {
                              other.health -= explosionDamage;
                              other.hitTimer = 3;
                            }
                          });
                        }
                      }
                    }
                  }
                  
                  // Gravity Well
                  if (next.passives.includes('gravity_well') && Math.random() < 0.1) {
                    const pullRadius = 180;
                    const pgx = Math.floor(e.pos.x / cellSize);
                    const pgy = Math.floor(e.pos.y / cellSize);

                    for (let ox = -2; ox <= 2; ox++) {
                      for (let oy = -2; oy <= 2; oy++) {
                        const cell = grid.get(`${pgx + ox},${pgy + oy}`);
                        if (cell) {
                          cell.forEach(other => {
                            if (other !== e && other.pos.distanceTo(e.pos) < pullRadius) {
                              const pullDir = e.pos.sub(other.pos).normalize();
                              other.pos = other.pos.add(pullDir.mul(25 * dt));
                            }
                          });
                        }
                      }
                    }
                  }
                  
                  if ((p.bounceCount || 0) > 0 && p.health > 0 && !isCrit && !hasPermanentPiercing(next) && !next.hasInfinityPierce && next.buffs.piercing <= 0) {
                    const bounceRadius = 300;
                    const nearestOther = findNearestEnemyInGrid(
                      grid,
                      e.pos,
                      e.id,
                      bounceRadius,
                      cellSize
                    );

                    if (nearestOther) {
                      const newDir = (nearestOther as Entity).pos.sub(e.pos).normalize();
                      const speed = p.velocity.magnitude();
                      p.velocity = newDir.mul(speed);
                      p.damage = (p.damage || 10) * 0.7; // Damage falls off
                      p.bounceCount = (p.bounceCount || 0) - 1; 
                    } else {
                      p.health = 0;
                    }
                  } else if (!isCrit && !hasPermanentPiercing(next) && !next.hasInfinityPierce && next.buffs.piercing <= 0) {
                    p.health = 0;
                  } else if (hasPermanentPiercing(next) || next.hasInfinityPierce || next.buffs.piercing > 0) {
                    p.damage = (p.damage || 10) * 0.8;
                    if ((p.damage || 0) < 5) p.health = 0;
                  } else if (isCrit) {
                    p.health = 0;
                  }
                  
                  if (next.burnOnCrit && isCrit) {
                    e.burnTimer = Math.max(e.burnTimer || 0, 120);
                  }
                  if (next.nextShotBurns) {
                    e.burnTimer = Math.max(e.burnTimer || 0, 90);
                    next.nextShotBurns = false;
                  }

                  const hitKind = isCrit ? 'crit' : isBossHit(e.enemyType) ? 'boss' : 'normal';
                  if (shouldTriggerHitFeedback(densityTier, hitKind)) {
                    triggerHitFeedback(next, hitKind);
                  }

                  if (shouldApplyKnockback(densityTier, isCrit, isKillHit, isBossHit(e.enemyType))) {
                    const kbForce = Math.min((damage / e.maxHealth) * 30 + 2, 10);
                    const pNorm = p.velocity.magnitude() > 0.01 ? p.velocity.normalize() : new Vector2(1, 0);
                    e.knockback = new Vector2(pNorm.x * kbForce, pNorm.y * kbForce);
                  }

                  const chaosFactor = Math.max(1, next.enemies.length / 50);
                  const isKill = isKillHit;
                  const isHeavy = e.enemyType === EnemyType.BOSS || e.enemyType === EnemyType.TANK || e.enemyType === EnemyType.ELITE;

                  // Damage numbers always â€” particles only on light enemies at low chaos
                  spawnDamageNumber(
                    next.damageTexts,
                    e.pos.clone(),
                    damage,
                    isCrit ? '#fde047' : isKill ? '#ef4444' : '#ffffff',
                    isCrit,
                    chaosFactor,
                    isKill
                  );

                  if (!isHeavy && next.qualityLevel === 'high' && Math.random() > (1 - 0.2/chaosFactor)) {
                    // Ship-specific impact effects
                    const threatLevel = Math.min(1, next.threatLevel / 1000);
                    const isCritHit = damage > next.baseDamage * 2;
                    const impactData = getImpactEffectData(next.selectedShip, damage, isCritHit, threatLevel);
                    
                    // Base impact with ship-specific color and size
                    next.particles.push(...createImpact(p.pos, impactData.color, Math.floor(impactData.size)));
                    
                    // Ship-specific special effects
                    if (impactData.shockwave && Math.random() < 0.3) {
                      // Heavy Sentinel gets shockwave rings
                      next.particles.push(...createExplosion(p.pos, impactData.color, 6, 0.8));
                    }
                    if (impactData.sparkBurst && Math.random() < 0.4) {
                      // Swift Falcon gets zippy spark bursts
                      next.particles.push(...createImpact(p.pos, '#00d4ff', 3));
                    }
                    if (impactData.cascade && Math.random() < 0.35) {
                      // Swarm Vessel gets cascading sparkles
                      for (let i = 0; i < 3; i++) {
                        const offset = new Vector2((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
                        next.particles.push(...createImpact(p.pos.add(offset), '#f5f5f5', 1));
                      }
                    }
                    
                    // Screen flash for major hits
                    const screenFlashData = shouldTriggerScreenFlash(next.selectedShip, damage, isCritHit, threatLevel);
                    if (screenFlashData.flash) {
                      next.screenFlash = Math.max(next.screenFlash, Math.floor(screenFlashData.intensity * 10));
                    }
                  }

                  if (e.health <= 0) {
                    if (e.miniBossId && next.gameMode === 'NORMAL') {
                      const mbId = e.miniBossId as MiniBossId;
                      next.miniBossKillsThisRun =
                        (next.miniBossKillsThisRun ?? 0) + 1;
                      const rewards = applyMiniBossDefeatRewards(
                        next,
                        mbId,
                        unlockedArtifactIdsRef.current,
                      );
                      if (rewards) {
                        equipRunArtifact(next, rewards.artifact.id);
                        persistArtifactUnlock(rewards.artifact.id, false);
                        showArtifactAcquireFeedback(rewards.artifact);
                        applyMiniBossDefeatJuice(next, mbId, rewards);
                        playMiniBossDefeatSfx(mbId);
                        const mbDef = getMiniBossDef(mbId);
                        next.particles.push(
                          ...createExplosion(e.pos, mbDef.auraColor, 12, 1.8),
                        );
                      }
                      next.enemies.forEach((oe) => {
                        if (oe.miniBossParentId === e.id) oe.health = 0;
                      });
                    }

                    const onRailsKill =
                      next.gameMode === 'ON_RAILS' && next.rails;
                    if (onRailsKill && e.enemyType !== EnemyType.BOSS) {
                      if (!e.railsDying) beginRailsEnemyDeath(next, e);
                    }
                    if (
                      onRailsKill &&
                      e.enemyType === EnemyType.BOSS &&
                      e.railsWeakPointOpen &&
                      isKillHit
                    ) {
                      triggerWeakPointHitFx(next, e);
                    }
                    next.combo++;
                    next.comboTimer = 2.5;
                    if (!onRailsKill || e.enemyType === EnemyType.BOSS) {
                      let scoreGain =
                        (onRailsKill ? railsEnemyKillScore(e.enemyType) : 100) *
                        (next.buffs.scoreX > 0 ? 2 : 1) *
                        Math.min(10, next.combo) *
                        next.comboDamageMult;
                      if (onRailsKill && next.rails) {
                        scoreGain *= railsScoreMult(next.rails, next.survivalTime);
                      }
                      next.score += scoreGain;
                    }
                    next.killCountSinceHeal += 1;
                    if (next.gameMode === 'NORMAL') {
                      recordStatDelta({ kills: 1 });
                      const lootDrop = rollLootOnKill(next);
                      if (lootDrop) {
                        if (lootDrop.kind === 'vault_artifact') {
                          persistArtifactUnlock(lootDrop.lootId, true);
                          equipRunArtifact(next, lootDrop.lootId);
                        } else if (lootDrop.kind === 'companion') {
                          const cid = lootDrop.lootId as CompanionId;
                          persistCompanionUnlock(cid);
                          unlockCompanionMeta(cid);
                          applyLootDrop(next, lootDrop);
                        } else {
                          applyLootDrop(next, lootDrop);
                        }
                      }
                      if (next.activeCompanionId) {
                        grantCompanionKillXp(next);
                      }
                    }
                    const ultGain =
                      next.bossActive && countPassiveStacks(next.passives, 'tyrant_fury') > 0 ? 0.8 : 0.5;
                    next.ultimateCharge = Math.min(100, next.ultimateCharge + ultGain);
                    if (next.passives.includes('kill_satellite')) {
                      next.killSatelliteCounter += 1;
                      if (next.killSatelliteCounter >= 8) {
                        next.killSatelliteCounter = 0;
                        const pulseDmg = 30 + next.threatLevel * 0.5;
                        next.enemies.forEach((oe) => {
                          if (oe.health > 0) oe.health -= pulseDmg;
                        });
                        next.screenshake = Math.min(next.screenshake + 5, 10);
                      }
                    }
                    if (next.vampiricBurstStacks > 0 && next.killCountSinceHeal >= 20) {
                      next.killCountSinceHeal = 0;
                      player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.25 * next.vampiricBurstStacks);
                    }
                    if (next.volatileDeath) {
                      const vgx = Math.floor(e.pos.x / cellSize);
                      const vgy = Math.floor(e.pos.y / cellSize);
                      for (let ox = -1; ox <= 1; ox++) {
                        for (let oy = -1; oy <= 1; oy++) {
                          const cell = grid.get(`${vgx + ox},${vgy + oy}`);
                          if (cell) {
                            cell.forEach((other) => {
                              if (other !== e && other.pos.distanceTo(e.pos) < 90) {
                                other.health -= 40;
                              }
                            });
                          }
                        }
                      }
                    }
                    
                    const rarityColor = e.enemyType === EnemyType.BOSS ? '#fbbf24' : e.color;
                    if (e.enemyType === EnemyType.BOSS) {
                      // Boss death: keep full explosion, it's a moment
                      next.particles.push(...createImplosion(e.pos, rarityColor, 4));
                      next.particles.push(...createExplosion(e.pos, e.color, 8, 1.5));
                    } else if (!isHeavy && !onRailsKill) {
                      if (Math.random() < 1 / chaosFactor) {
                        next.particles.push(...createExplosion(e.pos, e.color, Math.max(1, Math.floor(3 / chaosFactor)), 1.5));
                      }
                    }
                    // TANK/ELITE: no particles, just screenshake
                    next.experience += Math.floor(25 * getExperienceGainMultiplier(next));

                    // Reduced screenshake in high chaos
                    const shakeMult = 1 / Math.sqrt(chaosFactor);
                    next.screenshake = Math.min(next.screenshake + (e.enemyType === EnemyType.BOSS ? 8 : 2) * shakeMult, 15);

                    if (e.enemyType !== EnemyType.BOSS) {
                      // 1-frame flash only â€” not a value ramp
                      next.screenFlash = Math.max(next.screenFlash, 1);
                      next.runScrapEarned += scrapFromKill(next);
                    }
                    
                    const item = spawnItem(e.pos);
                    if (item) next.items.push(item);
                    
                    // Special death behaviors
                    if (e.enemyType === EnemyType.SPLINTER) {
                      for (let s = 0; s < 3; s++) {
                        const angle = (s / 3) * Math.PI * 2;
                        const offset = new Vector2(Math.cos(angle) * 30, Math.sin(angle) * 30);
                        next.enemies.push({
                          id: Math.random().toString(),
                          type: EntityType.ENEMY,
                          pos: e.pos.add(offset),
                          radius: 10,
                          health: 30 * (1 + next.stage * 0.2),
                          maxHealth: 30 * (1 + next.stage * 0.2),
                          speed: (3 + Math.random()) * (1 + next.stage * 0.05),
                          velocity: new Vector2(0, 0),
                          color: '#fb923c',
                          damage: 15 + next.stage * 3,
                          enemyType: EnemyType.SWARMER,
                        });
                      }
                    } else if (e.enemyType === EnemyType.NOVA) {
                      next.particles.push(...createExplosion(e.pos, '#f97316', 40, 2.5));
                      if (player.pos.distanceTo(e.pos) < 200) {
                        player.health -= 35;
                        next.screenshake = Math.max(next.screenshake, 20);
                        if (handleFatalDamage(next, player) && next.isGameOver) syncUi();
                      }
                    } else if (e.enemyType === EnemyType.SWARM_V2) {
                      // Nearby SWARM_V2 flee briefly when a packmate dies
                      next.enemies.forEach(other => {
                        if (other.enemyType === EnemyType.SWARM_V2 && other.pos.distanceTo(e.pos) < 280) {
                          other.aiState = 'retreat';
                          other.aiTimer = Math.max(other.aiTimer ?? 0, 55);
                        }
                      });
                    } else if (e.enemyType === EnemyType.FORTIFIED) {
                      // Always drops health
                      next.items.push({ ...(spawnItem(e.pos) ?? { id: Math.random().toString(), type: EntityType.ITEM, pos: e.pos.clone(), radius: 10, health: 1, maxHealth: 1, speed: 0, velocity: new Vector2(0, 0), color: '#4ade80' }), itemType: ItemType.HEALTH });
                      next.items.push({ ...(spawnItem(e.pos) ?? { id: Math.random().toString(), type: EntityType.ITEM, pos: new Vector2(e.pos.x + 30, e.pos.y), radius: 10, health: 1, maxHealth: 1, speed: 0, velocity: new Vector2(0, 0), color: '#4ade80' }), itemType: ItemType.ENERGY });
                    } else if (e.enemyType === EnemyType.TRACKER) {
                      // Drops extra XP
                      for (let x = 0; x < 3; x++) {
                        const xpOrb = spawnItem(new Vector2(e.pos.x + (Math.random()-0.5)*60, e.pos.y + (Math.random()-0.5)*60));
                        if (xpOrb) next.items.push({ ...xpOrb, itemType: ItemType.XP });
                      }
                    } else if (e.enemyType === EnemyType.REGENERATING) {
                      // Drops health orb on death
                      if (Math.random() < 0.6) {
                        const h = spawnItem(e.pos);
                        if (h) next.items.push({ ...h, itemType: ItemType.HEALTH });
                      }
                    } else if (e.enemyType === EnemyType.SHIELDED) {
                      // Drops shield item
                      if (Math.random() < 0.5) {
                        const s = spawnItem(e.pos);
                        if (s) next.items.push({ ...s, itemType: ItemType.SHIELD });
                      }
                    }
                    
                    if (e.type === EntityType.ENEMY) {
                      if (e.enemyType === EnemyType.BOSS) {
                        const defeatedBossId = next.activeBossId;
                        applyBossDefeatState(next);
                        next.lastBossDefeatedId = defeatedBossId;
                        next.bossVictoryBannerTimer = 150;
                        logBossLifecycle(next, 'boss-killed');
                        next.postBossBuffPick = true;
                        if (next.gameMode === 'NORMAL' && defeatedBossId) {
                          const bossLoot = rollBossLoot(next, defeatedBossId);
                          if (bossLoot) {
                            if (bossLoot.kind === 'vault_artifact') {
                              persistArtifactUnlock(bossLoot.lootId, true);
                              equipRunArtifact(next, bossLoot.lootId);
                            } else if (bossLoot.kind === 'companion') {
                              const cid = bossLoot.lootId as CompanionId;
                              persistCompanionUnlock(cid);
                              unlockCompanionMeta(cid);
                              applyLootDrop(next, bossLoot);
                            } else {
                              applyLootDrop(next, bossLoot);
                            }
                          }
                        }
                        let bossScrap = computeBossScrapBonus(next.stage);
                        if (countPassiveStacks(next.passives, 'salvage_radar') > 0) {
                          bossScrap += 25 * countPassiveStacks(next.passives, 'salvage_radar');
                        }
                        next.runScrapEarned += bossScrap;
                        if (countPassiveStacks(next.passives, 'regent_protocol') > 0) {
                          const heal = next.player.maxHealth * 0.25;
                          next.player.health = Math.min(
                            next.player.maxHealth,
                            next.player.health + heal
                          );
                          next.runScrapEarned += 15;
                        }
                        next.hitStop = 15;
                        next.screenshake = 10;
                        next.screenFlash = 5;

                        if (next.gameMode === 'CAMPAIGN' && next.campaignLevelId) {
                          markLevelComplete(next.campaignLevelId);
                        }

                        const choices = pickArtifactUnlockChoices(unlockedArtifactIdsRef.current, 2);
                        if (choices.length > 0) {
                          pendingArtifactUnlockRef.current = choices;
                          next.isPaused = true;
                        }

                        // Health / shield drops
                        const basicDrops = [ItemType.HEALTH, ItemType.SHIELD, ItemType.BOMB];
                        basicDrops.forEach(dt => {
                          const itm = spawnItem(e.pos);
                          if (itm) {
                            next.items.push({
                              ...itm,
                              itemType: dt,
                              pos: new Vector2(e.pos.x + (Math.random()-0.5)*200, e.pos.y + (Math.random()-0.5)*200)
                            });
                          }
                        });
                      } else if (
                        !next.bossActive &&
                        next.enemiesToKill > 0 &&
                        (next.gameMode === 'NORMAL' || next.gameMode === 'CAMPAIGN')
                      ) {
                        next.enemiesToKill--;
                        if (next.enemiesToKill <= 0 && next.gameMode === 'NORMAL' && next.bossArenaTransition <= 0) {
                          const upcoming = pickRandomBoss(next.stage, next.lastBossId);
                          next.lastBossId = upcoming.id;
                          beginBossWarp(next, upcoming);
                          syncUi();
                        }
                      }
                    }
                  }
                  collided = true;
                  break;
                }
              }
              if (collided) break;
            }
            if (collided) break;
          }
        }
      }

      next.enemies.forEach(e => {
        if (e.health <= 0) missionController.notifyEvent('enemy_killed', e.enemyType);
      });
      next.enemies = next.enemies.filter(e => e.health > 0);
      next.projectiles = next.projectiles.filter(p => p && p.health > 0 && p.pos);
      next.obstacles = next.obstacles.filter(o => o && o.pos && o.size);
      if (next.qualityLevel === 'low' && next.projectiles.length > 200) {
        next.projectiles.splice(0, next.projectiles.length - 200);
      }

      // Item Collection
      next.items = next.items.filter(item => {
        const d = player.pos.sub(item.pos);
        const dist = d.magnitude();
        const magnetR = item.itemType === ItemType.XP ? xpMagnetRange : effectiveMagnetRange;
        if (dist < magnetR) {
          const mult =
            item.itemType === ItemType.XP
              ? 14
              : next.buffs.magnet > 0
                ? 12
                : 6;
          item.pos = item.pos.add(d.normalize().mul(mult * dt));
        }

        if (checkCollision(player, item)) {
          missionController.notifyEvent('item_collected');
          if (item.itemType === ItemType.XP) {
            next.experience += Math.floor((item.damage ?? 25) * getExperienceGainMultiplier(next));
            playSfx('pickup');
          } else if (item.itemType === ItemType.HEALTH) {
            player.health = Math.min(player.maxHealth, player.health + 100);
            playSfx('pickup');
          } else if (item.itemType === ItemType.SHIELD) {
            grantExtraLife(next);
            playSfx('pickup');
            next.damageTexts.push({
              id: Math.random().toString(),
              pos: player.pos.clone(),
              text: 'EXTRA LIV!',
              life: 1.5,
              color: '#10b981'
            });
          } else if (item.itemType === ItemType.BOMB) {
            next.enemies.forEach(e => {
              e.health = 0;
              next.particles.push(...createExplosion(e.pos, e.color, 12, 1.2));
            });
            next.screenshake = 30;
            next.screenFlash = 15;
            next.damageTexts.push({
              id: Math.random().toString(),
              pos: player.pos.clone(),
              text: 'BOMBED!',
              life: 2.0,
              color: '#ffffff'
            });
          }
          next.particles.push(...createItemSparkle(item.pos, item.color, 12));
          return false;
        }
        return true;
      });

      if (next.bossArenaTransition <= 0) {
      for (const e of next.enemies) {
        if (checkCollision(player, e)) {
          if (next.gameMode === 'ON_RAILS' && next.rails) {
            if (
              isBossEntranceActive(next.rails) ||
              isRailsBossDeathActive(next.rails)
            ) {
              continue;
            }
            const bodyDmg =
              e.enemyType === EnemyType.BOSS
                ? railsBossTouchDamage(e)
                : railsEnemyBodyDamage(e);
            if (bodyDmg > 0) {
              const hits = e.enemyType === EnemyType.BOSS ? Math.min(3, bodyDmg >= 100 ? 3 : 1) : 1;
              for (let h = 0; h < hits; h++) {
                if (applyRailsPlayerHit(next, next.survivalTime)) {
                  playSfx('gameOver');
                  stopMusic();
                  if (next.isGameOver) syncUi();
                  break;
                }
              }
            }
            continue;
          }
          if (next.thornsDamage > 0) {
            e.health -= next.thornsDamage * 0.15 * dt;
          }
          if (next.dashIFrameTimer > 0 || next.playerIFrameTimer > 0) continue;

          player.health -= (2.0 + next.stage * 0.5) * dt;

          if (handleFatalDamage(next, player)) {
            if (next.isGameOver) {
              next.particles.push(...createExplosion(player.pos, player.color, 50));
              next.particles.push(...createExplosion(player.pos, '#ffffff', 20));
              syncUi();
            }
          }
        }
      }
      }

      if (prevFrameHealth > player.health) {
        if (next.gameMode !== 'ON_RAILS') {
          const dmg = prevFrameHealth - player.health;
          if (player.health <= 0) {
            applyPlayerDamageGlitch(next, player, 'fatal');
          } else if (dmg >= player.maxHealth * 0.04) {
            applyPlayerDamageGlitch(next, player, 'hit');
          } else {
            applyPlayerDamageGlitch(next, player, 'light');
          }
        }

        if (next.passives.includes('neon_blood')) {
          const stacks = countPassiveStacks(next.passives, 'neon_blood');
          const numMissiles = 8 + Math.max(0, stacks - 1) * 4;
          const missileSpeed = 12;
          for (let i = 0; i < numMissiles; i++) {
            const angle = Math.random() * Math.PI * 2;
            next.projectiles.push({
              id: Math.random().toString(),
              type: EntityType.PROJECTILE,
              pos: player.pos.clone(),
              radius: 6,
              health: 1,
              maxHealth: 1,
              speed: missileSpeed,
              velocity: new Vector2(Math.cos(angle) * missileSpeed, Math.sin(angle) * missileSpeed),
              color: '#ef4444',
              ownerId: 'player',
              damage: 60,
              bounceCount: 0,
              homing: true,
            });
          }
        }
        
        if (next.passives.includes('chrono_glitch')) {
           // Apply time slow to enemies but player moves normal/fast
           next.buffs.timeSlow = Math.max(next.buffs.timeSlow, 180); // 3 seconds freeze
           player.speed = player.baseSpeed * 2; // Super speed temporarily
           // Just modifying base speed will reset next frame so we need a buff
           next.buffs.rapidFire = Math.max(next.buffs.rapidFire, 180);
        }
      }

      if (next.screenshake > 0) next.screenshake *= Math.pow(0.9, dt);

      if (player.health / player.maxHealth < 0.25 && Math.random() < 0.002) {
        playSfx('lowHp');
      }

      if (next.score > next.wave * 4000) {
        next.wave += 1;
      }

      if (missionController.getStatus() === 'idle' && next.survivalTime > 1 && next.gameMode === 'NORMAL') {
        missionController.startMission(1);
      }
      missionController.update(dt * (16.67 / 1000));

      // Sync UI each frame during boss warp (overlay animation); otherwise throttle
      if (next.bossArenaTransition > 0) {
        syncUi();
      } else if (currentTime - lastUiSync > 250) {
        syncUi();
        lastUiSync = currentTime;
      }

      if (pendingArtifactUnlockRef.current) {
        const choices = pendingArtifactUnlockRef.current;
        pendingArtifactUnlockRef.current = null;
        window.setTimeout(() => {
          setArtifactUnlockChoices(choices);
          setShowArtifactUnlock(true);
        }, 0);
      }

      render(ctx, next, dimensions.width, dimensions.height, { isMobile: reducedEffectsRef.current });
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [screen, dimensions]);

  return (
    <div className={`fixed inset-0 bg-[#0c0c0e] overflow-hidden select-none touch-none ${screen === 'GAME' ? 'cursor-crosshair' : 'cursor-default'}`}>
      <AnimatePresence>
        {screen === 'MENU' && (
          <StartPage
            key={survivalMetaKey}
            onStartSurvival={() => {
              setHangarEntry('survival');
              setHangarInitialTab('ship');
              setScreen('HANGAR');
            }}
            onOpenHangar={() => {
              setHangarEntry('meta');
              setHangarInitialTab('ship');
              setScreen('HANGAR');
            }}
            onOpenUnlocks={() => {
              setHangarEntry('meta');
              setHangarInitialTab('progress');
              setScreen('HANGAR');
            }}
            hasPendingUnlocks={getPendingNewCount() > 0}
            onOnRails={() => setScreen('RAILS_SELECT')}
            onCampaign={() => setScreen('CAMPAIGN_SELECT')}
          />
        )}
        {screen === 'HANGAR' && (
          <HangarScreen
            key={`${hangarEntry}-${hangarInitialTab}`}
            entry={hangarEntry}
            initialTab={hangarInitialTab}
            equippedIds={equippedArtifactIds}
            unlockedArtifactIds={unlockedArtifactIds}
            metaScrap={metaScrap}
            newUnlockIds={newUnlockIds}
            onEquip={(slot, id) => {
              setEquippedArtifactIds((prev) => ({ ...prev, [slot]: id }));
            }}
            onViewVault={() => clearNewUnlockBadges({ artifacts: true })}
            onViewCompanions={() => clearNewUnlockBadges({ companions: true })}
            onConfirmLaunch={(shipId) => {
              setPendingLaunchShipId(shipId);
              setScreen('COMPANION_SELECT');
            }}
            onBack={() => setScreen('MENU')}
          />
        )}
        {screen === 'COMPANION_SELECT' && pendingLaunchShipId && (
          <CompanionSelectScreen
            onConfirm={(companionId) => {
              setPendingLaunchCompanionId(companionId);
              setScreen('PRE_RUN_SHOP');
            }}
            onBack={() => {
              setPendingLaunchShipId(null);
              setScreen('HANGAR');
            }}
          />
        )}
        {screen === 'PRE_RUN_SHOP' && pendingLaunchShipId && pendingLaunchCompanionId && (
          <PreRunShop
            metaScrap={metaScrap}
            shipId={pendingLaunchShipId}
            companionId={pendingLaunchCompanionId}
            onConfirm={(purchasedIds, totalSpent) => {
              if (totalSpent > 0 && !spendMetaScrap(totalSpent)) return;
              setMetaScrap(getMetaScrap());
              startGame(pendingLaunchShipId, pendingLaunchCompanionId, purchasedIds, totalSpent);
              setPendingLaunchShipId(null);
              setPendingLaunchCompanionId(null);
            }}
            onSkip={() => {
              startGame(pendingLaunchShipId, pendingLaunchCompanionId);
              setPendingLaunchShipId(null);
              setPendingLaunchCompanionId(null);
            }}
            onBack={() => {
              setScreen('COMPANION_SELECT');
            }}
          />
        )}
        {screen === 'CAMPAIGN_SELECT' && (
          <CampaignSelect
            onStartLevel={startCampaignLevel}
            onBack={() => setScreen('MENU')}
          />
        )}
        {screen === 'RAILS_SELECT' && (
          <RailsLevelSelect
            levels={RAILS_LEVELS}
            highScores={railsHighScores}
            onSelectLevel={(id) => startRailsGame(id)}
            onBack={() => setScreen('MENU')}
          />
        )}
      </AnimatePresence>


      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none" 
      />
      
      {/* High Speed Motion Blur Vignette */}
      {uiState && uiState.velocityMag > uiState.playerSpeed * 2.0 && (
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-150"
          style={{ opacity: Math.min((uiState.velocityMag - uiState.playerSpeed * 2.0) / 40, 0.15) }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(255,255,255,0.2)_100%)] mix-blend-screen" />
        </div>
      )}

      {screen === 'GAME' && devCheatsActive && (
        <DevCheatsHud toast={devCheatToast} />
      )}

      {/* General notifications */}
      {notification && (
        <div
          className="pointer-events-none fixed top-4 left-1/2 z-[100] -translate-x-1/2 max-w-[min(100vw-2rem,20rem)]"
          aria-live="polite"
        >
          <div className={`rounded-lg px-4 py-2 text-center font-medium shadow-lg ${
            notification.type === 'success' ? 'bg-green-900/90 text-green-100 ring-1 ring-green-500/40' :
            notification.type === 'warning' ? 'bg-yellow-900/90 text-yellow-100 ring-1 ring-yellow-500/40' :
            'bg-blue-900/90 text-blue-100 ring-1 ring-blue-500/40'
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      {screen === 'GAME' && uiState && uiState.bossArenaTransition > 0 && (
        <BossWarpOverlay
          bossId={uiState.activeBossId}
          bossArenaTransition={uiState.bossArenaTransition}
        />
      )}

      {screen === 'GAME' && uiState && (uiState.bossVictoryBannerTimer ?? 0) > 0 && (
        <BossVictoryBanner
          bossId={uiState.lastBossDefeatedId}
          timer={uiState.bossVictoryBannerTimer}
        />
      )}

      {uiState && uiState.health / uiState.maxHealth < 0.25 && (
        <motion.div 
          key="low-health-tint"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 bg-red-900/20 pointer-events-none z-10"
        />
      )}

      {screen === 'GAME' &&
        uiState?.gameMode === 'NORMAL' &&
        !uiState.isGameOver && (() => {
          const tier = getThreatTier(uiState.threatLevel);
          const threatVisual = getThreatVisualConfig(tier);
          return (
            <div
              className="absolute inset-0 pointer-events-none z-[8]"
              style={{
                background: `radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,${threatVisual.screenVignette}) 100%)`,
              }}
            />
          );
        })()}

      {screen === 'GAME' &&
        uiState?.gameMode === 'ON_RAILS' &&
        showTouchControls &&
        !showLevelUp &&
        !showArtifactUnlock && (
          <p className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-0 right-0 text-center text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400/50 pointer-events-none z-10">
            Dra = flytt · Klicka = skjut
          </p>
        )}

      {screen === 'GAME' &&
        uiState?.gameMode === 'ON_RAILS' &&
        gameStateRef.current?.rails &&
        !uiState.isGameOver && (() => {
          const gs = gameStateRef.current!;
          const rails = gs.rails!;
          const boss = gs.enemies.find(
            (e) => e.enemyType === EnemyType.BOSS && e.health > 0
          );
          return (
            <RailsHUD
              survivalTime={uiState.survivalTime}
              targetSeconds={rails.targetSeconds}
              outcome={rails.outcome}
              killCount={rails.killCount}
              score={uiState.score}
              health={uiState.health}
              maxHealth={uiState.maxHealth}
              hitTimer={gs.player.hitTimer}
              bossSpawned={rails.bossSpawned}
              bossCombatActive={rails.bossCombatActive}
              bossDefeated={rails.bossDefeated}
              bossId={boss?.railsBossId ?? null}
              bossHealth={boss?.health}
              bossMaxHealth={boss?.maxHealth}
              weakPointOpen={rails.weakPointOpen ?? boss?.railsWeakPointOpen}
              rapidFireUntil={rails.rapidFireUntil}
              slowTimeUntil={rails.slowTimeUntil}
              scoreMultUntil={rails.scoreMultUntil}
              invincibleUntil={rails.invincibleUntil}
              shieldBubbleHits={rails.shieldBubbleHits}
              megaBlastCharges={rails.megaBlastCharges}
            />
          );
        })()}

      {screen === 'GAME' && unlockToasts.length > 0 && (
        <UnlockToastStack
          toasts={unlockToasts}
          onDismiss={() => setUnlockToasts((prev) => prev.slice(1))}
        />
      )}

      {screen === 'GAME' && uiState && !showLevelUp && !showArtifactUnlock && (
        <motion.div key="game-ui-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
          <GameHUD 
            health={uiState.health} maxHealth={uiState.maxHealth}
            bossHealth={
              gameStateRef.current?.enemies.find(
                (e) => e.enemyType === EnemyType.BOSS && e.health > 0
              )?.health ?? 0
            }
            bossMaxHealth={
              gameStateRef.current?.enemies.find(
                (e) => e.enemyType === EnemyType.BOSS && e.health > 0
              )?.maxHealth ?? 0
            }
            companionId={uiState.companionId}
            companionLevel={uiState.companionLevel}
            companionHealth={uiState.companionHealth}
            companionMaxHealth={uiState.companionMaxHealth}
            companionAbilityCooldown={uiState.companionAbilityCooldown}
            companionAbilityCooldownMax={uiState.companionAbilityCooldownMax}
            companionAbilityName={uiState.companionAbilityName}
            companionEnergy={uiState.companionEnergy}
            survivalTime={uiState.survivalTime}
            threatLevel={uiState.threatLevel}
            augmentTier={getAugmentTier(gameStateRef.current?.passives.length ?? 0)}
            score={uiState.score} wave={uiState.wave}
            energy={uiState.energy} maxEnergy={uiState.maxEnergy}
            ultimateCharge={uiState.ultimateCharge}
            stage={uiState.stage} enemiesToKill={uiState.enemiesToKill} stageTransition={uiState.stageTransition} gameMode={uiState.gameMode}
            onOpenMenu={togglePause}
            onWeaponSwitch={(slot) => {
              const next = gameStateRef.current;
              if (next && next.activeWeaponSlot !== slot) {
                next.activeWeaponSlot = slot;
                playSfx('switchWeapon');
                syncUi();
              }
            }}
            cardTimer={uiState.stage === 1 ? 0 : uiState.cardTimer}
            cardInterval={
              uiState.stage === 1
                ? 1
                : getEffectiveCardIntervalSeconds(
                    uiState.stage,
                    uiState.survivalTime,
                    uiState.passives,
                    uiState.threatLevel,
                  )
            }
            activeWeaponSlot={uiState.activeWeaponSlot}
            equippedArtifacts={uiState.equippedArtifacts}
            threatGameState={uiState.gameMode === 'NORMAL' ? gameStateRef.current : null}
            buffs={uiState.buffs}
            extraLifeCharges={uiState.extraLifeCharges}
            bossArenaTransition={uiState.bossArenaTransition}
            bossActive={uiState.bossActive}
            isMobile={isMobile}
            compactHud={compactHud}
            landscapeHud={landscapeHud}
            viewportProfile={viewportProfile}
            selectedShip={uiState.selectedShip}
            isPaused={uiState.isPaused}
            survivalDifficultyLabel={
              uiState.gameMode === 'NORMAL' ? getSurvivalDifficultyLabelSv() : undefined
            }
            miniBossKillsThisRun={gameStateRef.current?.miniBossKillsThisRun ?? 0}
            miniBossActive={
              uiState.gameMode === 'NORMAL' &&
              !!gameStateRef.current?.enemies.some(
                (e) => e.miniBossId && e.health > 0
              )
            }
            miniBossDisplayName={(() => {
              const mb = gameStateRef.current?.enemies.find(
                (e) => e.miniBossId && e.health > 0
              );
              return mb?.miniBossId
                ? getMiniBossDef(mb.miniBossId as MiniBossId).displayName
                : '';
            })()}
            miniBossHealth={
              gameStateRef.current?.enemies.find(
                (e) => e.miniBossId && e.health > 0
              )?.health ?? 0
            }
            miniBossMaxHealth={
              gameStateRef.current?.enemies.find(
                (e) => e.miniBossId && e.health > 0
              )?.maxHealth ?? 0
            }
            miniBossAuraColor={(() => {
              const mb = gameStateRef.current?.enemies.find(
                (e) => e.miniBossId && e.health > 0
              );
              return mb?.miniBossId
                ? getMiniBossDef(mb.miniBossId as MiniBossId).auraColor
                : '#a855f7';
            })()}
          />
          {gameStateRef.current && uiState.gameMode === 'NORMAL' && (
            <SynergyBar
              lines={getActiveSynergies(gameStateRef.current)}
              layout={getSynergyBarLayout(viewportProfile)}
            />
          )}

          {(gameStateRef.current?.miniBossIncomingTimer ?? 0) > 0 && (
            <div
              className="absolute left-1/2 top-[22%] z-25 -translate-x-1/2 pointer-events-none text-center"
              style={{
                color: gameStateRef.current?.miniBossIncomingColor ?? '#c084fc',
                textShadow: `0 0 12px ${gameStateRef.current?.miniBossIncomingColor ?? '#c084fc'}55`,
              }}
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">
                Miniboss i denna våg
              </p>
              <p className="text-sm font-bold uppercase tracking-wide">
                {gameStateRef.current?.miniBossIncomingText ?? ''}
              </p>
            </div>
          )}

          {(gameStateRef.current?.miniBossSpawnPopupTimer ?? 0) > 0 && (
            <div
              className="absolute left-1/2 top-[28%] z-30 -translate-x-1/2 pointer-events-none text-center animate-pulse"
              style={{
                color: gameStateRef.current?.miniBossSpawnPopupColor ?? '#c084fc',
                textShadow: `0 0 16px ${gameStateRef.current?.miniBossSpawnPopupColor ?? '#c084fc'}`,
              }}
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-white/70">
                {gameStateRef.current?.miniBossSpawnPopupSubtext ?? 'Miniboss'}
              </p>
              <p className="text-base font-bold tracking-wide uppercase">
                {gameStateRef.current?.miniBossSpawnPopupText ?? ''}
              </p>
            </div>
          )}

          {(gameStateRef.current?.miniBossPopupTimer ?? 0) > 0 && (
            <div
              className="absolute left-1/2 top-[38%] z-30 -translate-x-1/2 pointer-events-none text-center"
              style={{
                color: gameStateRef.current?.miniBossPopupColor ?? '#c084fc',
                textShadow: `0 0 12px ${gameStateRef.current?.miniBossPopupColor ?? '#c084fc'}`,
              }}
            >
              <p className="text-sm font-bold tracking-widest uppercase">
                {gameStateRef.current?.miniBossPopupText ?? 'MINIBOSS BESEGRAD'}
              </p>
              {gameStateRef.current?.miniBossPopupSubtext && (
                <p className="mt-1 text-xs font-semibold text-white/90">
                  {gameStateRef.current.miniBossPopupSubtext}
                </p>
              )}
            </div>
          )}

          {showTouchControls && uiState?.gameMode !== 'ON_RAILS' && (() => {
            const joystickSize = getJoystickSize(viewportProfile);
            const touchSize = getTouchActionSize(viewportProfile);
            const touchBtnClass =
              touchSize === 'compact'
                ? 'min-h-12 min-w-12 border-white/20'
                : touchSize === 'medium'
                  ? 'w-14 h-14 border-white/30'
                  : 'w-14 h-14 md:w-16 md:h-16 border-white/30';
            const touchIconSize = touchSize === 'compact' ? 24 : touchSize === 'medium' ? 28 : 32;
            const safeCorner = compactHud || landscapeHud;
            const moveCornerClass =
              mobileLayout === 'LEFT_HANDED'
                ? safeCorner
                  ? 'right-[max(0.5rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))]'
                  : 'bottom-6 right-6 md:bottom-10 md:right-10'
                : safeCorner
                  ? 'left-[max(0.5rem,env(safe-area-inset-left))] bottom-[max(0.75rem,env(safe-area-inset-bottom))]'
                  : 'bottom-6 left-6 md:bottom-10 md:left-10';
            const aimCornerClass =
              mobileLayout === 'LEFT_HANDED'
                ? safeCorner
                  ? 'left-[max(0.5rem,env(safe-area-inset-left))] bottom-[max(0.75rem,env(safe-area-inset-bottom))]'
                  : 'bottom-6 left-6 md:bottom-10 md:left-10'
                : safeCorner
                  ? 'right-[max(0.5rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))]'
                  : 'bottom-6 right-6 md:bottom-10 md:right-10';
            const actionStackClass = landscapeHud ? 'flex flex-col gap-2 mb-1' : 'flex gap-3 mb-2';

            return (
              <>
                <motion.div className={`absolute flex flex-col items-center gap-2 pointer-events-none ${moveCornerClass}`}>
                  <div className={`${actionStackClass} pointer-events-auto`}>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        controls.current.wantUltimate = true;
                      }}
                      className={`rounded-full border flex items-center justify-center text-white transition-all duration-300 shadow-xl touch-manipulation backdrop-blur-xl ${touchBtnClass} ${
                        uiState && uiState.ultimateCharge >= 100
                          ? 'bg-fuchsia-600/80 border-white/50 shadow-[0_0_15px_rgba(217,70,239,0.5)] animate-pulse'
                          : 'bg-black/60 border-white/10 opacity-50 grayscale'
                      }`}
                      aria-label="Ultimate"
                    >
                      <Zap size={touchIconSize} fill={uiState && uiState.ultimateCharge >= 100 ? 'white' : 'rgba(255,255,255,0.2)'} />
                    </motion.button>
                    <motion.div className="relative pointer-events-auto">
                      {uiState && uiState.energy < 30 && (
                        <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse pointer-events-none" />
                      )}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          controls.current.wantDash = true;
                        }}
                        className={`rounded-full border flex items-center justify-center text-white transition-all duration-300 shadow-xl touch-manipulation backdrop-blur-xl ${touchBtnClass} ${
                          uiState && uiState.energy >= 30
                            ? 'bg-white/10 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            : 'bg-black/60 border-white/10 opacity-50 grayscale'
                        }`}
                        aria-label="Dash"
                      >
                        <Zap size={touchIconSize} fill={uiState && uiState.energy >= 30 ? 'white' : 'rgba(255,255,255,0.2)'} />
                      </motion.button>
                    </motion.div>
                  </div>
                  <Joystick
                    size={joystickSize}
                    label="move"
                    onMove={(dir) => {
                      controls.current.move = dir;
                    }}
                    onTap={() => {
                      controls.current.wantDash = true;
                    }}
                    onEnd={() => {
                      controls.current.move = { x: 0, y: 0 };
                    }}
                  />
                </motion.div>
                <motion.div className={`absolute flex flex-col items-center gap-2 pointer-events-none ${aimCornerClass}`}>
                  <motion.div className="flex gap-2 mb-1 pointer-events-auto">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const slots: ('CANNON_A' | 'CANNON_B')[] = ['CANNON_A', 'CANNON_B'];
                        if (!uiState) return;
                        const currentIdx = slots.indexOf(uiState.activeWeaponSlot);
                        const nextSlot = slots[(currentIdx + 1) % slots.length];
                        if (gameStateRef.current) {
                          gameStateRef.current.activeWeaponSlot = nextSlot;
                        }
                        playSfx('switchWeapon');
                        syncUi();
                      }}
                      className="relative rounded-full border-2 flex flex-col items-center justify-center text-white transition-all shadow-lg touch-manipulation min-h-12 min-w-12 bg-cyan-950/60 border-cyan-500"
                      aria-label="Swap Weapon"
                    >
                      {uiState?.activeWeaponSlot === 'CANNON_A' && <Swords size={20} className="text-cyan-400" />}
                      {uiState?.activeWeaponSlot === 'CANNON_B' && <Flame size={20} className="text-cyan-400" />}
                      <span className="text-[7px] font-mono font-black mt-0.5 text-cyan-200">
                        WPN.{(uiState ? ['CANNON_A', 'CANNON_B'].indexOf(uiState.activeWeaponSlot) + 1 : 1).toString().padStart(2, '0')}
                      </span>
                      <motion.div className="absolute -top-1 -right-1 bg-cyan-900 rounded-full border border-cyan-400/50 p-1">
                        <RotateCcw size={10} className="text-cyan-400" />
                      </motion.div>
                    </motion.button>
                  </motion.div>
                  <Joystick
                    size={joystickSize}
                    label="aim"
                    color="bg-red-500/10"
                    onMove={(dir) => {
                      controls.current.aim = dir;
                      controls.current.isFiring = true;
                    }}
                    onEnd={() => {
                      controls.current.isFiring = false;
                    }}
                  />
                </motion.div>
              </>
            );
          })()}

        </motion.div>
      )}

      {screen === 'GAME' && stageIntroStage !== null && (
        <StageIntroOverlay
          key={stageIntroKey}
          stage={stageIntroStage}
          onComplete={clearStageIntro}
        />
      )}


      <BuffCardPicker
        show={showLevelUp && screen === 'GAME'}
        choices={currentCardChoices}
        buffs={currentBuffs}
        passives={gameStateRef.current?.passives ?? []}
        onSelect={handleLevelUpChoice}
        isMobile={isMobile}
        viewportProfile={viewportProfile}
      />

      {screen === 'GAME' && (
        <ArtifactAcquireOverlay event={artifactAcquirePopup} />
      )}

      <ArtifactUnlockPicker
        show={showArtifactUnlock && screen === 'GAME'}
        choices={artifactUnlockChoices}
        unlocksRemaining={2 - (gameStateRef.current?.runArtifactUnlocks ?? 0)}
        onSelect={handleArtifactUnlockChoice}
        isMobile={isMobile}
      />

      <AnimatePresence>
        {isPauseMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">System Paused</h2>
              <p className="text-blue-400 font-mono text-[10px] md:text-sm tracking-widest mt-2 uppercase">Neural Link Suspended</p>
              {uiState?.gameMode === 'NORMAL' && gameStateRef.current && (
                <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                  <span className="px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-300/90 bg-cyan-500/10">
                    {getSurvivalDifficultyLabelSv()}
                  </span>
                  <span className="px-3 py-1 rounded-full border border-violet-500/30 text-violet-300/90 bg-violet-500/10">
                    Miniboss {gameStateRef.current.miniBossKillsThisRun ?? 0}
                  </span>
                  <span className="px-3 py-1 rounded-full border border-white/15 text-white/70 bg-white/5">
                    S{gameStateRef.current.stage} · V{gameStateRef.current.wave}
                  </span>
                </div>
              )}
            </div>
            
            <motion.div className="flex flex-col gap-4 w-full max-w-sm md:max-w-md pointer-events-auto px-4">
              <label className="text-white/50 text-[10px] uppercase font-bold tracking-widest">SFX</label>
              <input type="range" min={0} max={100} value={Math.round(sfxVol * 100)} onChange={(e) => { const v = Number(e.target.value) / 100; setSfxVol(v); setSfxVolume(v); }} className="w-full accent-blue-500" />
              <label className="flex items-center gap-2 text-white text-sm">
                <input type="checkbox" checked={sfxMuted} onChange={(e) => { setSfxMutedState(e.target.checked); setSfxMuted(e.target.checked); }} />
                Mute SFX
              </label>
              <label className="text-white/50 text-[10px] uppercase font-bold tracking-widest mt-2">Music</label>
              <input type="range" min={0} max={100} value={Math.round(musicVol * 100)} onChange={(e) => { const v = Number(e.target.value) / 100; setMusicVol(v); setMusicVolume(v); }} className="w-full accent-fuchsia-500" />
              <label className="flex items-center gap-2 text-white text-sm">
                <input type="checkbox" checked={musicMuted} onChange={(e) => { setMusicMutedState(e.target.checked); setMusicMuted(e.target.checked); if (e.target.checked) stopMusic(); else { resumeAudio(); startMusic(); } }} />
                Mute music
              </label>

              {showTouchControls && (
                <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl border border-white/10 mt-2">
                  <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1">Mobile Options</span>
                  <label className="flex items-center gap-2 text-white text-sm">
                    <input type="checkbox" checked={mobileLayout === 'LEFT_HANDED'} onChange={(e) => setMobileLayout(e.target.checked ? 'LEFT_HANDED' : 'RIGHT_HANDED')} />
                    Left-Handed Layout
                  </label>
                  <label className="flex items-center gap-2 text-white text-sm">
                    <input type="checkbox" checked={hapticsEnabled} onChange={(e) => setHapticsEnabled(e.target.checked)} />
                    Haptic Feedback
                  </label>
                  <label className="text-white text-sm mt-1">
                    Joystick Dead Zone: {joystickDeadZone.toFixed(2)}
                    <input type="range" min={0} max={0.5} step={0.05} value={joystickDeadZone} onChange={(e) => setJoystickDeadZone(Number(e.target.value))} className="w-full mt-1 accent-cyan-500" />
                  </label>
                </div>
              )}

              <button 
                onClick={togglePause}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 transition-all mt-2"
              >
                <Play size={24} fill="white" /> RESUME MISSION
              </button>
              <button 
                onClick={() => {
                  stopMusic();
                  gameStateRef.current = null;
                  setScreen('MENU');
                  setIsPauseMenuOpen(false);
                }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors pointer-events-auto"
              >
                <RotateCcw size={24} /> ABORT TO MENU
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {uiState?.isGameOver && gameStateRef.current ? (
        gameStateRef.current.gameMode === 'ON_RAILS' &&
        gameStateRef.current.rails?.outcome === 'cleared' ? (
          <RailsVictoryScreen
            title={
              getRailsLevel(gameStateRef.current.rails!.levelId)?.ui.clearedTitle ??
              'SECTOR CLEARED!'
            }
            time={gameStateRef.current.survivalTime}
            kills={gameStateRef.current.rails!.killCount}
            score={gameStateRef.current.score}
            medal={getRailsMedal(
              gameStateRef.current.score,
              gameStateRef.current.rails!.killCount
            )}
            hasNextLevel={
              !!getNextRailsLevelId(gameStateRef.current.rails!.levelId)
            }
            onNextLevel={() => {
              const levelId = gameStateRef.current?.rails?.levelId;
              const nextId = levelId ? getNextRailsLevelId(levelId) : null;
              gameStateRef.current = null;
              if (nextId) {
                startRailsGame(nextId);
              } else {
                setScreen('RAILS_SELECT');
              }
            }}
            onLevelSelect={() => {
              const levelId = gameStateRef.current?.rails?.levelId;
              if (levelId && gameStateRef.current) {
                saveRailsHighScore(levelId, gameStateRef.current.score);
                setRailsHighScores(getRailsHighScores());
              }
              gameStateRef.current = null;
              setScreen('RAILS_SELECT');
            }}
          />
        ) : (
          <RunSummary
            state={gameStateRef.current}
            unlockedCount={unlockedArtifactIds.length}
            totalArtifacts={Object.keys(ARTIFACTS).length}
            lockedIds={Object.keys(ARTIFACTS).filter((id) => !unlockedArtifactIds.includes(id))}
            scrapEarned={lastRunScrapEarned}
            metaScrapTotal={metaScrap}
            runUnlocks={getRunUnlocks()}
            newHighScoreThisRun={lastRunPersonalBest.score}
            newLongestThisRun={lastRunPersonalBest.time}
            personalBestScore={getSurvivalHighScore()}
            personalBestTime={getLongestSurvivalSeconds()}
            victory={uiState.stage > 25}
            onRestart={restartAfterRun}
            onVault={() => {
              gameStateRef.current = null;
              syncMetaUnlockState();
              setHangarEntry('meta');
              setHangarInitialTab('vault');
              setScreen('HANGAR');
            }}
          />
        )
      ) : null}
    </div>
  );
}
