import { Entity, EnemyType, GameState } from '../types';
import {
  createExplosion,
  createImpact,
  createImplosion,
  spawnItem,
  spawnXpOrb,
} from '../Logic';
import { spawnDamageNumber } from '../juice/damageNumbers';
import { triggerHitFeedback, isBossHit } from '../juice/hitFeedback';
import {
  getCombatDensityTier,
  shouldApplyHitTimer,
  shouldTriggerHitFeedback,
} from '../balance/combatDensity';
import { beginBossWarp, pickRandomBoss } from '../content/bossArenas';

export interface BeamHitContext {
  next: GameState;
  player: Entity;
  dt: number;
  damage: number;
  isCrit: boolean;
  onBossKill: () => void;
}

export function applyBeamHit(ctx: BeamHitContext, e: Entity): void {
  const { next, player, dt, damage, isCrit } = ctx;
  let finalDmg = damage;
  if (e.damageResist && e.damageResist > 0) finalDmg *= 1 - e.damageResist;
  if (e.health < e.maxHealth * 0.5 && next.hunterMarkBonus > 0) {
    finalDmg *= 1 + next.hunterMarkBonus;
  }
  if (next.frostSlowStrength > 0) {
    e.frostTimer = Math.max(e.frostTimer || 0, 45 * next.frostSlowStrength);
  }
  if (isCrit && next.burnOnCrit) {
    e.burnTimer = Math.max(e.burnTimer || 0, 120);
  }

  e.health -= finalDmg;
  const densityTier = getCombatDensityTier(next.enemies.length);
  const isKill = e.health <= 0;
  if (shouldApplyHitTimer(densityTier, isCrit, isKill)) {
    e.hitTimer = 3;
  }

  if (next.lifeSteal > 0 && isKill) {
    player.health = Math.min(player.maxHealth, player.health + e.maxHealth * next.lifeSteal);
  }

  const hitKind = isCrit ? 'crit' : isBossHit(e.enemyType) ? 'boss' : 'normal';
  if (shouldTriggerHitFeedback(densityTier, hitKind)) {
    triggerHitFeedback(next, hitKind);
  }

  const chaosFactor = Math.max(1, next.enemies.length / 50);
  spawnDamageNumber(
    next.damageTexts,
    e.pos.clone(),
    finalDmg,
    isCrit ? '#fde047' : isKill ? '#ef4444' : '#ffffff',
    isCrit,
    chaosFactor,
    isKill
  );

  if (Math.random() > 1 - 0.2 / chaosFactor) {
    next.particles.push(...createImpact(e.pos, '#00f2ff', isCrit ? 6 : 1));
  }

  if (isCrit) {
    // next.particles.push(...createExplosion(e.pos, '#ffffff', 5, 2));
  }

  if (e.health <= 0) {
    handleEnemyDeath(ctx, e, chaosFactor);
  }
}

function handleEnemyDeath(ctx: BeamHitContext, e: Entity, chaosFactor: number): void {
  const { next, player, onBossKill } = ctx;
  next.combo++;
  next.comboTimer = 1.5;
  const scoreGain =
    100 * (next.buffs.scoreX > 0 ? 2 : 1) * Math.min(10, next.combo) * next.comboDamageMult;
  next.score += scoreGain;
  next.killCountSinceHeal += 1;

  const rarityColor = e.enemyType === EnemyType.BOSS ? '#fbbf24' : e.color;
  // next.particles.push(...createImplosion(e.pos, rarityColor, Math.max(1, 4 / chaosFactor)));
  // const explCount = e.enemyType === EnemyType.BOSS ? 15 : Math.max(2, 6 / chaosFactor); 
  // next.particles.push(...createExplosion(e.pos, e.color, explCount, 1.2));

  const shakeMult = 1 / Math.sqrt(chaosFactor);
  next.screenshake = Math.min(
    next.screenshake + (e.enemyType === EnemyType.BOSS ? 2 : 0.5) * shakeMult,
    8
  );
  if (e.enemyType !== EnemyType.BOSS) {
    next.screenFlash = Math.max(next.screenFlash, 0.2);
  }

  next.items.push(spawnXpOrb(e.pos, 25));

  const item = spawnItem(e.pos);
  if (item) next.items.push(item);

  if (e.enemyType === EnemyType.BOSS) {
    next.bossActive = false;
    next.pendingArenaRestore = true;
    next.stageTransition = 300;
    next.screenFlash = 25;
    onBossKill();
  } else if (
    !next.bossActive &&
    next.enemiesToKill > 0 &&
    (next.gameMode === 'NORMAL' || next.gameMode === 'CAMPAIGN')
  ) {
    next.enemiesToKill--;
    if (next.enemiesToKill <= 0 && next.gameMode === 'NORMAL' && next.bossArenaTransition <= 0) {
      const upcoming = pickRandomBoss(next.stage, next.lastBossId);
      next.lastBossId = upcoming.id;
      beginBossWarp(next, upcoming);
    }
  }
}
