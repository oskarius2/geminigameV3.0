import { ShipId } from './types';
import { getShipDef } from './ships/shipDefs';

export interface WeaponSignature {
  projectileColor: string;
  projectileGlow: string;
  trailColor: string;
  impactColor: string;
  projectileSize: number;
  trailLength: number;
  impactSize: number;
  projectileShape: 'circle' | 'line' | 'hex' | 'star';
  special?: string;
}

export interface ProjectileRenderData {
  color: string;
  glowColor: string;
  trailColor: string;
  size: number;
  trailLength: number;
  shape: 'circle' | 'line' | 'hex' | 'star';
  intensity: number; // 1.0 = normal, higher = more intense
  hasOverdrive: boolean;
  isPiercing: boolean;
  isExplosive: boolean;
  isCrit: boolean;
  threatLevel: number; // 0-1 scale
}

// Ship weapon signatures based on the reference design
export const WEAPON_SIGNATURES: Record<ShipId, WeaponSignature> = {
  interceptor: {
    // Swift Falcon - Fast thin energy bolts with glowing trail
    projectileColor: '#00d4ff', // Bright cyan/electric blue
    projectileGlow: '#40e0ff',
    trailColor: '#00a3cc',
    impactColor: '#00d4ff',
    projectileSize: 0.8, // Smaller, thinner
    trailLength: 25, // Longer trail for speed
    impactSize: 1.0,
    projectileShape: 'line',
    special: 'high_frequency' // Multiple small projectiles
  },
  gunship: {
    // Heavy Sentinel - Heavy cannon shells
    projectileColor: '#ff6b35', // Deep orange/red
    projectileGlow: '#ff8555',
    trailColor: '#cc5428',
    impactColor: '#ff6b35',
    projectileSize: 1.5, // Larger, chunkier
    trailLength: 15, // Shorter but thicker trail
    impactSize: 2.0, // Much larger impact
    projectileShape: 'hex',
    special: 'heavy_impact' // Fewer, heavier projectiles
  },
  drone: {
    // Swarm Vessel - Orbiting drones with pulse waves
    projectileColor: '#f5f5f5', // White/silver
    projectileGlow: '#ffffff',
    trailColor: '#cccccc',
    impactColor: '#f5f5f5',
    projectileSize: 1.0,
    trailLength: 20,
    impactSize: 1.2,
    projectileShape: 'star',
    special: 'orbital_support' // Projectiles from multiple angles
  }
};

export function getProjectileRenderData(
  shipId: ShipId,
  threatLevel: number,
  buffs: {
    overdrive?: number;
    piercing?: boolean;
    explosive?: boolean;
  } = {},
  isCrit: boolean = false
): ProjectileRenderData {
  const signature = WEAPON_SIGNATURES[shipId];
  const ship = getShipDef(shipId);
  
  // Base intensity from threat level (0.25 = calm, 1.0 = critical)
  const threatIntensity = 0.7 + (threatLevel * 0.8);
  
  // Color intensity based on threat level
  const getIntensifiedColor = (baseColor: string, intensity: number) => {
    // Convert hex to RGB, increase saturation/brightness
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Increase brightness and saturation with threat level
    const boost = Math.min(1.5, intensity);
    const newR = Math.min(255, Math.floor(r * boost));
    const newG = Math.min(255, Math.floor(g * boost));
    const newB = Math.min(255, Math.floor(b * boost));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  let projectileColor = signature.projectileColor;
  let glowColor = signature.projectileGlow;
  let size = signature.projectileSize;
  let trailLength = signature.trailLength;

  // Apply threat level intensity
  if (threatLevel > 0.5) {
    projectileColor = getIntensifiedColor(signature.projectileColor, threatIntensity);
    glowColor = getIntensifiedColor(signature.projectileGlow, threatIntensity);
  }

  // Crit hit modifications
  if (isCrit) {
    projectileColor = '#ffd700'; // Gold overlay for crits
    glowColor = '#ffed4a';
    size *= 1.3;
    trailLength *= 1.4;
  }

  // Overdrive buff modifications
  const hasOverdrive = (buffs.overdrive || 0) > 0;
  if (hasOverdrive) {
    const overdriveBoost = 1.3;
    projectileColor = getIntensifiedColor(projectileColor, overdriveBoost);
    glowColor = getIntensifiedColor(glowColor, overdriveBoost);
    trailLength *= 1.5;
    size *= 1.2;
  }

  // Piercing buff modifications  
  const isPiercing = buffs.piercing || false;
  if (isPiercing) {
    trailLength *= 1.6; // Longer trails for piercing
  }

  return {
    color: projectileColor,
    glowColor: glowColor,
    trailColor: signature.trailColor,
    size: size,
    trailLength: trailLength,
    shape: signature.projectileShape,
    intensity: threatIntensity,
    hasOverdrive,
    isPiercing,
    isExplosive: buffs.explosive || false,
    isCrit,
    threatLevel
  };
}

export function getImpactEffectData(
  shipId: ShipId,
  damage: number,
  isCrit: boolean,
  threatLevel: number
) {
  const signature = WEAPON_SIGNATURES[shipId];
  const baseSize = signature.impactSize;
  
  // Scale impact size based on damage and ship type
  let impactSize = baseSize;
  if (isCrit) impactSize *= 3.0; // Massive crit impacts
  if (threatLevel > 0.75) impactSize *= 1.8; // Critical threat level
  if (damage > 100) impactSize *= 1.5; // High damage hits
  
  return {
    color: signature.impactColor,
    size: impactSize,
    particleCount: Math.floor(baseSize * 8 * (1 + threatLevel)),
    shockwave: shipId === 'gunship', // Heavy Sentinel gets shockwave rings
    cascade: shipId === 'drone', // Swarm Vessel gets cascade sparkles
    sparkBurst: shipId === 'interceptor' // Swift Falcon gets zippy sparks
  };
}

// Screen effects for major moments
export function shouldTriggerScreenFlash(
  shipId: ShipId,
  damage: number,
  isCrit: boolean,
  threatLevel: number
): { flash: boolean; color: string; intensity: number } {
  if (isCrit && damage > 150) {
    return {
      flash: true,
      color: '#ffd700', // Gold flash for big crits
      intensity: 0.3
    };
  }
  
  if (threatLevel > 0.75 && damage > 80) {
    const signature = WEAPON_SIGNATURES[shipId];
    return {
      flash: true,
      color: signature.projectileColor,
      intensity: 0.2
    };
  }
  
  return { flash: false, color: '', intensity: 0 };
}