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
    pill = true,
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
  class="btn {variant} {size}"
  class:pill
  class:full={fullWidth}
  class:loading
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  {...rest}
>
  {#if loading}<span class="spinner" aria-hidden="true"></span>{/if}
  <span class="content">{@render children()}</span>
</button>

<style>
  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-8);
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--letter-spacing-tight);
    white-space: nowrap;
    cursor: pointer;
    transition:
      background var(--duration-base) var(--ease-out),
      border-color var(--duration-base) var(--ease-out),
      color var(--duration-base) var(--ease-out),
      box-shadow var(--duration-base) var(--ease-out),
      transform var(--duration-fast) var(--ease-out);
  }
  /* Capsule is the Mosmos default button shape */
  .btn.pill {
    border-radius: var(--radius-full);
  }
  .btn.full {
    width: 100%;
  }

  .sm {
    height: var(--control-s);
    padding-inline: var(--space-16);
    font-size: var(--font-size-label-2);
  }
  .md {
    height: var(--control-m);
    padding-inline: var(--space-24);
    font-size: var(--font-size-label-1);
  }
  .lg {
    height: var(--control-l);
    padding-inline: var(--space-32);
    font-size: var(--font-size-subtitle-1);
  }

  .primary {
    background: var(--button-primary-default);
    color: var(--static-white);
    box-shadow: 0 6px 18px rgba(15, 111, 218, 0.34);
  }
  .primary:hover:not(:disabled) {
    background: var(--button-primary-hovered);
    box-shadow: 0 10px 26px rgba(15, 111, 218, 0.44);
  }
  .primary:active:not(:disabled) {
    background: var(--button-primary-pressed);
    transform: translateY(0.5px);
  }

  .secondary {
    background: var(--fill-normal);
    color: var(--label-strong);
    border-color: var(--line-normal-normal);
  }
  .secondary:hover:not(:disabled) {
    background: rgba(44, 137, 240, 0.14);
    border-color: rgba(44, 137, 240, 0.4);
    color: var(--label-strong);
  }

  .outline {
    background: transparent;
    color: var(--primary-bright);
    border-color: rgba(44, 137, 240, 0.46);
  }
  .outline:hover:not(:disabled) {
    background: rgba(44, 137, 240, 0.1);
    border-color: var(--primary-light);
  }

  .ghost {
    background: transparent;
    color: var(--label-alternative);
  }
  .ghost:hover:not(:disabled) {
    background: var(--fill-weak);
    color: var(--label-strong);
  }

  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.4;
    box-shadow: none;
  }

  .btn:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  .loading .content {
    opacity: 0.6;
  }
  .spinner {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-top-color: transparent;
    animation: spin 640ms linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 1600ms;
    }
  }
</style>
