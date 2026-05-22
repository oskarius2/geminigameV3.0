import React from 'react';
import { IconShell } from '../IconShell';
import type { IconProps } from '../IconProps';
import { BuffSparklesIcon, BuffTrophyIcon, BuffZapIcon, BuffShieldIcon } from './buffs';

export function UiMenuIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconShell>
  );
}

export function UiLockIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="6" y="11" width="12" height="9" rx="1" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </IconShell>
  );
}

export function UiRelicIcon(props: IconProps) {
  return <BuffSparklesIcon {...props} />;
}

export function UiArtifactIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M8 6h8l2 4v8l-6 4-6-4v-8l2-4z" />
      <path d="M12 10v6" opacity="0.5" />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </IconShell>
  );
}

export function UiDashIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M5 14c3-5 7-6 11-5 3 1 5 4 3 7-2 3-6 2-9-1-2-1-3-3-5-1z" />
      <path d="M14 6l3 2-2 3" opacity="0.6" />
    </IconShell>
  );
}

export function UiUltimateIcon(props: IconProps) {
  return <BuffZapIcon {...props} />;
}

export function UiPlayIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M8 6l10 6-10 6V6z" fill="currentColor" stroke="none" opacity="0.85" />
      <path d="M8 6l10 6-10 6V6z" />
    </IconShell>
  );
}

export function UiSparklesIcon(props: IconProps) {
  return <BuffSparklesIcon {...props} />;
}

export function UiTrophyIcon(props: IconProps) {
  return <BuffTrophyIcon {...props} />;
}

export function UiMapIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 6l6-2 4 2 6-2v14l-6 2-4-2-6 2V6z" />
      <path d="M10 4v14M14 6v14" opacity="0.4" />
    </IconShell>
  );
}

export function UiWrenchIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M14 4a4 4 0 00-5 5l-5 5a2 2 0 003 3l5-5a4 4 0 005-5l-3-3z" />
    </IconShell>
  );
}

export function UiGemIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M6 9h12l-2 10H8L6 9z" />
      <path d="M6 9l6-5 6 5" />
    </IconShell>
  );
}

export function UiActivityIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 16l4-10 3 6 2-4 3 6 4-8" />
    </IconShell>
  );
}

export function UiAlertIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 4L4 18h16L12 4z" />
      <path d="M12 10v4M12 16h.01" />
    </IconShell>
  );
}

export function UiFallbackIcon(props: IconProps) {
  return (
    <IconShell {...props} variant="muted">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 9v4M12 15h.01" />
    </IconShell>
  );
}

export function UiShieldIcon(props: IconProps) {
  return <BuffShieldIcon {...props} />;
}
