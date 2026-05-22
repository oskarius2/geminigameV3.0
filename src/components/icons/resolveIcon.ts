import type { ShipId } from '../../game/types';
import type { ArtifactSlot } from '../../game/types';
import type { CompanionId } from '../../game/types';
import type { IconName } from './types';

const WARNED = new Set<string>();

/** Legacy buff / shop Lucide icon string → canonical name */
const LEGACY_BUFF_MAP: Record<string, IconName> = {
  Zap: 'buff.zap',
  Target: 'buff.target',
  Shield: 'buff.shield',
  Flame: 'buff.flame',
  Magnet: 'buff.magnet',
  Activity: 'buff.activity',
  RotateCcw: 'buff.rotate',
  HeartPulse: 'buff.heart',
  ShieldCheck: 'buff.shieldCheck',
  Bomb: 'buff.bomb',
  Swords: 'buff.swords',
  CircleIcon: 'buff.circle',
  MoveRight: 'buff.moveRight',
  Trophy: 'buff.trophy',
  Sparkles: 'buff.sparkles',
  Gauge: 'shop.gauge',
  Package: 'shop.package',
  TrendingUp: 'shop.trending',
  Wind: 'shop.wind',
  Cloud: 'shop.cloud',
  ArrowUpCircle: 'shop.arrowUp',
  Bot: 'shop.bot',
  Crosshair: 'buff.target',
  MoveHorizontal: 'buff.moveRight',
};

const MINIBOSS_MAP: Record<string, IconName> = {
  shield: 'miniboss.shield',
  wave: 'miniboss.wave',
  speed: 'miniboss.speed',
  strike: 'miniboss.strike',
  ghost: 'miniboss.ghost',
  drain: 'miniboss.drain',
  apex: 'miniboss.apex',
  time: 'miniboss.time',
};

const RAILS_LEVEL_MAP: Record<string, IconName> = {
  tunnel: 'rails.tunnel',
  asteroid: 'rails.asteroid',
  void: 'rails.void',
};

const RAILS_POWERUP_MAP: Record<string, IconName> = {
  shield: 'rails.shield',
  gun: 'rails.gun',
  clock: 'rails.clock',
  heart: 'rails.heart',
  star: 'rails.star',
  bolt: 'rails.bolt',
  bomb: 'rails.bomb',
};

export function getShipIconName(shipId: ShipId): IconName {
  switch (shipId) {
    case 'gunship':
      return 'ship.tank';
    case 'interceptor':
      return 'ship.fast';
    case 'drone':
      return 'ship.balanced';
    default:
      return 'ship.balanced';
  }
}

export function getCompanionIconName(id: CompanionId): IconName {
  switch (id) {
    case 'guardian':
      return 'companion.guardian';
    case 'scout':
      return 'companion.scout';
    case 'healer':
      return 'companion.healer';
    case 'gunner':
      return 'companion.gunner';
    default:
      return 'companion.guardian';
  }
}

export function getSlotIconName(slot: ArtifactSlot): IconName {
  switch (slot) {
    case 'CANNON_A':
      return 'slot.cannonA';
    case 'CANNON_B':
      return 'slot.cannonB';
    case 'ULTIMATE':
      return 'slot.ultimate';
    case 'ARMOR':
      return 'slot.armor';
    case 'MOBILITY':
      return 'slot.mobility';
    default:
      return 'slot.cannonA';
  }
}

/** Resolve data-layer icon keys (buffs, shop, rails, miniboss) */
export function resolveIconKey(key: string | undefined | null): IconName {
  if (!key) return 'ui.fallback';
  if (key in LEGACY_BUFF_MAP) return LEGACY_BUFF_MAP[key];
  if (key in MINIBOSS_MAP) return MINIBOSS_MAP[key];
  if (key in RAILS_LEVEL_MAP) return RAILS_LEVEL_MAP[key];
  if (key in RAILS_POWERUP_MAP) return RAILS_POWERUP_MAP[key];
  if (key === 'artifact') return 'ui.artifact';
  if (key.startsWith('ship.') || key.startsWith('buff.') || key.startsWith('slot.')) {
    return key as IconName;
  }
  if (import.meta.env.DEV && !WARNED.has(key)) {
    WARNED.add(key);
    console.warn(`[GameIcon] Unknown icon key: "${key}"`);
  }
  return 'ui.fallback';
}
