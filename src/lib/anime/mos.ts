/**
 * Mos mood presets.
 *
 * One body, four readings. Each mood only adjusts energy, aura tint, the
 * Summon-Green glob and the resting face — the silhouette engine and every
 * idle loop stay exactly the same, which is the point: it should read as the
 * same creature in a different state, not four different characters.
 */

export type MosMood = 'idle' | 'working' | 'resting' | 'happy';

export interface MosMoodSpec {
  /** Multiplier handed to the blob's dent depth. */
  energy: number;
  /** Background for the aura layer. */
  aura: string;
  /** Opacity of the Summon-Green inner glob. */
  greenGlob: number;
  /** Whether the ^^ face is held at rest. */
  happyFace: boolean;
}

const aura = (inner: string, mid: string) =>
  `radial-gradient(closest-side,${inner},${mid} 58%,transparent)`;

export const MOS_MOOD: Record<MosMood, MosMoodSpec> = {
  idle: {
    energy: 1,
    aura: aura('rgba(31,206,206,.30)', 'rgba(15,111,218,.16)'),
    greenGlob: 0.42,
    happyFace: false,
  },
  working: {
    energy: 1.2,
    aura: aura('rgba(33,237,179,.32)', 'rgba(15,111,218,.18)'),
    greenGlob: 0.9,
    happyFace: false,
  },
  resting: {
    energy: 0.62,
    aura: aura('rgba(31,206,206,.16)', 'rgba(15,111,218,.09)'),
    greenGlob: 0.2,
    happyFace: false,
  },
  happy: {
    energy: 1.1,
    aura: aura('rgba(139,190,247,.34)', 'rgba(31,206,206,.18)'),
    greenGlob: 0.55,
    happyFace: true,
  },
};
