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
    min-height: var(--control-sm);
    padding: 0 16px;
    font-family: var(--font-body);
    font-size: var(--fs-body-sm);
    font-weight: var(--fw-medium);
    color: var(--text-body);
    background: var(--surface-card);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition:
      background var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);
  }
  .chip:hover {
    border-color: var(--border-strong);
    background: rgba(15, 111, 218, 0.05);
  }
  .chip.selected {
    background: rgba(15, 111, 218, 0.1);
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: var(--fw-semibold);
  }
</style>
