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

<div class="checkbox" class:invalid>
  <input type="checkbox" id={fieldId} {name} {required} bind:checked aria-invalid={invalid} />
  <label for={fieldId}>{@render children()}</label>
</div>

<style>
  .checkbox {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
  }
  input {
    flex: none;
    width: 20px;
    height: 20px;
    margin: 2px 0 0;
    accent-color: var(--color-primary);
    cursor: pointer;
  }
  label {
    font-family: var(--font-body);
    font-size: var(--fs-body-sm);
    line-height: var(--lh-body-sm);
    color: var(--text-muted);
    cursor: pointer;
  }
  .checkbox.invalid input {
    outline: 2px solid var(--status-error);
    outline-offset: 1px;
    border-radius: 4px;
  }
  .checkbox :global(a) {
    color: var(--text-link);
    text-decoration: underline;
  }
</style>
