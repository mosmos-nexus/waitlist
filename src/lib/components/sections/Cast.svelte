<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal, scrub } from '$lib/anime/motion';

  /**
   * The three names, before anything uses them.
   *
   * Mos, Mon and Mon Skill were each glossed where they first appeared, which
   * meant a reader met six unfamiliar words in the Chat section at once and had
   * to assemble the product from fragments — the student persona counted them
   * and re-read the panel twice. One short chapter up front, right after the
   * loss line, costs a screen and pays for every section after it.
   *
   * Definitions, then the sequence. The cards say what each name *is*; the line
   * under them says what happens in what order, which is the part that makes
   * the three separable rather than three words for the same thing.
   *
   * The names are read from the keys that already own them, so a rename cannot
   * leave this chapter saying something the rest of the page does not.
   */
  const CAST = $derived([
    { k: 'mos', n: m.decide_who_mos(), r: m.cast_mos_r(), d: m.cast_mos_d() },
    { k: 'mon', n: m.decide_who_mon(), r: m.cast_mon_r(), d: m.cast_mon_d() },
    { k: 'skill', n: m.make_t_skill(), r: m.cast_skill_r(), d: m.cast_skill_d() },
  ]);
</script>

<section class="cast section" aria-labelledby="cast-title">
  <div class="container">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.cast_eyebrow()}</span>
      <h2 class="title" id="cast-title">{m.cast_title()}</h2>
    </div>

    <ol class="cards">
      {#each CAST as c, i (c.k)}
        <li
          class="card hud {c.k}"
          use:reveal={{ delay: 60 + i * 60 }}
          use:scrub={{ y: 10 + i * 4 }}
        >
          <span class="n" translate="no">{c.n}</span>
          <span class="r">{c.r}</span>
          <p class="d">{c.d}</p>
        </li>
      {/each}
    </ol>

    <p class="flow" use:reveal={{ delay: 240 }}>{m.cast_flow()}</p>
  </div>
</section>

<style>
  .head {
    margin-bottom: var(--space-24);
  }

  .cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-12);
  }
  @media (min-width: 760px) {
    .cards {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-20);
    box-shadow: none;
  }
  /* One accent per role, matching where each name lives elsewhere: Mos speaks
     in the product blue, a Mon in the cyan the canvas gives it, a Mon Skill in
     the paper violet Studio marks documents with. */
  .card::before {
    content: '';
    width: 26px;
    height: 3px;
    border-radius: var(--radius-full);
    margin-bottom: var(--space-4);
  }
  .mos::before {
    background: var(--primary-light);
  }
  .mon::before {
    background: var(--bright-cyan);
  }
  .skill::before {
    background: rgb(213, 195, 249);
  }
  .n {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--shell-text);
  }
  .r {
    font-size: 12.5px;
    font-weight: 600;
  }
  .mos .r {
    color: var(--primary-light);
  }
  .mon .r {
    color: var(--bright-cyan);
  }
  .skill .r {
    color: rgb(213, 195, 249);
  }
  .d {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.65;
    color: var(--shell-meta);
  }

  /* The order, once the three are named. Centre-set and quiet — it is a caption
     for the row above, not a fourth card. */
  .flow {
    margin: var(--space-20) 0 0;
    text-align: center;
    font-size: 12.5px;
    line-height: 1.7;
    color: var(--shell-body);
    text-wrap: balance;
  }
</style>
