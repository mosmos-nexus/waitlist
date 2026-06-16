<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    label?: string;
    options: Option[];
    value?: string;
    placeholder?: string;
    id?: string;
    name?: string;
  }

  let { label, options, value = $bindable(''), placeholder, id, name }: Props = $props();

  const uid = $props.id();
  const fieldId = $derived(id ?? `sel-${uid}`);
</script>

<div class="field">
  {#if label}
    <label for={fieldId}>{label}</label>
  {/if}
  <div class="control">
    <select id={fieldId} {name} bind:value>
      {#if placeholder}
        <option value="" disabled selected={!value}>{placeholder}</option>
      {/if}
      {#each options as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>
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
    position: relative;
    display: flex;
    align-items: center;
  }
  .control::after {
    content: '';
    position: absolute;
    right: 16px;
    width: 9px;
    height: 9px;
    border-right: 2px solid var(--text-muted);
    border-bottom: 2px solid var(--text-muted);
    transform: translateY(-2px) rotate(45deg);
    pointer-events: none;
  }
  select {
    appearance: none;
    width: 100%;
    height: var(--control-md);
    padding: 0 40px 0 14px;
    font-family: var(--font-body);
    font-size: 16px;
    color: var(--text-body);
    background: var(--surface-card);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition:
      border-color var(--dur-base) var(--ease-out),
      box-shadow var(--dur-base) var(--ease-out);
  }
  select:focus-visible {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-focus);
    outline: none;
  }
</style>
