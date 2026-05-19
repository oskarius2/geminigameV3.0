import React from 'react';
import { clsx } from 'clsx';

interface ScreenShellProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenShell: React.FC<ScreenShellProps> = ({ children, className }) => (
  <div
    className={clsx(
      'absolute inset-0 z-[500] flex flex-col overflow-y-auto bg-[#020617] bg-noise',
      'pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]',
      'px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]',
      className
    )}
  >
    <div className="mx-auto w-full max-w-5xl flex-1 flex flex-col">{children}</div>
  </div>
);
