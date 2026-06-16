<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
</script>

<section class="section mosmon">
  <div class="container">
    <span class="eyebrow">{m.mosmon_eyebrow()}</span>
    <h2>{m.mosmon_title()}</h2>
    <p class="section-sub">{m.mosmon_sub()}</p>

    <div class="cards">
      <article class="card">
        <img class="art" src="/characters/mos-curious.webp" alt="Mos" width={120} height={120} />
        <div class="head">
          <h3>{m.mos_name()}</h3>
          <span class="role">{m.mos_role()}</span>
        </div>
        <p class="desc">{m.mos_desc()}</p>
        <span class="keywords">{m.mos_keywords()}</span>
      </article>

      <article class="card">
        <img
          class="art symbol"
          src="/brand/mosmos-symbol-gradient.svg"
          alt="Mon"
          width={120}
          height={120}
        />
        <div class="head">
          <h3>{m.mon_name()}</h3>
          <span class="role">{m.mon_role()}</span>
        </div>
        <p class="desc">{m.mon_desc()}</p>
        <span class="keywords">{m.mon_keywords()}</span>
      </article>
    </div>
  </div>
</section>

<style>
  .mosmon .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .eyebrow {
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    letter-spacing: var(--tracking-wide);
    text-transform: none;
    color: var(--color-secondary);
  }
  h2 {
    margin: var(--space-sm) 0 var(--space-md);
    font-size: var(--fs-h2);
    line-height: var(--lh-h2);
  }
  .section-sub {
    margin: 0 auto var(--space-2xl);
    max-width: 30em;
    font-size: var(--fs-body);
    color: var(--text-muted);
    line-height: var(--lh-body);
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-lg);
    width: 100%;
    max-width: 760px;
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-2xl) var(--space-lg);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-e1);
  }
  .art {
    width: 120px;
    height: 120px;
    object-fit: contain;
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
  }
  h3 {
    font-size: var(--fs-h2);
  }
  .role {
    font-size: var(--fs-body-sm);
    font-weight: var(--fw-semibold);
    color: var(--color-primary);
  }
  .desc {
    margin: 0;
    max-width: 24em;
    color: var(--text-muted);
    line-height: var(--lh-body);
  }
  .keywords {
    margin-top: var(--space-xs);
    font-size: var(--fs-body-sm);
    color: var(--text-faint);
  }
  @media (max-width: 720px) {
    .cards {
      grid-template-columns: 1fr;
    }
  }
</style>
