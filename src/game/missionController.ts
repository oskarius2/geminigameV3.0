// src/game/missionController.ts
import { MissionManager, MissionEventType } from './missionMode';
import { EnemyType } from './types';

class MissionControllerSingleton {
  private manager: MissionManager;

  constructor() {
    console.log('🎯 MissionController initialized');
    this.manager = new MissionManager({
      onComplete: (mission, reward) => {
        console.log(`✓ Mission Complete: ${mission.name} (+${reward} CR)`);
      },
      onFail: (mission, reason) => {
        console.log(`✗ Mission Failed: ${mission.name} — ${reason}`);
      },
      onProgress: (mission, progress) => {
        console.log(`→ ${mission.name}: ${progress}/${mission.targetCount}`);
      },
      onUnlock: (mission) => {
        console.log(`🔓 Mission Unlocked: ${mission.name}`);
      },
      onStart: (mission) => {
        console.log(`▶ Mission Started: ${mission.name}`);
      },
    });
  }

  update(dtSeconds: number): void {
    this.manager.update(dtSeconds);
  }

  notifyEvent(eventType: MissionEventType, targetType?: EnemyType): void {
    this.manager.notifyEvent(eventType, targetType);
  }

  startMission(missionId: number): boolean {
    return this.manager.startMission(missionId);
  }

  unlockMission(missionId: number): boolean {
    return this.manager.unlockMission(missionId);
  }

  getCurrentMission() {
    return this.manager.currentMission;
  }

  getStatus() {
    return this.manager.status;
  }

  getProgress() {
    return this.manager.progress;
  }

  getProgressRatio() {
    return this.manager.getProgressRatio();
  }

  getRemainingTime() {
    return this.manager.getRemainingTime();
  }

  getAvailableMissions() {
    return this.manager.getAvailableMissions();
  }

  getMissionCredits() {
    return this.manager.missionCredits;
  }
}

export const missionController = new MissionControllerSingleton();
