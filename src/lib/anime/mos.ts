/**
 * Mos mood presets.
 *
 * One body, four readings. A mood adjusts dent energy, resting aspect, aura
 * tint, the Summon-Green glob and the face — the silhouette engine and every
 * idle loop stay exactly the same, which is the point: it should read as the
 * same creature in a different state, not four different characters.
 *
 * The Monitor wireframes show Mos visibly rounder at rest and leaner while
 * working, so `aspect` carries that: `working` stands up and narrows, `resting`
 * settles wide and low. `energy` alone was too subtle to read at a glance.
 */

export type MosMood = 'idle' | 'working' | 'resting' | 'happy';

/** Which face group rests when nothing is poking Mos. */
export type MosFace = 'calm' | 'happy' | 'focus' | 'sleepy';

export interface MosMoodSpec {
  /** Multiplier handed to the blob's dent depth. */
  energy: number;
  /** Resting silhouette aspect `[x, y]` — how tall or wide the body sits. */
  aspect: [number, number];
  /** Background for the aura layer. */
  aura: string;
  /** Opacity of the Summon-Green inner glob. */
  greenGlob: number;
  /** Face group held at rest. */
  face: MosFace;
}

const aura = (inner: string, mid: string) =>
  `radial-gradient(closest-side,${inner},${mid} 58%,transparent)`;

export const MOS_MOOD: Record<MosMood, MosMoodSpec> = {
  idle: {
    energy: 1,
    aspect: [1, 1],
    aura: aura('rgba(31,206,206,.30)', 'rgba(15,111,218,.16)'),
    greenGlob: 0.42,
    face: 'calm',
  },
  working: {
    energy: 1.24,
    aspect: [0.965, 1.05],
    aura: aura('rgba(33,237,179,.38)', 'rgba(15,111,218,.2)'),
    greenGlob: 0.95,
    face: 'focus',
  },
  resting: {
    energy: 0.5,
    aspect: [1.07, 0.92],
    aura: aura('rgba(31,206,206,.14)', 'rgba(15,111,218,.08)'),
    greenGlob: 0.16,
    face: 'sleepy',
  },
  happy: {
    energy: 1.2,
    aspect: [1.05, 1.03],
    aura: aura('rgba(139,190,247,.36)', 'rgba(31,206,206,.2)'),
    greenGlob: 0.55,
    face: 'happy',
  },
};

/** Every face group, so a swap can zero the ones that are not resting. */
export const MOS_FACES: MosFace[] = ['calm', 'happy', 'focus', 'sleepy'];
