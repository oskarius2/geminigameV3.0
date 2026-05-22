import React from 'react';
import { IconShell } from '../IconShell';
import type { IconProps } from '../IconProps';

/** Heavy armored hull — tank class */
export function ShipTankIcon(props: IconProps) {
  return (
    <IconShell {...props} glow={props.glow ?? true}>
      <path d="M12 3v2" />
      <path d="M8 5h8l2 3H6l2-3z" />
      <path d="M5 8h14v8l-2 4H7l-2-4V8z" />
      <path d="M9 11h6v4H9z" />
      <circle cx="12" cy="13" r="1.25" fill="currentColor" stroke="none" />
      <path d="M7 16h10" />
    </IconShell>
  );
}

/** Delta wing + slipstream — fast class */
export function ShipFastIcon(props: IconProps) {
  return (
    <IconShell {...props} glow={props.glow ?? true}>
      <path d="M12 4l6 14H6L12 4z" />
      <path d="M12 8v8" />
      <path d="M4 14h3M17 14h3" opacity="0.7" />
      <path d="M2 16l2-1M20 16l-2-1" opacity="0.5" />
    </IconShell>
  );
}

/** Orbital nodes + core — balanced / swarm */
export function ShipBalancedIcon(props: IconProps) {
  return (
    <IconShell {...props} glow={props.glow ?? true}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 8v1M8.5 14.5l1-1M15.5 14.5l-1-1" opacity="0.6" />
      <ellipse cx="12" cy="12" rx="8" ry="3" opacity="0.35" />
    </IconShell>
  );
}
