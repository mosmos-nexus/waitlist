<script lang="ts">
  import { m } from '$lib/locale.svelte';

  const criteria = $derived([m.ui_criterion_1(), m.ui_criterion_2(), m.ui_criterion_3()]);
  const workers = $derived([
    { kind: 'copy', name: m.demo_worker_copy() },
    { kind: 'image', name: m.demo_worker_image() },
  ]);
  const SIDES = ['chat', 'mos'] as const;
  const compare = $derived([
    { label: m.compare_row_1(), chat: m.compare_chat_1(), mos: m.compare_mos_1() },
    { label: m.compare_row_2(), chat: m.compare_chat_2(), mos: m.compare_mos_2() },
    { label: m.compare_row_3(), chat: m.compare_chat_3(), mos: m.compare_mos_3() },
  ]);
</script>

<section class="section moments" aria-labelledby="moments-title">
  <div class="container">
    <div class="head">
      <h2 class="title" id="moments-title">{m.moments_title()}</h2>
      <p class="lead">{m.moments_sub()}</p>
    </div>

    <!-- Each card is one moment the decision is mine, drawn as the product's
         own chat card (wireframe 03-4). The fragments are pictures, so nothing
         in them is a live control. -->
    <ol class="cards">
      <li class="card">
        <div class="card-head">
          <span class="num" aria-hidden="true">01</span>
        </div>
        <h3>{m.moments_1_title()}</h3>

        <!-- 03-4/02·13: a question card waiting for an answer -->
        <div class="ui waiting">
          <div class="ui-head">
            <span class="glyph" aria-hidden="true">?</span>
            <span class="ui-name">{m.ui_question_label()}</span>
            <span class="tag">{m.ui_question_tag()}</span>
            <span class="state">{m.ui_waiting()}</span>
          </div>
          <p class="ask">{m.ui_question()}</p>
          <ul class="options">
            <li class="option picked">
              <span class="radio" aria-hidden="true"></span>
              <span class="option-text">
                <span class="option-label"
                  >{m.ui_deadline()}<span class="visually-hidden"> ({m.ui_picked()})</span></span
                >
                <span class="option-sub">{m.ui_deadline_sub()}</span>
              </span>
            </li>
            <li class="option">
              <span class="radio" aria-hidden="true"></span>
              <span class="option-text">
                <span class="option-label">{m.ui_quality()}</span>
                <span class="option-sub">{m.ui_quality_sub()}</span>
              </span>
            </li>
            <li class="option own">{m.ui_write_own()}</li>
          </ul>
          <div class="ui-foot">
            <span class="count">{m.ui_question_count()}</span>
            <span class="btn">{m.ui_skip()}</span>
            <span class="btn primary">{m.ui_send()}</span>
          </div>
        </div>

        <p class="meanwhile">{m.moments_1_mos()}</p>
      </li>

      <li class="card">
        <div class="card-head">
          <span class="num" aria-hidden="true">02</span>
          <span class="badge">{m.moments_2_badge()}</span>
        </div>
        <h3>{m.moments_2_title()}</h3>

        <!-- 03-4/03: the task summary, folded to its goal and done-when -->
        <div class="ui waiting">
          <div class="ui-head">
            <span class="glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h9" /></svg>
            </span>
            <span class="ui-name">{m.ui_brief_title()}</span>
            <span class="tag">{m.ui_brief_tag()}</span>
            <span class="state">{m.ui_waiting()}</span>
          </div>
          <div class="fields">
            <dl>
              <dt>{m.ui_brief_goal_label()}</dt>
              <dd>{m.ui_brief_goal()}</dd>
              <dt>{m.ui_brief_criteria_label()}</dt>
              <dd>
                <ul class="dots">
                  {#each criteria as criterion (criterion)}
                    <li>{criterion}</li>
                  {/each}
                </ul>
              </dd>
            </dl>
            <p class="folded"><span aria-hidden="true">+</span>{m.ui_brief_more()}</p>
          </div>
          <p class="prompt">{m.ui_brief_prompt()}</p>
          <ul class="options">
            <li class="option picked compact">
              <span class="radio" aria-hidden="true"></span>
              <span class="option-label"
                >{m.ui_brief_start()}<span class="visually-hidden"> ({m.ui_picked()})</span></span
              >
            </li>
            <li class="option compact">
              <span class="radio" aria-hidden="true"></span>
              <span class="option-label">{m.ui_brief_fix()}</span>
            </li>
          </ul>
          <div class="ui-foot">
            <span class="btn primary">{m.ui_send()}</span>
          </div>
        </div>

        <p class="meanwhile">{m.moments_2_mos()}</p>
      </li>

      <li class="card">
        <div class="card-head">
          <span class="num" aria-hidden="true">03</span>
        </div>
        <h3>{m.moments_3_title()}</h3>

        <!-- 03-4/05: Mos reports against the done-when, partly met -->
        <div class="ui chat">
          <p class="team">{m.hub_team()}<span class="tag">{m.demo_example()}</span></p>
          <ul class="workers">
            {#each workers as w (w.kind)}
              <li>
                <span class="glyph role" aria-hidden="true">
                  {#if w.kind === 'copy'}
                    <svg viewBox="0 0 24 24"
                      ><path d="M12 20h9" /><path
                        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"
                      /></svg
                    >
                  {:else}
                    <svg viewBox="0 0 24 24"
                      ><rect x="3" y="3" width="18" height="18" rx="2" /><circle
                        cx="9"
                        cy="9"
                        r="2"
                      /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></svg
                    >
                  {/if}
                </span>
                <span class="worker-name">{w.name}</span>
                <span class="done">{m.ui_done()}</span>
              </li>
            {/each}
          </ul>
          <div class="bubble">
            <p class="report">{m.ui_report_summary()}</p>
            <ul class="results">
              {#each criteria.slice(0, 2) as criterion (criterion)}
                <li class="met">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  <span>{criterion}<span class="visually-hidden"> ({m.ui_met()})</span></span>
                </li>
              {/each}
              <li class="short">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 3 20h18z" /></svg>
                <span>
                  {criteria[2]}<span class="visually-hidden"> ({m.ui_short()})</span>
                  <small>{m.ui_report_short()}</small>
                </span>
              </li>
            </ul>
            <span class="folder">
              <svg viewBox="0 0 24 24" aria-hidden="true"
                ><path
                  d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                /></svg
              >
              {m.ui_folder()}
            </span>
          </div>
          <div class="ui-foot replies">
            <span class="btn">{m.ui_use()}</span>
            <span class="btn primary">{m.ui_more()}</span>
          </div>
        </div>

        <p class="meanwhile">{m.moments_3_mos()}</p>
      </li>
    </ol>

    <!-- The difference from a chat AI, side by side. Two labelled lists, so a
         phone can simply stack them. -->
    <div class="compare">
      {#each SIDES as side (side)}
        <div class="side {side}">
          <h3 class="side-head">
            {#if side === 'mos'}
              <img
                src="/characters/mos-greeting.webp"
                alt=""
                width="32"
                height="32"
                loading="lazy"
              />
            {/if}
            {side === 'chat' ? m.compare_chat() : m.compare_mos()}
          </h3>
          <dl>
            {#each compare as row (row.label)}
              <div>
                <dt>{row.label}</dt>
                <dd>{row[side]}</dd>
              </div>
            {/each}
          </dl>
        </div>
      {/each}
    </div>

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

  /* One column, reading width, until three fit side by side. */
  .cards {
    display: grid;
    gap: var(--space-20);
    max-width: 560px;
    margin: var(--space-56) auto 0;
  }
  @media (min-width: 1024px) {
    .cards {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--space-24);
      max-width: none;
    }
  }

  .card {
    display: flex;
    flex-direction: column;
    padding: var(--space-24) var(--space-24) var(--space-20);
    border: 1px solid var(--line-normal-alternative);
    border-radius: var(--radius-l);
    background: var(--background-page);
  }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-8);
    min-height: 24px;
  }
  .num {
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-bold);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.06em;
    color: var(--primary-strong);
  }
  .badge {
    padding: 3px 10px;
    border-radius: var(--radius-full);
    background: var(--background-tint);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    line-height: var(--line-height-label);
    color: var(--primary-strong);
  }
  h3 {
    margin-top: var(--space-8);
    font-size: var(--font-size-h3);
    font-weight: var(--weight-bold);
    line-height: 1.4;
    letter-spacing: -0.01em;
    color: var(--label-strong);
    margin-bottom: var(--space-20);
  }

  /* ---- The UI fragment: the product's own white chat card ---- */
  .ui {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: var(--space-12);
    margin-block: 0;
    padding: var(--space-16);
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-m);
    background: var(--background-card);
    box-shadow: var(--shadow-e2);
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-label);
    text-align: left;
    color: var(--label-normal);
  }
  /* A card that is waiting on me carries the product's blue focus frame. */
  .ui.waiting {
    border-color: var(--primary-normal);
    box-shadow:
      0 0 0 3px rgba(15, 111, 218, 0.12),
      var(--shadow-e2);
  }

  .ui-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-6) var(--space-8);
  }
  .glyph {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--background-tint);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-bold);
    color: var(--primary-strong);
  }
  .glyph svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
  }
  .ui-name {
    font-weight: var(--weight-bold);
    color: var(--label-strong);
  }
  .tag {
    padding: 1px 8px;
    border-radius: var(--radius-full);
    background: var(--background-sunken);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    color: var(--label-alternative);
  }
  .state {
    margin-left: auto;
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }

  .ask,
  .prompt {
    font-weight: var(--weight-bold);
    line-height: 1.45;
    color: var(--label-strong);
  }

  /* Answer choices: radio rows, the chosen one in the product's blue. */
  .options {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  .option {
    display: flex;
    align-items: flex-start;
    gap: var(--space-10);
    padding: var(--space-10) var(--space-12);
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-s);
    background: var(--background-card);
  }
  .option.compact {
    align-items: center;
    padding-block: var(--space-8);
  }
  .option.picked {
    border-color: var(--primary-normal);
    background: var(--background-tint);
  }
  .radio {
    flex: none;
    width: 14px;
    height: 14px;
    margin-top: 2px;
    border: 1.5px solid var(--line-normal-strong);
    border-radius: 50%;
    background: var(--background-card);
  }
  .compact .radio {
    margin-top: 0;
  }
  .picked .radio {
    border: 4px solid var(--primary-normal);
  }
  .option-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .option-label {
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .option-sub {
    font-size: var(--font-size-caption-2);
    line-height: var(--line-height-label);
    color: var(--label-alternative);
  }
  /* The fragments fill their cards to one bottom line across the row: the
     write-in box takes the slack in card 1, the footer rides the bottom. */
  .options:has(.own),
  .option.own {
    flex: 1;
  }
  .option.own {
    padding-block: var(--space-8);
    border-style: dashed;
    font-size: var(--font-size-caption-1);
    color: var(--label-assistive);
  }

  .ui-foot {
    display: flex;
    flex-wrap: wrap;
    margin-top: auto;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-6);
  }
  .count {
    margin-right: auto;
    font-size: var(--font-size-caption-2);
    font-variant-numeric: tabular-nums;
    color: var(--label-assistive);
  }
  .btn {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 var(--space-14);
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-full);
    background: var(--background-card);
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    white-space: nowrap;
    color: var(--label-normal);
  }
  .btn.primary {
    border-color: var(--primary-fill);
    background: var(--primary-fill);
    color: var(--static-white);
  }

  /* Task summary fields, on the sunken panel the product uses. */
  .fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-12);
    border-radius: var(--radius-s);
    background: var(--background-page);
  }
  dl {
    display: grid;
    gap: var(--space-2);
  }
  dt {
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    color: var(--label-alternative);
  }
  dd {
    margin: 0 0 var(--space-8);
  }
  dd:last-child {
    margin-bottom: 0;
  }
  .dots {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .dots li {
    position: relative;
    padding-left: 12px;
  }
  .dots li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 0.62em;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--label-alternative);
  }
  .folded {
    display: flex;
    gap: var(--space-4);
    padding-top: var(--space-8);
    border-top: 1px solid var(--line-normal-normal);
    font-size: var(--font-size-caption-2);
    color: var(--label-alternative);
  }

  /* This job's team, collapsed to job title and status, each marked with the
     same role glyph the hero uses. */
  .team {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    margin-bottom: calc(var(--space-8) - var(--space-14));
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-bold);
    color: var(--label-strong);
  }
  .workers {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  .workers li {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-8) var(--space-10);
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-s);
  }
  .glyph.role {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-xs);
    background: var(--background-sunken);
    color: var(--label-alternative);
  }
  .glyph.role svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .worker-name {
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .done {
    margin-left: auto;
    padding: 1px 8px;
    border-radius: var(--radius-full);
    background: rgba(79, 161, 54, 0.12);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    color: var(--status-positive-text);
  }

  /* Mos's report: a chat bubble with my two replies under it. */
  .ui.chat {
    gap: var(--space-14);
  }
  .bubble {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    padding: var(--space-14);
    border-radius: 4px var(--radius-m) var(--radius-m) var(--radius-m);
    background: var(--background-sunken);
  }
  .report {
    font-weight: var(--weight-bold);
    line-height: 1.45;
    color: var(--label-strong);
  }
  .results {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  .results li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-8);
  }
  .results svg {
    flex: none;
    width: 16px;
    height: 16px;
    margin-top: 1px;
    fill: none;
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .met svg {
    stroke: var(--status-positive-fill);
  }
  .short svg {
    stroke: var(--status-warning-fill);
    stroke-width: 2.2;
  }
  .short small {
    display: block;
    margin-top: 2px;
    font-size: var(--font-size-caption-2);
    color: var(--label-alternative);
  }
  .folder {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: var(--space-6);
    margin-top: var(--space-2);
    padding: 3px 10px 3px 8px;
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-xs);
    background: var(--background-card);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    color: var(--label-alternative);
  }
  .folder svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: var(--primary-normal);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .replies {
    justify-content: flex-start;
  }

  /* What Mos is doing meanwhile: quieter than the moment itself, and level
     across the row whatever height each fragment has. */
  .meanwhile {
    display: flex;
    margin-top: var(--space-20);
    align-items: baseline;
    gap: var(--space-8);
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-assistive);
  }
  .meanwhile::before {
    content: '';
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--primary-bright);
    transform: translateY(-2px);
  }

  /* ---- Chat AI vs Mos ---- */
  .compare {
    display: grid;
    gap: var(--space-16);
    max-width: 960px;
    margin: var(--space-56) auto 0;
  }
  /* Side by side, the rows line up across both lists (subgrid). */
  @media (min-width: 768px) {
    .compare {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: repeat(4, auto);
      column-gap: var(--space-20);
      row-gap: 0;
    }
    .side {
      display: grid;
      grid-row: span 4;
      grid-template-rows: subgrid;
    }
    .side dl {
      display: grid;
      grid-row: span 3;
      grid-template-rows: subgrid;
    }
  }
  .side {
    padding: var(--space-8) var(--space-24) var(--space-12);
    border: 1px solid var(--line-normal-alternative);
    border-radius: var(--radius-l);
    background: var(--background-page);
  }
  .side.mos {
    border-color: var(--primary-normal);
    background: var(--background-card);
    box-shadow:
      0 0 0 3px rgba(15, 111, 218, 0.1),
      var(--shadow-e2);
  }
  .side-head {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    min-height: 56px;
    padding-block: var(--space-8);
    font-size: var(--font-size-subtitle-1);
    font-weight: var(--weight-bold);
    line-height: var(--line-height-label);
    color: var(--label-alternative);
  }
  .mos .side-head {
    color: var(--primary-strong);
  }
  .side-head img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
  .side dl {
    margin: 0;
    gap: 0;
  }
  .side dl > div {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding-block: var(--space-14);
    border-top: 1px solid var(--line-normal-alternative);
  }
  .side dt {
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    color: var(--label-assistive);
  }
  .side dd {
    margin: 0;
    font-size: var(--font-size-body-1);
    line-height: var(--line-height-body-normal);
    color: var(--label-alternative);
  }
  .mos dd {
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }

  .to-form {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    width: fit-content;
    min-height: var(--control-m);
    margin: var(--space-40) auto 0;
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

  @media (max-width: 640px) {
    .card {
      padding: var(--space-20) var(--space-16) var(--space-16);
      border-radius: var(--radius-m);
    }
    h3 {
      margin-bottom: var(--space-16);
    }
    .meanwhile {
      margin-top: var(--space-16);
    }
    .ui {
      padding: var(--space-14);
    }
    .side {
      padding-inline: var(--space-16);
      border-radius: var(--radius-m);
    }
  }
</style>
