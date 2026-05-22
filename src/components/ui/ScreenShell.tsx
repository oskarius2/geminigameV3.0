import React from 'react';
import { clsx } from 'clsx';
import { SpaceBackground } from './SpaceBackground';

interface ScreenShellProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenShell: React.FC<ScreenShellProps> = ({ children, className }) => (
  <div
    className={clsx(
      'absolute inset-0 z-[500] flex flex-col overflow-y-auto bg-[var(--bg-void)] bg-noise',
      'pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]',
      'px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]',
      className,
    )}
  >
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <SpaceBackground scanlines />
      <div className="absolute inset-0 nebula-layer nebula-layer-animate opacity-80" />
    </div>
    <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 flex flex-col">{children}</div>
  </div>
);
