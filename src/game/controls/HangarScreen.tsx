import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SpaceBackground } from '../../components/ui/SpaceBackground';
import { HudTabBar, type HangarTab } from '../../components/ui/HudTabBar';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { GhostButton } from '../../components/ui/GhostButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { Artifact, ArtifactSlot, ShipId } from '../types';
import { ARTIFACTS } from '../content/artifacts';
import { ShipTab } from './hangar/ShipTab';
import { RelicVaultTab } from './hangar/RelicVaultTab';
import { LoadoutTab } from './hangar/LoadoutTab';
import { UnlockProgressTab } from './hangar/UnlockProgressTab';

export type HangarEntry = 'survival' | 'meta';

const FLOW_STEPS: HangarTab[] = ['ship', 'vault', 'loadout'];

const LS_SHIP_KEY = 'spacehero_lastShip';
const LS_RELICS_KEY = 'spacehero_lastRelics';

function loadPersistedShip(): ShipId {
  try {
    const v = localStorage.getItem(LS_SHIP_KEY);
    if (v === 'interceptor' || v === 'gunship' || v === 'drone') return v;
  } catch { /* noop */ }
  return 'interceptor';
}

function persistShip(id: ShipId) {
  try { localStorage.setItem(LS_SHIP_KEY, id); } catch { /* noop */ }
}

function loadPersistedRelics(): Record<ArtifactSlot, string | null> | null {
  try {
    const raw = localStorage.getItem(LS_RELICS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return null;
}

function persistRelics(ids: Record<ArtifactSlot, string | null>) {
  try { localStorage.setItem(LS_RELICS_KEY, JSON.stringify(ids)); } catch { /* noop */ }
}

interface HangarScreenProps {
  entry: HangarEntry;
  initialTab?: HangarTab;
  equippedIds: Record<ArtifactSlot, string | null>;
  unlockedArtifactIds: string[];
  metaScrap: number;
  newUnlockIds?: string[];
  defaultShipId?: ShipId;
  onEquip: (slot: ArtifactSlot, id: string | null) => void;
  onViewVault?: () => void;
  onViewCompanions?: () => void;
  onConfirmLaunch: (shipId: ShipId) => void;
  onBack: () => void;
}

export function HangarScreen({
  entry,
  initialTab = 'ship',
  equippedIds,
  unlockedArtifactIds,
  metaScrap,
  newUnlockIds = [],
  defaultShipId,
  onEquip,
  onViewVault,
  onViewCompanions,
  onConfirmLaunch,
  onBack,
}: HangarScreenProps) {
  const [tab, setTab] = useState<HangarTab>(initialTab);
  const [selectedShip, setSelectedShip] = useState<ShipId | null>(
    () => defaultShipId ?? loadPersistedShip(),
  );
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const unlockedArtifacts = unlockedArtifactIds
    .map((id) => ARTIFACTS[id])
    .filter(Boolean) as Artifact[];

  const survivalMode = entry === 'survival';

  const completedSteps = new Set<HangarTab>();
  if (selectedShip) completedSteps.add('ship');
  const hasRelics = Object.values(equippedIds).some((v) => v != null);
  if (hasRelics) completedSteps.add('vault');

  const handleShipSelect = useCallback((id: ShipId) => {
    setSelectedShip(id);
    persistShip(id);
  }, []);

  const handleEquip = useCallback((slot: ArtifactSlot, id: string | null) => {
    onEquip(slot, id);
    const next = { ...equippedIds, [slot]: id };
    persistRelics(next);
  }, [onEquip, equippedIds]);

  const handleTabChange = (next: HangarTab) => {
    if (next === 'progress') {
      setShowProgress(true);
      return;
    }
    setShowProgress(false);
    setTab(next);
    if (next === 'vault') onViewVault?.();
  };

  const currentStepIdx = FLOW_STEPS.indexOf(tab);

  const goNext = () => {
    if (currentStepIdx < FLOW_STEPS.length - 1) {
      const next = FLOW_STEPS[currentStepIdx + 1];
      handleTabChange(next);
    }
  };

  const goPrev = () => {
    if (currentStepIdx > 0) {
      const prev = FLOW_STEPS[currentStepIdx - 1];
      handleTabChange(prev);
    } else {
      onBack();
    }
  };

  const canProceed = tab === 'ship' ? !!selectedShip : true;
  const isLastStep = currentStepIdx === FLOW_STEPS.length - 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showProgress) {
          setShowProgress(false);
        } else {
          goPrev();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 overflow-hidden flex flex-col pointer-events-auto"
      style={{
        background:
          'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(0,229,255,0.1) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(139,43,226,0.08) 0%, transparent 60%), var(--bg-void)',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <SpaceBackground scanlines />
      <div className="absolute inset-0 nebula-layer nebula-layer-animate pointer-events-none opacity-70" />
      <div className="relative z-10 flex flex-col flex-1 max-w-7xl mx-auto w-full min-h-0 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 shrink-0 mb-3 sm:mb-4">
          <div className="min-w-0">
            <p className="hud-micro-label mb-0.5">Orbital Bay</p>
            <h1
              className="font-display font-black tracking-[0.12em] text-white uppercase"
              style={{
                fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                textShadow: '0 0 48px rgba(0,229,255,0.4), 0 0 80px rgba(0,229,255,0.12)',
              }}
            >
              Hangar
            </h1>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-400/45 mt-0.5">
              {metaScrap.toLocaleString()} scrap · {unlockedArtifactIds.length} relics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProgress(!showProgress)}
              className="text-[10px] font-mono uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors px-3 py-2"
              style={{ minHeight: '44px' }}
            >
              Unlocks
            </button>
            <GhostButton onClick={goPrev} className="w-auto min-h-touch px-4 sm:px-6 shrink-0">
              Back
            </GhostButton>
          </div>
        </header>

        {/* Step indicator */}
        <HudTabBar
          tabs={FLOW_STEPS}
          active={tab}
          onChange={handleTabChange}
          completedSteps={completedSteps}
          className="shrink-0 mb-3 sm:mb-4"
        />

        {/* Tab content */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {showProgress ? (
              <motion.div
                key="progress"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <UnlockProgressTab />
              </motion.div>
            ) : (
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                {tab === 'ship' && (
                  <ShipTab selectedId={selectedShip} onSelect={handleShipSelect} />
                )}
                {tab === 'vault' && (
                  <RelicVaultTab
                    unlockedIds={unlockedArtifactIds}
                    equippedIds={equippedIds}
                    newUnlockIds={newUnlockIds}
                    onEquip={handleEquip}
                  />
                )}
                {tab === 'loadout' && (
                  <LoadoutTab
                    equippedIds={equippedIds}
                    unlockedArtifacts={unlockedArtifacts}
                    selectedShipId={selectedShip}
                    onEquip={handleEquip}
                    onPickSlot={() => handleTabChange('vault')}
                    onChangeShip={() => handleTabChange('ship')}
                    onChangeRelics={() => handleTabChange('vault')}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <footer
          className="shrink-0 pt-3 sm:pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mt-2 sm:mt-3 relative z-20"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Left: step hint */}
          <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 hidden sm:block">
            {showProgress
              ? 'Unlock progress'
              : tab === 'ship'
                ? 'Step 1 of 3 — Choose your vessel'
                : tab === 'vault'
                  ? 'Step 2 of 3 — Equip relics'
                  : 'Step 3 of 3 — Review & launch'}
          </p>

          {/* Right: action buttons */}
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            {showProgress ? (
              <PrimaryButton
                variant="primary"
                className="w-full sm:w-auto min-w-[160px] px-6"
                onClick={() => setShowProgress(false)}
              >
                Back to flow
              </PrimaryButton>
            ) : isLastStep && survivalMode ? (
              <PrimaryButton
                variant="accent"
                className="w-full sm:w-auto min-w-[200px] px-8"
                disabled={!selectedShip}
                onClick={() => selectedShip && onConfirmLaunch(selectedShip)}
              >
                Confirm & Launch
              </PrimaryButton>
            ) : isLastStep && !survivalMode ? (
              <PrimaryButton
                variant="primary"
                className="w-full sm:w-auto min-w-[160px] px-6"
                onClick={onBack}
              >
                Done
              </PrimaryButton>
            ) : (
              <>
                {tab === 'vault' && (
                  <SecondaryButton
                    className="w-auto px-4 hidden sm:flex"
                    onClick={() => goNext()}
                  >
                    Skip relics
                  </SecondaryButton>
                )}
                <PrimaryButton
                  variant="primary"
                  className="w-full sm:w-auto min-w-[160px] px-6"
                  disabled={!canProceed}
                  onClick={goNext}
                >
                  {tab === 'ship' ? 'Next: Relics' : 'Next: Review'}
                </PrimaryButton>
              </>
            )}
          </div>
        </footer>
      </div>
    </motion.div>
  );
}
