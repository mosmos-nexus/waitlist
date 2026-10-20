<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  type Status = 'default' | 'error' | 'success';
  type Size = 'sm' | 'md' | 'lg';

  interface Props extends Omit<HTMLInputAttributes, 'size'> {
    label?: string;
    helper?: string;
    status?: Status;
    size?: Size;
    value?: string;
  }

  let {
    label,
    helper,
    status = 'default',
    size = 'md',
    id,
    value = $bindable(''),
    ...rest
  }: Props = $props();

  const autoId = $props.id();
  const fieldId = $derived(id ?? `input-${autoId}`);
  const helperId = $derived(`${fieldId}-helper`);
</script>

<div class="field">
  {#if label}
    <label for={fieldId}>{label}</label>
  {/if}
  <input
    id={fieldId}
    class="control {size} {status}"
    data-cursor="text"
    bind:value
    aria-invalid={status === 'error' || undefined}
    aria-describedby={helper ? helperId : undefined}
    {...rest}
  />
  {#if helper}
    <p id={helperId} class="helper {status}">{helper}</p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    width: 100%;
  }

  label {
    font-size: var(--font-size-label-2);
    font-weight: var(--weight-medium);
    color: var(--label-alternative);
  }

  /* An empty text field has nothing but its border to announce itself with —
     WCAG 1.4.11 wants 3:1 against what is around it. The fill is near-white on
     a near-white page, so the edge has to clear 3:1 against the hero's blue
     glow, where `--line-normal-strong` alone measures 2.77:1. Halfway between
     it and the next step of the scale (blue-gray 59 → 44) is 3.57:1 there
     (3.9:1 on white) and still reads as a light field, not a black box. */
  .control {
    width: 100%;
    background: var(--field);
    border: 1px solid rgb(120, 129, 142);
    border-radius: var(--radius-s);
    color: var(--label-strong);
    transition:
      border-color var(--duration-base) var(--ease-out),
      background var(--duration-base) var(--ease-out),
      box-shadow var(--duration-base) var(--ease-out);
  }
  .control::placeholder {
    color: var(--label-assistive);
  }

  .sm {
    height: var(--control-s);
    padding-inline: var(--space-14);
    font-size: var(--font-size-body-2);
  }
  .md {
    height: var(--control-m);
    padding-inline: var(--space-16);
    font-size: var(--font-size-body-1);
  }
  .lg {
    height: var(--control-l);
    padding-inline: var(--space-20);
    font-size: var(--font-size-body-1);
  }

  .control:hover {
    border-color: var(--primary-light);
  }
  .control:focus {
    outline: none;
    border-color: var(--primary-light);
    background: var(--field);
    box-shadow: var(--shadow-focus);
  }

  .control.error {
    border-color: var(--status-error-fill);
  }
  .control.error:focus {
    box-shadow: 0 0 0 3px rgba(233, 83, 83, 0.28);
  }
  .control.success {
    border-color: var(--primary-normal);
  }

  .helper {
    font-size: var(--font-size-caption-1);
    color: var(--label-alternative);
  }
  .helper.error {
    color: var(--status-error-fill);
  }
  .helper.success {
    color: var(--primary-normal);
  }
</style>
