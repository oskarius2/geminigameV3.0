export const WEAPON_1_ID = 'primary';
export const WEAPON_2_ID = 'secondary';

export const MAGAZINE_SIZE = 12;
export const RELOAD_DURATION = 0.6;
export const SWITCH_DURATION = 0.25;

export const AMMO_PICKUP_AMOUNT = 5;
export const MINIBOSS_AMMO_AMOUNT = 8;

export interface AmmoDropConfig {
  stage: number;
  /** Chance for slot 2 ammo on enemy kill. */
  ammoDropRate: number;
  /** Chance for a new weapon crate (unlocks/replaces slot 2). */
  weaponDropRate: number;
  guaranteedOnMiniBoss: boolean;
}

export const STAGE_DROP_RATES: AmmoDropConfig[] = [
  { stage: 1, ammoDropRate: 0.08, weaponDropRate: 0.01, guaranteedOnMiniBoss: true },
  { stage: 2, ammoDropRate: 0.12, weaponDropRate: 0.04, guaranteedOnMiniBoss: true },
  { stage: 3, ammoDropRate: 0.18, weaponDropRate: 0.08, guaranteedOnMiniBoss: true },
  { stage: 4, ammoDropRate: 0.22, weaponDropRate: 0.12, guaranteedOnMiniBoss: true },
  { stage: 5, ammoDropRate: 0.28, weaponDropRate: 0.15, guaranteedOnMiniBoss: true },
];

export function getDropRatesForStage(stage: number): AmmoDropConfig {
  return STAGE_DROP_RATES[Math.min(Math.max(stage, 1), 5) - 1];
}
