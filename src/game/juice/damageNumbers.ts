import { DamageText } from '../types';
import { Vector2 } from '../utils/vector';

const MERGE_RADIUS = 40;
const MAX_DAMAGE_TEXTS = 25;

export function spawnDamageNumber(
  texts: DamageText[],
  pos: Vector2,
  damage: number,
  color: string,
  isCrit: boolean,
  chaosFactor: number,
  isKill?: boolean
): void {
  // Only show if it's a kill, a crit, or rarely on normal hits
  const shouldShow = isKill || isCrit || Math.random() < 0.2;
  if (!shouldShow) return;

  if (Math.random() > 1 - 1 / (chaosFactor * 2)) return;

  const text = (isCrit ? 'CRIT! ' : '') + Math.round(damage).toString();

  // Always attempt merge first — reduces visual noise regardless of cap
  for (const existing of texts) {
    if (existing.color !== color) continue;
    if (existing.pos.distanceTo(pos) > MERGE_RADIUS) continue;
    const prev = parseInt(existing.text.replace(/\D/g, ''), 10) || 0;
    existing.text = (isCrit || existing.text.startsWith('CRIT') ? 'CRIT! ' : '') + (prev + Math.round(damage)).toString();
    existing.life = Math.min(1.0, existing.life + 0.25);
    existing.pos = existing.pos.add(pos).mul(0.5);
    return;
  }

  // Hard cap applies to all types — no new push when full
  if (texts.length >= MAX_DAMAGE_TEXTS) return;

  texts.push({
    id: Math.random().toString(36).slice(2),
    pos: pos.clone(),
    text,
    life: 0.8,
    color,
  });
}
