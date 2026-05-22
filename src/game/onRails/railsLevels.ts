import { EnemyType } from '../types';
import { RailsLevel } from './types';

const VERTICAL_TUNNEL_LINE = [
  { x: 600, y: 18000 },
  { x: 600, y: 0 },
] as const;

/** tunnelStartLevel — cyberpunk digital corridor */
export const RAILS_LEVEL_TUNNEL_01: RailsLevel = {
  id: 'tunnel_01',
  name: 'Tunnel Run',
  targetSeconds: 60,
  scrollSpeed: 140,
  corridorHalfWidth: 320,
  railLength: 7200,
  centerline: VERTICAL_TUNNEL_LINE,
  ui: {
    style: 'digital',
    palette: 'cyberpunk',
    rules: ['minimal clutter', 'high readability'],
    difficulty: 'Easy',
    gradientFrom: '#00315F',
    gradientTo: '#0079BF',
    accentText: '#22d3ee',
    clearedTitle: 'TUNNEL CLEARED!',
    icon: 'tunnel',
  },
  obstacles: [
    {
      id: 'block_a',
      atDistance: 1200,
      lateral: 0.4,
      shape: 'rect',
      width: 160,
      height: 100,
      color: 'rgba(6, 182, 212, 0.35)',
    },
    {
      id: 'block_b',
      atDistance: 2800,
      lateral: -0.45,
      shape: 'rect',
      width: 140,
      height: 90,
      color: 'rgba(139, 92, 246, 0.35)',
    },
  ],
  spawns: [],
  ambientSpawnInterval: 0,
  ambientEnemyType: EnemyType.RANGED,
};

/** asteroidBeltLevel — industrial geometric belt */
export const RAILS_LEVEL_ASTEROID_BELT: RailsLevel = {
  id: 'asteroid_belt',
  name: 'Asteroid Belt',
  targetSeconds: 90,
  scrollSpeed: 120,
  corridorHalfWidth: 340,
  railLength: 8640,
  centerline: [
    { x: 500, y: 16000 },
    { x: 700, y: 8000 },
    { x: 550, y: 0 },
  ],
  ui: {
    style: 'geometric',
    palette: 'industrial',
    rules: ['angular shapes', 'bold colors'],
    difficulty: 'Medium',
    gradientFrom: '#A52A2A',
    gradientTo: '#FF6347',
    accentText: '#fb923c',
    clearedTitle: 'BELT CLEARED!',
    icon: 'asteroid',
  },
  obstacles: [
    {
      id: 'rock_a',
      atDistance: 2000,
      lateral: 0.5,
      shape: 'circle',
      width: 130,
      height: 130,
      color: 'rgba(180, 83, 9, 0.75)',
    },
    {
      id: 'rock_b',
      atDistance: 4500,
      lateral: -0.35,
      shape: 'rect',
      width: 200,
      height: 80,
      color: 'rgba(120, 113, 108, 0.8)',
    },
  ],
  spawns: [],
  ambientSpawnInterval: 0,
  ambientEnemyType: EnemyType.RANGED,
};

/** voidRunLevel — sparse cosmic void */
export const RAILS_LEVEL_VOID_RUN: RailsLevel = {
  id: 'void_run',
  name: 'Void Run',
  targetSeconds: 120,
  scrollSpeed: 110,
  corridorHalfWidth: 300,
  railLength: 10080,
  centerline: VERTICAL_TUNNEL_LINE,
  ui: {
    style: 'elegant',
    palette: 'cosmic',
    rules: ['luxury feel', 'sparse elements'],
    difficulty: 'Hard',
    gradientFrom: '#004B8B',
    gradientTo: '#1E90FF',
    accentText: '#e9d5ff',
    clearedTitle: 'VOID CONQUERED!',
    icon: 'void',
  },
  obstacles: [
    {
      id: 'void_a',
      atDistance: 3500,
      lateral: 0,
      shape: 'circle',
      width: 120,
      height: 120,
      color: 'rgba(147, 51, 234, 0.45)',
    },
    {
      id: 'void_b',
      atDistance: 7500,
      lateral: 0.55,
      shape: 'rect',
      width: 180,
      height: 70,
      color: 'rgba(99, 102, 241, 0.5)',
    },
  ],
  spawns: [],
  ambientSpawnInterval: 0,
  ambientEnemyType: EnemyType.RANGED,
};

export const RAILS_LEVEL_ORDER = [
  'tunnel_01',
  'asteroid_belt',
  'void_run',
] as const;

export const RAILS_LEVELS: RailsLevel[] = [
  RAILS_LEVEL_TUNNEL_01,
  RAILS_LEVEL_ASTEROID_BELT,
  RAILS_LEVEL_VOID_RUN,
];

export function getRailsLevel(id: string): RailsLevel | undefined {
  return RAILS_LEVELS.find((l) => l.id === id);
}

export function getNextRailsLevelId(currentId: string): string | null {
  const idx = RAILS_LEVEL_ORDER.indexOf(currentId as (typeof RAILS_LEVEL_ORDER)[number]);
  if (idx < 0 || idx >= RAILS_LEVEL_ORDER.length - 1) return null;
  return RAILS_LEVEL_ORDER[idx + 1];
}
