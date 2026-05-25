import { Obstacle } from '../types';
import { Vector2 } from '../utils/vector';
import { buildBossArenaLayout } from './bossArenas';

export interface BossDefinition {
  id: string;
  name: string;
  tagline: string;
  arenaTheme: 0 | 1 | 2 | 3 | 4;
  hpMult: number;
  speedMult: number;
  damageMult: number;
}

export const BOSS_DEFINITIONS: BossDefinition[] = [
  {
    id: 'salvage_hauler',
    name: 'Salvage Hauler',
    tagline: 'A derelict hauler blocks the lane.',
    arenaTheme: 0,
    hpMult: 1.0,
    speedMult: 0.85,
    damageMult: 1.2,
  },
  {
    id: 'hive_regent',
    name: 'Hive Regent',
    tagline: 'The swarm converges on a single pulse.',
    arenaTheme: 3,
    hpMult: 1.15,
    speedMult: 1,
    damageMult: 1.3,
  },
  {
    id: 'void_cardinal',
    name: 'Void Cardinal',
    tagline: 'Gravity bends along the corridor.',
    arenaTheme: 1,
    hpMult: 1.3,
    speedMult: 0.9,
    damageMult: 1.4,
  },
  {
    id: 'crimson_tyrant',
    name: 'Crimson Tyrant',
    tagline: 'Sector command sends its enforcer.',
    arenaTheme: 2,
    hpMult: 1.5,
    speedMult: 0.75,
    damageMult: 1.6,
  },
  {
    id: 'colossus',
    name: 'Colossus',
    tagline: 'The sector shudders under its weight.',
    arenaTheme: 2,
    hpMult: 2.2,
    speedMult: 0.35,
    damageMult: 2.2,
  },
  {
    id: 'hive_queen',
    name: 'Hive Queen',
    tagline: 'From the queen, the swarm is born.',
    arenaTheme: 3,
    hpMult: 0.9,
    speedMult: 0.75,
    damageMult: 1.0,
  },
  {
    id: 'wraith_lord',
    name: 'Wraith Lord',
    tagline: 'Blink and it is already behind you.',
    arenaTheme: 1,
    hpMult: 1.1,
    speedMult: 1.5,
    damageMult: 1.8,
  },
];

/** @deprecated Use pickRandomBoss from bossArenas.ts */
export function pickBossForStage(stage: number): BossDefinition {
  const idx = Math.min(BOSS_DEFINITIONS.length - 1, Math.floor((stage - 1) / 2));
  return BOSS_DEFINITIONS[idx];
}

/** @deprecated Use buildBossArenaLayout via applyBossArenaWarp */
export function generateBossArena(
  bossId: string,
  worldWidth: number,
  worldHeight: number,
  _playerX: number,
  _playerY: number
): Obstacle[] {
  return buildBossArenaLayout(bossId, worldWidth, worldHeight);
}
