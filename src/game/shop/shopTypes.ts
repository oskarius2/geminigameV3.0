export enum ShopCategory {
  STARTING_BUFFS = 'STARTING_BUFFS',
  EARLY_STAGE = 'EARLY_STAGE',
  THREAT = 'THREAT',
  COMPANION = 'COMPANION',
}

export type ShopItemId =
  | 'shop_overdrive'
  | 'shop_kinetic_surge'
  | 'shop_fortified'
  | 'shop_sharpened'
  | 'shop_regeneration'
  | 'shop_abundant_ammo'
  | 'shop_swift_training'
  | 'shop_lucky_streak'
  | 'shop_guardian_angel'
  | 'shop_calm_before_storm'
  | 'shop_breathing_room'
  | 'shop_companion_ascension'
  | 'shop_companion_hp';

export interface ShopItemDef {
  id: ShopItemId;
  name: string;
  description: string;
  category: ShopCategory;
  costScrap: number;
  icon: string;
  phase: 1 | 2 | 3;
}

export interface ShopCartLine {
  itemId: ShopItemId;
  costScrap: number;
}

export interface ShopPurchaseResult {
  ok: boolean;
  error?: 'insufficient_scrap' | 'duplicate_item' | 'invalid_item' | 'empty_cart';
  cart: ShopCartLine[];
  totalScrap: number;
  remainingScrap: number;
}

export interface ShopRunFlags {
  abundantAmmoStagesLeft?: number;
  swiftTrainingStagesLeft?: number;
  luckyArtifactPicksLeft?: number;
  guardianShieldTimer?: number;
  threatOffset?: number;
  threatGrowthMult?: number;
  companionHpBoost?: boolean;
}

export interface RunShopLoadout {
  purchasedIds: ShopItemId[];
  totalSpent: number;
}
