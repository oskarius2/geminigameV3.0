import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Play, RotateCcw, Shield, Swords, Zap, Trophy, Target } from 'lucide-react';
import { StartPage } from './game/controls/StartPage';
import { Joystick } from './game/controls/Joystick';
import { GameHUD } from './game/controls/GameHUD';
import { GearSystem } from './game/controls/GearSystem';
import { BuffCardPicker } from './game/controls/BuffCardPicker';
import { ArtifactUnlockPicker } from './game/controls/ArtifactUnlockPicker';
import { ArtifactInventory } from './game/controls/ArtifactInventory';
import {
  getViewportSnapshot,
  subscribeViewport,
  getJoystickSize,
  getTouchActionSize,
  getBuffChipsTopClass,
  getSynergyBarLayout,
  type ViewportProfile,
} from './game/controls/mobileLayout';
import { getAugmentTier, getTierModifiers } from './game/balance/augmentTiers';
import { computeThreatLevel } from './game/balance/threat';
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
import { BOSS_DEFINITIONS } from './game/content/bosses';
import {
  applyBossArenaWarp,
  beginBossWarp,
  BOSS_WARP_SWAP_AT,
  pickRandomBoss,
  restoreMainWorldAfterBoss,
} from './game/content/bossArenas';
import { countPassiveStacks } from './game/buffs/pickBuffs';
import { addMetaScrap, getMetaScrap, spendMetaScrap } from './lib/metaStore';
import { playSfx, loadSfxMuted, setSfxMuted, setSfxVolume, getSfxVolume, resumeAudio } from './game/audio/sfx';
import { startMusic, stopMusic, duckMusic, loadMusicSettings, setMusicMuted, setMusicVolume } from './game/audio/music';
import { spawnDamageNumber } from './game/juice/damageNumbers';
import { triggerHitFeedback, shootSfxForSlot, isBossHit, GAMEPLAY_HITSTOP_THRESHOLD } from './game/juice/hitFeedback';
import { getActiveSynergies, countTag } from './game/buffs/synergies';
import { SynergyBar } from './game/controls/SynergyBar';
import { RunSummary } from './game/controls/RunSummary';
import { BossWarpOverlay } from './game/controls/BossWarpOverlay';
import { PASSIVE_BUFFS } from './game/content/buffs';
import { getCampaignLevel, pickCampaignEnemyType, getSpawnPosAlongPath, samplePath, samplePathTangent, PORTAL_TRIGGER_RADIUS } from './game/content/campaignLevels';
import { CampaignSelect, markLevelComplete } from './game/controls/CampaignSelect';
import { BuffRarity } from './game/types';
import { Vector2 } from './game/utils/vector';
import { Artifact, ArtifactSlot, PassiveBuff, EntityType, GameState, ItemType, EnemyType, Entity, Hazard, RandomEvent } from './game/types';
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
  getCardIntervalSeconds,
} from './game/Logic';
import { applyBuff, hasPermanentOverdrive, hasPermanentPiercing, hasPermanentRapidFire } from './game/buffs/applyBuff';
import { applyHangarLoadout } from './game/runSetup';
import { pickArtifactUnlockChoices } from './game/meta/artifactUnlock';
import { render } from './game/Renderer';

import { RandomEventDialog } from './game/controls/RandomEventDialog';
import { TRAITS, handleEventChoice, pickRandomTraits, RANDOM_EVENTS } from './game/Logic';
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
    pendingEvent: RandomEvent | null;
    extraLifeCharges: number;
  } | null>(null);

  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [screen, setScreen] = useState<'MENU' | 'CAMPAIGN_SELECT' | 'GAME'>('MENU');
  const [isGearOpen, setIsGearOpen] = useState(false);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  
  // Artifact Persistence
  const [unlockedArtifactIds, setUnlockedArtifactIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unlockedArtifacts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // corrupted save
    }
    return ['iron_sights', 'backup_cannon', 'basic_hull', 'basic_thrusters'];
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
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [newUnlockIds, setNewUnlockIds] = useState<string[]>([]);
  
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
    localStorage.setItem('unlockedArtifacts', JSON.stringify(unlockedArtifactIds));
  }, [unlockedArtifactIds]);

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

  useEffect(() => {
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

  const openBuffPicker = (state: GameState) => {
    state.isPaused = true;
    setCurrentBuffs(pickBuffs(state, 3));
    setShowLevelUp(true);
    playSfx('cardFlip');
    duckMusic(0.3);
  };

  const startGame = () => {
    const initialState = INITIAL_STATE(dimensions.width, dimensions.height);
    
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
    initialState.threatLevel = computeThreatLevel(initialState);
    initialState.threatPeak = initialState.threatLevel;
    initialState.runStartTime = Date.now();
    initialState.runArtifactsUnlockedThisRun = [];
    initialState.cardTimer = 15;
    initialState.spawnRampTimer = 5;
    initialState.activeBossId = null;
    initialState.bossArenaTransition = 0;
    initialState.bossArenaSwapped = false;
    initialState.inBossArena = false;
    initialState.mainWorldSnapshot = null;
    initialState.lastBossId = null;
    initialState.pendingArenaRestore = false;
    initialState.runScrapEarned = 0;
    initialState.postBossBuffPick = false;
    gameStateRef.current = initialState;
    setLastRunScrapEarned(0);
    setNewUnlockIds([]);
    setShowArtifactUnlock(false);
    setArtifactUnlockChoices([]);
    syncUi();
    setScreen('GAME');
    setIsPauseMenuOpen(false);
    resumeAudio();
    if (!musicMuted) startMusic();

    // Prepare traits for the run AFTER this one
    setNextRunTraits(pickRandomTraits());
  };

  const startCampaignLevel = (levelId: string) => {
    const level = getCampaignLevel(levelId);
    if (!level) return;
    const initialState = INITIAL_STATE(dimensions.width, dimensions.height);
    applyHangarLoadout(initialState, equippedArtifactIds);
    initialState.gameMode = 'CAMPAIGN';
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
      pendingEvent: state.pendingEvent,
      extraLifeCharges: state.extraLifeCharges,
      passives: [...state.passives],
    });
  };

  const handleFatalDamage = (next: GameState, player: Entity): boolean => {
    if (player.health > 0) return false;
    if (next.isGameOver) return false;
    if (tryTriggerExtraLife(next, player)) return true;
    next.isGameOver = true;
    const banked = next.runScrapEarned + computeRunEndScrap(next);
    if (banked > 0) {
      addMetaScrap(banked);
      setMetaScrap(getMetaScrap());
    }
    setLastRunScrapEarned(banked);
    playSfx('gameOver');
    stopMusic();
    next.screenshake = 10;
    return true;
  };

  const handleLevelUpChoice = (choiceId: string) => {
    const next = gameStateRef.current;
    if (!next) return;
    applyBuff(next, choiceId);
    const def = PASSIVE_BUFFS[choiceId];
    if (def?.exclusive || def?.rarity === BuffRarity.EXCLUSIVE) playSfx('exclusive');
    else playSfx('augment');
    setShowLevelUp(false);
    next.isPaused = false;
    controls.current.isFiring = false;
    duckMusic(1);
    syncUi();
  };

  const handleArtifactUnlockChoice = (artifactId: string) => {
    if (!unlockedArtifactIds.includes(artifactId)) {
      setUnlockedArtifactIds((prev) => [...prev, artifactId]);
      setNewUnlockIds((prev) => [...prev, artifactId]);
    }
    const next = gameStateRef.current;
    if (next) {
      next.runArtifactUnlocks += 1;
      if (!next.runArtifactsUnlockedThisRun.includes(artifactId)) {
        next.runArtifactsUnlockedThisRun.push(artifactId);
      }
      next.isPaused = false;
      playSfx('artifact');
    }
    setShowArtifactUnlock(false);
    setArtifactUnlockChoices([]);
    syncUi();
  };

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
      controls.current.keys.add(e.key.toLowerCase());
      if (e.key === ' ') controls.current.wantDash = true;
      if (e.key.toLowerCase() === 'e') controls.current.wantUltimate = true;
      if (e.key === 'p' || e.key === 'Escape') togglePause();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      controls.current.keys.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      controls.current.mousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Prevent firing when clicking on buttons or interactive UI
      if (e.button === 0) {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        controls.current.isFiring = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) controls.current.isFiring = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [screen]);

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

      if (!next || next.isPaused || showLevelUpRef.current || showArtifactUnlockRef.current) {
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

      // Unify Spatial Partitioning (Grid) - Build once per frame
      const grid = new Map<string, Entity[]>();
      const cellSize = 150;
      for (let i = 0; i < next.enemies.length; i++) {
        const e = next.enemies[i];
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

      // Random events (survival)
      if (next.gameMode === 'NORMAL') {
        next.eventTimer -= dt;
        if (next.eventTimer <= 0) {
          const eventIds = Object.keys(RANDOM_EVENTS);
          const pickId = eventIds[Math.floor(Math.random() * eventIds.length)];
          next.pendingEvent = RANDOM_EVENTS[pickId];
          next.isPaused = true;
          next.eventTimer = 2000 + Math.random() * 1500;
          syncUi();
        }
      }

      if (next.gameMode === 'NORMAL' && !next.isPaused) {
        next.survivalTime += dt * (16.67 / 1000);
        next.threatLevel = computeThreatLevel(next);
        next.threatPeak = Math.max(next.threatPeak, next.threatLevel);
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

      // Card Timer Logic
      next.cardTimer -= dt * (16.67 / 1000); // Decr in seconds
      if (next.cardTimer <= 0) {
        next.cardTimer = getCardIntervalSeconds(next.stage, next.survivalTime, next.passives.length);
        openBuffPicker(next);
        playSfx('levelUp');
        next.screenshake = 5;
        syncUi();
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

      if (next.screenFlash > 0) next.screenFlash -= dt;
      
      const effectiveMagnetRange = next.buffs.magnet > 0 ? 800 : next.magnetRange;
      const xpMagnetRange = 120;

      // Passive Regen
      if (next.regen > 0 && player.health < player.maxHealth) {
        player.health = Math.min(player.maxHealth, player.health + (next.regen / 60) * dt);
      }

      // Passive Health Regen (very slow - base)
      if (player.health < player.maxHealth) {
        player.health = Math.min(player.maxHealth, player.health + 0.01 * dt);
      }
      
      const prevFrameHealth = player.health;

      // Process Input: Keyboard takes priority over Joystick
      let kx = 0;
      let ky = 0;
      const warpLocked = next.bossArenaTransition > 0;

      if (controls.current.keys.has('w')) ky -= 1;
      if (controls.current.keys.has('s')) ky += 1;
      if (controls.current.keys.has('a')) kx -= 1;
      if (controls.current.keys.has('d')) kx += 1;

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
        if (aimDir.magnitude() < 5) aimDir = new Vector2(1, 0); // Default if mouse is on player
        else aimDir = aimDir.normalize();
      }
      
      // Dash Initiation
      const dashCost = Math.max(12, 30 - next.dashEnergyDiscount);
      if (
        !warpLocked &&
        next.gameMode !== 'CAMPAIGN' &&
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
      } else if (warpLocked) {
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

      player.pos = player.pos.add(player.velocity);
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
      if (next.multiShotFireRatePenalty < 1) fireInterval /= next.multiShotFireRatePenalty;
      if (next.bulletStormMult > 1) fireInterval /= next.bulletStormMult;
      
      if (controls.current.isFiring && currentTime - lastFireTime.current > fireInterval) {
        lastFireTime.current = currentTime;

        if (countTag(next, 'damage') >= 2 && countTag(next, 'fire') >= 1) {
          next.nextShotBurns = true;
        }

        let numProjectiles = next.multiShot || 1;
        const spread = Math.min(Math.PI / 4, 0.1 * numProjectiles); // Dynamic spread
        
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
        let pColor = '#22d3ee'; // Sharp Cyan
        let pPiercing = next.bounceCount;
        if (hasPermanentPiercing(next) || next.hasInfinityPierce) pPiercing += 1000;

        if (next.activeWeaponSlot === 'CANNON_B') {
          projectileSpeed = 7.5;
          pRadius = 12; // Bigger rockets
          pColor = '#10b981'; // Emerald Green for contrast
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

          const finalDamage = Math.floor(baseDmg * damageMult);

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
      updateEnemies(next, dt);
      next.particles = updateParticles(next.particles, dt, next.player.pos);
      const PARTICLE_CAP = next.qualityLevel === 'low' ? 20 : 30;
      if (next.particles.length > PARTICLE_CAP) {
        next.particles.splice(0, next.particles.length - PARTICLE_CAP);
      }

      if (next.pendingArenaRestore) {
        restoreMainWorldAfterBoss(next, dimensions.width, dimensions.height);
        next.pendingArenaRestore = false;
        next.enemies = [];
        next.projectiles = [];
        next.items = [];
        next.spawnRampTimer = 0;
        next.screenFlash = Math.max(next.screenFlash, 15);
        playSfx('augment');
      }

      if (next.bossArenaTransition > 0) {
        next.bossArenaTransition -= dt;
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

      // Stage Transition Logic
      if (next.gameMode === 'NORMAL') {
        if (next.stageTransition > 0) {
          next.stageTransition -= dt;
          if (next.stageTransition <= 0) {
            // Advance Stage
          next.stage++;
          next.cardTimer = getCardIntervalSeconds(next.stage, next.survivalTime, next.passives.length);
          next.enemiesToKill = getStageQuota(next.stage);
          next.bossActive = false;
          next.activeBossId = null;
          next.bossArenaTransition = 0;
          next.bossArenaSwapped = false;
          next.inBossArena = false;
          next.mainWorldSnapshot = null;
          next.obstacles = generateObstaclesForStage(
            next.stage,
            next.world.width,
            next.world.height
          );
          next.runScrapEarned += computeStageClearScrap(next.stage - 1);
          next.enemies = [];
          next.projectiles = [];
          next.items = [];
          next.spawnRampTimer = 3.0;
          next.player.health = Math.min(
            next.player.maxHealth,
            player.health + next.player.maxHealth * 0.3
          );
          next.screenFlash = 20;
          openBuffPicker(next);
          playSfx('augment');
        }
      }
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
      } else if (next.stageTransition <= 0 && next.bossArenaTransition <= 0) {
        // Hazard spawning
        if (Math.random() < 0.002) {
          next.hazards.push(spawnHazard(next));
        }

        if (next.spawnRampTimer > 0) next.spawnRampTimer -= dt;

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
        if (next.bossActive || next.gameMode === 'SURVIVAL') {
          levelProgress = Math.min(1, levelProgress + next.survivalTime / 600);
        }

        const isRamping = next.spawnRampTimer > 0;

        const maxEnemies = getMaxAliveEnemies({
          levelProgress,
          threatFactor,
          isRamping,
          mobile,
        });

        const spawnChance =
          getSpawnChance({
            levelProgress,
            threatFactor,
            survivalTime: next.survivalTime,
            mobile,
          }) * tierMods.spawnChanceMult;

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
          if (entity) next.enemies.push(entity);
        };

        if (!next.bossActive && next.enemiesToKill > 0 && next.enemies.length < maxEnemies) {
          if (Math.random() < spawnChance) {
            pushSpawn(spawnOne());
          }

          if (!isRamping) {
            if (spawnChance > 0.15 && Math.random() < spawnChance * 0.5 && next.enemies.length < maxEnemies) {
              pushSpawn(spawnOne());
            }
            if (spawnChance > 0.3 && Math.random() < spawnChance * 0.4 && next.enemies.length < maxEnemies) {
              pushSpawn(spawnOne());
              pushSpawn(spawnOne());
            }
            if (!campaignLevel && levelProgress > 0.6 && Math.random() < 0.03 && next.enemies.length < maxEnemies) {
              const burstCount = Math.min(2, 1 + Math.floor(threatFactor));
              for (let h = 0; h < burstCount; h++) {
                if (next.enemies.length >= maxEnemies) break;
                pushSpawn(spawnOne());
              }
            }
          }
        } else if (next.bossActive && next.enemies.filter(e => e.enemyType === EnemyType.BOSS).length === 0) {
          pushSpawn(spawnEnemy(next));
        } else if (next.bossActive && next.enemies.length < maxEnemies && Math.random() < Math.min(0.4, spawnChance * 0.5)) {
          pushSpawn(spawnEnemy(next));
        }

        // Hard trim: remove oldest non-boss enemies if over absolute limit
        const HARD_CAP = mobile ? 60 : 90;
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
          p.health = 0;
          continue;
        }

        // Enemy projectiles vs Player
        if (p.ownerId !== 'player') {
          if (checkCollision(p, player)) {
            if (next.dashIFrameTimer > 0 || next.playerIFrameTimer > 0) {
              if (next.qualityLevel === 'high') next.particles.push(...createImpact(player.pos, '#ffffff', 2));
              p.health = 0;
              continue;
            }
            const takenDmg = (p.damage || 10) * 1.5;
            player.health -= takenDmg;
            player.hitTimer = 3;
            next.playerIFrameTimer = 45;
            next.screenFlash = 4;
            next.screenshake = Math.min(next.screenshake + 1, 4);
            next.particles.push(...createImpact(player.pos, '#ffffff', 5));

            if (handleFatalDamage(next, player)) {
              if (next.isGameOver) syncUi();
            }
            p.health = 0;
            continue;
          }
        }

        // Player projectiles vs Enemies
        if (p.ownerId === 'player') {
          const gx = Math.floor(p.pos.x / 150);
          const gy = Math.floor(p.pos.y / 150);
          
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
                  if (e.damageResist && e.damageResist > 0) damage *= 1 - e.damageResist;
                  if (e.health < e.maxHealth * 0.5 && next.hunterMarkBonus > 0) {
                    damage *= 1 + next.hunterMarkBonus;
                  }
                  if (next.frostSlowStrength > 0) {
                    e.frostTimer = Math.max(e.frostTimer || 0, 45 * next.frostSlowStrength);
                  }
                  
                  e.health -= damage;
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
                    next.particles.push(...createImpact(p.pos, p.color || '#ffffff', 1));
                  }

                  if (e.health <= 0) {
                    next.combo++;
                    next.comboTimer = 2.5;
                    const scoreGain = 100 * (next.buffs.scoreX > 0 ? 2 : 1) * Math.min(10, next.combo) * next.comboDamageMult;
                    next.score += scoreGain;
                    next.killCountSinceHeal += 1;
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
                      const vgx = Math.floor(e.pos.x / 150);
                      const vgy = Math.floor(e.pos.y / 150);
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
                    } else if (!isHeavy) {
                      // Light enemies: small pop, capped by chaosFactor
                      if (Math.random() < 1 / chaosFactor) {
                        next.particles.push(...createExplosion(e.pos, e.color, Math.max(1, Math.floor(3 / chaosFactor)), 1.5));
                      }
                    }
                    // TANK/ELITE: no particles, just screenshake
                    next.experience += 25;

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
                    }
                    
                    if (e.type === EntityType.ENEMY) {
                      if (e.enemyType === EnemyType.BOSS) {
                        next.bossActive = false;
                        next.pendingArenaRestore = true;
                        next.postBossBuffPick = true;
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
                        next.stageTransition = 90;
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
            next.experience += item.damage ?? 25;
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

      for (const e of next.enemies) {
        if (checkCollision(player, e)) {
          if (next.thornsDamage > 0) {
            e.health -= next.thornsDamage * 0.15 * dt;
          }
          if (next.dashIFrameTimer > 0 || next.playerIFrameTimer > 0) continue;

          player.health -= (2.0 + next.stage * 0.5) * dt;
          player.hitTimer = 3;
          next.screenFlash = Math.max(next.screenFlash, 2);
          next.screenshake = Math.min(next.screenshake + 0.4 * dt, 7);

          if (handleFatalDamage(next, player)) {
            if (next.isGameOver) {
              next.particles.push(...createExplosion(player.pos, player.color, 50));
              next.particles.push(...createExplosion(player.pos, '#ffffff', 20));
              next.screenshake = 20;
              syncUi();
            }
          }
        }
      }

      if (prevFrameHealth > player.health) {
        // Player took damage this frame
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

      // Sync UI less frequently for performance
      if (currentTime - lastUiSync > 250) {
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
            onStart={startGame}
            onCampaign={() => setScreen('CAMPAIGN_SELECT')}
            onOpenGear={() => setIsGearOpen(true)}
            onOpenInventory={() => setIsInventoryOpen(true)}
            relicCount={unlockedArtifactIds.length}
            metaScrap={metaScrap}
            equippedArtifactIds={equippedArtifactIds}
            activeTraits={nextRunTraits.map(id => TRAITS[id])}
          />
        )}
        {screen === 'CAMPAIGN_SELECT' && (
          <CampaignSelect
            onStartLevel={startCampaignLevel}
            onBack={() => setScreen('MENU')}
          />
        )}
      </AnimatePresence>

      <RandomEventDialog 
        event={uiState?.pendingEvent ?? null}
        onChoice={(choiceId) => {
          if (gameStateRef.current) {
            handleEventChoice(gameStateRef.current, choiceId);
            syncUi();
          }
        }}
      />

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

      {screen === 'GAME' && uiState && uiState.bossArenaTransition > 0 && (
        <BossWarpOverlay
          bossId={uiState.activeBossId}
          bossArenaTransition={uiState.bossArenaTransition}
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

      {screen === 'GAME' && uiState && !showLevelUp && !showArtifactUnlock && (
        <motion.div key="game-ui-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
          <GameHUD 
            health={uiState.health} maxHealth={uiState.maxHealth}
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
            cardTimer={uiState.cardTimer}
            cardInterval={getCardIntervalSeconds(
              uiState.stage,
              uiState.survivalTime,
              uiState.passives.length
            )}
            activeWeaponSlot={uiState.activeWeaponSlot}
            equippedArtifacts={uiState.equippedArtifacts}
            bossArenaTransition={uiState.bossArenaTransition}
            bossActive={uiState.bossActive}
            isMobile={isMobile}
            compactHud={compactHud}
            landscapeHud={landscapeHud}
            viewportProfile={viewportProfile}
            tabletSpacious={viewportProfile === 'tablet' && compactHud}
          />
          {gameStateRef.current && (
            <SynergyBar
              lines={getActiveSynergies(gameStateRef.current)}
              layout={getSynergyBarLayout(viewportProfile)}
            />
          )}
          {/* Buff Bar */}
          <motion.div
            className={`absolute left-1/2 -translate-x-1/2 flex flex-row flex-wrap justify-center gap-2 max-w-[80vw] z-50 pointer-events-none ${getBuffChipsTopClass(viewportProfile)}`}
          >
            {(uiState?.extraLifeCharges ?? 0) > 0 && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`flex items-center gap-1.5 bg-cyan-950/40 backdrop-blur-md rounded border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)] ${compactHud ? 'px-2 py-0.5' : 'px-3 py-1'}`}>
                <Shield size={compactHud ? 12 : 16} className="text-cyan-400 shrink-0" />
                <span className={`font-bold text-cyan-400 ${compactHud ? 'text-[9px]' : 'text-xs'}`}>
                  {compactHud ? 'EXTRA LIV' : 'EXTRA LIV (1)'}
                </span>
              </motion.div>
            )}
            {uiState?.buffs.overdrive > 0 && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-rose-500/20 backdrop-blur-md px-3 py-1 rounded border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse">
                <Zap size={16} className="text-rose-400" />
                <span className="text-xs font-bold text-rose-400 overflow-hidden text-ellipsis whitespace-nowrap">OVERDRIVE {Math.ceil(uiState.buffs.overdrive / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.magnet > 0 && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-cyan-500/10 backdrop-blur-md px-3 py-1 rounded border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                <Target size={16} className="text-cyan-400/70" />
                <span className="text-xs font-bold text-cyan-300/70 overflow-hidden text-ellipsis whitespace-nowrap">MAGNET {Math.ceil(uiState.buffs.magnet / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.scoreX > 0 && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-fuchsia-500/20 backdrop-blur-md px-3 py-1 rounded border border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.3)] animate-pulse">
                <Trophy size={16} className="text-fuchsia-400" />
                <span className="text-xs font-bold text-fuchsia-400 overflow-hidden text-ellipsis whitespace-nowrap">2X SCORE {Math.ceil(uiState.buffs.scoreX / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.rapidFire > 0 && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-md px-3 py-1 rounded border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
                <Flame size={16} className="text-amber-400" />
                <span className="text-xs font-bold text-amber-400 overflow-hidden text-ellipsis whitespace-nowrap">RAPID {Math.ceil(uiState.buffs.rapidFire / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.timeSlow > 0 && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-cyan-500/20 backdrop-blur-md px-3 py-1 rounded border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse">
                <RotateCcw size={16} className="text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400 overflow-hidden text-ellipsis whitespace-nowrap">SLOW-MO {Math.ceil(uiState.buffs.timeSlow / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.piercing > 0 && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-fuchsia-500/20 backdrop-blur-md px-3 py-1 rounded border border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.3)] animate-pulse">
                <Swords size={16} className="text-fuchsia-400" />
                <span className="text-xs font-bold text-fuchsia-400 overflow-hidden text-ellipsis whitespace-nowrap">PIERCE {Math.ceil(uiState.buffs.piercing / 60)}s</span>
              </motion.div>
            )}
          </motion.div>

          {showTouchControls && (() => {
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


      <BuffCardPicker
        show={showLevelUp && screen === 'GAME'}
        buffs={currentBuffs}
        passives={gameStateRef.current?.passives ?? []}
        onSelect={handleLevelUpChoice}
        isMobile={isMobile}
        viewportProfile={viewportProfile}
      />

      <ArtifactUnlockPicker
        show={showArtifactUnlock && screen === 'GAME'}
        choices={artifactUnlockChoices}
        unlocksRemaining={2 - (gameStateRef.current?.runArtifactUnlocks ?? 0)}
        onSelect={handleArtifactUnlockChoice}
        isMobile={isMobile}
      />

      <ArtifactInventory
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        unlockedIds={unlockedArtifactIds}
        metaScrap={metaScrap}
        newUnlockIds={newUnlockIds}
        isMobile={isMobile}
        onUnlockWithScrap={(artifactId, cost) => {
          if (!spendMetaScrap(cost)) return false;
          setMetaScrap(getMetaScrap());
          if (!unlockedArtifactIds.includes(artifactId)) {
            setUnlockedArtifactIds((prev) => [...prev, artifactId]);
          }
          playSfx('artifact');
          return true;
        }}
        onOpenHangar={() => {
          setIsInventoryOpen(false);
          setIsGearOpen(true);
        }}
      />

      <GearSystem
        isMobile={isMobile} 
        isOpen={isGearOpen}
        onClose={() => setIsGearOpen(false)}
        metaScrap={metaScrap}
        unlockedArtifacts={unlockedArtifactIds.map(id => ARTIFACTS[id]).filter(Boolean)}
        equippedIds={equippedArtifactIds}
        onEquip={(slot, id) => {
          setEquippedArtifactIds(prev => ({ ...prev, [slot]: id }));
        }}
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
        <RunSummary
          state={gameStateRef.current}
          unlockedCount={unlockedArtifactIds.length}
          totalArtifacts={Object.keys(ARTIFACTS).length}
          lockedIds={Object.keys(ARTIFACTS).filter((id) => !unlockedArtifactIds.includes(id))}
          scrapEarned={lastRunScrapEarned}
          metaScrapTotal={metaScrap}
          victory={uiState.stage > 25}
          onRestart={() => {
            gameStateRef.current = null;
            startGame();
          }}
          onVault={() => setIsInventoryOpen(true)}
        />
      ) : null}
    </div>
  );
}
