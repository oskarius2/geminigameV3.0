import { GameState } from '../types';
import { Vector2 } from '../utils/vector';
import { resolveObstacleCollision } from '../Logic';
import {
  applyRailsProjectileDrift,
  processRailsWaves,
  updateRailsEnemies,
} from './enemies';
import { updateRailsBosses, checkRailsBossDefeated } from './bosses';
import {
  isBossEntranceActive,
  updateRailsBossEntrance,
} from './bossEntranceAnimations';
import {
  isRailsBossDeathActive,
  updateRailsBossDeath,
} from './bossDeathAnimations';
import { processRailsEnemyKills } from './enemyDeathAnimations';
import {
  syncRailsPowerupTimers,
  updateRailsPowerupPickups,
  collectRailsPowerupPickups,
} from './powerups';
import { applyRailsPlayerHit } from './railsDamage';
import { getRailsPlayBounds } from './renderCorridor';
import { screenXToTargetLateral, smoothFollowLateral } from './steering';
import {
  clampLateral,
  clampRailsForward,
  sampleRailAt,
  worldFromRail,
} from './geometry';

/** Player sits in lower portion of screen; forward is up-screen. */
const RAILS_CAMERA_ANCHOR_Y = 0.72;
const RAILS_FORWARD_SPEED = 100;
const RAILS_KEYBOARD_LATERAL_SPEED = 220;

const RAILS_MAX_ENEMIES = 48;
const RAILS_CULL_BEHIND = 450;

export interface RailsControlsInput {
  /** Pointer X in screen pixels (mouse / touch). */
  pointerScreenX: number;
  moveForward: boolean;
  moveBack: boolean;
  moveLeft: boolean;
  moveRight: boolean;
}

function syncPlayerOnRail(state: GameState): void {
  const rails = state.rails!;
  const sample = sampleRailAt(
    rails.centerline,
    rails.cumulativeLengths,
    rails.distance
  );
  const clamped = clampLateral(rails.lateral, rails.corridorHalfWidth);
  rails.lateral = clamped;
  rails.forward = clampRailsForward(rails.forward, rails.corridorHalfWidth);
  const pos = worldFromRail(sample, clamped, rails.forward);
  state.player.pos = new Vector2(pos.x, pos.y);
  state.player.velocity = new Vector2(0, 0);
}

function updateRailsCamera(
  state: GameState,
  viewWidth: number,
  viewHeight: number
): void {
  const rails = state.rails!;
  state.campaignZoom = rails.viewZoom;
  state.campaignCameraAngle = null;
  state.campaignCameraPos = null;

  const zoom = rails.viewZoom;
  const bounds = getRailsPlayBounds(viewWidth, viewHeight);
  const viewWorldH = viewHeight / zoom;
  const py = state.player.pos.y;
  const sample = sampleRailAt(
    rails.centerline,
    rails.cumulativeLengths,
    rails.distance
  );

  const forwardNudge = (rails.forward / Math.max(1, rails.corridorHalfWidth)) * viewWorldH * 0.06;
  state.camera.x = sample.x - bounds.centerX / zoom;
  state.camera.y = Math.max(
    0,
    Math.min(
      state.world.height - viewWorldH,
      py - viewWorldH * RAILS_CAMERA_ANCHOR_Y - forwardNudge
    )
  );
}

function cullRailsEnemies(state: GameState): void {
  const rails = state.rails!;
  const minDist = rails.distance - RAILS_CULL_BEHIND;

  state.enemies = state.enemies.filter((e) => {
    const d = e.railsDistance ?? rails.distance;
    return d >= minDist && (e.health > 0 || e.railsDying);
  });
}

/** Obstacle touch = -1 HP in ON_RAILS. */
export function checkRailsFatalCollisions(state: GameState): boolean {
  const rails = state.rails!;
  const nowSec = state.survivalTime;

  const pre = state.player.pos.clone();
  resolveObstacleCollision(state.player, state.obstacles);
  if (state.player.pos.sub(pre).magnitude() > 0.5) {
    state.player.pos = pre;
    return applyRailsPlayerHit(state, nowSec);
  }
  return false;
}

function applyRailsMovement(
  state: GameState,
  controls: RailsControlsInput,
  viewWidth: number,
  dtSec: number
): void {
  const rails = state.rails!;
  const range = rails.corridorHalfWidth * 0.5;

  if (controls.moveForward) rails.forward += RAILS_FORWARD_SPEED * dtSec;
  if (controls.moveBack) rails.forward -= RAILS_FORWARD_SPEED * dtSec;
  rails.forward = clampRailsForward(rails.forward, rails.corridorHalfWidth);

  const useKeys = controls.moveLeft || controls.moveRight;
  if (useKeys) {
    if (controls.moveLeft) rails.lateral -= RAILS_KEYBOARD_LATERAL_SPEED * dtSec;
    if (controls.moveRight) rails.lateral += RAILS_KEYBOARD_LATERAL_SPEED * dtSec;
    rails.lateral = clampLateral(rails.lateral, rails.corridorHalfWidth);
  } else {
    const targetLateral = screenXToTargetLateral(
      controls.pointerScreenX,
      viewWidth,
      rails.corridorHalfWidth
    );
    rails.lateral = smoothFollowLateral(
      rails.lateral,
      targetLateral,
      rails.corridorHalfWidth,
      dtSec
    );
  }
}

/**
 * ON_RAILS tick. Returns true when run ended (win or loss).
 */
export function updateOnRails(
  state: GameState,
  dtSec: number,
  controls: RailsControlsInput,
  viewWidth: number,
  viewHeight: number
): boolean {
  const rails = state.rails;
  if (!rails || rails.outcome !== 'active') return false;

  const nowSec = state.survivalTime;

  if (state.player.health <= 0) {
    rails.outcome = 'failed';
    state.isGameOver = true;
    return true;
  }

  syncRailsPowerupTimers(rails, nowSec);

  if (rails.bossDefeated && rails.outcome === 'active') {
    if (nowSec >= rails.levelClearedBannerUntil) {
      rails.outcome = 'cleared';
      state.isGameOver = true;
      state.score += Math.floor(rails.targetSeconds * 10);
      return true;
    }
    updateRailsBossDeath(state, dtSec);
    return false;
  }

  state.survivalTime += dtSec;

  rails.distance = Math.min(
    rails.railLength,
    rails.distance + rails.scrollSpeed * dtSec
  );

  const entranceActive = isBossEntranceActive(rails);
  const bossDeathActive = isRailsBossDeathActive(rails);
  if (entranceActive) {
    updateRailsBossEntrance(state, dtSec);
  } else if (bossDeathActive) {
    updateRailsBossDeath(state, dtSec);
  } else {
    applyRailsMovement(state, controls, viewWidth, dtSec);
  }

  syncPlayerOnRail(state);
  updateRailsCamera(state, viewWidth, viewHeight);

  processRailsWaves(state);
  updateRailsEnemies(state, dtSec);
  processRailsEnemyKills(state, dtSec);
  updateRailsBosses(state, dtSec);
  if (isRailsBossDeathActive(rails)) {
    updateRailsBossDeath(state, dtSec);
  }
  applyRailsProjectileDrift(state, dtSec);
  updateRailsPowerupPickups(state, dtSec);
  collectRailsPowerupPickups(state, nowSec, 56, 40);
  cullRailsEnemies(state);
  checkRailsBossDefeated(state);

  if (checkRailsFatalCollisions(state)) return true;

  return false;
}

/** Scale multiplier for player ship when pressing forward/back. */
export function railsPlayerScale(state: GameState): number {
  const rails = state.rails;
  if (!rails) return 1;
  const t = rails.forward / Math.max(1, rails.corridorHalfWidth * 0.5);
  return 1 + t * 0.12;
}
