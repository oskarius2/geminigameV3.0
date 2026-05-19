import { GameState, Entity, EntityType, Particle, ItemType, EnemyType, Obstacle, Hazard, Trait, RandomEvent } from './types';
import { Vector2 } from './utils/vector';
import { hasTimeSlowEffect } from './buffs/applyBuff';
import {
  computeEnemyVelocity,
  runEnemyAttacks,
  getSeparationForce,
  finalizeEnemyMovement,
} from './ai/enemyBehaviors';
import { getAugmentTier, getTierModifiers } from './balance/augmentTiers';
import { getThreatMult } from './balance/threat';
import { getStageQuota } from './balance/spawnCurve';
import {
  pickEnemyTypeForThreat,
  getEnemyTypeForPick,
  isTypeAtCap,
} from './balance/spawnComposition';
import { BOSS_DEFINITIONS, pickBossForStage } from './content/bosses';
import { getViewportProfile, useReducedEffects } from './controls/mobileLayout';

export { ARTIFACTS, artifactPowerScore } from './content/artifacts';
export { PASSIVE_BUFFS } from './content/buffs';
export { pickBuffs } from './buffs/pickBuffs';
export { getCardIntervalSeconds, getNextLevelExp } from './buffs/cardTiming';
export { computeThreatLevel, getThreatMult, pickEnemyTypeForThreat } from './balance/threat';

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
      color: `rgba(15, 23, 42, 0.8)`, // Dark slate
    });
  }
  return obs;
}

export function getInitialWorldSize(viewWidth: number, viewHeight: number): { width: number; height: number } {
  const base = Math.min(viewWidth, viewHeight);
  const mult = 30; // Increased map size
  return { width: base * mult, height: base * mult };
}

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

export const INITIAL_STATE = (width: number, height: number): GameState => {
  const { width: worldWidth, height: worldHeight } = getInitialWorldSize(width, height);
  const traits = pickRandomTraits();
  
  const state: GameState = {
    player: {
      id: 'player',
      type: EntityType.PLAYER,
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
    score: 0,
    level: 1,
    experience: 0,
    nextLevelExp: 1500,
    isGameOver: false,
    isPaused: false,
    wave: 1,
    stage: 1,
    enemiesToKill: 50,
    bossActive: false,
    activeBossId: null,
    bossArenaTransition: 0,
    bossArenaSwapped: false,
    inBossArena: false,
    mainWorldSnapshot: null,
    lastBossId: null,
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
    playerIFrameTimer: 0,
    hitStop: 0,
    damageTexts: [],
    combo: 0,
    comboTimer: 0,
    gameMode: 'NORMAL',
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
    cardTimer: 0, // Trigger immediately on first frame
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
    eventTimer: 1200 + Math.random() * 600, // First event after ~20-30s
    runScrapEarned: 0,
    postBossBuffPick: false,
  };

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

  return state;
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

  // Add flash center
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

  // Add impact ring
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

export function spawnXpOrb(pos: Vector2, amount = 25): Entity {
  return {
    id: Math.random().toString(36).slice(2, 9),
    type: EntityType.ITEM,
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

  // Small cross impact
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
    if (state.gameMode === 'NORMAL') {
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

export function spawnEnemy(
  state: GameState,
  typeOverride?: number,
  posOverride?: { x: number; y: number }
): Entity | null {
  const worldWidth = state.world.width;
  const worldHeight = state.world.height;
  const playerPos = state.player.pos;
  const tier = getAugmentTier(state.passives.length);
  const tierMods = getTierModifiers(tier);
  const stage = state.stage;
  const threatMult = getThreatMult(state);

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
    pos.x = Math.max(0, Math.min(worldWidth, pos.x));
    pos.y = Math.max(0, Math.min(worldHeight, pos.y));
    pos.x = Math.max(0, Math.min(worldWidth, pos.x + (Math.random() - 0.5) * 200));
    pos.y = Math.max(0, Math.min(worldHeight, pos.y + (Math.random() - 0.5) * 200));
  }

  const skillFactor = Math.sqrt(state.score / 3500 + 1);
  const powerFactor = state.threatLevel / 100;

  // Time-based ramp: +50% damage/health after 5 min, +100% after 10 min, caps at +150% at ~15 min
  const timeRamp = 1 + Math.min(1.5, state.survivalTime / 600);

  const dynamicHealthFactor = 0.7 + powerFactor * 2.0;
  const healthScale =
    tierMods.enemyHpMult * skillFactor * dynamicHealthFactor * timeRamp * threatMult;

  const dynamicSpeedFactor = 0.8 + powerFactor * 1.0;
  const speedScale =
    tierMods.enemySpeedMult *
    Math.min(2.5, skillFactor * dynamicSpeedFactor) *
    Math.min(1.5, 1 + state.survivalTime / 1200);

  const isBoss = state.bossActive && state.enemies.filter((e) => e.enemyType === EnemyType.BOSS).length === 0;

  let radius = 12;
  let health = 20 * healthScale;
  let speed = (1.5 + Math.random() * 0.5) * speedScale;
  let color = '#f87171';
  let enemyType = EnemyType.CHASER;
  let damageResist = 0;

  if (isBoss) {
    const boss =
      BOSS_DEFINITIONS.find((b) => b.id === state.activeBossId) ?? pickBossForStage(stage);
    radius = 100 + stage * 10;
    health = (3500 * Math.pow(1.5, stage - 1)) * dynamicHealthFactor * boss.hpMult;
    speed = (0.8 + stage * 0.1) * speedScale * boss.speedMult;
    color = '#991b1b';
    enemyType = EnemyType.BOSS;
  } else {
    const levelProgress =
      state.gameMode === 'NORMAL' ? getSurvivalLevelProgress(state) : 0;
    const typePick = resolveSpawnTypePick(state, typeOverride, levelProgress);
    if (typePick === null) return null;
    switch (typePick) {
      case 0:
        color = '#ef4444'; 
        radius = 25; // Massive reduction from 70
        health *= 10; // Significant health but not 50x
        speed *= 0.8;
        enemyType = EnemyType.CHASER;
        break;
      case 1:
        color = '#0ea5e9';
        radius = 40;
        health *= 30;
        speed *= 0.3;
        enemyType = EnemyType.PHALANX;
        break;
      case 2:
        color = '#fde68a';
        radius = 18;
        health *= 5;
        speed *= 1.4;
        enemyType = EnemyType.WRAITH;
        break;
      case 3:
        color = '#fbbf24';
        radius = 35;
        health *= 15;
        speed *= 1.1;
        enemyType = EnemyType.ELITE;
        break;
      case 4:
        color = '#f87171';
        radius = 25;
        health *= 8;
        speed *= 0.8;
        enemyType = EnemyType.SPLINTER;
        break;
      case 5:
        color = '#f97316';
        radius = 22;
        health *= 6;
        speed *= 1.1;
        enemyType = EnemyType.NOVA;
        break;
      case 6:
        color = '#c084fc';
        radius = 20;
        health *= 2.5;
        speed *= 0.85;
        enemyType = EnemyType.RANGED;
        break;
      case 7:
        color = '#10b981';
        radius = 16;
        health *= 3;
        speed *= 1.1;
        enemyType = EnemyType.CHASER;
        break;
      case 8:
        color = '#22d3ee';
        radius = 14;
        health *= 4;
        speed *= 1.2;
        enemyType = EnemyType.CHASER;
        damageResist = 0.15;
        break;
      case 9:
        color = '#fde047';
        radius = 11;
        health *= 0.4;
        speed *= 2.3;
        enemyType = EnemyType.FAST;
        break;
      case 10:
        color = '#fb923c';
        radius = 9;
        health *= 0.15;
        speed *= 2.6;
        enemyType = EnemyType.SWARMER;
        break;
      case 11:
        color = '#ef4444';
        radius = 20;
        health *= 8;
        speed *= 0.6;
        enemyType = EnemyType.SNIPER;
        break;
      default:
        color = '#ef4444';
        radius = 14;
        health *= 1.2; // Reduced from 1.5
        speed *= 1;
        enemyType = EnemyType.CHASER;
        break;
    }
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    type: EntityType.ENEMY,
    pos,
    radius,
    health,
    maxHealth: health,
    speed,
    velocity: new Vector2(0, 0),
    color,
    damage: Math.floor((15 + tier * 2) * threatMult * timeRamp * (isBoss ? 2 : 1)),
    enemyType,
    lastShot: Date.now(),
    aiTimer: 0,
    behaviorSeed: Math.random(),
    aiState: 'chase',
    damageResist,
  };
}

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
    
    // Check collision with player
    const dist = state.player.pos.sub(h.pos).magnitude();
    const radius = h.type === 'ZONE' ? Math.max(h.size.x, h.size.y) / 2 : 50; 
    
    if (dist < radius + state.player.radius) {
      if (h.active) {
        state.player.health -= h.damage * dt * 0.1;
        state.screenFlash = Math.max(state.screenFlash, 0.2);
      }
    }
    
    // Toggle active state for laser
    if (h.type === 'LASER') {
        const pulse = Math.sin(h.timer);
        h.active = pulse > 0.5;
    } else {
        h.active = true;
    }
  });
}

export function updateEnemies(state: GameState, dt: number = 1) {
  const { enemies, player } = state;
  const playerPos = player.pos;
  const enemyDt = hasTimeSlowEffect(state) ? dt * 0.3 : dt;

  const gridSize = 120;
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
    const dx = playerPos.x - enemy.pos.x;
    const dy = playerPos.y - enemy.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 0.1) continue;

    let { vx, vy } = computeEnemyVelocity(enemy, state, enemyDt, dist, dx, dy);
    const sep = getSeparationForce(enemy, enemies, grid, gridSize, i, enemy.enemyType, state);
    vx += sep.vx;
    vy += sep.vy;

    runEnemyAttacks(enemy, state, dist, dx, dy, vx, vy);

    finalizeEnemyMovement(enemy, state, vx, vy, enemyDt, i);
    resolveObstacleCollision(enemy, state.obstacles);
  }
}

// Simple circle collision
export function checkCollision(e1: Entity, e2: Entity): boolean {
  const dx = e1.pos.x - e2.pos.x;
  const dy = e1.pos.y - e2.pos.y;
  const distSq = dx * dx + dy * dy;
  const radiusSum = e1.radius + e2.radius;
  return distSq < radiusSum * radiusSum;
}

export function resolveObstacleCollision(entity: Entity, obstacles: Obstacle[]) {
  // Simple push-out resolution
  for (const obs of obstacles) {
    if (!obs?.pos || !obs?.size) continue;
    if (obs.type === 'CIRCLE') {
      const dx = entity.pos.x - obs.pos.x;
      const dy = entity.pos.y - obs.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minRadius = entity.radius + obs.size.x;
      if (dist < minRadius) {
        const overlap = minRadius - dist;
        const pushX = (dx / dist) * overlap;
        const pushY = (dy / dist) * overlap;
        entity.pos.x += pushX;
        entity.pos.y += pushY;
      }
    } else if (obs.type === 'RECT') {
      // Very basic unrotated AABB collision for RECT
      const hw = obs.size.x / 2;
      const hh = obs.size.y / 2;
      // We will ignore rotation for physics simplicity right now, treating as AABB
      
      const testX = Math.max(obs.pos.x - hw, Math.min(entity.pos.x, obs.pos.x + hw));
      const testY = Math.max(obs.pos.y - hh, Math.min(entity.pos.y, obs.pos.y + hh));
      
      const dx = entity.pos.x - testX;
      const dy = entity.pos.y - testY;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < entity.radius * entity.radius) {
        const dist = Math.sqrt(distSq) || 0.001;
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

export function spawnItem(pos: Vector2): Entity | null {
  // 25% chance to drop a health item
  if (Math.random() > 0.25) return null; 
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: EntityType.ITEM,
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

export function activateUltimate(state: GameState): void {
  if (state.ultimateCharge < 100) return;
  
  // Kill non-boss enemies
  state.enemies = state.enemies.filter(e => {
    if (e.enemyType === EnemyType.BOSS) return true;
    // Massive damage
    e.health = -1;
    return false;
  });
  
  // Clear bullets
  state.projectiles = [];
  
  state.ultimateCharge = 0;
}
