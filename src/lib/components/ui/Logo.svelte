<script lang="ts">
  // Horizontal lockup intrinsic aspect ratio (viewBox 2820.905 × 893.965).
  const RATIO = 2820.905 / 893.965;

  interface Props {
    height?: number;
    alt?: string;
  }

  let { height = 28, alt = 'mosmos' }: Props = $props();
  const width = $derived(Math.round(height * RATIO));
</script>

<img class="logo" src="/brand/mosmos-horizontal-color.svg" {alt} {height} {width} />

<style>
  .logo {
    display: block;
  }
</style>
