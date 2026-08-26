<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    selected?: boolean;
    onclick?: () => void;
    children: Snippet;
  }

  let { selected = false, onclick, children }: Props = $props();
</script>

<button type="button" class="chip" class:selected aria-pressed={selected} {onclick}>
  {@render children()}
</button>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: var(--control-s);
    padding: 0 14px;
    border-radius: var(--radius-full);
    border: 1px solid var(--line-normal-normal);
    background: rgba(20, 23, 27, 0.6);
    color: var(--label-alternative);
    font-size: var(--font-size-body-2);
    cursor: pointer;
    transition:
      background var(--duration-base) var(--ease-out),
      border-color var(--duration-base) var(--ease-out),
      color var(--duration-base) var(--ease-out);
  }
  .chip:hover {
    border-color: var(--line-normal-strong);
    color: var(--label-strong);
  }
  .chip.selected {
    background: var(--primary-fill);
    border-color: var(--primary-fill);
    color: var(--static-white);
    font-weight: var(--weight-semibold);
  }
  .chip:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
</style>
