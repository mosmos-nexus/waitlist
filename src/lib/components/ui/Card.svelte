<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type Accent = 'blue' | 'purple' | 'cyan' | 'none';
  type Elevation = 'e1' | 'e2' | 'e3' | 'flat';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    accent?: Accent;
    elevation?: Elevation;
    interactive?: boolean;
    padding?: string;
    icon?: Snippet;
    title?: string;
    description?: string;
    children?: Snippet;
  }

  let {
    accent = 'blue',
    elevation = 'e1',
    interactive = false,
    padding = 'var(--space-lg)',
    icon,
    title,
    description,
    children,
    ...rest
  }: Props = $props();
</script>

<div class="card" class:interactive data-elevation={elevation} style:padding {...rest}>
  {#if icon}
    <div class="icon-tile" data-accent={accent}>{@render icon()}</div>
  {/if}
  {#if title}
    <h3>{title}</h3>
  {/if}
  {#if description}
    <p>{description}</p>
  {/if}
  {@render children?.()}
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    transition:
      box-shadow var(--dur-base) var(--ease-out),
      transform var(--dur-base) var(--ease-out);
  }
  .card[data-elevation='e1'] {
    box-shadow: var(--shadow-e1);
  }
  .card[data-elevation='e2'] {
    box-shadow: var(--shadow-e2);
  }
  .card[data-elevation='e3'] {
    box-shadow: var(--shadow-e3);
  }
  .card[data-elevation='flat'] {
    box-shadow: none;
  }
  .card.interactive {
    cursor: pointer;
  }
  .card.interactive:hover {
    box-shadow: var(--shadow-e2);
    transform: translateY(-2px);
  }
  .icon-tile {
    width: 48px;
    height: 48px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
  }
  .icon-tile[data-accent='blue'] {
    background: rgba(15, 111, 218, 0.1);
    color: var(--blue-core);
  }
  .icon-tile[data-accent='purple'] {
    background: rgba(155, 110, 239, 0.12);
    color: var(--purple-pop);
  }
  .icon-tile[data-accent='cyan'] {
    background: rgba(0, 160, 163, 0.12);
    color: var(--cyan-bright);
  }
  .icon-tile[data-accent='none'] {
    background: transparent;
    color: var(--text-strong);
  }
  h3 {
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
    color: var(--text-strong);
  }
  p {
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    color: var(--text-muted);
  }
</style>
