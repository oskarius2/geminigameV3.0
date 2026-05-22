import { describe, expect, it, beforeEach, vi } from 'vitest';
import { CompanionType } from './companionTypes';
import {
  COMPANION_LEVEL_XP_THRESHOLDS,
  applyCompanionProgressToGameState,
  checkLevelUp,
  gainXP,
  getCompanionLevel,
  getCompanionXp,
  getLevelFromXp,
  getSelectedCompanion,
  getXpToNextLevel,
  grantCompanionKillXp,
  loadCompanionProgress,
  persistCompanionRunProgress,
  saveCompanionProgress,
  setSelectedCompanion,
} from './companionLeveling';
import { EntityType, type GameState } from '../types';
import { Vector2 } from '../utils/vector';

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  });
});

function mockState(partial: Partial<GameState> = {}): GameState {
  return {
    player: {
      id: 'p',
      type: EntityType.PLAYER,
      pos: new Vector2(0, 0),
      radius: 20,
      health: 100,
      maxHealth: 100,
      speed: 100,
      velocity: new Vector2(0, 0),
      color: '#0ff',
    },
    activeCompanionId: 'guardian',
    companionLevel: 1,
    companionXp: 0,
    stage: 3,
    gameMode: 'NORMAL',
    ...partial,
  } as GameState;
}

describe('companionLeveling', () => {
  it('uses per-type XP thresholds', () => {
    expect(COMPANION_LEVEL_XP_THRESHOLDS.guardian[1]).toBe(100);
    expect(COMPANION_LEVEL_XP_THRESHOLDS.scout[1]).toBe(150);
    expect(getLevelFromXp(99, 'guardian')).toBe(1);
    expect(getLevelFromXp(100, 'guardian')).toBe(2);
    expect(getLevelFromXp(700, 'guardian')).toBe(5);
  });

  it('gainXP persists and detects level up', () => {
    const first = gainXP('scout', 140);
    expect(first.leveledUp).toBe(false);
    expect(first.newLevel).toBe(1);

    const second = gainXP('scout', 20);
    expect(second.leveledUp).toBe(true);
    expect(second.newLevel).toBe(2);
    expect(getCompanionXp('scout')).toBe(160);
    expect(getCompanionLevel('scout')).toBe(2);
  });

  it('checkLevelUp reconciles stale stored level', () => {
    saveCompanionProgress({
      guardian: { xp: 500, level: 1 },
    });
    expect(checkLevelUp('guardian')).toBe(true);
    expect(getCompanionLevel('guardian')).toBe(4);
  });

  it('grantCompanionKillXp updates game state and storage', () => {
    const state = mockState({ stage: 4 });
    const result = grantCompanionKillXp(state, 2);
    expect(result?.xpGained).toBe(4);
    expect(state.companionXp).toBe(4);
    expect(state.companionLevel).toBe(1);
    expect(getCompanionXp('guardian')).toBe(4);
  });

  it('applyCompanionProgressToGameState loads meta into run', () => {
    gainXP('healer', 450);
    const state = mockState({ activeCompanionId: 'healer', companionXp: 0, companionLevel: 1 });
    applyCompanionProgressToGameState(state);
    expect(state.companionXp).toBe(450);
    expect(state.companionLevel).toBe(3);
  });

  it('getXpToNextLevel returns gap to next threshold', () => {
    gainXP('gunner', 300);
    expect(getXpToNextLevel('gunner')).toBe(200);
  });

  it('loadCompanionProgress returns empty when unset', () => {
    expect(loadCompanionProgress()).toEqual({});
  });

  it('persists selected companion', () => {
    setSelectedCompanion('scout');
    expect(getSelectedCompanion()).toBe('scout');
  });

  it('gainXP and getCompanionLevel work with CompanionType', () => {
    gainXP(CompanionType.GUNNER, 260);
    expect(getCompanionLevel(CompanionType.GUNNER)).toBe(2);
    expect(getCompanionXp('gunner')).toBe(260);
  });

  it('persists XP between simulated runs', () => {
    gainXP('scout', 200);
    const runEnd = mockState({
      activeCompanionId: 'scout',
      companionXp: 200,
      companionLevel: 2,
    });
    persistCompanionRunProgress(runEnd);

    const freshRun = mockState({
      activeCompanionId: 'scout',
      companionXp: 0,
      companionLevel: 1,
    });
    applyCompanionProgressToGameState(freshRun);
    expect(freshRun.companionXp).toBe(200);
    expect(freshRun.companionLevel).toBe(2);
  });

  it('checkLevelUp returns true when stored level lags behind XP', () => {
    saveCompanionProgress({ healer: { xp: 500, level: 1 } });
    expect(checkLevelUp(CompanionType.HEALER)).toBe(true);
    expect(getCompanionLevel('healer')).toBe(3);
  });
});
