import React from 'react';
import { clsx } from 'clsx';

export type HangarTab = 'ship' | 'vault' | 'loadout' | 'progress';

const TAB_LABELS: Record<HangarTab, string> = {
  ship: 'Ship',
  vault: 'Relics',
  loadout: 'Launch',
  progress: 'Unlocks',
};

const STEP_NUMBERS: Record<HangarTab, number> = {
  ship: 1,
  vault: 2,
  loadout: 3,
  progress: 0,
};

interface HudTabBarProps {
  tabs: HangarTab[];
  active: HangarTab;
  onChange: (tab: HangarTab) => void;
  completedSteps?: Set<HangarTab>;
  className?: string;
}

export function HudTabBar({ tabs, active, onChange, completedSteps, className }: HudTabBarProps) {
  const flowTabs = tabs.filter((t) => t !== 'progress');

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <nav
        className="flex gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide pb-1"
        role="tablist"
        aria-label="Hangar navigation"
      >
        {flowTabs.map((tab, idx) => {
          const isActive = active === tab;
          const isCompleted = completedSteps?.has(tab) && !isActive;
          const stepNum = STEP_NUMBERS[tab];

          return (
            <React.Fragment key={tab}>
              {idx > 0 && (
                <div
                  className="self-center hidden sm:block"
                  aria-hidden
                >
                  <div
                    className="w-6 h-[2px] rounded-full transition-colors duration-300"
                    style={{
                      background: isCompleted || isActive
                        ? 'rgba(0,229,255,0.5)'
                        : 'rgba(255,255,255,0.08)',
                    }}
                  />
                </div>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Step ${stepNum}: ${TAB_LABELS[tab]}`}
                onClick={() => onChange(tab)}
                className={clsx(
                  'hud-tab-btn group relative flex items-center gap-2 transition-all duration-200',
                  isActive && 'hud-tab-btn--active',
                  isCompleted && 'hud-tab-btn--completed',
                )}
                style={{
                  minWidth: '44px',
                  minHeight: '44px',
                }}
              >
                <span
                  className={clsx(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black shrink-0 transition-all duration-200',
                    isActive && 'bg-[rgba(0,229,255,0.2)] text-[#00e5ff] ring-1 ring-[rgba(0,229,255,0.5)]',
                    isCompleted && 'bg-[rgba(0,229,255,0.12)] text-[#00e5ff]/70',
                    !isActive && !isCompleted && 'bg-white/5 text-white/30',
                  )}
                >
                  {isCompleted ? '✓' : stepNum}
                </span>
                <span className="hidden sm:inline">{TAB_LABELS[tab]}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
