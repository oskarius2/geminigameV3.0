import { GameState, Entity, EntityType, Particle, ItemType, EnemyType, Obstacle, Hazard, MovingHazard, Trait, RandomEvent, ShipId } from './types';
import { Vector2 } from './utils/vector';
import { COLORS, SIZES, PHYSICS } from '../config/gameTheme';
import { hasTimeSlowEffect } from './buffs/applyBuff';
import {
  computeEnemyVelocity,
  getEnemyAggroPos,
  runEnemyAttacks,
  getSeparationForce,
  finalizeEnemyMovement,
} from './ai/enemyBehaviors';
import { getAugmentTier, getTierModifiers } from './balance/augmentTiers';
import { getStageQuota } from './balance/spawnCurve';
import { applyShipStats, getShipDef } from './ships/shipDefs';
import { createInitialWeaponState } from './weapons/weaponState';
import { applyEquippedArtifacts } from './artifacts/applyArtifactStats';
import {
  pickEnemyTypeForThreat,
  getEnemyTypeForPick,
  isTypeAtCap,
} from './balance/spawnComposition';
import { getBossAttackPattern } from './bosses/bossSpecs';
import { tickSurvivalBossPattern } from './bosses/bossSurvivalAI';
import { BOSS_DEFINITIONS, pickBossForStage } from './content/bosses';
import { getBossSpawnPosition } from './content/bossArenas';
import { hasLiveBoss } from './bossLifecycle';
import { getDifficultyForStage } from './progression/difficultyConfig';
import { initStageDifficulty } from './progression/difficultyScaler';
import { getViewportProfile, useReducedEffects } from './controls/mobileLayout';

/** Shared by updateEnemies separation grid and App projectile spatial hash. */
export const ENEMY_SPATIAL_CELL_SIZE = 150;

export { ARTIFACTS, artifactPowerScore } from './content/artifacts';
export { PASSIVE_BUFFS } from './content/buffs';
export { pickBuffs } from './buffs/pickBuffs';
export { getCardIntervalSeconds, getNextLevelExp } from './buffs/cardTiming';
export { computeThreatLevel, getThreatMult, pickEnemyTypeForThreat } from './balance/threat';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const SPAWN_OBSTACLE_PAD = 30;
const SPAWN_POSITION_ATTEMPTS = 5;

// ============================================================================
// STATE & INITIALIZATION
// ============================================================================

export const TRAITS: Record<string, Trait> = {
  'agile': { id: 'agile', name: 'Agile Frame', description: '+20% Move Speed', type: 'POSITIVE', isPositive: true },
  'hard_hitter': { id: 'hard_hitter', name: 'Hard Hitter', description: '+25% Damage', type: 'POSITIVE', isPositive: true },
  'scavenger': { id: 'scavenger', name: 'Scavenger', description: '+50% Scrap gain', type: 'POSITIVE', isPositive: true },
  'efficient': { id: 'efficient', name: 'Efficient Salvage', description: '+20% scrap gain', type: 'POSITIVE', isPositive: true },
  'hull_plating': { id: 'hull_plating', name: 'Hull Plating', description: '+150 Max Health', type: 'POSITIVE', isPositive: true },
  
  'frail': { id: 'frail', name: 'Frail Hull', description: '-100 Max Health', type: 'NEGATIVE', isPositive: false },
  'fuel_leak': { id: 'fuel_leak', name: 'Leaky Cargo', description: '-15% scrap gain', type: 'NEGATIVE', isPositive: false },
  'clunky': { id: 'clunky', name: 'Clunky Systems', description: '-15% Move Speed', type: 'NEGATIVE', isPositive: false },
  'glass_cannon': { id: 'glass_cannon', name: 'Glass Cannon', description: '-30% Health, but +15% Damage', type: 'NEGATIVE', isPositive: false },
  'bad_radar': { id: 'bad_radar', name: 'Static Radar', description: 'Enemies are 10% faster', type: 'NEGATIVE', isPositive: false },
};

export const RANDOM_EVENTS: Record<string, RandomEvent> = {
  'stranger_deal': {
    id: 'stranger_deal',
    title: 'Unknown signal',
    description: 'A foreign ship offers repairs in exchange for your scrap.',
    options: [
      { id: 'accept_heal', label: 'Pay scrap', description: '40 scrap → restore 40% hull' },
      { id: 'refuse_deal', label: 'Ignore', description: 'Continue without trading' },
      { id: 'rob_deal', label: 'Raid them', description: '30% risk: 100 damage, else +50 scrap' }
    ]
  },
  'abandoned_station': {
    id: 'abandoned_station',
    title: 'Abandoned station',
    description: 'A drifting wreck. The reactor pulses uneasily.',
    options: [
      { id: 'salvage_safe', label: 'Quick salvage', description: '+60 scrap' },
      { id: 'salvage_risky', label: 'Deep search', description: '+250 XP (40% risk: 150 damage)' },
      { id: 'leave_station', label: 'Leave', description: 'Safety first' }
    ]
  },
  'black_market': {
    id: 'black_market',
    title: 'Black market',
    description: 'A shady dealer offers power — at a price.',
    options: [
      { id: 'buy_mod', label: 'Pay scrap', description: '100 scrap → +10% damage' },
      { id: 'deal_blood', label: 'Pay in blood', description: '-200 max HP → relic chance' },
      { id: 'decline_market', label: 'Decline', description: 'Move on' }
    ]
  }
};

export function pickRandomTraits(): string[] {
  const allIds = Object.keys(TRAITS);
  const positives = allIds.filter(id => TRAITS[id].type === 'POSITIVE');
  const negatives = allIds.filter(id => TRAITS[id].type === 'NEGATIVE');
  
  const pickedPos = positives.sort(() => 0.5 - Math.random()).slice(0, 2);
  const pickedNeg = negatives.sort(() => 0.5 - Math.random()).slice(0, 2);
  
  return [...pickedPos, ...pickedNeg];
}

export function getInitialWorldSize(viewWidth: number, viewHeight: number): { width: number; height: number } {
  const base = Math.min(viewWidth, viewHeight);
  const mult = 30;
  return { width: base * mult, height: base * mult };
}

export function generateObstaclesForStage(stage: number, width: number, height: number): Obstacle[] {
  const obs: Obstacle[] = [];
  
  // 1. Add Landmarks (handcrafted-ish interest points)
  const landmarkCount = 3 + Math.floor(stage * 0.5);
  for (let l = 0; l < landmarkCount; l++) {
    const lPos = new Vector2(
      200 + Math.random() * (width - 400),
      200 + Math.random() * (height - 400)
    );
    // Landmark: A "Hub" of obstacles
    const clusterSize = 3 + Math.floor(Math.random() * 4);
    for (let c = 0; c < clusterSize; c++) {
      const isCircle = Math.random() > 0.4;
      const sizeBase = 40 + Math.random() * 100;
      const offset = new Vector2((Math.random()-0.5)*200, (Math.random()-0.5)*200);
      obs.push({
        id: `lm_${l}_${c}`,
        type: isCircle ? 'CIRCLE' : 'RECT',
        pos: lPos.add(offset),
        size: isCircle ? new Vector2(sizeBase, 0) : new Vector2(sizeBase, sizeBase * 0.8),
        rotation: isCircle ? 0 : Math.random() * Math.PI,
        color: l % 2 === 0 ? 'rgba(6, 182, 212, 0.05)' : 'rgba(217, 70, 239, 0.05)',
        isLandmark: true
      } as any);
    }
  }

  // 2. Add random obstacles
  const numObstacles = 8 + Math.floor(stage * 2);
  for (let i = 0; i < numObstacles; i++) {
    const isCircle = Math.random() > 0.5;
    const sizeBase = 40 + Math.random() * 140;
    const type = isCircle ? 'CIRCLE' : 'RECT';
    
    let pos = new Vector2(Math.random() * width, Math.random() * height);
    while (pos.sub(new Vector2(width / 2, height / 2)).magnitude() < 400) {
      pos = new Vector2(Math.random() * width, Math.random() * height);
    }

    obs.push({
      id: Math.random().toString(),
      type,
      pos,
      size: isCircle ? new Vector2(sizeBase, 0) : new Vector2(sizeBase, sizeBase * (0.6 + Math.random())),
      rotation: isCircle ? 0 : Math.random() * Math.PI,
      color: `rgba(15, 23, 42, 0.8)`,
    });
  }
  return obs;
}

export function appendObstaclesForExpansion(
  stage: number,
  worldWidth: number,
  worldHeight: number,
  expandW: number,
  expandH: number,
  playerPos: Vector2
): Obstacle[] {
  const obs: Obstacle[] = [];
  const count = 3 + Math.floor(stage * 0.5);
  for (let i = 0; i < count; i++) {
    const isCircle = Math.random() > 0.5;
    const sizeBase = 50 + Math.random() * 120;
    let pos = new Vector2(
      playerPos.x + (Math.random() - 0.5) * (worldWidth + expandW),
      playerPos.y + (Math.random() - 0.5) * (worldHeight + expandH)
    );
    pos.x = Math.max(80, Math.min(worldWidth + expandW - 80, pos.x));
    pos.y = Math.max(80, Math.min(worldHeight + expandH - 80, pos.y));
    if (pos.sub(playerPos).magnitude() < 200) continue;
    obs.push({
      id: Math.random().toString(),
      type: isCircle ? 'CIRCLE' : 'RECT',
      pos,
      size: isCircle ? new Vector2(sizeBase, 0) : new Vector2(sizeBase, sizeBase * (0.5 + Math.random())),
      rotation: isCircle ? Math.random() * Math.PI : 0,
      color: `hsl(${(stage * 25 + i * 17) % 360}, 30%, 15%)`,
    });
  }
  return obs;
}

export const INITIAL_STATE = (
  width: number,
  height: number,
  selectedShip: ShipId = 'interceptor',
): GameState => {
  const { width: worldWidth, height: worldHeight } = getInitialWorldSize(width, height);
  const traits = pickRandomTraits();
  
  const state: GameState = {
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      active: true,
      pos: new Vector2(worldWidth / 2, worldHeight / 2),
      radius: 15,
      health: 450,
      maxHealth: 450,
      speed: 9,
      velocity: new Vector2(0, 0),
      color: '#60a5fa',
    },
    enemies: [],
    projectiles: [],
    items: [],
    particles: [],
    obstacles: generateObstaclesForStage(1, worldWidth, worldHeight),
    hazards: [],
    movingHazards: [],
    movingHazardSpawnTimer: 8,
    score: 0,
    level: 1,
    experience: 0,
    nextLevelExp: 1500,
    isGameOver: false,
    isPaused: false,
    isPlayerDashing: false,
    wave: 0,
    stage: 1,
    enemiesToKill: 40,
    bossActive: false,
    activeBossId: null,
    bossArenaTransition: 0,
    bossArenaSwapped: false,
    inBossArena: false,
    mainWorldSnapshot: null,
    lastBossId: null,
    lastBossDefeatedId: null,
    bossVictoryBannerTimer: 0,
    pendingArenaRestore: false,
    stageTransition: 0,
    spawnRampTimer: 0,
    qualityLevel: 'high',
    world: { width: worldWidth, height: worldHeight },
    camera: new Vector2(worldWidth / 2 - width / 2, worldHeight / 2 - height / 2),
    energy: 100,
    maxEnergy: 100,
    isDashing: false,
    dashDirection: new Vector2(0, 0),
    dashDuration: 0,
    dashCooldownRemaining: 0,
    buffs: {
      shield: 0,
      overdrive: 0,
      magnet: 0,
      scoreX: 0,
      rapidFire: 0,
      timeSlow: 0,
      piercing: 0,
    },
    screenshake: 0,
    multiShot: 1,
    baseDamage: 18,
    critChance: 0.1,
    lifeSteal: 0,
    regen: 0,
    explosiveChance: 0,
    bounceCount: 0,
    magnetRange: 150,
    orbitalCount: 0,
    passives: [],
    rapidFireTimer: 0,
    shieldTimer: 0,
    screenFlash: 0,
    screenFlashColor: null,
    playerIFrameTimer: 0,
    hitStop: 0,
    damageTexts: [],
    combo: 0,
    comboTimer: 0,
    gameMode: 'NORMAL',
    selectedShip,
    fireRateMultiplier: 1,
    rails: null,
    campaignLevelId: null,
    campaignDialogQueue: [],
    campaignCameraPos: null,
    campaignZoom: null,
    campaignCameraAngle: null,
    equippedArtifacts: {
      CANNON_A: null,
      CANNON_B: null,
      ULTIMATE: null,
      ARMOR: null,
      MOBILITY: null
    },
    activeWeaponSlot: 'CANNON_A',
    cardTimer: 0,
    permanentOverdrive: false,
    permanentTimeSlow: false,
    permanentRapidFire: false,
    permanentPiercing: false,
    hasLighting: false,
    hasGravityWell: false,
    hasBackshot: false,
    hasSpiralShot: false,
    burnOnCrit: false,
    frostSlowStrength: 0,
    thornsDamage: 0,
    dashIFrames: false,
    dashIFrameTimer: 0,
    comboDamageMult: 1,
    hasEmergencyShield: false,
    emergencyShieldCooldown: 0,
    extraLifeCharges: 0,
    smartRicochet: false,
    vampiricBurstStacks: 0,
    killCountSinceHeal: 0,
    chainCritBonus: 0,
    pendingCritBonus: 0,
    wideArcStacks: 0,
    dashEnergyDiscount: 0,
    volatileDeath: false,
    hasTimeDilation: false,
    timeDilationCooldown: 0,
    hunterMarkBonus: 0,
    runArtifactUnlocks: 0,
    survivalTime: 0,
    threatLevel: 0,
    threatPeak: 0,
    augmentCount: 0,
    augmentPityExclusive: 0,
    runStartTime: Date.now(),
    bulletStormMult: 1,
    multiShotFireRatePenalty: 1,
    hasVoidRift: false,
    voidRiftCooldown: 0,
    killSatelliteCounter: 0,
    hasInfinityPierce: false,
    runArtifactsUnlockedThisRun: [],
    pickJuiceTimer: 0,
    ultimateCharge: 0,
    nextShotBurns: false,

    activeTraits: traits,
    pendingEvent: null,
    eventTimer: 1200 + Math.random() * 600,
    runScrapEarned: 0,
    postBossBuffPick: false,
    stageEnteredAt: 0,
    waveSpawnQueue: [],
    waveMiniBossQueue: [],
    waveSpawnCooldown: 0,
    activeWaveIndex: -1,
    activeCompanionId: null,
    companionLevel: 1,
    companionXp: 0,
    companionRuntime: null,
    companionsUnlocked: [],
    companionGrantedThisRun: false,
    collectedShipLoot: [],
    miniBossKillsThisRun: 0,
    runBossesDefeated: 0,
    activeEnemyCount: 0,
    shopPurchasedIds: [],
    shopRunFlags: {},
    shopScrapSpent: 0,
    weaponState: createInitialWeaponState(),
  };

  const shipDef = getShipDef(selectedShip);
  if (shipDef) {
    applyShipStats(state, shipDef);
  }

  // Apply Trait impacts on initialization
  traits.forEach(tId => {
    switch(tId) {
      case 'agile': state.player.speed *= 1.2; break;
      case 'hard_hitter': state.baseDamage *= 1.25; break;
      case 'hull_plating': 
        state.player.maxHealth += 150; 
        state.player.health += 150; 
        break;
      case 'frail': 
        state.player.maxHealth = Math.max(50, state.player.maxHealth - 100);
        state.player.health = Math.min(state.player.health, state.player.maxHealth);
        break;
      case 'clunky': state.player.speed *= 0.85; break;
      case 'glass_cannon': 
        state.player.maxHealth *= 0.7;
        state.player.health *= 0.7;
        state.baseDamage *= 1.15;
        break;
    }
  });

  applyEquippedArtifacts(state);

  return initStageDifficulty(state);
};

export function handleEventChoice(state: GameState, choiceId: string) {
  const popup = (text: string, color: string) => {
    state.damageTexts.push({
      id: Math.random().toString(36).slice(2),
      pos: state.player.pos.clone(),
      text,
      life: 1.5,
      color,
    });
  };

  switch(choiceId) {
    case 'accept_heal':
      if (state.runScrapEarned >= 40) {
        state.runScrapEarned -= 40;
        const heal = state.player.maxHealth * 0.4;
        state.player.health = Math.min(state.player.maxHealth, state.player.health + heal);
        popup('-40 SKROT', '#f87171');
        popup('+40% HP', '#4ade80');
      } else {
        popup('INTE NOG SKROT', '#f87171');
      }
      break;
    case 'rob_deal':
      if (Math.random() < 0.3) {
        state.player.health -= 100;
        state.screenFlash = 5;
        popup('-100 HP', '#f87171');
      } else {
        state.runScrapEarned += 50;
        popup('+50 SKROT', '#4ade80');
      }
      break;
    case 'salvage_safe':
      state.runScrapEarned += 60;
      popup('+60 SKROT', '#4ade80');
      break;
    case 'salvage_risky':
      if (Math.random() < 0.4) {
        state.player.health -= 150;
        state.screenFlash = 7;
        popup('-150 HP', '#f87171');
      } else {
        state.experience += 250;
        popup('+250 XP', '#a78bfa');
      }
      break;
    case 'buy_mod':
      if (state.runScrapEarned >= 100) {
        state.runScrapEarned -= 100;
        state.baseDamage *= 1.1;
        popup('-100 SKROT', '#f87171');
        popup('DMG +10%', '#fbbf24');
      } else {
        popup('INTE NOG SKROT', '#f87171');
      }
      break;
    case 'deal_blood':
      state.player.maxHealth = Math.max(50, state.player.maxHealth - 200);
      state.player.health = Math.min(state.player.health, state.player.maxHealth);
      state.runArtifactUnlocks += 1;
      popup('-200 MAX HP', '#f87171');
      popup('RELIC UNLOCKED', '#fbbf24');
      break;
  }
  state.pendingEvent = null;
  state.isPaused = false;
}

// ============================================================================
// PARTICLES & EFFECTS
// ============================================================================

export function createExplosion(pos: Vector2, color: string, count: number = 4, speedMult: number = 1): Particle[] {
  const particles: Particle[] = [];
  const pCount = Math.floor(count * 2);

  for (let i = 0; i < pCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (20 + Math.random() * 80) * speedMult;
    particles.push({
      id: Math.random().toString(),
      pos: pos.clone(),
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: 0.6 + Math.random() * 0.4,
      maxLife: 1.0,
      color: color,
      size: 4 + Math.random() * 8,
      particleType: Math.random() < 0.3 ? 'streak' : 'spark'
    });
  }

  particles.push({
    id: Math.random().toString(),
    pos: pos.clone(),
    velocity: new Vector2(0, 0),
    life: 0.5,
    maxLife: 0.5,
    color,
    size: Math.max(20, count * 5 * speedMult),
    particleType: 'flash'
  });

  particles.push({
    id: Math.random().toString(),
    pos: pos.clone(),
    velocity: new Vector2(0, 0),
    life: 0.8,
    maxLife: 0.8,
    color,
    size: Math.max(15, count * 4 * speedMult),
    particleType: 'ring'
  });

  return particles;
}

export function createImplosion(pos: Vector2, color: string, count: number = 6): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 50;
    particles.push({
      id: Math.random().toString(),
      pos: new Vector2(pos.x + Math.cos(angle) * distance, pos.y + Math.sin(angle) * distance),
      velocity: new Vector2(-Math.cos(angle) * distance, -Math.sin(angle) * distance),
      life: 1.0,
      maxLife: 1.0,
      color,
      size: 3 + Math.random() * 5,
      particleType: 'streak'
    });
  }
  return particles;
}

export function createImpact(pos: Vector2, color: string, count: number = 1): Particle[] {
  const particles: Particle[] = [];
  const pCount = count;
  for (let i = 0; i < pCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 40;
    particles.push({
      id: Math.random().toString(),
      pos: pos.clone(),
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: 0.3 + Math.random() * 0.3,
      maxLife: 0.6,
      color,
      size: 2 + Math.random() * 4,
      particleType: 'spark'
    });
  }

  if (count > 2) {
    particles.push({
      id: Math.random().toString(),
      pos: pos.clone(),
      velocity: new Vector2(0, 0),
      life: 0.4,
      maxLife: 0.4,
      color,
      size: count * 3,
      particleType: 'cross'
    });
  }

  return particles;
}

export function createItemSparkle(pos: Vector2, color: string, count: number = 4): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 15;
    particles.push({
      id: Math.random().toString(),
      pos: pos.clone(),
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1.0,
      color,
      size: 2 + Math.random() * 3,
      particleType: 'cross'
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], dt: number = 1, playerPos?: { x: number; y: number }) {
  const reduced =
    typeof window !== 'undefined' &&
    useReducedEffects(getViewportProfile(window.innerWidth, window.innerHeight));
  const maxParticlesCount = reduced ? 40 : 250;
  let current = particles;
  if (particles.length > maxParticlesCount) {
    current = particles.slice(particles.length - maxParticlesCount);
  }

  return current.filter(p => {
    if (playerPos) {
      const dx = p.pos.x - playerPos.x;
      const dy = p.pos.y - playerPos.y;
      if (dx * dx + dy * dy > 2000 * 2000) return false;
    }
    p.pos.x += p.velocity.x * dt;
    p.pos.y += p.velocity.y * dt;
    const friction = Math.pow(0.92, dt);
    p.velocity.x *= friction;
    p.velocity.y *= friction;
    p.life -= (1 / p.maxLife) * 0.03 * dt;
    p.size *= Math.pow(0.98, dt);
    return p.life > 0;
  });
}

// ============================================================================
// SPAWN HELPERS & COLLISION
// ============================================================================

function getSurvivalLevelProgress(state: GameState): number {
  const quota = getStageQuota(state.stage);
  if (quota <= 0) return 1;
  const killsDone = quota - state.enemiesToKill;
  return Math.max(0, Math.min(1, killsDone / quota));
}

function resolveSpawnTypePick(
  state: GameState,
  typeOverride: number | undefined,
  levelProgress: number
): number | null {
  if (typeOverride !== undefined) {
    if (state.gameMode === 'CAMPAIGN') {
      const type = getEnemyTypeForPick(typeOverride);
      if (type && isTypeAtCap(type, state.enemies, levelProgress)) {
        for (let i = 0; i < 3; i++) {
          const picked = pickEnemyTypeForThreat(state, levelProgress);
          if (picked !== null) return picked;
        }
        return null;
      }
    }
    return typeOverride;
  }
  if (state.gameMode === 'NORMAL') {
    for (let i = 0; i < 3; i++) {
      const picked = pickEnemyTypeForThreat(state, levelProgress);
      if (picked !== null) return picked;
    }
    return null;
  }
  const fallback = pickEnemyTypeForThreat(state, levelProgress);
  return fallback;
}

export function isPosInsideObstacle(
  pos: Vector2,
  obstacles: Obstacle[],
  pad = SPAWN_OBSTACLE_PAD
): boolean {
  for (const obs of obstacles) {
    if (!obs?.pos || !obs?.size) continue;
    if (obs.type === 'CIRCLE') {
      if (pos.distanceTo(obs.pos) < obs.size.x + pad) return true;
    } else {
      const hw = obs.size.x / 2;
      const hh = obs.size.y / 2;
      if (
        Math.abs(pos.x - obs.pos.x) < hw + pad &&
        Math.abs(pos.y - obs.pos.y) < hh + pad
      ) {
        return true;
      }
    }
  }
  return false;
}

export function pickSpawnPosition(
  state: GameState,
  posOverride?: { x: number; y: number }
): Vector2 {
  const worldWidth = state.world.width;
  const worldHeight = state.world.height;
  const playerPos = state.player.pos;

  for (let attempt = 0; attempt < SPAWN_POSITION_ATTEMPTS; attempt++) {
    let pos: Vector2;
    if (posOverride) {
      pos = new Vector2(
        Math.max(0, Math.min(worldWidth, posOverride.x + (Math.random() - 0.5) * 200)),
        Math.max(0, Math.min(worldHeight, posOverride.y + (Math.random() - 0.5) * 200))
      );
    } else {
      const angle = Math.random() * Math.PI * 2;
      const distance = 1000 + Math.random() * 300;
      pos = new Vector2(
        playerPos.x + Math.cos(angle) * distance,
        playerPos.y + Math.sin(angle) * distance
      );
      pos.x = Math.max(0, Math.min(worldWidth, pos.x + (Math.random() - 0.5) * 200));
      pos.y = Math.max(0, Math.min(worldHeight, pos.y + (Math.random() - 0.5) * 200));
    }
    if (!isPosInsideObstacle(pos, state.obstacles)) return pos;
  }

  return new Vector2(worldWidth / 2, worldHeight / 2);
}

// ============================================================================
// ENEMY SPAWNING
// ============================================================================

/**
 * REFACTORED spawnEnemy() for wave composition system
 * 
 * KEY CHANGE: Accept EnemyType directly instead of typeOverride: number
 * This eliminates the giant 21-case switch and makes spawn deterministic.
 */

export function spawnEnemyFromWave(
  state: GameState,
  enemyType: EnemyType,
  posOverride?: { x: number; y: number }
): Entity | null {
  const tier = getAugmentTier(state.passives.length);
  const tierMods = getTierModifiers(tier);
  const stage = state.stage;

  let pos = pickSpawnPosition(state, posOverride);

  const powerFactor = state.threatLevel / 100;

  // Gradual time ramp: +50% over 10 min, caps at +60%
  const timeRamp = 1 + Math.min(0.6, state.survivalTime / 1200);

  const dynamicHealthFactor = 0.7 + powerFactor * 0.5;
  const healthScale = tierMods.enemyHpMult * dynamicHealthFactor * timeRamp;

  const speedScale =
    tierMods.enemySpeedMult * (1 + Math.min(0.4, state.survivalTime / 1800));

  const isBoss =
    state.bossActive &&
    state.inBossArena &&
    !hasLiveBoss(state);

  let radius = 12;
  let health = 20 * healthScale;
  let speed = (1.5 + Math.random() * 0.5) * speedScale;
  let color = '#f87171';
  let finalEnemyType = enemyType;
  let damageResist = 0;
  let damageMult = 1;

  if (isBoss) {
    const boss =
      BOSS_DEFINITIONS.find((b) => b.id === state.activeBossId) ?? pickBossForStage(stage);
    if (state.inBossArena && state.activeBossId) {
      const worldWidth = state.world.width;
      const worldHeight = state.world.height;
      const spawn = getBossSpawnPosition(state.activeBossId, worldWidth, worldHeight);
      pos = new Vector2(
        spawn.x + (Math.random() - 0.5) * 80,
        spawn.y + (Math.random() - 0.5) * 80
      );
    }
    radius = 100 + stage * 12;
    // 3× baseline HP, exponential 1.55 per stage (not 1.4), multiplied by boss hpMult.
    health = (24000 * Math.pow(1.55, stage - 1)) * boss.hpMult;
    speed = (0.8 + stage * 0.1) * speedScale * boss.speedMult;
    color = '#991b1b';
    // Bosses resist 35% of incoming damage — prevents augment stacking from one-shotting.
    damageResist = 0.35;
    damageMult = boss.damageMult;
    finalEnemyType = EnemyType.BOSS;
  } else {
    // Enemy type configuration — SIMPLIFIED via EnemyType directly
    switch (enemyType) {
      case EnemyType.CHASER:
        color = '#ef4444';
        radius = 25;
        health *= 10;
        speed *= 0.8;
        break;

      case EnemyType.PHALANX:
        color = '#0ea5e9';
        radius = 40;
        health *= 30;
        speed *= 0.3;
        break;

      case EnemyType.WRAITH:
        color = '#fde68a';
        radius = 18;
        health *= 5;
        speed *= 1.4;
        break;

      case EnemyType.ELITE:
        color = '#fbbf24';
        radius = 35;
        health *= 15;
        speed *= 1.1;
        break;

      case EnemyType.SPLINTER:
        color = '#f87171';
        radius = 25;
        health *= 8;
        speed *= 0.8;
        break;

      case EnemyType.NOVA:
        color = '#f97316';
        radius = 22;
        health *= 6;
        speed *= 1.1;
        break;

      case EnemyType.RANGED:
        color = '#c084fc';
        radius = 20;
        health *= 2.5;
        speed *= 0.85;
        break;

      case EnemyType.FAST:
        color = '#fde047';
        radius = 11;
        health *= 0.4;
        speed *= 2.3;
        break;

      case EnemyType.SWARMER:
        color = '#fb923c';
        radius = 9;
        health *= 0.15;
        speed *= 2.6;
        break;

      case EnemyType.SNIPER:
        color = '#ef4444';
        radius = 20;
        health *= 8;
        speed *= 0.6;
        break;

      case EnemyType.DASHER:
        color = '#ff6b35';
        radius = 10;
        health *= 0.5;
        speed *= 2.8;
        break;

      case EnemyType.PHANTOM:
        color = '#00d4ff';
        radius = 16;
        health *= 4;
        speed *= 1.5;
        break;

      case EnemyType.ZAPPER:
        color = '#38bdf8';
        radius = 13;
        health *= 1.8;
        speed *= 1.1;
        break;

      case EnemyType.STRIKER:
        color = '#cc2200';
        radius = 18;
        health *= 5;
        speed *= 1.9;
        damageMult = 1.9;
        break;

      case EnemyType.SWARM_V2:
        color = '#ff8c00';
        radius = 10;
        health *= 0.3;
        speed *= 2.9;
        break;

      case EnemyType.TRACKER:
        color = '#c026d3';
        radius = 17;
        health *= 7;
        speed *= 1.15;
        break;

      case EnemyType.TANK:
        color = '#475569';
        radius = 44;
        health *= 60;
        speed *= 0.2;
        break;

      case EnemyType.SHIELDED:
        color = '#06b6d4';
        radius = 22;
        health *= 8;
        speed *= 0.9;
        enemyType = EnemyType.SHIELDED;
        damageResist = 0.85;
        break;

      case EnemyType.REGENERATING:
        color = '#22c55e';
        radius = 20;
        health *= 12;
        speed *= 0.8;
        break;

      case EnemyType.FORTIFIED:
        color = '#475569';
        radius = 44;
        health *= 60;
        speed *= 0.2;
        break;

      default:
        color = '#ef4444';
        radius = 14;
        health *= 1.2;
        speed *= 1;
        finalEnemyType = EnemyType.CHASER;
        break;
    }
  }

  const baseDamage = Math.floor(
    (15 + tier * 2) * timeRamp * (isBoss ? 2 : 1) * damageMult
  );
  const difficulty = getDifficultyForStage(stage);
  const baseHealth = health;
  const scaledHealth = isBoss
    ? health
    : baseHealth * difficulty.enemyHealthMultiplier;
  const scaledDamage = isBoss
    ? baseDamage
    : baseDamage * difficulty.enemyDamageMultiplier;

  const entity: Entity = {
    id: Math.random().toString(36).substr(2, 9),
    type: EntityType.ENEMY,
    active: true,
    pos,
    radius,
    health: scaledHealth,
    maxHealth: scaledHealth,
    speed,
    velocity: new Vector2(0, 0),
    color,
    damage: scaledDamage,
    baseHealth: isBoss ? undefined : baseHealth,
    baseDamage: isBoss ? undefined : baseDamage,
    enemyType: finalEnemyType,
    lastShot: Date.now(),
    aiTimer: 0,
    behaviorSeed: Math.random(),
    aiState: 'chase',
    damageResist,
    shieldHealth: enemyType === EnemyType.SHIELDED ? 10 : undefined,
  };

  if (isBoss && state.activeBossId) {
    entity.bossPatternId = getBossAttackPattern(state.activeBossId);
    entity.bossPatternTimer = 30;
    entity.bossEngageTimer = 0;
    entity.bossEnrageAnnounced = false;
  }

  return entity;
}

/**
 * Object-pool push: reuse the first inactive slot instead of growing the array.
 * Call this instead of `state.enemies.push(entity)` everywhere in the survival
 * game loop to eliminate array-growth allocations on the hot path.
 *
 * Increments `state.activeEnemyCount` so spawn-cap checks stay O(1).
 */
export function pooledEnemyPush(state: GameState, entity: Entity): void {
  entity.active = true;
  const freeIdx = state.enemies.findIndex(e => !e.active);
  if (freeIdx >= 0) {
    state.enemies[freeIdx] = entity; // reuse dead slot — no array growth
  } else {
    state.enemies.push(entity); // pool not large enough yet, grow once
  }
  state.activeEnemyCount++;
}

/**
 * Deactivate a live enemy (pool it). Prefer this over splicing or filtering.
 * Decrements `state.activeEnemyCount`.
 */
export function deactivateEnemy(state: GameState, enemy: Entity): void {
  if (enemy.active === false) return;
  enemy.active = false;
  state.activeEnemyCount = Math.max(0, state.activeEnemyCount - 1);
}

/**
 * LEGACY WRAPPER — keeps old spawnEnemy() working for backwards compatibility
 * (e.g., boss minions, specific spawns)
 * 
 * Gradually deprecate this and use spawnEnemyFromWave() for all normal spawns.
 */
export function spawnEnemy(
  state: GameState,
  typeOverride?: number | EnemyType,
  posOverride?: { x: number; y: number }
): Entity | null {
  if (typeof typeOverride === 'number') {
    const enemyType = getEnemyTypeForPick(typeOverride) ?? EnemyType.CHASER;
    return spawnEnemyFromWave(state, enemyType, posOverride);
  }
  if (typeof typeOverride === 'string') {
    return spawnEnemyFromWave(state, typeOverride as EnemyType, posOverride);
  }
  return spawnEnemyFromWave(state, EnemyType.CHASER, posOverride);
}
export function spawnXpOrb(pos: Vector2, amount = 25): Entity {
  return {
    id: Math.random().toString(36).slice(2, 9),
    type: EntityType.ITEM,
    active: true,
    pos: pos.clone(),
    radius: 10,
    health: 1,
    maxHealth: 1,
    speed: 0,
    velocity: new Vector2(0, 0),
    color: '#22d3ee',
    itemType: ItemType.XP,
    damage: amount,
  };
}

export function spawnItem(pos: Vector2): Entity | null {
  // 25% chance to drop a health item
  if (Math.random() > 0.25) return null; 
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: EntityType.ITEM,
    active: true,
    pos: pos.clone(),
    radius: 12,
    health: 1,
    maxHealth: 1,
    speed: 0,
    velocity: new Vector2(0, 0),
    color: '#4ade80',
    itemType: ItemType.HEALTH,
  };
}

export function spawnHazard(state: GameState): Hazard {
  const isLaser = Math.random() > 0.5;
  const worldWidth = state.world.width;
  const worldHeight = state.world.height;
  return {
    id: Math.random().toString(),
    type: isLaser ? 'LASER' : 'ZONE',
    pos: new Vector2(Math.random() * worldWidth, Math.random() * worldHeight),
    size: isLaser ? new Vector2(400, 10) : new Vector2(200, 200),
    rotation: Math.random() * Math.PI,
    active: false,
    timer: 0,
    damage: 10,
    color: isLaser ? '#ff0000' : '#ffff00'
  };
}

// ============================================================================
// COLLISION & PHYSICS
// ============================================================================

export function checkCollision(e1: Entity, e2: Entity): boolean {
  const dx = e1.pos.x - e2.pos.x;
  const dy = e1.pos.y - e2.pos.y;
  const distSq = dx * dx + dy * dy;
  const radiusSum = e1.radius + e2.radius;
  return distSq < radiusSum * radiusSum;
}

export function resolveObstacleCollision(entity: Entity, obstacles: Obstacle[]) {
  for (const obs of obstacles) {
    if (!obs?.pos || !obs?.size) continue;
    if (obs.type === 'CIRCLE') {
      const dx = entity.pos.x - obs.pos.x;
      const dy = entity.pos.y - obs.pos.y;
      const distSq = dx * dx + dy * dy;
      const minRadius = entity.radius + obs.size.x;
      if (distSq < minRadius * minRadius) {
        const dist = distSq > 0 ? Math.sqrt(distSq) : 0.001;
        const overlap = minRadius - dist;
        const pushX = (dx / dist) * overlap;
        const pushY = (dy / dist) * overlap;
        entity.pos.x += pushX;
        entity.pos.y += pushY;
      }
    } else if (obs.type === 'RECT') {
      const hw = obs.size.x / 2;
      const hh = obs.size.y / 2;
      
      const testX = Math.max(obs.pos.x - hw, Math.min(entity.pos.x, obs.pos.x + hw));
      const testY = Math.max(obs.pos.y - hh, Math.min(entity.pos.y, obs.pos.y + hh));
      
      const dx = entity.pos.x - testX;
      const dy = entity.pos.y - testY;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < entity.radius * entity.radius) {
        const dist = distSq > 0 ? Math.sqrt(distSq) : 0.001;
        const overlap = entity.radius - dist;
        entity.pos.x += (dx / dist) * overlap;
        entity.pos.y += (dy / dist) * overlap;
      }
    }
  }
}

export function checkProjectileObstacleCollision(p: Entity, obs: Obstacle): boolean {
  if (!p?.pos || !obs?.pos || !obs?.size) return false;
  if (obs.type === 'CIRCLE') {
    const dx = p.pos.x - obs.pos.x;
    const dy = p.pos.y - obs.pos.y;
    return (dx * dx + dy * dy) < (obs.size.x + p.radius) * (obs.size.x + p.radius);
  } else if (obs.type === 'RECT') {
    const hw = obs.size.x / 2;
    const hh = obs.size.y / 2;
    const testX = Math.max(obs.pos.x - hw, Math.min(p.pos.x, obs.pos.x + hw));
    const testY = Math.max(obs.pos.y - hh, Math.min(p.pos.y, obs.pos.y + hh));
    const dx = p.pos.x - testX;
    const dy = p.pos.y - testY;
    return (dx * dx + dy * dy) < p.radius * p.radius;
  }
  return false;
}

// ============================================================================
// GAME STATE UPDATES
// ============================================================================

export function updateProjectiles(projectiles: Entity[], worldWidth: number, worldHeight: number, dt: number = 1, bounceCount: number = 0) {
  const updated = projectiles.filter(p => {
    if (!p?.pos || !p?.velocity) return false;
    p.pos = p.pos.add(p.velocity.mul(dt));
    
    if (p.life !== undefined) {
      p.life -= 0.016 * dt;
      if (p.life <= 0) return false;
    }
    
    // Wall bounce
    if (bounceCount > 0) {
      if (p.pos.x < 0 || p.pos.x > worldWidth) {
        p.velocity.x *= -1;
        p.pos.x = Math.max(0, Math.min(worldWidth, p.pos.x));
      }
      if (p.pos.y < 0 || p.pos.y > worldHeight) {
        p.velocity.y *= -1;
        p.pos.y = Math.max(0, Math.min(worldHeight, p.pos.y));
      }
    }

    return (
      p.pos.x > -100 && p.pos.x < worldWidth + 100 &&
      p.pos.y > -100 && p.pos.y < worldHeight + 100
    );
  });
  return updated;
}

export function updateHazards(state: GameState, dt: number) {
  state.hazards.forEach(h => {
    h.timer += dt * 0.05;
    if (h.timer > Math.PI * 2) h.timer = 0;
    
    const dist = state.player.pos.sub(h.pos).magnitude();
    const radius = h.type === 'ZONE' ? Math.max(h.size.x, h.size.y) / 2 : 50; 
    
    if (dist < radius + state.player.radius) {
      if (h.active) {
        state.player.health -= h.damage * dt * 0.1;
        state.screenFlash = Math.max(state.screenFlash, 0.2);
      }
    }
    
    if (h.type === 'LASER') {
      const pulse = Math.sin(h.timer);
      h.active = pulse > 0.5;
    } else {
      h.active = true;
    }
  });
}

// ============================================================================
// MOVING HAZARD UPDATES
// ============================================================================

/**
 * Advance all moving hazards by one frame: movement pattern, rotation,
 * hit-flash countdown, and out-of-bounds culling.
 *
 * Collision detection (player/projectile) is handled in App.tsx so it can
 * integrate with the projectile pipeline and scoring.
 */
export function updateMovingHazards(state: GameState, dt: number): void {
  const { world } = state;
  const worldW = world.width;
  const worldH = world.height;
  const OUT_MARGIN = 200;

  state.movingHazards = state.movingHazards.filter(h => {
    if (h.health <= 0) return false;

    h.patternPhase += dt * 0.04;
    h.rotation += h.rotationSpeed * dt;
    if (h.hitFlash > 0) h.hitFlash -= dt;

    switch (h.pattern) {
      case 'linear': {
        h.pos.x += h.velocity.x * dt;
        h.pos.y += h.velocity.y * dt;
        // Cull once fully off-map
        if (
          h.pos.x < -OUT_MARGIN || h.pos.x > worldW + OUT_MARGIN ||
          h.pos.y < -OUT_MARGIN || h.pos.y > worldH + OUT_MARGIN
        ) {
          return false;
        }
        break;
      }
      case 'bounce': {
        h.pos.x += h.velocity.x * dt;
        h.pos.y += h.velocity.y * dt;
        if (h.pos.x - h.radius < 0) {
          h.pos.x = h.radius;
          h.velocity.x = Math.abs(h.velocity.x);
        } else if (h.pos.x + h.radius > worldW) {
          h.pos.x = worldW - h.radius;
          h.velocity.x = -Math.abs(h.velocity.x);
        }
        if (h.pos.y - h.radius < 0) {
          h.pos.y = h.radius;
          h.velocity.y = Math.abs(h.velocity.y);
        } else if (h.pos.y + h.radius > worldH) {
          h.pos.y = worldH - h.radius;
          h.velocity.y = -Math.abs(h.velocity.y);
        }
        break;
      }
      case 'sine': {
        // Base linear motion + perpendicular sine displacement
        const speed = Math.sqrt(h.velocity.x * h.velocity.x + h.velocity.y * h.velocity.y);
        const nx = h.velocity.x / (speed || 1);
        const ny = h.velocity.y / (speed || 1);
        // Perpendicular normal
        const px = -ny;
        const py = nx;
        const sineOffset = Math.sin(h.patternPhase * 3) * h.sineAmplitude * 0.012 * dt;
        h.pos.x += h.velocity.x * dt + px * sineOffset;
        h.pos.y += h.velocity.y * dt + py * sineOffset;
        if (
          h.pos.x < -OUT_MARGIN || h.pos.x > worldW + OUT_MARGIN ||
          h.pos.y < -OUT_MARGIN || h.pos.y > worldH + OUT_MARGIN
        ) {
          return false;
        }
        break;
      }
      case 'orbital': {
        // Orbit around anchorPos at constant angular speed
        const orbitSpeed = (Math.sqrt(h.velocity.x * h.velocity.x + h.velocity.y * h.velocity.y) / 150) * dt;
        h.patternPhase += orbitSpeed;
        const orbitRadius = Math.sqrt(
          (h.pos.x - h.anchorPos.x) ** 2 + (h.pos.y - h.anchorPos.y) ** 2,
        );
        h.pos.x = h.anchorPos.x + Math.cos(h.patternPhase) * orbitRadius;
        h.pos.y = h.anchorPos.y + Math.sin(h.patternPhase) * orbitRadius;
        break;
      }
    }

    return true;
  });
}

export function updateEnemies(state: GameState, dt: number = 1) {
  const { enemies, player } = state;
  const playerPos = player.pos;
  const enemyDt = hasTimeSlowEffect(state) ? dt * 0.3 : dt;

  const gridSize = ENEMY_SPATIAL_CELL_SIZE;
  const grid: Record<string, number[]> = {};

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const gx = Math.floor(e.pos.x / gridSize);
    const gy = Math.floor(e.pos.y / gridSize);
    const key = `${gx},${gy}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(i);
  }

    for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    /** Taunt: while companion holds aggro, swap target so chase + ranged AI both
     *  point at the companion. Bosses/minibosses are immune (handled by helper). */
    const aggroPos = getEnemyAggroPos(state, enemy);
    const dx = aggroPos.x - enemy.pos.x;
    const dy = aggroPos.y - enemy.pos.y;
    const distSq = dx * dx + dy * dy;

    if (distSq <= 0.01) continue;
    const dist = Math.sqrt(distSq);

    let { vx, vy } = computeEnemyVelocity(enemy, state, enemyDt, dist, dx, dy);
    const sep = getSeparationForce(enemy, enemies, grid, gridSize, i, enemy.enemyType, state);
    vx += sep.vx;
    vy += sep.vy;

    runEnemyAttacks(enemy, state, dist, dx, dy, vx, vy);
    tickSurvivalBossPattern(state, enemy, dist, dx, dy, enemyDt);

    // REGENERATING: heals 5 HP/sec
    if (enemy.enemyType === EnemyType.REGENERATING && enemy.health < enemy.maxHealth) {
      enemy.health = Math.min(enemy.maxHealth, enemy.health + (5 / 60) * enemyDt);
    }

    // SHIELDED: shield restores after recharge timer expires
    if (enemy.enemyType === EnemyType.SHIELDED && enemy.aiState === 'recharge' && (enemy.aiTimer ?? 1) <= 0) {
      enemy.damageResist = 0.85;
      enemy.shieldHealth = 10;
      enemy.aiState = 'chase';
    }

    finalizeEnemyMovement(enemy, state, vx, vy, enemyDt, i);
    resolveObstacleCollision(enemy, state.obstacles);
  }
}

export function activateUltimate(state: GameState): void {
  if (state.ultimateCharge < 100) return;
  
  // Deactivate non-boss enemies (pool them instead of filtering)
  for (const e of state.enemies) {
    if (e.active === false || e.enemyType === EnemyType.BOSS) continue;
    e.health = -1;
    e.active = false;
    state.activeEnemyCount = Math.max(0, state.activeEnemyCount - 1);
  }
  
  // Clear bullets
  state.projectiles = [];
  
  state.ultimateCharge = 0;
}