export const WEAPON_1_ID = 'primary';
export const WEAPON_2_ID = 'secondary';

export const MAGAZINE_SIZE = 15;
export const RELOAD_DURATION = 0.5;
export const SWITCH_DURATION = 0.25;

export const AMMO_PICKUP_AMOUNT = 30;
export const MINIBOSS_AMMO_AMOUNT = 50;

export interface AmmoDropConfig {
  stage: number;
  ammoDropRate: number;
  weaponDropRate: number;
  guaranteedOnMiniBoss: boolean;
}

export const STAGE_DROP_RATES: AmmoDropConfig[] = [
  { stage: 1, ammoDropRate: 0.1, weaponDropRate: 0.02, guaranteedOnMiniBoss: true },
  { stage: 2, ammoDropRate: 0.1, weaponDropRate: 0.05, guaranteedOnMiniBoss: true },
  { stage: 3, ammoDropRate: 0.25, weaponDropRate: 0.15, guaranteedOnMiniBoss: true },
  { stage: 4, ammoDropRate: 0.5, weaponDropRate: 0.3, guaranteedOnMiniBoss: true },
  { stage: 5, ammoDropRate: 0.75, weaponDropRate: 0.5, guaranteedOnMiniBoss: true },
];

export function getDropRatesForStage(stage: number): AmmoDropConfig {
  return STAGE_DROP_RATES[Math.min(Math.max(stage, 1), 5) - 1];
}
