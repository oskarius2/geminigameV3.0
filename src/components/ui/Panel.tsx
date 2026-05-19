import React from 'react';
import { clsx } from 'clsx';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ children, className }) => (
  <div
    className={clsx(
      'rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
      className
    )}
  >
    {children}
  </div>
);
