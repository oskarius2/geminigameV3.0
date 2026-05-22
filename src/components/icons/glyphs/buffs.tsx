import React from 'react';
import { IconShell } from '../IconShell';
import type { IconProps } from '../IconProps';

export function BuffZapIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z" fill="currentColor" stroke="none" opacity="0.85" />
      <path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z" />
    </IconShell>
  );
}

export function BuffTargetIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </IconShell>
  );
}

export function BuffShieldIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z" />
    </IconShell>
  );
}

export function BuffFlameIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 3c0 4-3 5-3 9a3 3 0 006 0c0-4-3-5-3-9z" />
      <path d="M12 14v4" opacity="0.5" />
    </IconShell>
  );
}

export function BuffMagnetIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M8 6v6a4 4 0 008 0V6" />
      <path d="M6 6h4M14 6h4" />
      <path d="M6 6V4M18 6V4" />
    </IconShell>
  );
}

export function BuffActivityIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 14l4-8 3 6 2-4 3 6 4-10" />
    </IconShell>
  );
}

export function BuffRotateIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 12a8 8 0 0113-6" />
      <path d="M17 6v4h-4" />
      <path d="M20 12a8 8 0 01-13 6" />
      <path d="M7 18v-4h4" />
    </IconShell>
  );
}

export function BuffHeartIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 20s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z" />
      <path d="M12 10v4M10 12h4" opacity="0.5" />
    </IconShell>
  );
}

export function BuffShieldCheckIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </IconShell>
  );
}

export function BuffBombIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="11" cy="13" r="6" />
      <path d="M14 7l3-3M17 4h2v2" />
      <path d="M8 13h6" opacity="0.5" />
    </IconShell>
  );
}

export function BuffSwordsIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M6 18L16 8" />
      <path d="M8 6l2 2M16 14l2 2" />
      <path d="M4 20l4-4M20 4l-4 4" opacity="0.6" />
    </IconShell>
  );
}

export function BuffCircleIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity="0.4" />
    </IconShell>
  );
}

export function BuffMoveRightIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M5 12h12M13 8l4 4-4 4" />
      <path d="M4 8v8" opacity="0.35" />
    </IconShell>
  );
}

export function BuffTrophyIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M8 4h8v3a4 4 0 01-8 0V4z" />
      <path d="M6 4H4v2a2 2 0 002 2M18 4h2v2a2 2 0 01-2 2" />
      <path d="M12 11v3M9 18h6M10 14h4" />
    </IconShell>
  );
}

export function BuffSparklesIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" fill="currentColor" stroke="none" opacity="0.35" />
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M18 4l.5 1.5L20 6l-1.5.5L18 8l-.5-1.5L16 6l1.5-.5L18 4z" opacity="0.7" />
    </IconShell>
  );
}

/** Shop-only extras */
export function ShopGaugeIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 4a8 8 0 108 8" />
      <path d="M12 8v4l3 2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </IconShell>
  );
}

export function ShopPackageIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 8h16v11H4z" />
      <path d="M4 8l8-4 8 4" />
      <path d="M12 4v15" opacity="0.4" />
    </IconShell>
  );
}

export function ShopTrendingIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 18l5-6 4 3 7-9" />
      <path d="M15 6h5v5" />
    </IconShell>
  );
}

export function ShopWindIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 10h11a3 3 0 100-6" />
      <path d="M4 14h14a4 4 0 110 8" />
      <path d="M4 18h9" opacity="0.5" />
    </IconShell>
  );
}

export function ShopCloudIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M8 16h9a4 4 0 000-8 5 5 0 00-9-2 4 4 0 00 0 10z" />
    </IconShell>
  );
}

export function ShopArrowUpIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 15V9M9 11l3-3 3 3" />
    </IconShell>
  );
}

export function ShopBotIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="6" y="8" width="12" height="10" rx="2" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M12 4v4M9 4h6" />
    </IconShell>
  );
}
