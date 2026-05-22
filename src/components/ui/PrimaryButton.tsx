import React from 'react';
import { clsx } from 'clsx';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  className,
  variant = 'primary',
  ...props
}) => (
  <button
    type="button"
    className={clsx(
      'min-h-touch w-full rounded-lg font-display font-bold uppercase tracking-[0.2em] text-sm transition-all active:scale-95 disabled:opacity-40',
      variant === 'primary' &&
        'bg-cyan-950/80 hover:bg-cyan-900/90 text-white shadow-[0_0_24px_rgba(0,212,255,0.35)] border-2 border-[var(--hud-accent)]/50 hover:shadow-[0_0_32px_rgba(0,212,255,0.5)]',
      variant === 'ghost' &&
        'bg-white/5 hover:bg-white/10 text-white border border-white/15',
      variant === 'danger' &&
        'bg-rose-950/60 hover:bg-rose-900/80 text-white border border-rose-500/40',
      className
    )}
    {...props}
  >
    {children}
  </button>
);
