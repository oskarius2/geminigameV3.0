/**
 * Companion module public API.
 * Core logic uses {@link CompanionGameState} placeholders; adapters bridge to app {@link GameState}.
 */
export * from './companionTypes';
export * from './companionGameState';
export {
  COMPANION_DEFINITIONS,
  COMPANION_IDS,
  COMPANION_MAX_LEVEL,
  applyCompanionPassives,
  createCompanionInstance,
  getCompanionDef,
  getRecommendedCompanion,
  getScaledCompanionStats,
  useCompanionAbility,
} from './companionDefs';
export * from './companionLeveling';
export * from './companionPassives';
export {
  updateCompanionAI,
  updateCompanionAILogic,
  getCompanionHudSnapshot,
  buildCompanionInstance,
  selectClosestEnemy,
  selectHighestThreat,
} from './companionAI';
