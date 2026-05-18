import { EnemyType } from '../types';

export interface EnemySpawnRule {
  typeOverride: number; // maps to spawnEnemy typeOverride switch (0–11)
  enemyType: EnemyType; // for readability / future filtering
  weight: number;       // relative spawn probability, weights sum to ~100
  startAt: number;      // 0.0–1.0 progress through level before type appears
}

export interface CampaignLevel {
  id: string;
  number: number;
  name: string;
  flavorIntro: string;
  flavorBossIntro: string;
  flavorOutro: string;
  enemiesToKill: number;
  enemyComposition: EnemySpawnRule[];
  bossType: EnemyType;
  backgroundTheme: 0 | 1 | 2 | 3 | 4;
}

// typeOverride reference (from spawnEnemy switch):
//  0 = CHASER   1 = PHALANX  2 = WRAITH   3 = ELITE
//  4 = SPLINTER 5 = NOVA     6 = RANGED   9 = FAST
// 10 = SWARMER 11 = SNIPER

export const CAMPAIGN_LEVELS: CampaignLevel[] = [
  {
    id: 'level_1',
    number: 1,
    name: 'Debris Field',
    flavorIntro:
      'Wreckage from the outer colonies drifts across sector zero. ' +
      'Salvage drones have gone rogue — clear the field.',
    flavorBossIntro: 'A salvage hauler emerges from the debris. It has seen better days.',
    flavorOutro:
      'The field is clear. Whatever turned these machines hostile came from deeper in the sector.',
    enemiesToKill: 35,
    enemyComposition: [
      { typeOverride: 0,  enemyType: EnemyType.CHASER,  weight: 55, startAt: 0.0 },
      { typeOverride: 9,  enemyType: EnemyType.FAST,    weight: 30, startAt: 0.1 },
      { typeOverride: 10, enemyType: EnemyType.SWARMER, weight: 15, startAt: 0.4 },
    ],
    bossType: EnemyType.BOSS,
    backgroundTheme: 0,
  },

  {
    id: 'level_2',
    number: 2,
    name: 'The Swarm',
    flavorIntro:
      'A bio-mechanical hive ship has seeded the asteroid belt. ' +
      'Thousands of drones pour from its hull. Do not let them reach the colony.',
    flavorBossIntro: 'The hive mind surfaces. It coordinates every drone with a single pulse.',
    flavorOutro:
      'The swarm collapses as the hive mind falls silent. ' +
      'But the signal that woke it is still broadcasting.',
    enemiesToKill: 55,
    enemyComposition: [
      { typeOverride: 10, enemyType: EnemyType.SWARMER, weight: 40, startAt: 0.0 },
      { typeOverride: 0,  enemyType: EnemyType.CHASER,  weight: 25, startAt: 0.0 },
      { typeOverride: 9,  enemyType: EnemyType.FAST,    weight: 20, startAt: 0.2 },
      { typeOverride: 6,  enemyType: EnemyType.RANGED,  weight: 15, startAt: 0.5 },
    ],
    bossType: EnemyType.BOSS,
    backgroundTheme: 1,
  },

  {
    id: 'level_3',
    number: 3,
    name: 'Crystal Caverns',
    flavorIntro:
      'Deep below the moon\'s crust, crystalline structures hum with alien energy. ' +
      'The entities here do not fight — they hunt.',
    flavorBossIntro:
      'The cavern trembles. Something vast stirs in the dark below the resonance crystal.',
    flavorOutro:
      'The crystal goes dark. In the silence you find a single transmission — ' +
      'coordinates pointing inward toward the void.',
    enemiesToKill: 70,
    enemyComposition: [
      { typeOverride: 2,  enemyType: EnemyType.WRAITH,  weight: 35, startAt: 0.0 },
      { typeOverride: 3,  enemyType: EnemyType.ELITE,   weight: 25, startAt: 0.2 },
      { typeOverride: 0,  enemyType: EnemyType.CHASER,  weight: 20, startAt: 0.0 },
      { typeOverride: 11, enemyType: EnemyType.SNIPER,  weight: 12, startAt: 0.4 },
      { typeOverride: 6,  enemyType: EnemyType.RANGED,  weight: 8,  startAt: 0.3 },
    ],
    bossType: EnemyType.BOSS,
    backgroundTheme: 2,
  },

  {
    id: 'level_4',
    number: 4,
    name: 'The Void',
    flavorIntro:
      'Beyond the mapped sectors, space itself behaves differently. ' +
      'Enemies here fragment, detonate, and reform. Trust nothing that holds still.',
    flavorBossIntro:
      'A structure of pure annihilation materialises at the void\'s centre. ' +
      'It has no name in any database.',
    flavorOutro:
      'The void structure collapses inward. The coordinates it was broadcasting lead ' +
      'to a single point — something built the boss lair deliberately.',
    enemiesToKill: 90,
    enemyComposition: [
      { typeOverride: 4,  enemyType: EnemyType.SPLINTER, weight: 35, startAt: 0.0 },
      { typeOverride: 5,  enemyType: EnemyType.NOVA,     weight: 30, startAt: 0.0 },
      { typeOverride: 2,  enemyType: EnemyType.WRAITH,   weight: 15, startAt: 0.2 },
      { typeOverride: 3,  enemyType: EnemyType.ELITE,    weight: 12, startAt: 0.3 },
      { typeOverride: 1,  enemyType: EnemyType.PHALANX,  weight: 8,  startAt: 0.5 },
    ],
    bossType: EnemyType.BOSS,
    backgroundTheme: 3,
  },

  {
    id: 'level_5',
    number: 5,
    name: 'Boss Lair',
    flavorIntro:
      'Every signal, every attack, every wave across five sectors was a test. ' +
      'This is what you were being tested for. ' +
      'One ship. One target. End it.',
    flavorBossIntro:
      'It rises from below the station core — the architect of everything you have fought. ' +
      'It is enormous. It is aware of you. It has been waiting.',
    flavorOutro:
      'The station falls silent for the first time in years. ' +
      'Across all sectors, the hostiles power down one by one. ' +
      'You drift out of the wreckage into empty, quiet space. ' +
      'It\'s over.',
    enemiesToKill: 120,
    enemyComposition: [
      { typeOverride: 3,  enemyType: EnemyType.ELITE,    weight: 22, startAt: 0.0 },
      { typeOverride: 4,  enemyType: EnemyType.SPLINTER, weight: 18, startAt: 0.0 },
      { typeOverride: 5,  enemyType: EnemyType.NOVA,     weight: 16, startAt: 0.0 },
      { typeOverride: 1,  enemyType: EnemyType.PHALANX,  weight: 14, startAt: 0.1 },
      { typeOverride: 2,  enemyType: EnemyType.WRAITH,   weight: 12, startAt: 0.1 },
      { typeOverride: 11, enemyType: EnemyType.SNIPER,   weight: 8,  startAt: 0.3 },
      { typeOverride: 6,  enemyType: EnemyType.RANGED,   weight: 6,  startAt: 0.2 },
      { typeOverride: 0,  enemyType: EnemyType.CHASER,   weight: 4,  startAt: 0.0 },
    ],
    bossType: EnemyType.BOSS,
    backgroundTheme: 4,
  },
];

export function getCampaignLevel(id: string): CampaignLevel | undefined {
  return CAMPAIGN_LEVELS.find((l) => l.id === id);
}

export function pickCampaignEnemyType(
  level: CampaignLevel,
  progress: number // 0.0–1.0, kills done / enemiesToKill
): number {
  const eligible = level.enemyComposition.filter((r) => progress >= r.startAt);
  if (eligible.length === 0) return level.enemyComposition[0].typeOverride;

  const totalWeight = eligible.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const rule of eligible) {
    roll -= rule.weight;
    if (roll <= 0) return rule.typeOverride;
  }
  return eligible[eligible.length - 1].typeOverride;
}
