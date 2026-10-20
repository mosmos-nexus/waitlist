<script lang="ts">
  import { m } from '$lib/locale.svelte';

  // Lucide line icons: message-circle-question, list-checks, thumbs-up.
  const steps = $derived([
    {
      title: m.moments_1_title(),
      body: m.moments_1_body(),
      d: 'M7.9 20A9 9 0 1 0 4 16.1L2 22ZM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
    },
    {
      title: m.moments_2_title(),
      body: m.moments_2_body(),
      d: 'm3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8',
    },
    {
      title: m.moments_3_title(),
      body: m.moments_3_body(),
      d: 'M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z',
    },
  ]);
</script>

<section class="section moments" aria-labelledby="moments-title">
  <div class="container">
    <div class="head">
      <h2 class="title" id="moments-title">{m.moments_title()}</h2>
      <p class="lead">{m.moments_sub()}</p>
    </div>

    <ol class="steps">
      {#each steps as step, i (step.d)}
        <li class="step">
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d={step.d} /></svg>
          </span>
          <span class="num" aria-hidden="true">0{i + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </li>
      {/each}
    </ol>

    <a class="to-form" href="#waitlist">
      {m.hero_cta()}<svg viewBox="0 0 24 24" aria-hidden="true"
        ><path d="M12 5v14M6 13l6 6 6-6" /></svg
      >
    </a>
  </div>
</section>

<style>
  .moments {
    background: var(--background-card);
    border-block: 1px solid var(--line-normal-alternative);
  }

  .head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-16);
    text-align: center;
  }
  .lead {
    text-wrap: balance;
  }

  /* Phone: one short row per step, icon beside the words. Desktop: three
     cards side by side, icon on top. */
  .steps {
    display: grid;
    gap: var(--space-12);
    max-width: 560px;
    margin: var(--space-40) auto 0;
  }
  .step {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      'icon num'
      'icon title'
      'icon body';
    align-content: start;
    column-gap: var(--space-14);
    padding: var(--space-16);
    border: 1px solid var(--line-normal-alternative);
    border-radius: var(--radius-m);
    background: var(--background-page);
  }
  .icon {
    grid-area: icon;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-s);
    background: var(--background-tint);
    color: var(--primary-normal);
  }
  .icon svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .num {
    grid-area: num;
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-bold);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.06em;
    line-height: var(--line-height-label);
    color: var(--primary-strong);
  }
  h3 {
    grid-area: title;
    margin-top: var(--space-2);
    font-size: var(--font-size-subtitle-1);
    font-weight: var(--weight-bold);
    line-height: 1.4;
    letter-spacing: -0.01em;
    color: var(--label-strong);
  }
  .step p {
    grid-area: body;
    margin-top: var(--space-6);
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
  }

  @media (min-width: 1024px) {
    .steps {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--space-24);
      max-width: none;
      margin-top: var(--space-56);
    }
    .step {
      grid-template-columns: auto 1fr;
      grid-template-areas:
        'icon num'
        'title title'
        'body body';
      align-items: center;
      row-gap: 0;
      padding: var(--space-24);
      border-radius: var(--radius-l);
    }
    .icon {
      width: 44px;
      height: 44px;
    }
    .num {
      justify-self: end;
    }
    h3 {
      margin-top: var(--space-20);
      font-size: var(--font-size-h3);
    }
    .step p {
      margin-top: var(--space-8);
      font-size: var(--font-size-body-1);
    }
  }

  .to-form {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    width: fit-content;
    min-height: var(--control-m);
    margin: var(--space-32) auto 0;
    font-weight: var(--weight-semibold);
  }
  .to-form svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform var(--duration-base) var(--ease-out);
  }
  .to-form:hover svg {
    transform: translateY(2px);
  }
</style>
