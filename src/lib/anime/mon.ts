/**
 * Mon identity, kept out of the component so sections can type their own
 * role lists without importing the Svelte file.
 *
 * Three role variants per the design system: research (purple — research and
 * analysis), organize (green — scheduling and categorization), design (pink —
 * creation and content).
 */

export type MonRole = 'research' | 'organize' | 'design';

export interface MonTint {
  /** Body base colour and the status pip. */
  core: string;
  /** Deep end of the body gradient. */
  deep: string;
  /** Halo and inner core glow. */
  glow: string;
  /** Rim highlight. */
  rim: string;
}

export const MON_TINT: Record<MonRole, MonTint> = {
  research: { core: '#8B5CF6', deep: '#2A1065', glow: '#B99AF4', rim: '#C4B5FD' },
  organize: { core: '#21EDB3', deep: '#06402F', glow: '#5FF0C8', rim: '#A7F3D0' },
  design: { core: '#E96AA6', deep: '#54122F', glow: '#F49AC2', rim: '#FBCFE8' },
};
