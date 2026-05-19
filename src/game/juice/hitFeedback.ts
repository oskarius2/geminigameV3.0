import { EnemyType, GameState } from '../types';
import { playSfx, SfxEvent } from '../audio/sfx';

export type HitKind = 'normal' | 'crit' | 'shield' | 'boss';

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
