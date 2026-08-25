<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal, scrub } from '$lib/anime/motion';

  /**
   * The price screen's one structural idea: two payments that do not replace
   * each other, so they are shown side by side with nothing bridging them.
   *
   * The slider is real because the account model is the part people distrust —
   * a number you can move and watch settle says "you decide how much" more
   * plainly than a sentence claiming it.
   */
  const PLANS = $derived([
    { name: m.cost_p1(), price: m.cost_p1_price(), per: m.cost_p1_per(), role: m.cost_p1_role() },
    { name: m.cost_p2(), price: m.cost_p2_price(), per: m.cost_p2_per(), role: m.cost_p2_role() },
    { name: m.cost_p3(), price: m.cost_p3_price(), per: m.cost_p3_per(), role: m.cost_p3_role() },
  ]);
  let plan = $state(1);

  const MIN = 500;
  const MAX = 6000;
  const STEP = 100;
  /** 100 Mana ≈ $1, from the Pricing screen. */
  const RATE = 100;

  let amount = $state(2000);

  // The bonus ladder is the wireframe's, not a rounder invention of one.
  const bonusRate = $derived(
    amount >= 5000 ? 0.12 : amount >= 3000 ? 0.08 : amount >= 2000 ? 0.05 : 0,
  );
  const bonus = $derived(Math.round((amount * bonusRate) / STEP) * STEP);
  const total = $derived(amount + bonus);
  const usd = $derived(Math.round((amount / RATE) * 100) / 100);
  const fmt = (n: number) => n.toLocaleString('en-US');
</script>

<section class="cost section" aria-labelledby="cost-title">
  <div class="container">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.cost_eyebrow()}</span>
      <h2 class="title" id="cost-title">{m.cost_title()}</h2>
      <p class="lead">{m.cost_lead()}</p>
    </div>

    <div class="split">
      <div class="col" use:reveal={{ delay: 60 }} use:scrub={{ y: 12 }}>
        <div class="col-head">
          <span class="num">1</span>
          <div>
            <h3>{m.cost_sub()}</h3>
            <p>{m.cost_sub_d()}</p>
          </div>
        </div>

        <div class="plans">
          {#each PLANS as p, i (p.name)}
            <button
              type="button"
              class="plan hud"
              class:on={plan === i}
              aria-pressed={plan === i}
              onclick={() => (plan = i)}
            >
              <span class="plan-n" translate="no">{p.name}</span>
              <span class="plan-p tnum">{p.price}<i>{p.per}</i></span>
              <span class="plan-r">{p.role}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="col" use:reveal={{ delay: 110 }} use:scrub={{ y: 20 }}>
        <div class="col-head">
          <span class="num accent">2</span>
          <div>
            <h3>{m.cost_mana()}</h3>
            <p>{m.cost_mana_d()}</p>
          </div>
        </div>

        <div class="wallet hud">
          <div class="amount-head">
            <span class="eyebrow">{m.cost_amount()}</span>
            <span class="rate">{m.cost_rate()}</span>
          </div>

          <div class="amount">
            <span class="big tnum">{fmt(amount)}</span>
            <span class="unit" translate="no">Mana</span>
            <span class="usd tnum">${fmt(usd)}</span>
          </div>

          <label class="slider">
            <span class="visually-hidden">{m.cost_amount()}</span>
            <input type="range" min={MIN} max={MAX} step={STEP} bind:value={amount} />
          </label>

          <div class="ledger">
            <span>{bonus ? `${m.cost_bonus()} +${fmt(bonus)}` : m.cost_bonus_none()}</span>
            <span class="total tnum">{m.cost_total()} <b>{fmt(total)}</b></span>
          </div>

          <div class="compare">
            <p>{m.cost_compare()}</p>
            <p class="ref tnum">{m.cost_compare_ref()}</p>
          </div>
        </div>
      </div>
    </div>

    <p class="note" use:reveal={{ delay: 150 }}>{m.cost_note()}</p>
  </div>
</section>

<style>
  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    max-width: 44ch;
    margin-bottom: var(--space-32);
  }
  .title {
    margin: 0;
    font-size: clamp(28px, 3.6vw, 40px);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.025em;
    color: var(--shell-text);
    text-wrap: balance;
  }
  .lead {
    margin: 0;
    font-size: var(--font-size-body-1);
    line-height: 1.65;
    color: var(--shell-body);
  }
  .note {
    margin: var(--space-20) 0 0;
    font-size: var(--font-size-caption-1);
    color: var(--shell-faint);
  }

  /* Two columns with a dashed gutter and nothing spanning it — the Pricing
     screen splits them exactly this way so neither reads as buying the other. */
  .split {
    display: grid;
    gap: var(--space-24);
  }
  @media (min-width: 900px) {
    .split {
      grid-template-columns: minmax(0, 58fr) minmax(0, 42fr);
      column-gap: var(--space-48);
    }
    .split > .col + .col {
      padding-left: var(--space-48);
      margin-left: calc(var(--space-48) * -1);
      border-left: 1px dashed var(--glass-line);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
    min-width: 0;
  }
  .col-head {
    display: flex;
    gap: var(--space-10);
    align-items: flex-start;
  }
  .col-head h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--shell-text);
  }
  .col-head p {
    margin: 4px 0 0;
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--shell-meta);
  }
  .num {
    flex: none;
    width: 20px;
    height: 20px;
    border-radius: 7px;
    display: grid;
    place-items: center;
    background: rgba(112, 115, 124, 0.34);
    font-size: 10.5px;
    font-weight: 700;
    color: var(--shell-text);
  }
  .num.accent {
    background: var(--primary-normal);
    color: var(--static-white);
  }

  .plans {
    display: grid;
    gap: var(--space-10);
  }
  @media (min-width: 620px) {
    .plans {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .plan {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-16);
    text-align: left;
    cursor: pointer;
    box-shadow: none;
    transition: var(--transition-base);
  }
  .plan:hover {
    border-color: rgba(49, 220, 220, 0.5);
  }
  .plan.on {
    border-color: var(--primary-light);
    background: rgba(15, 111, 218, 0.18);
  }
  .plan:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  .plan-n {
    font-size: 15px;
    font-weight: 700;
    color: var(--shell-text);
  }
  .plan-p {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--shell-text);
  }
  .plan-p i {
    margin-left: 4px;
    font-size: 11.5px;
    font-style: normal;
    font-weight: 500;
    color: var(--shell-meta);
  }
  .plan-r {
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--shell-meta);
  }

  .wallet {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding: var(--space-20);
  }
  .amount-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-8) var(--space-12);
  }
  .rate {
    margin-left: auto;
    font-size: 11px;
    color: var(--shell-faint);
  }
  .amount {
    display: flex;
    align-items: baseline;
    gap: var(--space-8);
  }
  .big {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--shell-text);
  }
  .unit {
    font-size: 12.5px;
    color: var(--shell-meta);
  }
  .usd {
    margin-left: auto;
    font-size: 17px;
    font-weight: 700;
    color: var(--bright-cyan);
  }

  .slider {
    display: block;
  }
  .slider input {
    display: block;
    width: 100%;
    margin: 0;
    accent-color: var(--primary-normal);
    cursor: pointer;
  }
  .slider input:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
    border-radius: var(--radius-full);
  }

  .ledger {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8) var(--space-12);
    font-size: 11.5px;
    color: var(--shell-meta);
  }
  .total {
    margin-left: auto;
  }
  .total b {
    color: var(--summon-green);
  }

  .compare {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 11px 13px;
    border-radius: var(--radius-xs);
    background: rgba(112, 115, 124, 0.14);
  }
  .compare p {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--shell-body);
  }
  .compare .ref {
    font-size: 10.5px;
    color: var(--shell-faint);
  }
</style>
