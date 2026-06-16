<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
  type Size = 'sm' | 'md' | 'lg';

  interface Props extends HTMLButtonAttributes {
    variant?: Variant;
    size?: Size;
    pill?: boolean;
    fullWidth?: boolean;
    loading?: boolean;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    pill = false,
    fullWidth = false,
    loading = false,
    type = 'button',
    disabled = false,
    children,
    ...rest
  }: Props = $props();
</script>

<button
  {type}
  class="btn"
  class:pill
  class:full={fullWidth}
  data-variant={variant}
  data-size={size}
  disabled={disabled || loading}
  aria-busy={loading}
  {...rest}
>
  {#if loading}
    <span class="spinner" aria-hidden="true"></span>
  {/if}
  {@render children()}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    width: auto;
    font-family: var(--font-body);
    font-weight: var(--fw-semibold);
    line-height: 1;
    white-space: nowrap;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition:
      background var(--dur-base) var(--ease-out),
      color var(--dur-base) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }
  .btn.full {
    width: 100%;
  }
  .btn.pill {
    border-radius: var(--radius-pill);
  }
  .btn:active:not(:disabled) {
    transform: translateY(0.5px);
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  .btn[data-size='sm'] {
    height: var(--control-sm);
    padding: 0 16px;
    font-size: 14px;
  }
  .btn[data-size='md'] {
    height: var(--control-md);
    padding: 0 24px;
    font-size: 16px;
  }
  .btn[data-size='lg'] {
    height: var(--control-lg);
    padding: 0 32px;
    font-size: 17px;
  }

  .btn[data-variant='primary'] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-e1);
  }
  .btn[data-variant='primary']:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  .btn[data-variant='secondary'] {
    background: var(--color-secondary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-e1);
  }
  .btn[data-variant='secondary']:hover:not(:disabled) {
    background: var(--color-secondary-hover);
  }
  .btn[data-variant='outline'] {
    background: transparent;
    color: var(--color-primary);
    border-color: var(--border-strong);
  }
  .btn[data-variant='outline']:hover:not(:disabled),
  .btn[data-variant='ghost']:hover:not(:disabled) {
    background: rgba(15, 111, 218, 0.07);
  }
  .btn[data-variant='ghost'] {
    background: transparent;
    color: var(--color-primary);
  }

  .spinner {
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 1.2s;
    }
  }
</style>
