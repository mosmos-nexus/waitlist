<script lang="ts">
  // Horizontal lockup intrinsic aspect ratio (viewBox 2820.905 × 893.965).
  const RATIO = 2820.905 / 893.965;

  interface Props {
    height?: number;
    alt?: string;
    /** The shell is deep space, so the white lockup is the default treatment. */
    tone?: 'black' | 'color' | 'white';
  }

  let { height = 28, alt = 'mosmos', tone = 'white' }: Props = $props();
  const width = $derived(Math.round(height * RATIO));
  const src = $derived(`/brand/mosmos-horizontal-${tone}.svg`);
</script>

<img class="logo" {src} {alt} {height} {width} />

<style>
  .logo {
    display: block;
  }
</style>
