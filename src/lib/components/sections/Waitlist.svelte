<script lang="ts">
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import { m } from '$lib/locale.svelte';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
  }
  let { onSuccess }: Props = $props();
</script>

<section class="section waitlist" id="waitlist" aria-labelledby="waitlist-title">
  <div class="container">
    <div class="panel">
      <h2 class="title" id="waitlist-title">{m.waitlist_title()}</h2>

      <div class="lines">
        <p>{m.waitlist_line_1()}</p>
        <p>{m.waitlist_line_2()}</p>
      </div>

      <div class="form">
        <WaitlistForm {onSuccess} position="join" />
      </div>
    </div>
  </div>
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 720px;
    margin-inline: auto;
    padding: var(--space-48) var(--space-20) var(--space-40);
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-l);
    background: var(--background-card);
    box-shadow: var(--shadow-e2);
    text-align: center;
  }
  @media (min-width: 768px) {
    .panel {
      padding: var(--space-64) var(--space-56) var(--space-48);
    }
  }

  /* Two short lines: how we open, and that signing up isn't a guarantee. */
  .lines {
    display: grid;
    gap: var(--space-6);
    margin-top: var(--space-20);
    font-size: var(--font-size-lead);
    line-height: var(--line-height-lead);
    color: var(--label-normal);
    text-wrap: balance;
  }

  .form {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-top: var(--space-32);
    text-align: left;
  }
</style>
