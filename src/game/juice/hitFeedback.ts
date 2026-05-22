import { EnemyType, Entity, GameState } from '../types';
import { playSfx, SfxEvent } from '../audio/sfx';

export type HitKind = 'normal' | 'crit' | 'shield' | 'boss';

/** TV glitch + chromatic tear (Renderer) — same juice as ON_RAILS damage. */
export type PlayerDamageGlitchSeverity = 'light' | 'hit' | 'fatal';

const GLITCH_BY_SEVERITY: Record<
  PlayerDamageGlitchSeverity,
  { screenFlash: number; hitTimer: number; screenshake: number }
> = {
  light: { screenFlash: 4, hitTimer: 6, screenshake: 2 },
  hit: { screenFlash: 10, hitTimer: 12, screenshake: 5 },
  fatal: { screenFlash: 18, hitTimer: 20, screenshake: 12 },
};

/** Screen "breaks" / RGB slice glitch when the player takes damage or dies. */
export function applyPlayerDamageGlitch(
  state: GameState,
  player: Entity,
  severity: PlayerDamageGlitchSeverity = 'hit'
): void {
  const g = GLITCH_BY_SEVERITY[severity];
  state.screenFlash = Math.max(state.screenFlash || 0, g.screenFlash);
  player.hitTimer = Math.max(player.hitTimer ?? 0, g.hitTimer);
  state.screenshake = Math.max(state.screenshake || 0, g.screenshake);
}

/** Only hitStop at or above this freezes the game loop (see App.tsx). */
export const GAMEPLAY_HITSTOP_THRESHOLD = 1;

export function triggerHitFeedback(state: GameState, kind: HitKind): void {
  switch (kind) {
    case 'crit':
      playSfx('crit');
      state.hitStop = Math.max(state.hitStop || 0, 0.8);
      state.screenFlash = Math.max(state.screenFlash || 0, 1.2);
      state.screenshake = Math.max(state.screenshake || 0, 0.8);
      break;
    case 'boss':
      playSfx('hit');
      state.hitStop = Math.max(state.hitStop || 0, 1.2);
      state.screenFlash = Math.max(state.screenFlash || 0, 1.5);
      state.screenshake = Math.max(state.screenshake || 0, 1.2);
      break;
    case 'shield':
      playSfx('shield');
      state.hitStop = Math.max(state.hitStop || 0, 1);
      state.screenFlash = Math.max(state.screenFlash || 0, 3.0);
      state.screenshake = Math.max(state.screenshake || 0, 2.0);
      break;
    case 'normal':
    default:
      playSfx('hit');
      state.screenFlash = Math.max(state.screenFlash || 0, 0.15);
      state.screenshake = Math.max(state.screenshake || 0, 0.25);
      break;
  }
}

export function shootSfxForSlot(slot: 'CANNON_A' | 'CANNON_B'): void {
  const map: Record<string, SfxEvent> = {
    CANNON_A: 'shoot_a',
    CANNON_B: 'shoot_b',
  };
  playSfx(map[slot]);
}

export function isBossHit(enemyType?: EnemyType): boolean {
  return enemyType === EnemyType.BOSS;
}
