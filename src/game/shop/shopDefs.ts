import { LOOT_VARIANT_COUNTS } from '../loot/dropLogic';
import { ShopCategory, type ShopItemDef, type ShopItemId } from './shopTypes';

/** In-run loot catalog sizes (artifacts, companions, ship loot) — not shop SKUs. */
export const SHOP_LOOT_CATALOG = LOOT_VARIANT_COUNTS;

export const SHOP_ITEMS: ShopItemDef[] = [
  {
    id: 'shop_overdrive',
    name: 'Overdrive',
    description: 'Start with +20% weapon damage.',
    category: ShopCategory.STARTING_BUFFS,
    costScrap: 200,
    icon: 'Zap',
    phase: 1,
  },
  {
    id: 'shop_kinetic_surge',
    name: 'Kinetic Surge',
    description: 'Start with +15% movement speed.',
    category: ShopCategory.STARTING_BUFFS,
    costScrap: 150,
    icon: 'Gauge',
    phase: 1,
  },
  {
    id: 'shop_fortified',
    name: 'Fortified',
    description: 'Start with +30 max hull.',
    category: ShopCategory.STARTING_BUFFS,
    costScrap: 100,
    icon: 'Shield',
    phase: 1,
  },
  {
    id: 'shop_sharpened',
    name: 'Sharpened',
    description: 'Start with +10% crit chance.',
    category: ShopCategory.STARTING_BUFFS,
    costScrap: 125,
    icon: 'Crosshair',
    phase: 1,
  },
  {
    id: 'shop_regeneration',
    name: 'Regeneration',
    description: 'Passive +0.5 HP/s for the run.',
    category: ShopCategory.STARTING_BUFFS,
    costScrap: 175,
    icon: 'HeartPulse',
    phase: 1,
  },
  {
    id: 'shop_abundant_ammo',
    name: 'Abundant Ammo',
    description: 'Stages 1–2: double loot drop chance.',
    category: ShopCategory.EARLY_STAGE,
    costScrap: 250,
    icon: 'Package',
    phase: 1,
  },
  {
    id: 'shop_swift_training',
    name: 'Swift Training',
    description: 'Stages 1–2: +25% experience gain.',
    category: ShopCategory.EARLY_STAGE,
    costScrap: 200,
    icon: 'TrendingUp',
    phase: 1,
  },
  {
    id: 'shop_lucky_streak',
    name: 'Lucky Streak',
    description: 'Next 2 card picks favor rare+ relic offers.',
    category: ShopCategory.EARLY_STAGE,
    costScrap: 300,
    icon: 'Sparkles',
    phase: 1,
  },
  {
    id: 'shop_guardian_angel',
    name: 'Guardian Angel',
    description: '50 HP shield for the first 30 seconds.',
    category: ShopCategory.EARLY_STAGE,
    costScrap: 150,
    icon: 'ShieldCheck',
    phase: 1,
  },
  {
    id: 'shop_calm_before_storm',
    name: 'Calm Before Storm',
    description: 'Threat starts 10 points lower.',
    category: ShopCategory.THREAT,
    costScrap: 200,
    icon: 'Wind',
    phase: 2,
  },
  {
    id: 'shop_breathing_room',
    name: 'Breathing Room',
    description: 'Threat ramps 20% slower from augments.',
    category: ShopCategory.THREAT,
    costScrap: 250,
    icon: 'Cloud',
    phase: 2,
  },
  {
    id: 'shop_companion_ascension',
    name: 'Companion Ascension',
    description: 'Selected drone starts +1 level.',
    category: ShopCategory.COMPANION,
    costScrap: 400,
    icon: 'ArrowUpCircle',
    phase: 2,
  },
  {
    id: 'shop_companion_hp',
    name: 'Companion HP Boost',
    description: 'Drone starts with +50% max health.',
    category: ShopCategory.COMPANION,
    costScrap: 150,
    icon: 'Bot',
    phase: 2,
  },
];

const BY_ID = new Map(SHOP_ITEMS.map((i) => [i.id, i]));

export function getShopItem(id: ShopItemId): ShopItemDef | undefined {
  return BY_ID.get(id);
}

export function getShopItemsByCategory(category: ShopCategory | 'ALL'): ShopItemDef[] {
  if (category === 'ALL') return [...SHOP_ITEMS];
  return SHOP_ITEMS.filter((i) => i.category === category);
}

export function isValidShopItemId(id: string): id is ShopItemId {
  return BY_ID.has(id as ShopItemId);
}
