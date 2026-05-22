import { GameState, Obstacle } from '../types';
import { Vector2 } from '../utils/vector';
import { getRailsLevel } from './railsLevels';
import { createRailsRunState, RailsLevel, RailsObstacleSpec } from './types';
import { buildCumulativeLengths, sampleRailAt, worldFromRail } from './geometry';
import { getRailsLateralHalfWidth, getRailsPlayBounds } from './renderCorridor';

function obstacleFromSpec(
  spec: RailsObstacleSpec,
  centerline: RailsLevel['centerline'],
  cumulative: number[],
  corridorHalfWidth: number
): Obstacle {
  const sample = sampleRailAt(centerline, cumulative, spec.atDistance);
  const lateral = spec.lateral * corridorHalfWidth;
  const pos = worldFromRail(sample, lateral);
  const size =
    spec.shape === 'circle'
      ? new Vector2(spec.width, 0)
      : new Vector2(spec.width, spec.height);

  return {
    id: `rails_${spec.id}`,
    type: spec.shape === 'circle' ? 'CIRCLE' : 'RECT',
    pos: new Vector2(pos.x, pos.y),
    size,
    rotation: 0,
    color: spec.color,
  };
}

function computeWorldSize(level: RailsLevel, viewWidth: number, viewHeight: number) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of level.centerline) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const padX = level.corridorHalfWidth + 200;
  const padY = 500;

  return {
    width: Math.max(viewWidth * 1.5, maxX - minX + padX * 2),
    height: Math.max(viewHeight * 2, maxY - minY + padY * 2),
  };
}

/** Configure an existing GameState for ON_RAILS (call after INITIAL_STATE + loadout). */
export function startRailsRun(
  state: GameState,
  levelId: string,
  viewWidth: number,
  viewHeight: number
): boolean {
  const level = getRailsLevel(levelId);
  if (!level) return false;

  const cumulative = buildCumulativeLengths(level.centerline);
  const builtObstacles = level.obstacles.map((spec) =>
    obstacleFromSpec(spec, level.centerline, cumulative, level.corridorHalfWidth)
  );

  const world = computeWorldSize(level, viewWidth, viewHeight);
  const startDistance = 120;
  const startSample = sampleRailAt(level.centerline, cumulative, startDistance);
  const startPos = worldFromRail(startSample, 0);
  const playBounds = getRailsPlayBounds(viewWidth, viewHeight);
  const viewZoom = Math.min(
    0.75,
    Math.max(0.35, playBounds.width / (level.corridorHalfWidth * 2.1))
  );
  const playLateralHalf = getRailsLateralHalfWidth(viewWidth, viewZoom);

  state.gameMode = 'ON_RAILS';
  state.rails = {
    ...createRailsRunState(level),
    distance: startDistance,
    builtObstacles,
    cumulativeLengths: [...cumulative],
    viewZoom,
    corridorHalfWidth: playLateralHalf,
    killCount: 0,
    triggeredWaveIds: [],
    wavePowerupBudget: 0,
    bossSpawned: false,
    bossDefeated: false,
    bossCombatActive: false,
    bossEntrance: null,
    bossDeath: null,
    levelClearedBannerUntil: 0,
    weakPointOpen: false,
    weakPointPhase: 0,
    weakPointWasOpen: false,
    weakPointHitFlash: 0,
    weakPointHitFlashUntil: 0,
    shieldBubbleHits: 0,
    rapidFireUntil: 0,
    slowTimeUntil: 0,
    scoreMultUntil: 0,
    invincibleUntil: 0,
    megaBlastCharges: 0,
    enemySlowMult: 1,
    forward: 0,
  };

  state.campaignLevelId = null;
  state.campaignDialogQueue = [];
  state.campaignCameraPos = null;
  state.campaignCameraAngle = null;
  state.campaignZoom = viewZoom;

  state.bossActive = false;
  state.activeBossId = null;
  state.bossArenaTransition = 0;
  state.bossArenaSwapped = false;
  state.inBossArena = false;
  state.mainWorldSnapshot = null;
  state.stage = 1;
  state.enemiesToKill = 0;
  state.stageTransition = 0;
  state.spawnRampTimer = 0;
  state.cardTimer = 99999;
  state.pendingEvent = null;

  state.world = world;
  state.obstacles = builtObstacles;
  state.enemies = [];
  state.projectiles = [];
  state.items = [];
  state.hazards = [];
  state.particles = [];
  state.damageTexts = [];

  state.survivalTime = 0;
  state.score = 0;
  state.isGameOver = false;
  state.isPaused = false;
  state.combo = 0;
  state.wave = 1;
  state.threatLevel = 0;
  state.threatPeak = 0;
  state.screenshake = 0;
  state.screenFlash = 0;

  state.player.pos = new Vector2(startPos.x, startPos.y);
  state.player.velocity = new Vector2(0, 0);
  state.player.maxHealth = 3;
  state.player.health = 3;

  const viewWorldW = playBounds.width / viewZoom;
  const viewWorldH = viewHeight / viewZoom;
  state.camera = new Vector2(
    startSample.x - playBounds.centerX / viewZoom,
    Math.max(0, Math.min(world.height - viewWorldH, startPos.y - viewWorldH * 0.72))
  );

  if (import.meta.env.DEV) {
    console.log('[ON_RAILS] startRailsRun', {
      levelId,
      gameMode: state.gameMode,
      rails: !!state.rails,
      playerPos: { x: state.player.pos.x, y: state.player.pos.y },
      camera: { x: state.camera.x, y: state.camera.y },
      viewZoom: state.rails?.viewZoom,
    });
  }

  return true;
}
