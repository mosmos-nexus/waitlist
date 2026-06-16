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
  <div class="control" data-status={status} data-size={size}>
    <input
      id={fieldId}
      bind:value
      aria-invalid={status === 'error'}
      aria-describedby={helper ? helperId : undefined}
      {...rest}
    />
  </div>
  {#if helper}
    <span class="helper" id={helperId} data-status={status}>{helper}</span>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }
  label {
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: var(--fw-medium);
    color: var(--text-strong);
  }
  .control {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 0 14px;
    background: var(--surface-card);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    transition:
      border-color var(--dur-base) var(--ease-out),
      box-shadow var(--dur-base) var(--ease-out);
  }
  .control[data-size='sm'] {
    height: var(--control-sm);
  }
  .control[data-size='md'] {
    height: var(--control-md);
  }
  .control[data-size='lg'] {
    height: var(--control-lg);
  }
  .control:focus-within {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-focus);
  }
  .control[data-status='error'] {
    border-color: var(--status-error);
    box-shadow: none;
  }
  .control[data-status='success'] {
    border-color: var(--status-success);
    box-shadow: none;
  }
  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-family: var(--font-body);
    font-size: 16px;
    color: var(--text-body);
  }
  input::placeholder {
    color: var(--text-faint);
  }
  .helper {
    font-family: var(--font-body);
    font-size: 13px;
    line-height: var(--lh-caption);
    color: var(--text-muted);
  }
  .helper[data-status='error'] {
    color: var(--status-error);
  }
  .helper[data-status='success'] {
    color: var(--status-success);
  }
</style>
