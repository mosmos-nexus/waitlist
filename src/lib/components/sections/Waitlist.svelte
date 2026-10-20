<script lang="ts">
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import { m } from '$lib/locale.svelte';
  import { features } from '$lib/config/features';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
  }
  let { onSuccess }: Props = $props();

  // The welcome email only goes out while its flag is on, so the strip must not
  // promise it otherwise — the same gate the consent microcopy follows.
  const steps = $derived([
    ...(features.welcomeEmail ? [m.waitlist_step_1()] : []),
    m.waitlist_step_2(),
    m.waitlist_step_3(),
  ]);
</script>

<section class="section waitlist" id="waitlist" aria-labelledby="waitlist-title">
  <div class="container">
    <div class="panel">
      <h2 class="title" id="waitlist-title">{m.waitlist_title()}</h2>

      <div class="lines">
        <p>{m.waitlist_line_1()}</p>
        <p>{m.waitlist_line_2()}</p>
      </div>

      <div class="after">
        <p class="after-label" id="waitlist-after">{m.waitlist_after()}</p>
        <ol class="steps" aria-labelledby="waitlist-after">
          {#each steps as step, i (step)}
            <li><span class="n" aria-hidden="true">{i + 1}</span>{step}</li>
          {/each}
        </ol>
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

  /* What happens after: three numbered stops on one hairline. */
  .after {
    width: 100%;
    margin-top: var(--space-32);
    padding: var(--space-16) var(--space-12) var(--space-20);
    border: 1px solid var(--line-normal-alternative);
    border-radius: var(--radius-m);
    background: var(--background-page);
  }
  .after-label {
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    color: var(--label-assistive);
  }
  /* As many equal columns as there are steps (two while the welcome email is
     off, three with it). */
  .steps {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    max-width: 520px;
    margin: var(--space-14) auto 0;
  }
  .steps li {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-8);
    padding-inline: var(--space-4);
    font-size: var(--font-size-body-2);
    font-weight: var(--weight-semibold);
    line-height: var(--line-height-label);
    color: var(--label-strong);
  }
  /* The connector runs from the previous number to this one. */
  .steps li + li::before {
    content: '';
    position: absolute;
    top: 13px;
    right: calc(50% + 22px);
    left: calc(-50% + 22px);
    height: 1px;
    background: var(--line-normal-strong);
  }
  .n {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--primary-light);
    border-radius: 50%;
    background: var(--background-card);
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-bold);
    font-variant-numeric: tabular-nums;
    color: var(--primary-strong);
  }

  .form {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-top: var(--space-32);
    text-align: left;
  }
</style>
