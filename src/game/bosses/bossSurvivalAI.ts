import { EnemyType, type Entity, type GameState } from '../types';
import { fireAtPlayer } from '../ai/enemyBehaviors';
import { getBossAttackPattern } from './bossSpecs';

/**
 * Stage-specific boss pattern ticks (void cardinal / crimson tyrant).
 * Colossus and wraith lord patterns live in enemyBehaviors.ts via activeBossId.
 */
export function tickSurvivalBossPattern(
  state: GameState,
  enemy: Entity,
  dist: number,
  dx: number,
  dy: number,
  dt: number,
): void {
  if (enemy.enemyType !== EnemyType.BOSS || !state.activeBossId) return;

  const pattern = enemy.bossPatternId ?? getBossAttackPattern(state.activeBossId);
  if (pattern === 'standard' || pattern === 'colossus_slam') return;

  enemy.bossPatternTimer = (enemy.bossPatternTimer ?? 0) - dt;

  if (pattern === 'gravity_pulse') {
    if ((enemy.bossPatternTimer ?? 0) > 0) return;
    enemy.bossPatternTimer = 90;
    state.buffs.timeSlow = Math.max(state.buffs.timeSlow, 45);
    state.screenshake = Math.min(12, state.screenshake + 4);
    if (dist < 420) {
      const angle = Math.atan2(dy, dx);
      for (let i = 0; i < 6; i++) {
        const offset = (i / 5 - 0.5) * 0.6;
        fireAtPlayer(state, enemy, angle + offset, {
          speed: 4.5,
          radius: 10,
          color: '#6366f1',
          damage: (enemy.damage ?? 30) * 0.85,
          spread: 0.05,
          count: 1,
        });
      }
    }
    return;
  }

  if (pattern === 'enforcer_barrage') {
    if ((enemy.bossPatternTimer ?? 0) > 0 || dist > 700) return;
    enemy.bossPatternTimer = 55;
    const angle = Math.atan2(dy, dx);
    fireAtPlayer(state, enemy, angle, {
      speed: 8,
      radius: 12,
      color: '#dc2626',
      damage: (enemy.damage ?? 35) * 1.1,
      spread: 0.12,
      count: 5,
    });
    state.screenFlash = Math.max(state.screenFlash, 1);
  }
}
