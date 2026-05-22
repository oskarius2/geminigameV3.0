/** Display names for survival stage intro overlays. */
export const SURVIVAL_STAGE_NAMES: Record<number, string> = {
  1: 'AWAKENING',
  2: 'PRESSURE',
  3: 'VARIATION',
  4: 'ESCALATION',
  5: 'ENDLESS CHAOS',
};

export function getStageIntroLabel(stage: number): string {
  const name = SURVIVAL_STAGE_NAMES[stage];
  return name ? `STAGE ${stage}: ${name}` : `STAGE ${stage}`;
}
