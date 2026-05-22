import React from 'react';
import { clsx } from 'clsx';

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const CLIP = 'polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)';

export const GhostButton: React.FC<GhostButtonProps> = ({ children, className, ...props }) => (
  <button
    type="button"
    className={clsx(
      'relative min-h-touch w-full overflow-hidden',
      'font-display font-semibold text-sm',
      'text-white/65 hover:text-white/90 cursor-pointer',
      'transition-all duration-200 active:scale-[0.97]',
      'group',
      className
    )}
    style={{ clipPath: CLIP }}
    {...props}
  >
    {/* Border */}
    <span
      className="pointer-events-none absolute inset-0 transition-all duration-200 group-hover:opacity-70"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}
    />
    {/* Background */}
    <span
      className="pointer-events-none absolute inset-0"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    />
    {/* Hover fill */}
    <span
      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    />
    {/* Sweep */}
    <span
      className="pointer-events-none absolute inset-y-0 w-1/2 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out opacity-0 group-hover:opacity-100"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }}
    />
    <span className="relative z-10 flex items-center justify-center gap-2 px-4 py-3">
      {children}
    </span>
  </button>
);
