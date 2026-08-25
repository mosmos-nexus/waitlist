<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, prefersReduced } from '$lib/anime/motion';

  /**
   * A Mon.
   *
   * Same family as Mos — round, soft-edged, lit from inside — but smaller and
   * simpler on purpose: a Mon is a specialist that shows up, does one thing and
   * leaves, so it does not carry Mos's roaming dents or its face. It gets a
   * tone instead, which is how the design system tells the three roles apart.
   *
   * The silhouette is a fixed path rather than a per-frame rewrite. Several of
   * these can be on screen at once and the difference would not read at this
   * size, while the cost would multiply.
   */
  type Tone = 'research' | 'organize' | 'design';

  interface Props {
    tone?: Tone;
    size?: number;
    /** Working Mon glow harder and bob faster. */
    active?: boolean;
    /** Staggers the idle bob so a row of them never pulses in unison. */
    phase?: number;
    label?: string;
  }
  let { tone = 'research', size = 56, active = false, phase = 0, label }: Props = $props();

  const TONES: Record<Tone, { core: string; edge: string; rim: string }> = {
    research: { core: '#9B6EEF', edge: '#5436B4', rim: '#D3BFF8' },
    organize: { core: '#21EDB3', edge: '#0F8F6B', rim: '#B8FBE5' },
    design: { core: '#E96AA6', edge: '#A62E68', rim: '#F8C6DE' },
  };
  const t = $derived(TONES[tone]);

  // Unique per instance: gradient ids are document-global, and this component
  // is rendered many times on one page.
  const uid = $props.id();

  let root = $state<SVGSVGElement | null>(null);

  onMount(() => {
    if (!root || prefersReduced()) return;
    const bob = animate(root, {
      translateY: [0, -6],
      duration: 2400 + phase * 260,
      loop: true,
      alternate: true,
      ease: 'inOut(2)',
      delay: phase * 180,
    });
    return () => bob.revert();
  });
</script>

<svg
  bind:this={root}
  class="mon"
  class:active
  viewBox="0 0 120 120"
  width={size}
  height={size}
  role={label ? 'img' : 'presentation'}
  aria-label={label}
  style="--core:{t.core};--edge:{t.edge};--rim:{t.rim}"
>
  <defs>
    <radialGradient id="mon-body-{uid}" cx="0.36" cy="0.3" r="0.85">
      <stop offset="0" stop-color={t.core} stop-opacity="0.95" />
      <stop offset="0.62" stop-color={t.edge} stop-opacity="0.96" />
      <stop offset="1" stop-color={t.edge} />
    </radialGradient>
    <linearGradient id="mon-rim-{uid}" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color={t.rim} stop-opacity="0.85" />
      <stop offset="0.6" stop-color={t.rim} stop-opacity="0.28" />
      <stop offset="1" stop-color={t.rim} stop-opacity="0" />
    </linearGradient>
    <radialGradient id="mon-gloss-{uid}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.4" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- One closed curve with four gentle lobes: round enough to read as a drop
       of the same material Mos is made of, uneven enough not to be a circle. -->
  <path
    class="body"
    d="M60,10
       C84,10 104,26 108,48
       C112,70 100,92 80,102
       C64,110 44,110 30,100
       C12,88 6,66 12,46
       C18,26 38,10 60,10Z"
    fill="url(#mon-body-{uid})"
  />
  <ellipse cx="44" cy="38" rx="22" ry="16" fill="url(#mon-gloss-{uid})" />
  <path
    d="M60,10
       C84,10 104,26 108,48
       C112,70 100,92 80,102
       C64,110 44,110 30,100
       C12,88 6,66 12,46
       C18,26 38,10 60,10Z"
    fill="none"
    stroke="url(#mon-rim-{uid})"
    stroke-width="2.6"
  />
  <g fill="#0B1B33" opacity="0.82">
    <circle cx="46" cy="58" r="4.6" />
    <circle cx="74" cy="58" r="4.6" />
  </g>
  <path
    d="M50,74 Q60,82 70,74"
    fill="none"
    stroke="#0B1B33"
    stroke-opacity="0.8"
    stroke-width="4"
    stroke-linecap="round"
  />
</svg>

<style>
  .mon {
    display: block;
    overflow: visible;
    filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
    transition: filter var(--duration-slow) var(--ease-out);
  }
  .mon.active {
    filter: drop-shadow(0 0 18px color-mix(in srgb, var(--core) 55%, transparent))
      drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
  }
  .body {
    transition: opacity var(--duration-base) var(--ease-out);
  }
</style>
