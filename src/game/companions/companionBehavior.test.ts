import { describe, expect, it } from 'vitest';
import { Vector2 } from '../utils/vector';
import { EntityType, type GameState } from '../types';
import { determineCompanionState, getTargetPosition } from './companionBehavior';
import { createCompanionInstance, getCompanionDef } from './companionDefs';
import { CompanionAIState, CompanionType } from './companionTypes';
import { fromGameState } from './companionGameState';
import { ensureCompanionRuntime } from './companionAI';

function mockState(partial: Partial<GameState> = {}): GameState {
  return {
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      pos: new Vector2(0, 0),
      radius: 20,
      health: 100,
      maxHealth: 100,
      speed: 100,
      velocity: new Vector2(0, 0),
      color: '#0ff',
    },
    enemies: [],
    projectiles: [],
    items: [],
    particles: [],
    obstacles: [],
    hazards: [],
    world: { width: 2000, height: 2000 },
    camera: new Vector2(0, 0),
    activeCompanionId: 'guardian',
    companionLevel: 1,
    gameMode: 'NORMAL',
    isPaused: false,
    ...partial,
  } as GameState;
}

describe('companionBehavior', () => {
  it('enters THREAT when enemy within 300px', () => {
    const app = mockState({
      enemies: [
        {
          id: 'e1',
          type: EntityType.ENEMY,
          pos: new Vector2(200, 0),
          radius: 18,
          health: 50,
          maxHealth: 50,
          speed: 40,
          velocity: new Vector2(0, 0),
          color: '#f00',
        },
      ] as GameState['enemies'],
    });
    const gs = fromGameState(app);
    ensureCompanionRuntime(gs);
    const rt = gs.companionRuntime!;
    const instance = createCompanionInstance('guardian', 1);
    expect(determineCompanionState(instance, rt, gs)).toBe(CompanionAIState.THREAT);
  });

  it('enters PLAYER_DISTRESSED when player low HP', () => {
    const app = mockState({
      player: {
        id: 'player',
        type: EntityType.PLAYER,
        pos: new Vector2(0, 0),
        radius: 20,
        health: 20,
        maxHealth: 100,
        speed: 100,
        velocity: new Vector2(0, 0),
        color: '#0ff',
      },
    });
    const gs = fromGameState(app);
    ensureCompanionRuntime(gs);
    const instance = createCompanionInstance('guardian', 1);
    expect(determineCompanionState(instance, gs.companionRuntime!, gs)).toBe(
      CompanionAIState.PLAYER_DISTRESSED,
    );
  });

  it('guardian combat positions between player and threat', () => {
    const app = mockState({
      enemies: [
        {
          id: 'e1',
          type: EntityType.ENEMY,
          pos: new Vector2(100, 0),
          radius: 18,
          health: 50,
          maxHealth: 50,
          speed: 40,
          velocity: new Vector2(0, 0),
          color: '#f00',
        },
      ] as GameState['enemies'],
    });
    const gs = fromGameState(app);
    ensureCompanionRuntime(gs);
    const rt = gs.companionRuntime!;
    rt.aiState = CompanionAIState.COMBAT;
    const instance = createCompanionInstance('guardian', 1);
    const def = getCompanionDef(CompanionType.GUARDIAN)!;
    const goal = getTargetPosition(rt.aiState, instance, rt, gs, def);
    expect(goal.x).toBeGreaterThan(0);
    expect(goal.x).toBeLessThan(100);
  });
});
