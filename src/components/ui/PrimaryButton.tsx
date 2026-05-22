import React from 'react';
import { clsx } from 'clsx';
import { AudioManager } from '../../game/audio/AudioManager';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'danger';
}

const CLIP = 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)';

const SWEEP: Record<string, string> = {
  primary: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.28), transparent)',
  accent: 'linear-gradient(90deg, transparent, rgba(232,184,74,0.35), transparent)',
  ghost: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
  danger: 'linear-gradient(90deg, transparent, rgba(255,34,68,0.22), transparent)',
};

const VARIANT_STYLES = {
  primary: {
    text: 'text-[#00e5ff]',
    border: 'inset 0 0 0 1px rgba(0,229,255,0.6)',
    bg: 'rgba(0,229,255,0.08)',
    bgHover: 'rgba(0,229,255,0.14)',
    shadow: 'shadow-[0_0_22px_rgba(0,229,255,0.25)]',
    shadowHover: 'hover:shadow-[0_0_40px_rgba(0,229,255,0.55),inset_0_0_28px_rgba(0,229,255,0.1)]',
  },
  accent: {
    text: 'text-[#f5d078]',
    border: 'inset 0 0 0 1px rgba(232,184,74,0.65)',
    bg: 'rgba(232,184,74,0.1)',
    bgHover: 'rgba(232,184,74,0.18)',
    shadow: 'shadow-[0_0_24px_rgba(232,184,74,0.35)]',
    shadowHover: 'hover:shadow-[0_0_44px_rgba(232,184,74,0.6),inset_0_0_28px_rgba(232,184,74,0.12)]',
  },
  ghost: {
    text: 'text-white/75 hover:text-white',
    border: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
    bg: 'rgba(255,255,255,0.03)',
    bgHover: 'rgba(255,255,255,0.07)',
    shadow: 'shadow-none',
    shadowHover: '',
  },
  danger: {
    text: 'text-[#ff4466]',
    border: 'inset 0 0 0 1px rgba(255,34,68,0.5)',
    bg: 'rgba(255,34,68,0.08)',
    bgHover: 'rgba(255,34,68,0.14)',
    shadow: 'shadow-[0_0_18px_rgba(255,34,68,0.22)]',
    shadowHover: 'hover:shadow-[0_0_36px_rgba(255,34,68,0.5)]',
  },
} as const;

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  className,
  variant = 'primary',
  onMouseEnter,
  onClick,
  ...props
}) => {
  const v = VARIANT_STYLES[variant];

  return (
    <button
      type="button"
      className={clsx(
        'relative min-h-touch w-full overflow-hidden cursor-pointer',
        'font-display font-bold uppercase tracking-[0.22em] text-sm',
        'transition-all duration-200 active:scale-[0.97]',
        'disabled:opacity-40 disabled:pointer-events-none',
        'group',
        v.text,
        v.shadow,
        v.shadowHover,
        className,
      )}
      style={{ clipPath: CLIP }}
      onMouseEnter={(e) => {
        if (AudioManager.isUiPackReady()) AudioManager.playUIHover();
        onMouseEnter?.(e);
      }}
      onClick={(e) => {
        if (AudioManager.isUiPackReady()) AudioManager.playUIClick();
        onClick?.(e);
      }}
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-0 transition-all duration-200"
        style={{ boxShadow: v.border }}
      />
      <span
        className="pointer-events-none absolute inset-0 transition-colors duration-200"
        style={{ background: v.bg }}
      />
      <span
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: v.bgHover }}
      />
      <span
        className="pointer-events-none absolute inset-y-0 w-1/2 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out"
        style={{ background: SWEEP[variant] }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2 px-5 py-3">{children}</span>
    </button>
  );
};
