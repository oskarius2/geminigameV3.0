import React from 'react';
import { IconShell } from '../IconShell';
import type { IconProps } from '../IconProps';

export function SlotCannonAIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M6 14h12l-1 4H7l-1-4z" />
      <path d="M10 10h4v4h-4z" />
      <path d="M12 6v4" />
      <path d="M9 6h6" />
    </IconShell>
  );
}

export function SlotCannonBIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M5 15h14" />
      <path d="M8 11h8v4H8z" />
      <path d="M10 7h4v4h-4z" opacity="0.7" />
      <path d="M12 4v3" />
    </IconShell>
  );
}

export function SlotUltimateIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 3v4" />
      <path d="M8 7h8l1 10H7l1-10z" />
      <path d="M10 11h4v3h-4z" fill="currentColor" stroke="none" opacity="0.5" />
      <path d="M6 19h12" opacity="0.5" />
    </IconShell>
  );
}

export function SlotArmorIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 4l6 3v5c0 4-2.5 6.5-6 7.5-3.5-1-6-3.5-6-7.5V7l6-3z" />
      <path d="M9 10h6v4H9z" opacity="0.6" />
    </IconShell>
  );
}

export function SlotMobilityIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 14c2-4 6-6 8-6s6 2 8 6" />
      <path d="M8 14h8" />
      <path d="M10 10l2-3 2 3" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </IconShell>
  );
}
