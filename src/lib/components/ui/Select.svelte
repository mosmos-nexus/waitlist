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
  {#if label}<label for={fieldId}>{label}</label>{/if}
  <div class="shell">
    <select id={fieldId} {name} bind:value>
      {#if placeholder}<option value="" disabled selected>{placeholder}</option>{/if}
      {#each options as opt (opt.value)}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    <svg class="caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
  </div>
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

  .shell {
    position: relative;
  }
  select {
    appearance: none;
    width: 100%;
    height: var(--control-m);
    padding: 0 var(--space-40) 0 var(--space-16);
    background: rgba(20, 23, 27, 0.72);
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-s);
    color: var(--label-strong);
    font-size: var(--font-size-body-1);
    cursor: pointer;
    transition:
      border-color var(--duration-base) var(--ease-out),
      box-shadow var(--duration-base) var(--ease-out);
  }
  select:hover {
    border-color: var(--line-normal-strong);
  }
  select:focus {
    outline: none;
    border-color: var(--primary-light);
    box-shadow: var(--shadow-focus);
  }
  /* Native option lists paint on the OS surface, so they need explicit colours */
  select option {
    background: var(--color-blue-gray-15);
    color: var(--label-strong);
  }

  .caret {
    position: absolute;
    right: var(--space-14);
    top: 50%;
    translate: 0 -50%;
    width: 18px;
    height: 18px;
    fill: none;
    stroke: var(--label-assistive);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }
</style>
