import { getMiniBossHpMultiplier } from '../balance/miniBossDifficulty';
import { getMiniBossStats } from '../progression/difficultyScaler';
import { getThreatMult } from '../balance/threat';
import { getAugmentTier, getTierModifiers } from '../balance/augmentTiers';
import { pickSpawnPosition } from '../Logic';
import { Entity, EntityType, GameState } from '../types';
import { Vector2 } from '../utils/vector';
import { getMiniBossDef, type MiniBossId } from './miniBossDefs';

/** Spawn a scripted mini-boss entity for survival wave composition. */
export function spawnMiniBoss(state: GameState, miniBossId: MiniBossId): Entity | null {
  const def = getMiniBossDef(miniBossId);
  const tierMods = getTierModifiers(getAugmentTier(state.passives.length));
  const threatMult = getThreatMult(state);
  const powerFactor = state.threatLevel / 100;
  const timeRamp = 1 + Math.min(1.5, state.survivalTime / 600);
  const skillFactor = Math.sqrt(state.score / 3500 + 1);

  const healthScale =
    tierMods.enemyHpMult * skillFactor * (0.85 + powerFactor * 0.55) * timeRamp * threatMult;
  const speedScale =
    tierMods.enemySpeedMult *
    Math.min(2.2, skillFactor * (0.8 + powerFactor * 0.4)) *
    Math.min(1.4, 1 + state.survivalTime / 1200);

  const rangedBaselineSpeed = 1.35 * speedScale * 0.85;
  const speedRatio = def.baseSpeed / 120;
  const speed = rangedBaselineSpeed * speedRatio;

  const stageStats = getMiniBossStats(state.stage);
  const runScale = 0.65 + healthScale * 0.2 + powerFactor * 0.15;
  let health = stageStats.maxHealth * runScale * getMiniBossHpMultiplier();
  if (state.stage >= 5) {
    const waveBoost = 1 + Math.min(0.45, Math.max(0, state.activeWaveIndex) * 0.07);
    health *= waveBoost;
  }
  const damage = stageStats.damage * threatMult;
  const pos = pickSpawnPosition(state);

  return {
    id: `mb_${miniBossId}_${Math.random().toString(36).slice(2, 9)}`,
    type: EntityType.ENEMY,
    active: true,
    pos,
    radius: def.baseRadius,
    health,
    maxHealth: health,
    speed,
    velocity: new Vector2(0, 0),
    color: def.color,
    damage,
    baseHealth: stageStats.maxHealth,
    baseDamage: stageStats.damage,
    enemyType: def.enemyType,
    miniBossId,
    behaviorSeed: 0.5,
    aiState: 'strafe',
    miniBossShockwaveTimer:
      miniBossId === 'void_harbinger'
        ? 3000
        : miniBossId === 'swarm_overlord'
          ? 2400
          : 2000,
    miniBossBurstShots: 0,
    miniBossBurstCooldown: 0,
    miniBossPhase: 0,
  };
}
