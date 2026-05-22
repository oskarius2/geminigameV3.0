import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { EnemyType, EntityType, GameState } from '../types';
import { Vector2 } from '../utils/vector';
import {
  resetSurvivalDifficultyCache,
  setSurvivalDifficulty,
} from './miniBossDifficulty';
import {
  getSpawnPickForEnemyType,
  resetWaveSpawnState,
  tickSurvivalWaveSpawns,
} from './waveSpawnController';

function minimalWaveState(overrides: Partial<GameState> = {}): GameState {
  return {
    stage: 1,
    survivalTime: 0,
    stageEnteredAt: 0,
    waveSpawnQueue: [],
    waveMiniBossQueue: [],
    waveSpawnCooldown: 0,
    activeWaveIndex: -1,
    enemiesToKill: 50,
    enemies: [],
    gameMode: 'NORMAL',
    ...overrides,
  } as GameState;
}

describe('waveSpawnController', () => {
  beforeEach(() => {
    setSurvivalDifficulty('normal');
  });

  afterEach(() => {
    resetSurvivalDifficultyCache();
  });

  it('maps CHASER to basic spawn pick', () => {
    expect(getSpawnPickForEnemyType(EnemyType.CHASER)).toBe(7);
  });

  it('resets wave state on stage entry', () => {
    const state = minimalWaveState({ survivalTime: 120, activeWaveIndex: 2 });
    resetWaveSpawnState(state);
    expect(state.stageEnteredAt).toBe(120);
    expect(state.activeWaveIndex).toBe(-1);
    expect(state.waveSpawnQueue).toEqual([]);
    expect(state.waveMiniBossQueue).toEqual([]);
  });

  it('spawns after cooldown using wave template', () => {
    const state = minimalWaveState({ waveSpawnCooldown: 0 });
    const spawned: number[] = [];
    const entity = tickSurvivalWaveSpawns(state, 0.1, 20, (pick) => {
      spawned.push(pick);
      return {
        id: 'e1',
        type: EntityType.ENEMY,
        pos: new Vector2(0, 0),
        radius: 10,
        health: 10,
        maxHealth: 10,
        speed: 1,
        velocity: new Vector2(0, 0),
        color: '#fff',
        enemyType: EnemyType.CHASER,
      };
    });
    expect(entity).not.toBeNull();
    expect(spawned[0]).toBe(7);
    expect(state.waveSpawnCooldown).toBeGreaterThan(0);
  });

  it('does not spawn when kill quota is cleared', () => {
    const state = minimalWaveState({ enemiesToKill: 0, waveSpawnCooldown: 0 });
    const entity = tickSurvivalWaveSpawns(state, 1, 20, () => null);
    expect(entity).toBeNull();
  });

  it('announces mini-boss when entering a wave with a mini-boss slot', () => {
    const state = minimalWaveState({
      stage: 2,
      stageEnteredAt: 0,
      survivalTime: 70,
      activeWaveIndex: 1,
      waveSpawnCooldown: 0,
    });
    tickSurvivalWaveSpawns(state, 0.1, 20, () => null);
    expect(state.miniBossIncomingTimer).toBe(4);
    expect(state.miniBossIncomingText).toBe('Chockvågssköld');
    expect(state.waveMiniBossQueue.length).toBeGreaterThan(0);
  });
});
