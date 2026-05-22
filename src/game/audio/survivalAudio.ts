import { EnemyType, type GameState } from '../types';
import { getThreatTier, type ThreatTier } from '../balance/threat';
import {
  dipMusicForStinger,
  enterBossMusic,
  exitBossMusic,
  playDefeatSting,
  playVictorySting,
  setSurvivalStageLayer,
  setSurvivalThreatMusic,
  startSurvivalMusic,
  stopSurvivalMusic,
  updateBossMusicIntensity,
} from './survivalMusic';
import { duckMusic, scheduleMusicDuck } from './audioEngine';
import { playSfx, type SfxEvent } from './sfx';

let lastThreatTier: ThreatTier | null = null;
let lastBossId: string | null = null;
let bossWarpAnnounced = false;

export function resetSurvivalAudioSession(): void {
  lastThreatTier = null;
  lastBossId = null;
  bossWarpAnnounced = false;
}

export function startSurvivalAudio(): void {
  resetSurvivalAudioSession();
  startSurvivalMusic();
}

export function stopSurvivalAudio(): void {
  stopSurvivalMusic();
  resetSurvivalAudioSession();
}

/** Call each frame in survival loop after threatLevel is updated. */
export function updateSurvivalAudio(state: GameState): void {
  if (state.gameMode !== 'NORMAL') return;

  setSurvivalStageLayer(state.stage);

  const tier = getThreatTier(state.threatLevel);
  if (tier !== lastThreatTier) {
    if (lastThreatTier != null) playSfx('threatChange');
    lastThreatTier = tier;
    if (!state.bossActive) setSurvivalThreatMusic(state.threatLevel);
  }

  if (state.bossActive && state.activeBossId) {
    if (state.activeBossId !== lastBossId) {
      lastBossId = state.activeBossId;
    }
    const boss = state.enemies.find(
      (e) => e.enemyType === EnemyType.BOSS && e.health > 0
    );
    const ratio =
      boss && boss.maxHealth > 0 ? boss.health / boss.maxHealth : 1;
    updateBossMusicIntensity(ratio);
  } else if (lastBossId) {
    lastBossId = null;
    exitBossMusic(state.threatLevel);
  }
}

export function onBossWarpBegin(bossId: string, stage: number): void {
  if (bossWarpAnnounced) return;
  bossWarpAnnounced = true;
  scheduleMusicDuck(0.05, 900, 0.08, 0.5);
  window.setTimeout(() => {
    dipMusicForStinger(300);
    playSfx('bossSpawn');
    enterBossMusic(bossId, stage);
  }, 350);
}

export function onBossWarpEndReset(): void {
  bossWarpAnnounced = false;
}

export function onBossDefeated(state: GameState, bossId: string | null): void {
  playSfx('bossDeath');
  playVictorySting(state.stage);
  scheduleMusicDuck(0.4, 1200, 0.05, 0.6);
  lastBossId = null;
  bossWarpAnnounced = false;
  exitBossMusic(state.threatLevel);
}

export function onPlayerDeath(): void {
  playSfx('playerDeath');
  playDefeatSting();
  stopSurvivalAudio();
}

export function onMiniBossSpawn(): void {
  scheduleMusicDuck(0.7, 1000, 0.06, 0.45);
}

export function onUltimate(): void {
  playSfx('playerUltimate');
  scheduleMusicDuck(0.9, 500, 0.04, 0.25);
}

export function onCompanionAbility(companionId: string): void {
  const map: Record<string, SfxEvent> = {
    guardian: 'companionTaunt',
    scout: 'companionSpeed',
    healer: 'companionHeal',
    gunner: 'companionBurst',
  };
  const ev = map[companionId];
  if (ev) playSfx(ev);
}

export function onBossAttackTell(kind: 'charge' | 'laser' | 'summon' | 'melee' = 'charge'): void {
  const ev: SfxEvent =
    kind === 'laser'
      ? 'bossTellLaser'
      : kind === 'summon'
        ? 'bossTellSummon'
        : kind === 'melee'
          ? 'bossTellMelee'
          : 'bossTellCharge';
  playSfx(ev);
  scheduleMusicDuck(0.8, 500, 0.05, 0.2);
}
