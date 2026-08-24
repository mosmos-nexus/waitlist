<script lang="ts">
  // Horizontal lockup intrinsic aspect ratio (viewBox 2820.905 × 893.965).
  const RATIO = 2820.905 / 893.965;

  interface Props {
    height?: number;
    alt?: string;
    /** The waitlist runs dark, so white is the default treatment. */
    tone?: 'white' | 'color';
  }

  let { height = 28, alt = 'mosmos', tone = 'white' }: Props = $props();
  const width = $derived(Math.round(height * RATIO));
  const src = $derived(
    tone === 'white' ? '/brand/mosmos-horizontal-white.svg' : '/brand/mosmos-horizontal-color.svg',
  );
</script>

<img class="logo" {src} {alt} {height} {width} />

<style>
  .logo {
    display: block;
  }
</style>
