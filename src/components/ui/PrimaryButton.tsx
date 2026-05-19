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
      'min-h-touch w-full rounded-xl font-display font-bold uppercase tracking-[0.2em] text-sm transition-all active:scale-[0.98] disabled:opacity-40',
      variant === 'primary' &&
        'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_24px_rgba(6,182,212,0.35)] border border-cyan-400/30',
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
