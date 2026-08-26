<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal, scrub } from '$lib/anime/motion';

  /**
   * Two payments that do not replace each other, shown side by side with
   * nothing bridging them — subscription buys the things that are always on,
   * Mana pays for the work when work happens.
   *
   * WHAT THIS SECTION MAY AND MAY NOT SAY
   *
   * The monetization strategy fixes the plan names (Ground / Plot / Parcel) and
   * the axis each tier differs on, and it lists *every* number as an open
   * experiment: subscription price, USD-to-Mana rate, per-task Mana
   * coefficients, top-up bonuses, storage caps, log-retention windows. The
   * page previously showed $0 / $18 / $48 and "100 Mana ≈ $1" with a top-up
   * bonus ladder, none of which exists anywhere but in the wireframe.
   *
   * So: names and axes yes, figures no. A plan card shows what changes, not
   * what it costs, and says so where the price would be.
   *
   * The MVP line matters too. A waitlist sits at MVP 0-1, where Hub trading,
   * creator payout and certification are all inactive; MVP 2 is where
   * Plot/Parcel pricing gets shown to users at all. Three named plans with no
   * price attached is exactly that fake-door step, which is why it can appear
   * here — and why nothing downstream of it (a rate, a balance, a bonus) can.
   */

  /* Ground is free — that is decided. The other two are not: subscription price
     is an open experiment, so they say so where the price goes. */
  const PLANS = $derived([
    { name: m.cost_p1(), role: m.cost_p1_role(), price: m.cost_p1_price_free(), free: true },
    { name: m.cost_p2(), role: m.cost_p2_role(), price: m.cost_tbd(), free: false },
    { name: m.cost_p3(), role: m.cost_p3_role(), price: m.cost_tbd(), free: false },
  ]);
  let plan = $state(1);

  /**
   * The differentiation axes, in the strategy's own order: things that cost a
   * standing infrastructure bill are the things a tier can gate. `values` is
   * one entry per plan, so a row that does not change across two tiers simply
   * repeats — which is itself worth seeing.
   */
  const ROWS = $derived([
    {
      label: m.cost_d_slots(),
      values: [m.cost_v_basic(), m.cost_v_more(), m.cost_v_most()],
    },
    {
      label: m.cost_d_memory(),
      values: [m.cost_v_mem_short(), m.cost_v_mem_long(), m.cost_v_mem_long()],
    },
    {
      label: m.cost_d_files(),
      values: [m.cost_v_small(), m.cost_v_std(), m.cost_v_large()],
    },
    {
      label: m.cost_d_logs(),
      values: [m.cost_v_short(), m.cost_v_mid(), m.cost_v_long()],
    },
    {
      label: m.cost_d_cron(),
      values: [m.cost_v_none(), m.cost_v_yes(), m.cost_v_yes()],
    },
    {
      label: m.cost_d_queue(),
      values: [m.cost_v_fifo(), m.cost_v_fifo(), m.cost_v_first()],
    },
    {
      label: m.cost_d_early(),
      values: [m.cost_v_dash(), m.cost_v_dash(), m.cost_v_yes()],
    },
  ]);

  /** What Mana is spent on, and what it is not. Both lists are the charging
   *  model itself: execution is post-charged, making and storing are not
   *  charged at all, and a Hub-sourced run splits part of the charge to the
   *  Mon's author. */
  const SPEND = $derived([
    { what: m.cost_a1(), why: m.cost_a1_d() },
    { what: m.cost_a2(), why: m.cost_a2_d() },
    { what: m.cost_a3(), why: m.cost_a3_d() },
  ]);
  const FREE = $derived([m.cost_b1(), m.cost_b2(), m.cost_b3()]);

  /* How the charge is worked out. This is the part that distinguishes Mana from
     a token meter: the coefficient weighs task difficulty, which model actually
     handled it, cache hit rate and paid tool calls, so the same request can
     cost less on a second pass. Stated without a rate, which is unsettled. */
  const HOW = $derived([m.cost_how_1(), m.cost_how_2(), m.cost_how_3()]);
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

        <div class="plans" role="group" aria-label={m.cost_pick()}>
          {#each PLANS as p, i (p.name)}
            <button
              type="button"
              class="plan hud"
              class:on={plan === i}
              aria-pressed={plan === i}
              onclick={() => (plan = i)}
            >
              <span class="plan-n" translate="no">{p.name}</span>
              <span class="plan-tbd" class:free={p.free}>{p.price}</span>
              <span class="plan-r">{p.role}</span>
            </button>
          {/each}
        </div>

        <div class="table hud">
          <div class="table-head">
            <span class="eyebrow">{m.cost_diff()}</span>
            <span class="for" translate="no">{PLANS[plan].name}</span>
          </div>
          <dl>
            {#each ROWS as row (row.label)}
              {@const changed = plan > 0 && row.values[plan] !== row.values[0]}
              <div class="row" class:changed>
                <dt>{row.label}</dt>
                <dd>{row.values[plan]}</dd>
              </div>
            {/each}
          </dl>
          <p class="panel-note">{m.cost_amounts_tbd()}</p>
        </div>

        <p class="open">{m.cost_open()}</p>
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
          <span class="eyebrow spend-label">{m.cost_yes()}</span>
          <ul class="spend">
            {#each SPEND as s (s.what)}
              <li>
                <span class="what">{s.what}</span>
                <span class="why">{s.why}</span>
              </li>
            {/each}
          </ul>

          <span class="eyebrow free-label">{m.cost_no()}</span>
          <ul class="free">
            {#each FREE as f (f)}
              <li>{f}</li>
            {/each}
          </ul>

          <div class="how">
            <span class="eyebrow">{m.cost_how()}</span>
            <p>{m.cost_how_d()}</p>
            <ul>
              {#each HOW as h (h)}
                <li>{h}</li>
              {/each}
            </ul>
          </div>

          <p class="panel-note">{m.cost_mana_tbd()}</p>
        </div>
      </div>
    </div>

    <p class="note" use:reveal={{ delay: 150 }}>{m.cost_note()}</p>
  </div>
</section>

<style>
  .head {
    margin-bottom: var(--space-32);
  }

  /* Two columns with a dashed gutter and nothing spanning it — neither side
     reads as buying the other. */
  .split {
    display: grid;
    gap: var(--space-24);
  }
  @media (min-width: 900px) {
    .split {
      grid-template-columns: minmax(0, 55fr) minmax(0, 45fr);
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
    font-size: 12px;
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
    background: var(--primary-fill);
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
  /* Where the price would be. Sized like a price so the absence is the point
     rather than an omission the eye slides past. */
  .plan-tbd {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--bright-cyan);
  }
  .plan-tbd.free {
    color: var(--summon-green);
  }
  .plan-r {
    font-size: 12px;
    line-height: 1.55;
    color: var(--shell-meta);
  }

  .table {
    padding: var(--space-16) var(--space-20) var(--space-14);
    box-shadow: none;
  }
  .table-head {
    display: flex;
    align-items: baseline;
    gap: var(--space-10);
    margin-bottom: var(--space-6);
  }
  .for {
    margin-left: auto;
    font-size: 12px;
    font-weight: 700;
    color: var(--bright-cyan);
  }
  dl {
    margin: 0;
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: var(--space-12);
    padding: 9px 0;
    border-bottom: 1px solid var(--glass-line-soft);
  }
  .row:last-of-type {
    border-bottom: 0;
  }
  dt {
    font-size: 12.5px;
    color: var(--shell-body);
  }
  dd {
    margin: 0 0 0 auto;
    flex: none;
    max-width: 52%;
    text-align: right;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--shell-meta);
  }
  /* The rows this plan actually buys you over Ground. Marked with weight and
     the accent rather than a badge, so scanning the column answers "what am I
     paying for" without a legend. */
  .changed dd {
    color: var(--summon-green);
  }

  .open {
    margin: 0;
    padding: 11px 14px;
    border-radius: var(--radius-xs);
    background: rgba(112, 115, 124, 0.14);
    font-size: 12px;
    line-height: 1.6;
    color: var(--shell-body);
  }

  .wallet {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-20);
  }
  .spend-label {
    color: var(--bright-cyan);
  }
  .free-label {
    margin-top: var(--space-10);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .spend li {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 0;
    border-bottom: 1px solid var(--glass-line-soft);
  }
  .spend li:last-child {
    border-bottom: 0;
  }
  .what {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .why {
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--shell-meta);
  }
  .free {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  .free li {
    position: relative;
    padding-left: 16px;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--shell-body);
  }
  .free li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 0.55em;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--summon-green);
  }

  .how {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    margin-top: var(--space-10);
    padding: var(--space-12) var(--space-14);
    border-radius: var(--radius-xs);
    background: rgba(15, 111, 218, 0.12);
    border: 1px solid rgba(40, 135, 240, 0.28);
  }
  .how p {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.65;
    color: var(--shell-body);
  }
  .how ul {
    margin: 2px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .how li {
    position: relative;
    padding-left: 14px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--shell-meta);
  }
  .how li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 0.5em;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--primary-bright);
  }

  .panel-note {
    margin: var(--space-10) 0 0;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--shell-faint);
  }
</style>
