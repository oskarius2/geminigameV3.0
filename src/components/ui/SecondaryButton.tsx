import React from 'react';
import { clsx } from 'clsx';

const CLIP = 'polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  accent?: 'default' | 'amber' | 'gold';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  className,
  accent = 'default',
  ...props
}) => (
  <button
    type="button"
    className={clsx(
      'group relative min-h-touch w-full overflow-hidden cursor-pointer',
      'font-display font-semibold text-sm transition-all duration-200 active:scale-[0.97]',
      accent === 'amber' && 'text-amber-200/75 hover:text-amber-100',
      accent === 'gold' && 'text-[#e8b84a]/80 hover:text-[#f5d078]',
      accent === 'default' && 'text-white/60 hover:text-white/90',
      className,
    )}
    style={{ clipPath: CLIP }}
    {...props}
  >
    <span
      className="pointer-events-none absolute inset-0 transition-all duration-200"
      style={{
        boxShadow:
          accent === 'gold'
            ? 'inset 0 0 0 1px rgba(232,184,74,0.35)'
            : accent === 'amber'
              ? 'inset 0 0 0 1px rgba(255,170,0,0.28)'
              : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
      }}
    />
    <span
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          accent === 'gold'
            ? 'rgba(232,184,74,0.04)'
            : accent === 'amber'
              ? 'rgba(255,170,0,0.04)'
              : 'rgba(255,255,255,0.025)',
      }}
    />
    <span
      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      style={{
        background:
          accent === 'gold'
            ? 'rgba(232,184,74,0.1)'
            : accent === 'amber'
              ? 'rgba(255,170,0,0.08)'
              : 'rgba(255,255,255,0.06)',
      }}
    />
    <span
      className="pointer-events-none absolute inset-y-0 w-1/2 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out opacity-0 group-hover:opacity-100"
      style={{
        background:
          accent === 'gold'
            ? 'linear-gradient(90deg, transparent, rgba(232,184,74,0.15), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
      }}
    />
    <span className="relative z-10 flex items-center justify-center gap-2 px-4 py-3">{children}</span>
  </button>
);
