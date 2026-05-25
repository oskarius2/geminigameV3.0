import React from 'react';
import { clsx } from 'clsx';
import type { WeaponState } from '../weapons/weaponState';
import { getReloadProgress, getSwitchProgress } from '../weapons/ammoController';
import { getWeaponDef } from '../weapons/weaponDefs';
import { isAmmoSystemEnabled } from '../weapons/weaponController';
import type { GameState } from '../types';

interface WeaponHUDProps {
  weaponState: WeaponState | null;
  gameMode: GameState['gameMode'];
  onSwitch?: (slot: 'CANNON_A' | 'CANNON_B') => void;
  activeWeaponSlot: 'CANNON_A' | 'CANNON_B';
  compact?: boolean;
}

export function WeaponHUD({
  weaponState,
  gameMode,
  onSwitch,
  activeWeaponSlot,
  compact = false,
}: WeaponHUDProps) {
  if (!weaponState || !isAmmoSystemEnabled({ gameMode } as GameState)) {
    return null;
  }

  const primary = weaponState.slots[0];
  const secondary = weaponState.slots[1];
  const reloadProgress = getReloadProgress(weaponState);
  const switchProgress = getSwitchProgress(weaponState);
  const primaryDef = primary ? getWeaponDef(primary.weaponId) : null;
  const secondaryDef = secondary ? getWeaponDef(secondary.weaponId) : null;

  const slotClass = (slot: 'CANNON_A' | 'CANNON_B', locked: boolean, disabled: boolean) =>
    clsx(
      'weapon-hud__slot',
      activeWeaponSlot === slot && 'weapon-hud__slot--active',
      locked && 'weapon-hud__slot--locked',
      disabled && 'weapon-hud__slot--disabled',
      weaponState.switchState.isSwitching && 'weapon-hud__slot--switching',
    );

  return (
    <div className={clsx('weapon-hud', compact && 'weapon-hud--compact')} aria-label="Weapons">
      <button
        type="button"
        className={slotClass('CANNON_A', false, false)}
        onClick={() => onSwitch?.('CANNON_A')}
        aria-pressed={activeWeaponSlot === 'CANNON_A'}
        aria-label={`Weapon 1, ${primary?.ammoLoaded ?? 0} in magazine`}
      >
        <span className="weapon-hud__label">WPN 1</span>
        <span className="weapon-hud__ammo">
          {primary ? `${primary.ammoLoaded}/${primaryDef?.magazineSize ?? '?'}` : '—'}
        </span>
        {primaryDef && !compact && (
          <span className="weapon-hud__sub">{primaryDef.name}</span>
        )}
      </button>

      <button
        type="button"
        className={slotClass('CANNON_B', !secondary?.isUnlocked, secondary?.isDisabledUI ?? true)}
        onClick={() => onSwitch?.('CANNON_B')}
        disabled={!secondary?.isUnlocked}
        aria-pressed={activeWeaponSlot === 'CANNON_B'}
        aria-label={
          !secondary?.isUnlocked
            ? 'Weapon 2 locked'
            : `Weapon 2, ${secondary.ammoLoaded} in magazine, ${secondary.ammoReserve} reserve`
        }
      >
        <span className="weapon-hud__label">WPN 2</span>
        {!secondary?.isUnlocked ? (
          <span className="weapon-hud__ammo weapon-hud__ammo--locked">LOCKED</span>
        ) : (
          <span className="weapon-hud__ammo">
            {secondary.ammoLoaded}/{secondary.ammoReserve}
          </span>
        )}
        {secondaryDef && secondary?.isUnlocked && !compact && (
          <span className="weapon-hud__sub">{secondaryDef.name}</span>
        )}
      </button>

      {weaponState.reloadState?.isReloading && (
        <div className="weapon-hud__reload" role="progressbar" aria-valuenow={Math.round(reloadProgress * 100)}>
          <div className="weapon-hud__reload-track">
            <div
              className="weapon-hud__reload-fill"
              style={{ width: `${reloadProgress * 100}%` }}
            />
          </div>
          <span className="weapon-hud__reload-label">Reloading…</span>
        </div>
      )}

      {weaponState.switchState.isSwitching && (
        <div className="weapon-hud__switch-bar" aria-hidden>
          <div
            className="weapon-hud__switch-fill"
            style={{ width: `${switchProgress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
