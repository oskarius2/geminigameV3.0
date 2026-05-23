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
    return;
  }

  if (pattern === 'swarm_crown') {
    if ((enemy.bossPatternTimer ?? 0) > 0) return;
    enemy.bossPatternTimer = 40;
    const baseAngle = Math.atan2(dy, dx);
    // 4-shot spread arc of fast small projectiles
    for (let i = 0; i < 4; i++) {
      const offset = (i / 3 - 0.5) * 1.1;
      fireAtPlayer(state, enemy, baseAngle + offset, {
        speed: 5.5,
        radius: 7,
        color: '#86efac',
        damage: (enemy.damage ?? 25) * 0.7,
        spread: 0.04,
        count: 1,
      });
    }
    state.screenshake = Math.min(8, state.screenshake + 2);
    return;
  }

  if (pattern === 'wraith_blink') {
    if ((enemy.bossPatternTimer ?? 0) > 0) return;
    enemy.bossPatternTimer = 60;
    // Teleport to a random position in the arena close to the player
    const arenaW = state.world.width;
    const arenaH = state.world.height;
    const margin = 120;
    const newX = margin + Math.random() * (arenaW - margin * 2);
    const newY = margin + Math.random() * (arenaH - margin * 2);
    enemy.pos.x = newX;
    enemy.pos.y = newY;
    // Brief invulnerability flash
    enemy.hitTimer = Math.max(enemy.hitTimer ?? 0, 18);
    state.screenshake = Math.min(10, state.screenshake + 3);
    // Fire a ring of ghost shots after blink
    const ringCount = 8;
    for (let i = 0; i < ringCount; i++) {
      const a = (i / ringCount) * Math.PI * 2;
      fireAtPlayer(state, enemy, a, {
        speed: 3.5,
        radius: 9,
        color: '#e9d5ff',
        damage: (enemy.damage ?? 30) * 0.6,
        spread: 0,
        count: 1,
      });
    }
    return;
  }
}
