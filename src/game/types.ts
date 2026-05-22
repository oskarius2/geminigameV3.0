import { Vector2 } from './utils/vector';
import type { RailsRunState } from './onRails/types';
import type { CompanionRuntime } from './companions/companionTypes';
import type { ShopItemId, ShopRunFlags } from './shop/shopTypes';

export type GameMode = 'NORMAL' | 'SURVIVAL' | 'AIM_TRAINER' | 'CAMPAIGN' | 'ON_RAILS';

export type ShipId = 'interceptor' | 'gunship' | 'drone';

export type CompanionId = 'guardian' | 'scout' | 'healer' | 'gunner';

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  PROJECTILE = 'PROJECTILE',
  ITEM = 'ITEM',
}

export enum ItemType {
  HEALTH = 'HEALTH',
  ENERGY = 'ENERGY',
  SCORE = 'SCORE',
  MULTISHOT = 'MULTISHOT',
  SHIELD = 'SHIELD',
  OVERDRIVE = 'OVERDRIVE',
  BOMB = 'BOMB',
  MAGNET = 'MAGNET',
  SCORE_MULTIPLIER = 'SCORE_MULTIPLIER',
  RAPID_FIRE = 'RAPID_FIRE',
  TIME_SLOW = 'TIME_SLOW',
  PIERCING = 'PIERCING',
  ARTIFACT = 'ARTIFACT',
  XP = 'XP',
}

export enum EnemyType {
  CHASER = 'CHASER',
  RANGED = 'RANGED',
  TANK = 'TANK',
  BOSS = 'BOSS',
  FAST = 'FAST',
  ELITE = 'ELITE',
  SWARMER = 'SWARMER',
  PHALANX = 'PHALANX',
  WRAITH = 'WRAITH',
  SPLINTER = 'SPLINTER',
  NOVA = 'NOVA',
  SNIPER = 'SNIPER',
  // New variants
  DASHER = 'DASHER',
  PHANTOM = 'PHANTOM',
  ZAPPER = 'ZAPPER',
  STRIKER = 'STRIKER',
  SWARM_V2 = 'SWARM_V2',
  TRACKER = 'TRACKER',
  FORTIFIED = 'FORTIFIED',
  SHIELDED = 'SHIELDED',
  REGENERATING = 'REGENERATING',
  BLOCKER = 'BLOCKER',
  CHARGER = 'CHARGER',
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  velocity: Vector2;
  aimDir?: Vector2;
  color: string;
  damage?: number;
  ownerId?: string;
  itemType?: ItemType;
  enemyType?: EnemyType;
  hitTimer?: number;
  knockback?: Vector2;
  aiTimer?: number;
  lastShot?: number;
  bounceCount?: number;
  life?: number;
  aiState?: 'chase' | 'strafe' | 'retreat' | 'windup' | 'lunge' | 'blink' | 'teleport' | 'invisible' | 'recharge' | 'hover' | 'engage';
  shieldHealth?: number;
  behaviorSeed?: number;
  burnTimer?: number;
  frostTimer?: number;
  damageResist?: number;
  /** Per-projectile homing (e.g. neon_blood retaliation). */
  homing?: boolean;
  /** ON_RAILS: lateral offset from centerline (horizontal only). */
  railsLateral?: number;
  /** ON_RAILS: lerp target for horizontal strafe. */
  railsLateralTarget?: number;
  /** ON_RAILS: arc-length on centerline (spawn ahead, drifts toward player). */
  railsDistance?: number;
  /** ON_RAILS boss id (sentinel_core, iron_titan, void_phantom). */
  railsBossId?: string;
  /** ON_RAILS weak point exposed for 1.5x damage. */
  railsWeakPointOpen?: boolean;
  /** ON_RAILS floating pickup kind. */
  railsPowerup?: string;
  /** ON_RAILS pickup spawn animation progress 0..1. */
  railsPickupAnim?: number;
  /** ON_RAILS death animation playing. */
  railsDying?: boolean;
  railsDeathElapsedMs?: number;
  /** Survival stage boss pattern (void cardinal, crimson tyrant, etc.). */
  bossPatternId?: string;
  bossPatternTimer?: number;
  /** Survival mini-boss archetype id (e.g. shockwave_sentinel). */
  miniBossId?: string;
  miniBossBurstShots?: number;
  miniBossBurstCooldown?: number;
  miniBossShockwaveTimer?: number;
  /** Dash chain / phase counter for mini-boss AI. */
  miniBossPhase?: number;
  /** Void Harbinger drone spawns reference parent mini-boss id. */
  miniBossParentId?: string;
  /** Enemy plasma cluster — splash on impact (pixels). */
  explosiveRadius?: number;
}

export interface Particle {
  id: string;
  pos: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  particleType?: 'dot' | 'spark' | 'ring' | 'cross' | 'flash' | 'streak';
}

export interface Obstacle {
  id: string;
  type: 'RECT' | 'CIRCLE';
  pos: Vector2;
  size: Vector2; // x=width/radius, y=height
  rotation: number;
  color: string;
}

export interface Hazard {
  id: string;
  type: 'LASER' | 'ZONE';
  pos: Vector2; // For zone, center. For laser, start.
  size: Vector2; // width, height (for Zone) or length, thickness (for LASER)
  rotation: number;
  active: boolean;
  timer: number;
  damage: number;
  color: string;
}

export enum BuffRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  EXCLUSIVE = 'EXCLUSIVE',
  MYSTERY = 'MYSTERY',
}

export interface PassiveBuff {
  id: string;
  name: string;
  description: string;
  stackSummary?: string;
  rarity: BuffRarity;
  icon: string;
  tags?: string[];
  maxStacks?: number;
  exclusive?: boolean;
  wowFactor?: 1 | 2 | 3;
  threatWeight?: number;
}

export type ArtifactSlot = 'CANNON_A' | 'CANNON_B' | 'ULTIMATE' | 'ARMOR' | 'MOBILITY';

export interface Artifact {
  id: string;
  name: string;
  description: string;
  rarity: BuffRarity;
  slot: ArtifactSlot;
  stats: {
    damageMod?: number;
    healthMod?: number;
    speedMod?: number;
    energyMod?: number;
    expMod?: number;
    critMod?: number;
    specialType?: string;
    multiShot?: number;
  };
  /** Meta scrap to unlock in vault (optional). */
  scrapCost?: number;
}

export interface Trait {
  id: string;
  name: string;
  description: string;
  type: 'POSITIVE' | 'NEGATIVE';
  isPositive: boolean; // Just for UI styling
}

export interface ChoiceOption {
  id: string;
  label: string;
  description: string;
  // action will be handled in Logic.ts based on ID
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  options: ChoiceOption[];
}

export interface GameState {
  player: Entity;
  enemies: Entity[];
  projectiles: Entity[];
  items: Entity[];
  particles: Particle[];
  obstacles: Obstacle[];
  hazards: Hazard[];
  score: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  survivalTime: number;
  threatLevel: number;
  threatPeak: number;
  augmentCount: number;
  augmentPityExclusive: number;
  runStartTime: number;
  isGameOver: boolean;
  isPaused: boolean;
  wave: number;
  stage: number;
  enemiesToKill: number;
  bossActive: boolean;
  activeBossId: string | null;
  bossArenaTransition: number;
  bossArenaSwapped: boolean;
  inBossArena: boolean;
  mainWorldSnapshot: {
    world: { width: number; height: number };
    obstacles: Obstacle[];
    playerPos: Vector2;
    camera: Vector2;
  } | null;
  lastBossId: string | null;
  /** Last defeated survival boss — drives victory banner copy. */
  lastBossDefeatedId: string | null;
  /** Frames remaining for post-boss victory banner (60fps ticks). */
  bossVictoryBannerTimer: number;
  pendingArenaRestore: boolean;
  stageTransition: number;
  spawnRampTimer: number;
  qualityLevel: 'high' | 'low';
  world: { width: number; height: number };
  camera: Vector2;
  energy: number;
  maxEnergy: number;
  isDashing: boolean;
  dashDirection: Vector2;
  dashDuration: number;
  buffs: {
    shield: number;
    overdrive: number;
    magnet: number;
    scoreX: number;
    rapidFire: number;
    timeSlow: number;
    piercing: number;
  };
  screenshake: number;
  multiShot: number;
  baseDamage: number;
  critChance: number;
  lifeSteal: number;
  regen: number;
  explosiveChance: number;
  bounceCount: number;
  magnetRange: number;
  orbitalCount: number;
  beamFlashes?: any[];
  passives: string[]; // List of passive IDs owned
  rapidFireTimer: number;
  shieldTimer: number;
  screenFlash: number;
  /** Optional tint for screen flash (hex). Cleared when flash ends. */
  screenFlashColor?: string | null;
  playerIFrameTimer: number;
  hitStop: number;
  damageTexts: DamageText[];
  combo: number;
  comboTimer: number;
  gameMode: GameMode;
  selectedShip: ShipId;
  /** Ship + buff fire-rate scaling (1 = baseline). */
  fireRateMultiplier: number;
  /** ON_RAILS only — null in all other modes. */
  rails: RailsRunState | null;
  campaignLevelId: string | null;
  campaignDialogQueue: string[];
  campaignCameraPos: { x: number; y: number } | null;
  campaignZoom: number | null;
  campaignCameraAngle: number | null;
  equippedArtifacts: Record<ArtifactSlot, string | null>;
  activeWeaponSlot: 'CANNON_A' | 'CANNON_B';
  cardTimer: number;
  permanentOverdrive: boolean;
  permanentTimeSlow: boolean;
  permanentRapidFire: boolean;
  permanentPiercing: boolean;
  hasLighting: boolean;
  hasGravityWell: boolean;
  hasBackshot: boolean;
  hasSpiralShot: boolean;
  hasHoming?: boolean;
  burnOnCrit: boolean;
  frostSlowStrength: number;
  thornsDamage: number;
  dashIFrames: boolean;
  dashIFrameTimer: number;
  comboDamageMult: number;
  hasEmergencyShield: boolean;
  emergencyShieldCooldown: number;
  /** 0 or 1 — consumed only when HP would reach 0 (not per-hit block). */
  extraLifeCharges: number;
  smartRicochet: boolean;
  vampiricBurstStacks: number;
  killCountSinceHeal: number;
  chainCritBonus: number;
  pendingCritBonus: number;
  wideArcStacks: number;
  dashEnergyDiscount: number;
  volatileDeath: boolean;
  hasTimeDilation: boolean;
  timeDilationCooldown: number;
  hunterMarkBonus: number;
  runArtifactUnlocks: number;
  bulletStormMult: number;
  multiShotFireRatePenalty: number;
  hasVoidRift: boolean;
  voidRiftCooldown: number;
  killSatelliteCounter: number;
  hasInfinityPierce: boolean;
  runArtifactsUnlockedThisRun: string[];
  pickJuiceTimer: number;
  ultimateCharge: number;
  nextShotBurns: boolean;
  
  // RNG/Survival mechanics
  activeTraits: string[];
  pendingEvent: RandomEvent | null;
  eventTimer: number;
  /** Scrap earned this run (banked to meta scrap on game over). */
  runScrapEarned: number;
  /** Next buff pick favors rare+ (set after boss kill). */
  postBossBuffPick: boolean;

  /** NORMAL survival — wave composition spawn controller. */
  stageEnteredAt: number;
  waveSpawnQueue: EnemyType[];
  waveMiniBossQueue: string[];
  waveSpawnCooldown: number;
  activeWaveIndex: number;
  /** Mini-boss defeat HUD popup timer (seconds). */
  miniBossPopupTimer?: number;
  miniBossPopupText?: string;
  miniBossPopupSubtext?: string;
  miniBossPopupColor?: string;
  /** Mini-boss spawn warning popup (seconds). */
  miniBossSpawnPopupTimer?: number;
  miniBossSpawnPopupText?: string;
  miniBossSpawnPopupSubtext?: string;
  miniBossSpawnPopupColor?: string;
  /** Wave started with a mini-boss in queue — short heads-up (seconds). */
  miniBossIncomingTimer?: number;
  miniBossIncomingText?: string;
  miniBossIncomingColor?: string;
  /** Health snapshot for Temporal Anchor (updated every ~2s). */
  healthSnapshot?: { survivalTime: number; health: number };
  miniBossPassiveRuntime?: {
    damageReductionMult: number;
    damageReductionTimer: number;
    speedBoostMult: number;
    speedBoostTimer: number;
    nextShotShockwave: boolean;
    phantomStrikePending: boolean;
    voidWalkerTimer: number;
    apexPredatorTimer: number;
    apexPredatorCooldown: number;
    temporalAnchorUsed: boolean;
  };

  /** Active companion for this run (null until stage 2 drop). */
  activeCompanionId: CompanionId | null;
  companionLevel: number;
  companionXp: number;
  /** World position, targeting, and stat modifiers for companion AI. */
  companionRuntime: CompanionRuntime | null;
  /** Companion types unlocked across runs / this save. */
  companionsUnlocked: CompanionId[];
  /** First companion slot filled this run. */
  companionGrantedThisRun: boolean;
  /** Ship / cross-ship loot collected this run. */
  collectedShipLoot: string[];
  /** Mini-bosses defeated this survival run. */
  miniBossKillsThisRun: number;

  /** Pre-run shop purchases applied this run. */
  shopPurchasedIds: ShopItemId[];
  shopRunFlags: ShopRunFlags;
  /** Meta scrap spent at run start (for summary). */
  shopScrapSpent: number;
}

export interface DamageText {
  id: string;
  pos: Vector2;
  text: string;
  life: number;
  color: string;
}

export interface BeamFlash {
  id: string;
  origin: Vector2;
  end: Vector2;
  color: string;
  life: number;
  maxLife: number;
}
