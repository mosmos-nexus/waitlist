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

<!--
  The row is the label, not a div holding one.
  A 20px box beside a line of text is a 20px target, and clicking the empty
  space above or below it did nothing. Wrapping the input makes the whole 44px
  row toggle it, and the association is implicit so nothing needs `for`.
-->
<label class="row" class:invalid>
  <input
    type="checkbox"
    id={fieldId}
    {name}
    {required}
    bind:checked
    aria-invalid={invalid || undefined}
  />
  <span class="text">{@render children()}</span>
</label>

<style>
  /* Negative margins keep the row's visual density while the box grows to the
     44px floor the design system asks for. */
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    min-height: var(--control-m);
    margin-block: calc(var(--space-10) * -1);
    cursor: pointer;
  }

  input {
    flex: none;
    appearance: none;
    width: 20px;
    height: 20px;
    margin: 0;
    border: 1.5px solid var(--line-normal-strong);
    border-radius: 6px;
    background: var(--field);
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

  /* The row is the label now, so the type belongs on the text inside it. */
  .text {
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
  }

  .invalid input {
    border-color: var(--status-error-fill);
  }
  .invalid .text {
    color: var(--status-error-fill);
  }
</style>
