// missionMode.ts
import { EnemyType } from './types';

export type MissionObjectiveType = 'destroy' | 'collect' | 'survive' | 'boss';
export type MissionEventType = 'enemy_killed' | 'item_collected';
export type MissionStatus = 'idle' | 'active' | 'completed' | 'failed';

export interface MissionEnemySpec {
  type: string;
  count: number;
}

export interface MissionDefinition {
  id: number;
  name: string;
  description: string;
  objectiveType: MissionObjectiveType;
  targetCount: number;
  timeLimit: number;
  enemies: MissionEnemySpec[];
  unlockCost: number;
  reward: number;
  targetEnemyType?: EnemyType;
}

interface MissionRuntime extends MissionDefinition {
  isUnlocked: boolean;
}

export interface MissionCallbacks {
  onComplete?: (mission: MissionDefinition, reward: number) => void;
  onFail?: (mission: MissionDefinition, reason: string) => void;
  onProgress?: (mission: MissionDefinition, progress: number) => void;
  onUnlock?: (mission: MissionDefinition) => void;
  onStart?: (mission: MissionDefinition) => void;
}

export class MissionManager {
  public missions: MissionRuntime[];
  public currentMission: MissionRuntime | null = null;
  public progress: number = 0;
  public missionCredits: number = 0;
  public elapsed: number = 0;
  public status: MissionStatus = 'idle';

  private callbacks: MissionCallbacks;

  constructor(callbacks: MissionCallbacks = {}) {
    this.callbacks = callbacks;

    this.missions = [
      {
        id: 1,
        name: 'Horde Breaker',
        description: 'Kill 20 enemies before they overrun you.',
        objectiveType: 'destroy',
        targetCount: 20,
        timeLimit: 60,
        enemies: [{ type: 'chaser', count: 20 }],
        unlockCost: 0,
        reward: 150,
        isUnlocked: true,
      },
      {
        id: 2,
        name: 'Survivor Convoy',
        description: 'Stay alive for 45 seconds while waves close in.',
        objectiveType: 'survive',
        targetCount: 45,
        timeLimit: 60,
        enemies: [{ type: 'swarmer', count: 30 }],
        unlockCost: 100,
        reward: 250,
        isUnlocked: false,
      },
      {
        id: 3,
        name: 'Scavenger',
        description: 'Collect 5 XP orbs without dying.',
        objectiveType: 'collect',
        targetCount: 5,
        timeLimit: 30,
        enemies: [{ type: 'wraith', count: 4 }],
        unlockCost: 200,
        reward: 300,
        isUnlocked: false,
      },
      {
        id: 4,
        name: 'The Brute',
        description: 'Slay the boss.',
        objectiveType: 'boss',
        targetCount: 1,
        timeLimit: 120,
        enemies: [{ type: 'boss', count: 1 }],
        unlockCost: 500,
        reward: 1000,
        isUnlocked: false,
        targetEnemyType: EnemyType.BOSS,
      },
    ];
  }

  unlockMission(missionId: number): boolean {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return false;
    if (mission.isUnlocked) return true;
    if (this.missionCredits >= mission.unlockCost) {
      this.missionCredits -= mission.unlockCost;
      mission.isUnlocked = true;
      this.callbacks.onUnlock?.(mission);
      return true;
    }
    return false;
  }

  startMission(missionId: number): boolean {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission || !mission.isUnlocked) return false;
    this.currentMission = mission;
    this.progress = 0;
    this.elapsed = 0;
    this.status = 'active';
    this.callbacks.onStart?.(mission);
    return true;
  }

  update(dt: number): void {
    if (!this.currentMission || this.status !== 'active') return;
    this.elapsed += dt;
    if (this.elapsed > this.currentMission.timeLimit) {
      this.failMission('Time expired!');
      return;
    }
    if (this.currentMission.objectiveType === 'survive') {
      this.progress = Math.floor(this.elapsed);
      if (this.progress >= this.currentMission.targetCount) {
        this.completeMission();
      }
    }
  }

  notifyEvent(eventType: MissionEventType, targetType?: EnemyType): void {
    if (!this.currentMission || this.status !== 'active') return;
    const m = this.currentMission;
    let progressed = false;
    if (m.objectiveType === 'destroy' && eventType === 'enemy_killed') {
      if (m.targetEnemyType === undefined || m.targetEnemyType === targetType) {
        this.progress += 1;
        progressed = true;
      }
    } else if (m.objectiveType === 'collect' && eventType === 'item_collected') {
      this.progress += 1;
      progressed = true;
    } else if (m.objectiveType === 'boss' && eventType === 'enemy_killed' && targetType === EnemyType.BOSS) {
      this.progress += 1;
      progressed = true;
    }
    if (progressed) {
      this.callbacks.onProgress?.(m, this.progress);
      if (this.progress >= m.targetCount) {
        this.completeMission();
      }
    }
  }

  private completeMission(): void {
    if (!this.currentMission) return;
    const mission = this.currentMission;
    this.missionCredits += mission.reward;
    this.status = 'completed';
    this.callbacks.onComplete?.(mission, mission.reward);
    this.currentMission = null;
  }

  private failMission(reason: string): void {
    if (!this.currentMission) return;
    const mission = this.currentMission;
    this.status = 'failed';
    this.callbacks.onFail?.(mission, reason);
    this.currentMission = null;
  }

  getAvailableMissions(): MissionDefinition[] {
    return this.missions.filter(m => m.isUnlocked);
  }

  getLockedMissions(): MissionDefinition[] {
    return this.missions.filter(m => !m.isUnlocked);
  }

  getRemainingTime(): number {
    if (!this.currentMission) return 0;
    return Math.max(0, this.currentMission.timeLimit - this.elapsed);
  }

  getProgressRatio(): number {
    if (!this.currentMission) return 0;
    return Math.min(1, this.progress / this.currentMission.targetCount);
  }
}
