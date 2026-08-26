<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal, scrub } from '$lib/anime/motion';
  import Mon from '$lib/components/world/Mon.svelte';

  /**
   * Hub, from the maker's side.
   *
   * The screen this comes from is a registry a Mos searches, so the section
   * shows the listing rather than a storefront — and the price control is the
   * interaction because pricing is the decision a maker actually makes here.
   * Every figure on the peer rows is the Hub wireframe's own.
   */
  /* Three ways to be paid back, no figures attached. The rates that would
     turn these into numbers — the settlement share, the execution margin —
     are open experiments, and Hub trading itself only switches on well past
     the stage this page is announcing. What is decided is the shape: free
     costs the runner nothing extra, lending splits part of each run's charge,
     a Skill is bought once. */
  const MODES = $derived([
    { name: m.share_free(), note: m.share_free_d() },
    { name: m.share_paid(), note: m.share_paid_d() },
    { name: m.share_skill(), note: m.share_skill_d() },
  ]);
  let mode = $state(1);

  /* A Mon and a Mon Skill are different assets and the list has to say so.
     A Mon is an agent you rent — it runs, and each run is charged. A Skill is a
     procedure document you buy once — it never runs; the Mon it is attached to
     opens it. Drawing both as an avatar plus a line made the Hub's rent-versus-
     buy split unreadable, so the kind, the trade and the mark are all explicit,
     and only the agent gets a face. */
  const PEERS = $derived([
    {
      name: m.share_peer_1(),
      meta: m.share_peer_1_m(),
      tone: 'research' as const,
      skill: false,
      kind: m.share_kind_mon(),
      trade: m.share_rent(),
    },
    {
      name: m.share_peer_2(),
      meta: m.share_peer_2_m(),
      tone: 'organize' as const,
      skill: true,
      kind: m.share_kind_skill(),
      trade: m.share_buy(),
    },
    {
      name: m.share_peer_3(),
      meta: m.share_peer_3_m(),
      tone: 'design' as const,
      skill: false,
      kind: m.share_kind_mon(),
      trade: m.share_rent(),
    },
  ]);
</script>

<section class="share section" aria-labelledby="share-title">
  <div class="container">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.share_eyebrow()}</span>
      <h2 class="title" id="share-title">{m.share_title()}</h2>
      <p class="lead">{m.share_lead()}</p>
    </div>

    <div class="grid">
      <div class="pricer hud" use:reveal={{ delay: 60, scale: true }} use:scrub={{ y: 14 }}>
        <span class="eyebrow">{m.share_price()}</span>
        <div class="modes">
          {#each MODES as mo, i (mo.name)}
            <button
              type="button"
              class="mode"
              class:on={mode === i}
              aria-pressed={mode === i}
              onclick={() => (mode = i)}
            >
              <span class="mode-n">{mo.name}</span>
              <span class="mode-d">{mo.note}</span>
            </button>
          {/each}
        </div>

        <div class="listing">
          <span class="eyebrow">{m.share_listed()}</span>
          <article class="card mine">
            <header>
              <Mon tone="design" size={44} />
              <div class="who">
                <span class="n" translate="no">{m.share_mine_name()}</span>
                <span class="by">{m.share_yours()}</span>
              </div>
              <span class="badge">{m.share_verified()}</span>
            </header>
            <p class="desc">{m.share_mine_desc()}</p>
            <footer>
              <span class="stars">{m.share_mode_label()}</span>
              <span class="price">{MODES[mode].name}</span>
            </footer>
          </article>
        </div>
      </div>

      <div class="peers" use:reveal={{ delay: 110 }} use:scrub={{ y: 24 }}>
        {#each PEERS as p, i (p.name)}
          <article class="card hud" class:is-skill={p.skill}>
            <header>
              {#if p.skill}
                <span class="doc-mark" aria-hidden="true"></span>
              {:else}
                <Mon tone={p.tone} size={38} phase={i + 1} />
              {/if}
              <div class="who">
                <span class="n" translate="no">{p.name}</span>
                <span class="by">{p.meta}</span>
              </div>
              <div class="tags">
                <span class="kind">{p.kind}</span>
                <span class="trade">{p.trade}</span>
              </div>
            </header>
          </article>
        {/each}

        <div class="reviews hud">
          <span class="eyebrow">{m.share_review_label()}</span>
          <p>{m.share_review_mos()}</p>
          <p class="dim">{m.share_review_patron()}</p>
        </div>
      </div>
    </div>

    <p class="note" use:reveal={{ delay: 150 }}>{m.share_note()}</p>
  </div>
</section>

<style>
  .head {
    margin-bottom: var(--space-32);
  }

  .grid {
    display: grid;
    gap: var(--space-20);
    align-items: start;
  }
  @media (min-width: 900px) {
    .grid {
      grid-template-columns: minmax(0, 54fr) minmax(0, 46fr);
    }
  }

  .pricer {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
    padding: var(--space-20);
  }
  .modes {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }
  .mode {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 12px 14px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-xs);
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: var(--transition-base);
  }
  .mode:hover {
    border-color: rgba(49, 220, 220, 0.55);
  }
  .mode.on {
    border-color: var(--primary-light);
    background: rgba(15, 111, 218, 0.16);
  }
  .mode:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  .mode-n {
    font-size: 13px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .mode-d {
    font-size: 11.5px;
    color: var(--shell-meta);
  }

  .listing {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    padding-top: var(--space-14);
    border-top: 1px solid var(--glass-line-soft);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
  }
  .card.mine {
    padding: var(--space-16);
    border: 1px solid rgba(49, 220, 220, 0.3);
    border-radius: var(--radius-m);
    background: rgba(31, 206, 206, 0.06);
  }
  .peers .card.hud {
    padding: var(--space-14) var(--space-16);
    border-radius: var(--radius-m);
    box-shadow: none;
  }
  /* Squared corners and a spine: a document sitting among agents. */
  .peers .card.is-skill {
    border-radius: 5px;
    border-left: 4px solid rgba(155, 110, 239, 0.8);
    background: rgba(122, 62, 234, 0.1);
  }
  .doc-mark {
    flex: none;
    width: 30px;
    height: 38px;
    border: 1px solid rgba(155, 110, 239, 0.6);
    border-radius: 3px;
    background:
      linear-gradient(
          transparent 8px,
          rgba(213, 195, 249, 0.5) 8px 9px,
          transparent 9px 14px,
          rgba(213, 195, 249, 0.5) 14px 15px,
          transparent 15px 20px,
          rgba(213, 195, 249, 0.5) 20px 21px,
          transparent 21px
        )
        no-repeat 6px 0 / 18px 100%,
      rgba(122, 62, 234, 0.18);
  }
  .tags {
    margin-left: auto;
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
  }
  .kind {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--shell-meta);
  }
  .is-skill .kind {
    color: rgb(213, 195, 249);
  }
  .trade {
    padding: 1px 7px;
    border-radius: var(--radius-full);
    border: 1px solid var(--glass-line);
    font-size: 9.5px;
    font-weight: 700;
    color: var(--shell-body);
  }
  .is-skill .trade {
    border-color: rgba(155, 110, 239, 0.5);
  }
  .card header {
    display: flex;
    align-items: center;
    gap: var(--space-10);
  }
  .who {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .n {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .by {
    font-size: 11px;
    color: var(--shell-meta);
  }
  .badge {
    margin-left: auto;
    flex: none;
    padding: 4px 9px;
    border-radius: var(--radius-full);
    border: 1px solid rgba(49, 220, 220, 0.6);
    font-size: 10.5px;
    font-weight: 700;
    color: var(--bright-cyan);
  }
  .desc {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--shell-body);
  }
  .card footer {
    display: flex;
    align-items: baseline;
    gap: var(--space-12);
    padding-top: var(--space-10);
    border-top: 1px dashed var(--glass-line-soft);
  }
  .stars {
    font-size: 11.5px;
    color: var(--shell-meta);
  }
  .price {
    margin-left: auto;
    font-size: 15px;
    font-weight: 700;
    color: var(--bright-cyan);
  }

  .peers {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
  }
  .reviews {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-16);
    border-radius: var(--radius-m);
    box-shadow: none;
  }
  .reviews p {
    margin: 0;
    font-size: 12px;
    line-height: 1.65;
    color: var(--shell-body);
  }
  .reviews p.dim {
    color: var(--shell-faint);
  }
</style>
