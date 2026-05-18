import { EnemyType, GameState } from '../types';
import { playSfx, SfxEvent } from '../audio/sfx';

export type HitKind = 'normal' | 'crit' | 'shield' | 'boss';

export function triggerHitFeedback(state: GameState, kind: HitKind): void {
  switch (kind) {
    case 'crit':
      playSfx('crit');
      state.hitStop = Math.max(state.hitStop || 0, 1.5);
      state.screenFlash = Math.max(state.screenFlash || 0, 1.5);
      state.screenshake = Math.max(state.screenshake || 0, 1.0);
      break;
    case 'boss':
      playSfx('hit');
      state.hitStop = Math.max(state.hitStop || 0, 2.0);
      state.screenFlash = Math.max(state.screenFlash || 0, 2.0);
      state.screenshake = Math.max(state.screenshake || 0, 1.5);
      break;
    case 'shield':
      playSfx('shield');
      state.hitStop = Math.max(state.hitStop || 0, 1.0);
      state.screenFlash = Math.max(state.screenFlash || 0, 3.0);
      state.screenshake = Math.max(state.screenshake || 0, 2.0);
      break;
    case 'normal':
    default:
      playSfx('hit');
      // Very tiny hit stop for standard hits keeps it feeling chunky
      state.hitStop = Math.max(state.hitStop || 0, 0.5);
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
