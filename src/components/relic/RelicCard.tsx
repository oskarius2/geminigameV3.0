import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import type { Artifact, ArtifactSlot } from '../../game/types';
import { BuffRarity } from '../../game/types';
import { artifactPowerScore } from '../../game/content/artifacts';

const RARITY_CLASS: Record<BuffRarity, string> = {
  [BuffRarity.COMMON]: 'relic-card--common',
  [BuffRarity.RARE]: 'relic-card--rare',
  [BuffRarity.EPIC]: 'relic-card--epic',
  [BuffRarity.LEGENDARY]: 'relic-card--legendary',
  [BuffRarity.EXCLUSIVE]: 'relic-card--exclusive',
  [BuffRarity.MYSTERY]: 'relic-card--mystery',
};

export interface RelicCardProps {
  artifact: Artifact;
  owned: boolean;
  equipped: boolean;
  isNew?: boolean;
  description: string;
  enterDelayMs?: number;
  onEquip?: () => void;
}

export function RelicCard({
  artifact,
  owned,
  equipped,
  isNew = false,
  description,
  enterDelayMs = 0,
  onEquip,
}: RelicCardProps) {
  const locked = !owned;
  const rarityMod = RARITY_CLASS[artifact.rarity] ?? 'relic-card--common';

  return (
    <article
      className={clsx(
        'relic-card',
        'relic-card--enter',
        rarityMod,
        locked && 'relic-card--locked',
        equipped && 'relic-card--equipped',
      )}
      style={{ animationDelay: `${enterDelayMs}ms` }}
      aria-label={owned ? artifact.name : `Locked relic: ${artifact.slot}`}
    >
      <div className="relic-card__rarity-bar" aria-hidden />

      {isNew && owned && (
        <span className="relic-card__badge" aria-label="New unlock">
          <Sparkles size={12} strokeWidth={2.5} aria-hidden />
          NEW
        </span>
      )}

      {locked && (
        <Lock className="relic-card__lock" size={18} aria-hidden />
      )}

      <div className="relic-card__content">
        <span className="relic-card__label">{artifact.rarity}</span>
        <h3 className="relic-card__name">{owned ? artifact.name : 'Locked'}</h3>
        <span className="relic-card__slot">{formatSlot(artifact.slot)}</span>

        {owned && (
          <>
            <div className="relic-card__divider" />
            <p className="relic-card__description">{description}</p>
            <span className="relic-card__power">Power: {artifactPowerScore(artifact)}</span>
            {onEquip && (
              <div className="relic-card__actions">
                <button
                  type="button"
                  className={clsx(
                    'relic-card__btn',
                    equipped ? 'relic-card__btn--unequip' : 'relic-card__btn--equip',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEquip();
                  }}
                >
                  {equipped ? 'Unequip' : 'Equip'}
                </button>
              </div>
            )}
          </>
        )}

        {locked && (
          <p className="relic-card__description">{description}</p>
        )}
      </div>
    </article>
  );
}

function formatSlot(slot: ArtifactSlot): string {
  return slot.replace(/_/g, ' ');
}
