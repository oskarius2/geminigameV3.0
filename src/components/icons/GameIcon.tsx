import React from 'react';
import type { IconProps } from './IconProps';
import type { IconName } from './types';
import { ICON_REGISTRY } from './registry';
import { resolveIconKey } from './resolveIcon';

export interface GameIconProps extends IconProps {
  name: IconName;
}

export function GameIcon({ name, ...props }: GameIconProps) {
  const Component = ICON_REGISTRY[name] ?? ICON_REGISTRY['ui.fallback'];
  return <Component {...props} />;
}

/** Render from buff/shop/rails data `icon` field */
export function GameIconFromKey({
  iconKey,
  ...props
}: IconProps & { iconKey: string | undefined | null }) {
  const name = resolveIconKey(iconKey);
  return <GameIcon name={name} {...props} />;
}

export { resolveIconKey, getShipIconName, getCompanionIconName, getSlotIconName } from './resolveIcon';
