import React from 'react';
import { IconShell } from '../IconShell';
import type { IconProps } from '../IconProps';

export function RailsTunnelIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" opacity="0.5" />
      <path d="M12 4v16M4 12h16" opacity="0.35" />
    </IconShell>
  );
}

export function RailsAsteroidIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 4l3 2 4 1 1 4 2 3-2 4-1 4-4 1-3-2-4-1-1-4-2-3 2-4 1-4 4-1 3 2z" />
      <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" opacity="0.5" />
    </IconShell>
  );
}

export function RailsVoidIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 3l2 7h7l-5.5 4 2 7L12 17l-5.5 4 2-7L3 10h7l2-7z" fill="currentColor" stroke="none" opacity="0.25" />
      <path d="M12 3l2 7h7l-5.5 4 2 7L12 17l-5.5 4 2-7L3 10h7l2-7z" />
    </IconShell>
  );
}

export function RailsShieldIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 4l6 2v5c0 3.5-2.5 6-6 7-3.5-1-6-3.5-6-7V6l6-2z" />
    </IconShell>
  );
}

export function RailsGunIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M6 16h10l-1 3H7l-1-3z" />
      <path d="M10 8h4v8h-4z" />
      <path d="M12 5v3" />
    </IconShell>
  );
}

export function RailsClockIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </IconShell>
  );
}

export function RailsHeartIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 19s-6-3.5-6-9a3.5 3.5 0 016-1.5 3.5 3.5 0 016 1.5c0 5.5-6 9-6 9z" />
    </IconShell>
  );
}

export function RailsStarIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 4l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" />
    </IconShell>
  );
}

export function RailsBoltIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M13 3L7 13h5l-1 8 6-10h-5l1-8z" fill="currentColor" stroke="none" opacity="0.4" />
      <path d="M13 3L7 13h5l-1 8 6-10h-5l1-8z" />
    </IconShell>
  );
}

export function RailsBombIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="11" cy="14" r="5" />
      <path d="M14 8l2-2" />
    </IconShell>
  );
}

export function MinibossWaveIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
      <path d="M3 16c2-3 4-3 6 0s4 3 6 0" opacity="0.5" />
    </IconShell>
  );
}

export function MinibossSpeedIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M5 14h10l-2 4H7l-2-4z" />
      <path d="M14 6l3 2-3 2" />
      <path d="M4 10h2" opacity="0.5" />
    </IconShell>
  );
}

export function MinibossStrikeIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 4v10" />
      <path d="M8 14h8" />
      <path d="M10 18h4" opacity="0.5" />
      <path d="M6 8l3 2M18 8l-3 2" opacity="0.6" />
    </IconShell>
  );
}

export function MinibossGhostIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M8 20V10a4 4 0 018 0v10" />
      <circle cx="10" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="11" r="1" fill="currentColor" stroke="none" />
      <path d="M8 16h8" opacity="0.4" />
    </IconShell>
  );
}

export function MinibossDrainIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="7" opacity="0.4" />
      <path d="M12 5v14M5 12h14" opacity="0.35" />
      <path d="M8 8l8 8M16 8l-8 8" />
    </IconShell>
  );
}

export function MinibossApexIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 4l2 14h-4l2-14z" />
      <path d="M6 10h12" />
      <circle cx="12" cy="8" r="2" fill="currentColor" stroke="none" opacity="0.5" />
    </IconShell>
  );
}

export function MinibossTimeIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l4 2" />
      <path d="M4 4l2 2M20 20l-2-2" opacity="0.4" />
    </IconShell>
  );
}
