import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { INITIAL_STATE } from '../Logic';
import {
  resetSurvivalDifficultyCache,
  setSurvivalDifficulty,
} from '../balance/miniBossDifficulty';
import { spawnMiniBoss } from './miniBossSpawn';

describe('miniBossSpawn', () => {
  beforeEach(() => setSurvivalDifficulty('normal'));
  afterEach(() => resetSurvivalDifficultyCache());

  it('spawns entity with scaled HP and miniBossId', () => {
    const state = INITIAL_STATE(800, 600, 'interceptor');
    state.gameMode = 'NORMAL';
    state.stage = 2;
    state.threatLevel = 20;
    const entity = spawnMiniBoss(state, 'shockwave_sentinel');
    expect(entity).not.toBeNull();
    expect(entity!.miniBossId).toBe('shockwave_sentinel');
    expect(entity!.maxHealth).toBeGreaterThan(100);
    expect(entity!.health).toBe(entity!.maxHealth);
  });

  it('scales HP higher on hard difficulty', () => {
    setSurvivalDifficulty('hard');
    const easyState = INITIAL_STATE(800, 600, 'interceptor');
    easyState.gameMode = 'NORMAL';
    easyState.stage = 3;
    setSurvivalDifficulty('easy');
    const easy = spawnMiniBoss(easyState, 'eclipse_dasher')!.maxHealth;

    setSurvivalDifficulty('hard');
    const hardState = INITIAL_STATE(800, 600, 'interceptor');
    hardState.gameMode = 'NORMAL';
    hardState.stage = 3;
    const hard = spawnMiniBoss(hardState, 'eclipse_dasher')!.maxHealth;

    expect(hard).toBeGreaterThan(easy);
  });
});
