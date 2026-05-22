import type { MiniBossId } from './miniBossDefs';
import { playSfx } from '../audio/sfx';

/** Per-archetype spawn sting (falls back to generic miniBossSpawn). */
export function playMiniBossSpawnSfx(id: MiniBossId): void {
  switch (id) {
    case 'shockwave_sentinel':
      playSfx('miniBossSpawn');
      break;
    case 'eclipse_dasher':
      playSfx('rails_death_dasher');
      setTimeout(() => playSfx('miniBossSpawn'), 80);
      break;
    case 'void_harbinger':
      playSfx('rails_void_tear');
      break;
    case 'plasma_splitter':
      playSfx('rails_death_ranged');
      setTimeout(() => playSfx('miniBossSpawn'), 60);
      break;
    case 'chronos_guardian':
      playSfx('rails_weak_ding');
      setTimeout(() => playSfx('miniBossSpawn'), 100);
      break;
    case 'swarm_overlord':
      playSfx('rails_death_swarm');
      setTimeout(() => playSfx('miniBossSpawn'), 50);
      break;
    default:
      playSfx('miniBossSpawn');
  }
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
