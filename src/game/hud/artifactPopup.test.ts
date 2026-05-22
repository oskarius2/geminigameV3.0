import { describe, expect, it } from 'vitest';
import { ARTIFACTS } from '../content/artifacts';
import { BuffRarity } from '../types';
import {
  describeArtifactStatChanges,
  formatArtifactAcquire,
  getRarityVisual,
} from './artifactPopup';

describe('artifactPopup', () => {
  it('formats legendary title and stat lines', () => {
    const art = ARTIFACTS.eternal_star;
    expect(art.rarity).toBe(BuffRarity.LEGENDARY);
    const formatted = formatArtifactAcquire(art);
    expect(formatted.title).toBe('LEGENDARY ARTIFACT ACQUIRED: Eternal Star');
    const stats = describeArtifactStatChanges(art);
    expect(stats).toContain('+60% Damage');
    expect(stats).toContain('+150 Health');
  });

  it('assigns higher flash for legendary than common', () => {
    const leg = getRarityVisual(BuffRarity.LEGENDARY);
    const common = getRarityVisual(BuffRarity.COMMON);
    expect(leg.flash).toBeGreaterThan(common.flash);
    expect(leg.color).toBe('#fbbf24');
  });
});
