import type { MiniBossId } from './miniBossDefs';
import { playSfx } from '../audio/sfx';
import { onMiniBossSpawn } from '../audio/survivalAudio';

function stingMiniBossSpawn(): void {
  onMiniBossSpawn();
  playSfx('miniBossSpawn');
}

/** Per-archetype spawn sting (falls back to generic miniBossSpawn). */
export function playMiniBossSpawnSfx(id: MiniBossId): void {
  switch (id) {
    case 'shockwave_sentinel':
      stingMiniBossSpawn();
      break;
    case 'eclipse_dasher':
      playSfx('rails_death_dasher');
      setTimeout(() => stingMiniBossSpawn(), 80);
      break;
    case 'void_harbinger':
      playSfx('rails_void_tear');
      break;
    case 'plasma_splitter':
      playSfx('rails_death_ranged');
      setTimeout(() => stingMiniBossSpawn(), 60);
      break;
    case 'chronos_guardian':
      playSfx('rails_weak_ding');
      setTimeout(() => stingMiniBossSpawn(), 100);
      break;
    case 'swarm_overlord':
      playSfx('rails_death_swarm');
      setTimeout(() => stingMiniBossSpawn(), 50);
      break;
    default:
      stingMiniBossSpawn();
  }
}

/** Heavy boom for shockwave / plasma detonation / swarm summon bursts. */
export function playMiniBossExplosionSfx(): void {
  playSfx('miniBossExplosion');
}

/** Per-archetype defeat sting. */
export function playMiniBossDefeatSfx(id: MiniBossId): void {
  switch (id) {
    case 'shockwave_sentinel':
      playSfx('miniBossDefeat');
      break;
    case 'eclipse_dasher':
      playSfx('crit');
      setTimeout(() => playSfx('miniBossDefeat'), 90);
      break;
    case 'void_harbinger':
      playSfx('rails_boss_defeat_void');
      break;
    case 'plasma_splitter':
      playSfx('rails_boss_defeat_sentinel');
      break;
    case 'chronos_guardian':
      playSfx('exclusive');
      break;
    case 'swarm_overlord':
      playSfx('levelUp');
      break;
    default:
      playSfx('miniBossDefeat');
  }
}
