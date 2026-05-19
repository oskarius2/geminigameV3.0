import React from 'react';
import { clsx } from 'clsx';

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const GhostButton: React.FC<GhostButtonProps> = ({ children, className, ...props }) => (
  <button
    type="button"
    className={clsx(
      'min-h-touch w-full rounded-xl font-sans font-medium text-sm transition-all active:scale-[0.98]',
      'bg-white/5 hover:bg-white/10 text-white border border-white/15',
      className
    )}
    {...props}
  >
    {children}
  </button>
);
