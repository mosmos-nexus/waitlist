<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type Accent = 'blue' | 'purple' | 'cyan' | 'green' | 'none';
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
    padding = 'var(--space-24)',
    icon,
    title,
    description,
    children,
    ...rest
  }: Props = $props();
</script>

<div
  class="card accent-{accent} {elevation}"
  class:interactive
  style="--card-pad:{padding}"
  {...rest}
>
  <span class="edge" aria-hidden="true"></span>
  {#if icon}<div class="icon">{@render icon()}</div>{/if}
  {#if title}<h3 class="t-title-3 title">{title}</h3>{/if}
  {#if description}<p class="t-body-2-reading desc prewrap">{description}</p>{/if}
  {#if children}{@render children()}{/if}
</div>

<style>
  .card {
    position: relative;
    padding: var(--card-pad);
    border-radius: var(--radius-l);
    border: 1px solid var(--line-normal-normal);
    background: linear-gradient(150deg, rgba(35, 41, 47, 0.72) 0%, rgba(20, 23, 27, 0.84) 100%);
    backdrop-filter: blur(14px) saturate(1.2);
    overflow: hidden;
  }

  /* A single lit edge along the top does the work a border colour can't:
     it reads as light falling on the panel from the world behind it. */
  .edge {
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    opacity: 0.7;
  }
  .accent-blue .edge {
    background: linear-gradient(90deg, transparent, rgba(44, 137, 240, 0.7), transparent);
  }
  .accent-cyan .edge {
    background: linear-gradient(90deg, transparent, rgba(49, 220, 220, 0.7), transparent);
  }
  .accent-purple .edge {
    background: linear-gradient(90deg, transparent, rgba(155, 110, 239, 0.7), transparent);
  }
  .accent-green .edge {
    background: linear-gradient(90deg, transparent, rgba(33, 237, 179, 0.7), transparent);
  }
  .accent-none .edge {
    display: none;
  }

  .e1 {
    box-shadow: var(--shadow-e1);
  }
  .e2 {
    box-shadow: var(--shadow-e2);
  }
  .e3 {
    box-shadow: var(--shadow-e3);
  }
  .flat {
    box-shadow: none;
  }

  .interactive {
    transition:
      transform var(--duration-slow) var(--ease-out),
      box-shadow var(--duration-slow) var(--ease-out),
      border-color var(--duration-slow) var(--ease-out);
  }
  .interactive:hover {
    transform: translateY(-3px);
    border-color: var(--line-normal-strong);
    box-shadow: var(--shadow-e2);
  }

  .icon {
    display: inline-flex;
    margin-bottom: var(--space-12);
    color: var(--primary-bright);
  }
  .title {
    color: var(--label-strong);
  }
  .desc {
    margin-top: var(--space-8);
    color: var(--label-alternative);
  }
</style>
