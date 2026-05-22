import React from 'react';
import { IconShell } from '../IconShell';
import type { IconProps } from '../IconProps';

export function CompanionGuardianIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 3l7 4v6c0 4.5-3.5 7.5-7 8-3.5-.5-7-3.5-7-8V7l7-4z" />
      <path d="M12 9v5" />
      <path d="M9 11h6" />
    </IconShell>
  );
}

export function CompanionScoutIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
      <path d="M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" opacity="0.7" />
      <circle cx="12" cy="12" r="7" opacity="0.35" />
    </IconShell>
  );
}

export function CompanionHealerIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 6v12M8 10h8" />
      <path d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" opacity="0.5" />
      <path d="M9 18h6" opacity="0.4" />
    </IconShell>
  );
}

export function CompanionGunnerIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
      <path d="M7.5 7.5l1.5 1.5M16.5 16.5l-1.5-1.5M7.5 16.5l1.5-1.5M16.5 7.5l-1.5 1.5" />
    </IconShell>
  );
}
