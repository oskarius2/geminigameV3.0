import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { SpaceBackground } from '../../components/ui/SpaceBackground';
import { HudTabBar, type HangarTab } from '../../components/ui/HudTabBar';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { GhostButton } from '../../components/ui/GhostButton';
import { Artifact, ArtifactSlot, ShipId } from '../types';
import { ARTIFACTS } from '../content/artifacts';
import { ShipTab } from './hangar/ShipTab';
import { RelicVaultTab } from './hangar/RelicVaultTab';
import { LoadoutTab } from './hangar/LoadoutTab';
import { UnlockProgressTab } from './hangar/UnlockProgressTab';

export type HangarEntry = 'survival' | 'meta';

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
  defaultShipId = 'interceptor',
  onEquip,
  onViewVault,
  onViewCompanions,
  onConfirmLaunch,
  onBack,
}: HangarScreenProps) {
  const [tab, setTab] = useState<HangarTab>(initialTab);
  const [selectedShip, setSelectedShip] = useState<ShipId | null>(defaultShipId);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const unlockedArtifacts = unlockedArtifactIds
    .map((id) => ARTIFACTS[id])
    .filter(Boolean) as Artifact[];

  const survivalMode = entry === 'survival';

  const handleTabChange = (next: HangarTab) => {
    setTab(next);
    if (next === 'vault') onViewVault?.();
    if (next === 'progress') onViewVault?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[600] overflow-hidden flex flex-col pointer-events-auto"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 70%), #020617',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <SpaceBackground />
      <div className="relative z-10 flex flex-col flex-1 max-w-7xl mx-auto w-full min-h-0 p-4 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-4 shrink-0 mb-4">
          <div>
            <h1
              className="font-display font-bold tracking-[0.15em] text-white uppercase"
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                textShadow: '0 0 40px rgba(0,212,255,0.35)',
              }}
            >
              Hangar
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/60 mt-1">
              {metaScrap.toLocaleString()} scrap · {unlockedArtifactIds.length} relics
            </p>
          </div>
          <GhostButton onClick={onBack} className="!w-auto min-h-touch px-6 shrink-0">
            Back
          </GhostButton>
        </header>

        <HudTabBar
          tabs={['ship', 'vault', 'loadout', 'progress']}
          active={tab}
          onChange={handleTabChange}
          className="shrink-0 mb-4"
        />

        <div className="flex-1 min-h-0 flex flex-col">
          {tab === 'ship' && (
            <ShipTab selectedId={selectedShip} onSelect={(id) => setSelectedShip(id)} />
          )}
          {tab === 'vault' && (
            <RelicVaultTab
              unlockedIds={unlockedArtifactIds}
              equippedIds={equippedIds}
              newUnlockIds={newUnlockIds}
              onEquip={onEquip}
            />
          )}
          {tab === 'loadout' && (
            <LoadoutTab
              equippedIds={equippedIds}
              unlockedArtifacts={unlockedArtifacts}
              onEquip={onEquip}
              onPickSlot={() => setTab('vault')}
            />
          )}
          {tab === 'progress' && <UnlockProgressTab />}
        </div>

        <footer className="shrink-0 pt-4 flex flex-wrap justify-end gap-3 border-t border-white/10 mt-4">
          {survivalMode ? (
            <PrimaryButton
              className="!w-auto min-w-[200px] px-8"
              disabled={!selectedShip}
              onClick={() => selectedShip && onConfirmLaunch(selectedShip)}
            >
              Confirm and Launch
            </PrimaryButton>
          ) : (
            <PrimaryButton className="!w-auto min-w-[160px] px-6" onClick={onBack}>
              Done
            </PrimaryButton>
          )}
        </footer>
      </div>
    </motion.div>
  );
}
