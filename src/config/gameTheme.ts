/**
 * ============================================================================
 * GAME THEME - Central Design System
 * ============================================================================
 * All magic numbers extracted to a single source of truth.
 * Organized by category for easy maintenance and balancing.
 */

// ============================================================================
// COLORS - All hex/rgba values
// ============================================================================

export const COLORS = {
  // Player & UI
  player: '#60a5fa',
  playerTrail: 'rgba(96, 165, 250, 0.3)',
  
  // Projectiles (player)
  projectile: '#00e5ff',
  projectileGlow: 'rgba(0, 229, 255, 0.8)',
  projectileCore: '#e0f7ff',
  // Enemy projectile palette — typed
  enemyProjectile: '#ff5566',         // default red/orange
  enemyProjectileDanger: 'rgba(255, 20, 0, 0.25)',
  rocketTrail: '#ff6600',
  
  // Items
  xpOrb: '#22d3ee',
  health: '#4ade80',
  energy: '#fbbf24',
  legendary: '#a855f7',
  rare: '#f97316',
  
  // ============================================================================
  // ENEMIES — Cohesive palette grouped by archetype role
  // Melee (red)  · Tank (gold)  · Ranged (cyan)  · Swarm (purple)  · Special
  // ============================================================================

  // MELEE archetype — Red family
  enemyBase: '#ef4444',
  enemyChaser: '#ef4444',     // sleek red diamond
  enemyFast: '#f97316',       // red/orange streak
  enemyDasher: '#ff5722',     // deep red trapezoid
  enemyStriker: '#dc2626',    // menacing red hex

  // TANK archetype — Gold family
  enemyTank: '#b45309',       // dull steel gold
  enemyPhalanx: '#d97706',    // bronze shield pentagon
  enemyFortified: '#78716c',  // steel gray with gold trim (trim drawn in renderer)
  enemyElite: '#fbbf24',      // premium gold octagon

  // RANGED archetype — Cyan/Blue family
  enemyRanged: '#06b6d4',     // cyan triangle
  enemySniper: '#0891b2',     // cold blue spike
  enemyZapper: '#38bdf8',     // electric cyan orb
  enemyNova: '#0ea5e9',       // blue starburst

  // SWARM archetype — Purple family
  enemySwarmer: '#a855f7',
  enemySwarmV2: '#9333ea',    // (referenced via Logic.ts switch)
  enemySplinter: '#c084fc',   // jagged purple shard

  // SPECIAL — varied identity colors
  enemyWraith: '#6366f1',     // indigo phantom (ethereal)
  enemyPhantom: '#818cf8',    // lighter indigo ghost
  enemyTracker: '#22c55e',    // green targeting reticle
  enemyShielded: '#0284c7',   // shielded base color
  enemyRegenerating: '#16a34a', // organic green glow

  boss: '#991b1b',
  bossDark: '#0f172a',
  bossCore: '#ef4444',
  
  // Effects
  hitFlash: '#ffffff',
  explosion: '#ff4400',
  screenFlash: '#ffffff',
  critical: '#fbbf24',
  
  // Backgrounds
  spaceDeep: '#020617',
  spaceBlack: '#000000',
  gridLine: 'rgba(56, 189, 248, 0.1)',
  gridCross: 'rgba(56, 189, 248, 0.2)',
  worldBorder: 'rgba(6, 182, 212, 0.6)',
  
  // Nebula & Atmosphere
  nebulaCyan: 'rgba(6, 182, 212, 0.04)',
  nebulaPurple: 'rgba(217, 70, 239, 0.04)',
  nebulaViolet: 'rgba(139, 92, 246, 0.04)',
  
  // Buffs
  overdrive: '#f43f5e',
  shield: '#3b82f6',
  timeSlow: '#06b6d4',
  rapidFire: '#f97316',
  magnet: '#8b5cf6',
  
  // Damage Text
  damageRed: '#f87171',
  damageGreen: '#4ade80',
  damageYellow: '#fbbf24',
  damagePurple: '#a78bfa',
  
  // Obstacles
  obstacleBase: 'rgba(15, 23, 42, 0.8)',
  obstacleCyan: 'rgba(6, 182, 212, 0.05)',
  obstaclePurple: 'rgba(217, 70, 239, 0.05)',
  obstacleAccent: 'rgba(96, 165, 250, 0.05)',
} as const;

// ============================================================================
// HAZARD_COLORS — Comets, asteroids, debris (moving hazards)
// Each has a distinct identity so they can't be confused with enemies.
// ============================================================================

export const HAZARD_COLORS = {
  // COMET: fast cyan streaker, bright hot core
  cometBody: '#00e5ff',
  cometTrail: '#7dd3fc',
  cometCore: '#ffffff',

  // ASTEROID: slow rocky tumbler, gray/brown sheen
  asteroidBody: '#78716c',
  asteroidTrail: '#a8a29e',
  asteroidCrater: 'rgba(0, 0, 0, 0.45)',

  // DEBRIS: small orange/gold shard
  debrisBody: '#ff7f00',
  debrisTrail: '#fbbf24',
  debrisCore: '#fde047',
} as const;

// ============================================================================
// PROJECTILE_COLORS — Per-weapon and per-enemy projectile identity
// ============================================================================

export const PROJECTILE_COLORS = {
  // Player weapons
  playerPulse: '#00e5ff',
  playerRocket: '#ff6b00',
  playerPlasma: '#a855f7',
  playerRailgun: '#ffffff',
  playerFlame: '#ff4400',
  playerShotgun: '#fbbf24',

  // Enemy types
  enemyStandard: '#ff5566',  // red/orange — visible against dark BG
  enemyGravity: '#a855f7',   // purple gravity well
  enemyBarrage: '#ef4444',   // red machine-gun pellets
  enemySlam: '#ff6b00',      // orange explosive ball
  enemySwarm: '#c084fc',     // tiny purple dots
  enemyWraith: '#6366f1',    // indigo ghostly bolt
  enemySniper: '#06b6d4',    // sharp cyan laser
  enemyTracker: '#22c55e',   // green tracking shot
} as const;

// ============================================================================
// GLOW_INTENSITY — Shadow blur per object type (mobile fallback = 0)
// ============================================================================

export const GLOW_INTENSITY = {
  enemyDefault: 12,
  enemyElite: 18,
  enemyBoss: 30,
  enemyMiniBoss: 24,
  hazardComet: 22,    // brightest hazard glow
  hazardAsteroid: 8,  // dimmer rocky glow
  hazardDebris: 10,
  projectilePlayer: 18,
  projectileEnemy: 14,
  projectileRocket: 30,
} as const;

// ============================================================================
// SIZES - All pixel/radius values
// ============================================================================

export const SIZES = {
  // Player
  playerRadius: 15,
  playerInitialHealth: 450,
  playerInitialMaxHealth: 450,
  
  // Projectiles
  projectileRadius: 8,
  projectileTrailLength: 25,
  rocketTrailLength: 35,
  
  // Items
  xpOrbRadius: 10,
  itemRadius: 12,
  
  // Enemies - Base
  enemyBaseRadius: 12,
  enemyChaserRadius: 25,
  enemyPhalanxRadius: 40,
  enemyWraithRadius: 18,
  enemyEliteRadius: 35,
  enemySplinterRadius: 25,
  enemyNovaRadius: 22,
  enemyRangedRadius: 20,
  enemyFastRadius: 11,
  enemySwarmerRadius: 9,
  enemySniperRadius: 20,
  enemyDasherRadius: 10,
  enemyPhantomRadius: 16,
  enemyZapperRadius: 13,
  enemyStrikerRadius: 18,
  enemyTrackerRadius: 17,
  enemyTankRadius: 44,
  enemyShieldedRadius: 22,
  enemyRegeneratingRadius: 20,
  enemyFortifiedRadius: 44,
  
  // Bosses
  bossBaseRadius: 100,
  bossRadiusPerStage: 12,
  
  // Hazards
  hazardLaserLength: 400,
  hazardLaserWidth: 10,
  hazardZoneSize: 200,
  
  // Obstacles
  obstacleMinSize: 40,
  obstacleMaxSize: 140,
  landmarkMinSize: 40,
  landmarkMaxSize: 100,
  
  // Grid & World
  gridSize: 400,
  spatialCellSize: 150,
  cullMargin: 200,
  cullMarginMobile: 50,
  
  // UI
  minimapSize: 120,
  minimapPadding: 20,
  healthBarHeight: 4,
  miniBossHealthBarHeight: 6,
  
  // Orbitals & Effects
  orbitalRadius: 100,
  orbitalSize: 12,
  threatAuraBase: 2.5, // multiplier
  
  // Particles
  particleMinSize: 4,
  particleMaxSize: 12,
  explosionParticleSpeedMin: 20,
  explosionParticleSpeedMax: 80,
} as const;

// ============================================================================
// PHYSICS - Speeds, forces, and movement
// ============================================================================

export const PHYSICS = {
  // Player Movement
  playerBaseSpeed: 9,
  dashSpeedMultiplier: 2.5,
  dashEnergyCost: 30,
  
  // Enemy Movement
  enemyBaseSpeedMin: 1.5,
  enemyBaseSpeedMax: 2.0,
  enemyChaserSpeedMult: 0.8,
  enemyPhalanxSpeedMult: 0.3,
  enemyWraithSpeedMult: 1.4,
  enemyEliteSpeedMult: 1.1,
  enemySplinterSpeedMult: 0.8,
  enemyNovaSpeedMult: 1.1,
  enemyRangedSpeedMult: 0.85,
  enemyFastSpeedMult: 2.3,
  enemySwarmerSpeedMult: 2.6,
  enemySniperSpeedMult: 0.6,
  enemyDasherSpeedMult: 2.8,
  enemyPhantomSpeedMult: 1.5,
  enemyZapperSpeedMult: 1.1,
  enemyStrikerSpeedMult: 1.9,
  enemyTrackerSpeedMult: 1.15,
  enemyTankSpeedMult: 0.2,
  enemyShieldedSpeedMult: 0.9,
  enemyRegeneratingSpeedMult: 0.8,
  enemyFortifiedSpeedMult: 0.2,
  
  // Projectile Speed
  projectileSpeed: 20,
  rocketSpeed: 15,
  
  // Combat
  baseDamage: 18,
  bossBaseDamage: 15,
  bossBaseDamagePerTier: 2,
  bossDamageResist: 0.35,
  shieldedDamageResist: 0.85,
  
  // Enemy Health Multipliers
  enemyChaserHealthMult: 10,
  enemyPhalanxHealthMult: 30,
  enemyWraithHealthMult: 5,
  enemyEliteHealthMult: 15,
  enemySplinterHealthMult: 8,
  enemyNovaHealthMult: 6,
  enemyRangedHealthMult: 2.5,
  enemyFastHealthMult: 0.4,
  enemySwarmerHealthMult: 0.15,
  enemySniperHealthMult: 8,
  enemyDasherHealthMult: 0.5,
  enemyPhantomHealthMult: 4,
  enemyZapperHealthMult: 1.8,
  enemyStrikerHealthMult: 5,
  enemyTrackerHealthMult: 7,
  enemyTankHealthMult: 60,
  enemyShieldedHealthMult: 8,
  enemyRegeneratingHealthMult: 12,
  enemyFortifiedHealthMult: 60,
  
  // Boss Stats
  bossBaseHealth: 24000,
  bossHealthExponent: 1.55,
  bossSpeedBase: 0.8,
  bossSpeedPerStage: 0.1,
  
  // Forces & Knockback
  knockbackForce: 5,
  explosionKnockback: 10,
  separationForce: 2,
  
  // Regeneration
  enemyRegenerationRate: 5, // HP per second
  playerRegenRate: 0, // Base (modified by passives)
  
  // Friction & Drag
  particleFriction: 0.92,
  projectileDrag: 0.98,
} as const;

// ============================================================================
// TIMING - Durations, cooldowns, intervals (in seconds or frames)
// ============================================================================

export const TIMING = {
  // Hit Feedback
  hitFlashDuration: 0.1,
  hitStopDuration: 3,
  screenFlashDuration: 5,
  iframeDuration: 0.5,
  
  // Dash
  dashDuration: 0.15,
  dashCooldown: 1.0,
  
  // Buffs
  overdriveBaseDuration: 8,
  shieldBaseDuration: 10,
  rapidFireBaseDuration: 6,
  timeSlowBaseDuration: 5,
  magnetBaseDuration: 8,
  
  // Cooldowns
  ultimateCooldown: 30,
  emergencyShieldCooldown: 45,
  voidRiftCooldown: 15,
  timeDilationCooldown: 20,
  
  // Combat
  fireRate: 0.16, // seconds between shots
  chargeTime: 1.0,
  reloadTime: 2.0,
  
  // Particles
  particleLifeMin: 0.6,
  particleLifeMax: 1.0,
  particleFlashLife: 0.5,
  particleRingLife: 0.8,
  particleCrossLife: 0.4,
  
  // Enemy AI
  enemyAITickRate: 0.05,
  enemyShootCooldown: 1.5,
  bossAttackCooldown: 2.0,
  
  // Spawning
  spawnRampDuration: 10,
  waveInterval: 5,
  eventTimerMin: 1200, // frames (20 seconds)
  eventTimerMax: 1800, // frames (30 seconds)
  
  // Animations
  bounceAnimSpeed: 400, // ms
  rotationSpeed: 1.5, // radians per second
  pulseSpeed: 150, // ms period
} as const;

// ============================================================================
// FX - Visual effects parameters
// ============================================================================

export const FX = {
  // Glow & Shadows
  shadowBlurPlayer: 15,
  shadowBlurEnemy: 15,
  shadowBlurBoss: 30,
  shadowBlurProjectile: 20,
  shadowBlurItem: 8,
  shadowBlurOrbit: 15,
  
  // Screenshake
  screenshakeHit: 2,
  screenshakeCrit: 4,
  screenshakeExplosion: 6,
  screenshakeBoss: 8,
  screenshakeMin: 0.5,
  
  // Trails & Streaks
  trailAlpha: 0.15,
  trailWidthMult: 1.8,
  streakLengthMult: 2.5,
  dashGhostCount: 5,
  dashGhostSpacing: 0.8,
  
  // Particles
  explosionParticleCount: 4,
  implosionParticleCount: 6,
  impactParticleCount: 1,
  sparkleParticleCount: 4,
  
  // Flashes & Pulses
  hitFlashIntensity: 1.0,
  critFlashIntensity: 1.5,
  bossFlashIntensity: 2.0,
  pulseAmplitude: 0.1,
  pulseSpeed: 150, // ms
  
  // Grid & Background
  starCountBase: 300,
  starCountMobile: 200,
  dustCountBase: 120,
  dustCountMobile: 40,
  nebulaCountBase: 12,
  nebulaCountMobile: 8,
  
  // Vignette
  vignetteIntensity: 0.5,
  vignetteLowHP: 0.8,
  vignetteDanger: 0.6,
  
  // Chromatic Aberration
  chromaticAberrationStrength: 15,
  chromaticAberrationAlpha: 0.6,
  
  // Zoom & Camera
  baseZoom: 0.5,
  railsZoom: 1.0,
  campaignZoom: 0.5,
} as const;

// ============================================================================
// SPAWN - Spawning parameters
// ============================================================================

export const SPAWN = {
  // Positioning
  spawnDistanceMin: 1000,
  spawnDistanceMax: 1300,
  spawnJitter: 200,
  obstaclePadding: 30,
  positionAttempts: 5,
  
  // Wave Config
  baseEnemiesToKill: 40,
  enemiesPerStage: 2,
  obstaclesBase: 8,
  obstaclesPerStage: 2,
  landmarkCount: 3,
  landmarkPerStage: 0.5,
  
  // Drop Rates
  healthDropChance: 0.25,
  itemDropChance: 0.1,
  xpDropChance: 1.0,
  
  // XP Rewards
  xpPerKillBase: 25,
  xpPerKillElite: 100,
  xpPerKillBoss: 500,
} as const;

// ============================================================================
// WORLD - World generation & bounds
// ============================================================================

export const WORLD = {
  // Initial World Size
  worldSizeMultiplier: 30,
  worldExpansionAmount: 2000,
  
  // Bounds & Limits
  minWorldSize: 800,
  maxWorldSize: 20000,
  
  // Camera
  cameraLerpSpeed: 0.1,
  cameraLookAhead: 100,
  
  // Minimap
  minimapRevealBase: 2000,
  minimapRevealPerLevel: 500,
  
  // Portals
  portalTriggerRadius: 120,
  portalGlowRadius: 100,
} as const;

// ============================================================================
// BALANCE - Difficulty scaling & progression
// ============================================================================

export const BALANCE = {
  // XP & Leveling
  initialXpRequirement: 1500,
  xpGrowthRate: 1.2,
  
  // Threat System
  threatPerKill: 1,
  threatDecayRate: 0.1,
  threatCapBase: 100,
  threatCapPerStage: 20,
  
  // Time Scaling
  timeRampCap: 0.6, // +60% max
  timeRampDuration: 1200, // 20 minutes
  
  // Trait Modifiers
  traitAgileSpeedBonus: 0.2,
  traitHardHitterDamageBonus: 0.25,
  traitScavengerScrapBonus: 0.5,
  traitHullPlatingHealthBonus: 150,
  traitFrailHealthPenalty: 100,
  traitClunkySpeedPenalty: 0.15,
  traitGlassCannonHealthPenalty: 0.3,
  traitGlassCannonDamageBonus: 0.15,
  
  // Crit System
  baseCritChance: 0.1,
  critDamageMultiplier: 2.0,
  
  // Combo System
  comboDecayRate: 1, // per second
  comboDamageBonus: 0.05, // per combo level
} as const;

// ============================================================================
// ENERGY - Energy system values
// ============================================================================

export const ENERGY = {
  maxEnergy: 100,
  regenRate: 0.5, // per frame
  dashCost: 30,
  ultCost: 100,
  abilityCost: 25,
} as const;

// ============================================================================
// TYPE EXPORTS - For TypeScript intellisense
// ============================================================================

export type ColorKey = keyof typeof COLORS;
export type SizeKey = keyof typeof SIZES;
export type PhysicsKey = keyof typeof PHYSICS;
export type TimingKey = keyof typeof TIMING;
export type FXKey = keyof typeof FX;
export type SpawnKey = keyof typeof SPAWN;
export type WorldKey = keyof typeof WORLD;
export type BalanceKey = keyof typeof BALANCE;
export type EnergyKey = keyof typeof ENERGY;
