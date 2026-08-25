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

  .control {
    width: 100%;
    background: var(--card);
    border: 1px solid var(--line-normal-normal);
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
    font-size: var(--font-size-subtitle-1);
  }

  .control:hover {
    border-color: var(--line-normal-strong);
  }
  .control:focus {
    outline: none;
    border-color: var(--primary-light);
    background: var(--card);
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
