import { describe, expect, it } from 'vitest';
import { getProjectileRenderData, getImpactEffectData, shouldTriggerScreenFlash, WEAPON_SIGNATURES } from './weaponEffects';

describe('weaponEffects', () => {
  it('provides correct weapon signatures for each ship', () => {
    // Swift Falcon (Interceptor)
    expect(WEAPON_SIGNATURES.interceptor.projectileColor).toBe('#00d4ff');
    expect(WEAPON_SIGNATURES.interceptor.projectileShape).toBe('line');
    expect(WEAPON_SIGNATURES.interceptor.special).toBe('high_frequency');

    // Heavy Sentinel (Gunship)
    expect(WEAPON_SIGNATURES.gunship.projectileColor).toBe('#ff6b35');
    expect(WEAPON_SIGNATURES.gunship.projectileShape).toBe('hex');
    expect(WEAPON_SIGNATURES.gunship.special).toBe('heavy_impact');

    // Swarm Vessel (Drone)
    expect(WEAPON_SIGNATURES.drone.projectileColor).toBe('#f5f5f5');
    expect(WEAPON_SIGNATURES.drone.projectileShape).toBe('star');
    expect(WEAPON_SIGNATURES.drone.special).toBe('orbital_support');
  });

  it('generates correct projectile render data based on ship and threat level', () => {
    const renderData = getProjectileRenderData('interceptor', 0.5);
    
    expect(renderData.color).toBe('#00d4ff');
    expect(renderData.shape).toBe('line');
    expect(renderData.size).toBe(0.8); // Swift Falcon has smaller projectiles
    expect(renderData.trailLength).toBe(25); // Swift Falcon has longer trails
  });

  it('modifies projectile data for crit hits', () => {
    const normalData = getProjectileRenderData('gunship', 0.3, {}, false);
    const critData = getProjectileRenderData('gunship', 0.3, {}, true);
    
    expect(critData.color).toBe('#ffd700'); // Gold for crits
    expect(critData.size).toBeGreaterThan(normalData.size);
    expect(critData.trailLength).toBeGreaterThan(normalData.trailLength);
    expect(critData.isCrit).toBe(true);
  });

  it('applies overdrive buff modifications', () => {
    const normalData = getProjectileRenderData('drone', 0.4);
    const overdriveData = getProjectileRenderData('drone', 0.4, { overdrive: 100 });
    
    expect(overdriveData.size).toBeGreaterThan(normalData.size);
    expect(overdriveData.trailLength).toBeGreaterThan(normalData.trailLength);
    expect(overdriveData.hasOverdrive).toBe(true);
  });

  it('generates ship-specific impact effects', () => {
    // Heavy Sentinel should have shockwave effects
    const gunshipImpact = getImpactEffectData('gunship', 100, false, 0.5);
    expect(gunshipImpact.shockwave).toBe(true);
    expect(gunshipImpact.cascade).toBe(false);
    expect(gunshipImpact.sparkBurst).toBe(false);

    // Swarm Vessel should have cascade effects
    const droneImpact = getImpactEffectData('drone', 50, false, 0.3);
    expect(droneImpact.cascade).toBe(true);
    expect(droneImpact.shockwave).toBe(false);
    expect(droneImpact.sparkBurst).toBe(false);

    // Swift Falcon should have spark burst effects
    const interceptorImpact = getImpactEffectData('interceptor', 75, false, 0.4);
    expect(interceptorImpact.sparkBurst).toBe(true);
    expect(interceptorImpact.shockwave).toBe(false);
    expect(interceptorImpact.cascade).toBe(false);
  });

  it('triggers screen flash for major hits', () => {
    // Big crit should trigger screen flash
    const bigCrit = shouldTriggerScreenFlash('interceptor', 200, true, 0.6);
    expect(bigCrit.flash).toBe(true);
    expect(bigCrit.color).toBe('#ffd700'); // Gold flash for crits
    expect(bigCrit.intensity).toBe(0.3);

    // High threat + high damage should trigger ship-colored flash
    const highThreat = shouldTriggerScreenFlash('gunship', 100, false, 0.8);
    expect(highThreat.flash).toBe(true);
    expect(highThreat.color).toBe('#ff6b35'); // Ship color
    expect(highThreat.intensity).toBe(0.2);

    // Low damage should not trigger flash
    const lowDamage = shouldTriggerScreenFlash('drone', 30, false, 0.5);
    expect(lowDamage.flash).toBe(false);
  });

  it('scales impact size based on damage and crit', () => {
    const normalImpact = getImpactEffectData('gunship', 50, false, 0.3);
    const critImpact = getImpactEffectData('gunship', 50, true, 0.3);
    const highDamageImpact = getImpactEffectData('gunship', 150, false, 0.3);
    
    expect(critImpact.size).toBeGreaterThan(normalImpact.size);
    expect(highDamageImpact.size).toBeGreaterThan(normalImpact.size);
    expect(critImpact.size).toBe(normalImpact.size * 3.0); // 3x for crit
  });
});