<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    checked?: boolean;
    id?: string;
    name?: string;
    required?: boolean;
    invalid?: boolean;
    children: Snippet;
  }

  let {
    checked = $bindable(false),
    id,
    name,
    required = false,
    invalid = false,
    children,
  }: Props = $props();

  const uid = $props.id();
  const fieldId = $derived(id ?? `cb-${uid}`);
</script>

<div class="row" class:invalid>
  <input
    type="checkbox"
    id={fieldId}
    {name}
    {required}
    bind:checked
    aria-invalid={invalid || undefined}
  />
  <label for={fieldId}>{@render children()}</label>
</div>

<style>
  .row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-10);
  }

  input {
    flex: none;
    appearance: none;
    width: 20px;
    height: 20px;
    margin: 2px 0 0;
    border: 1.5px solid var(--line-normal-strong);
    border-radius: 6px;
    background: var(--card);
    cursor: pointer;
    transition:
      background var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out);
  }
  input:hover {
    border-color: var(--primary-light);
  }
  input:checked {
    background: var(--primary-normal);
    border-color: var(--primary-normal);
    /* Inline tick so the control needs no icon dependency */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E");
    background-size: 15px;
    background-position: center;
    background-repeat: no-repeat;
  }
  input:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  label {
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
    cursor: pointer;
  }

  .invalid input {
    border-color: var(--status-error-fill);
  }
  .invalid label {
    color: var(--status-error-fill);
  }
</style>
