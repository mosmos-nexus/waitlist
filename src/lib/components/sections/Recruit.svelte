<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal } from '$lib/anime/motion';

  /**
   * The early-team ask, back on the page.
   *
   * It lived in `BuildCta.svelte` and went out with that component when the
   * page was rebuilt as the Monitor world; its strings sat unreferenced for
   * three commits. Restored rather than reinvented — the roles are the ones the
   * copy already named — but rewritten for this shell: one panel, three roles
   * with a line each saying who the role is actually for, and a link out.
   *
   * Deliberately quiet. It sits after the signup, so it must not compete with
   * it: no accent fill, no second form, one outbound link.
   */
  const ROLES = $derived([
    { name: m.recruit_role1(), who: m.recruit_role1_d() },
    { name: m.recruit_role2(), who: m.recruit_role2_d() },
    { name: m.recruit_role3(), who: m.recruit_role3_d() },
  ]);

  const HREF = 'https://mosmos.world/careers';
</script>

<section class="recruit section" aria-labelledby="recruit-title">
  <div class="container">
    <div class="panel hud" use:reveal={{ scale: true }}>
      <div class="panel-head">
        <span class="eyebrow">{m.recruit_eyebrow()}</span>
        <h2 class="title" id="recruit-title">{m.recruit_title()}</h2>
        <p class="lead">{m.recruit_lead()}</p>
      </div>

      <ul class="roles">
        {#each ROLES as r (r.name)}
          <li>
            <span class="role-n">{r.name}</span>
            <span class="role-w">{r.who}</span>
          </li>
        {/each}
      </ul>

      <div class="foot">
        <p class="say">{m.recruit_text()}</p>
        <a class="go" href={HREF} target="_blank" rel="noopener noreferrer">
          {m.recruit_cta()}
          <span aria-hidden="true">↗</span>
          <span class="visually-hidden">— {m.recruit_new_tab()}</span>
        </a>
      </div>
    </div>
  </div>
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-20);
    padding: var(--space-32) var(--space-24);
  }
  @media (min-width: 720px) {
    .panel {
      padding: var(--space-40);
    }
  }

  /* `panel-head`, not `head`. Every section head on the page shares one measure
     so the left column lines up, and this one sits inside a padded panel — it is
     bounded by the panel, not the container, so it can never match and should
     not claim to. Same split the closing notes already make. */
  .panel-head {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
  }
  .title {
    margin: 0;
    font-size: clamp(21px, 2.4vw, 27px);
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.02em;
    color: var(--shell-text);
    text-wrap: balance;
  }
  .lead {
    margin: 0;
    font-size: var(--font-size-body-2);
    line-height: 1.65;
    color: var(--shell-body);
    text-wrap: balance;
  }

  .roles {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-10);
  }
  @media (min-width: 720px) {
    .roles {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .roles li {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--space-14) var(--space-16);
    border: 1px solid var(--glass-line-soft);
    border-radius: var(--radius-xs);
  }
  .role-n {
    font-size: 13px;
    font-weight: 700;
    color: var(--shell-text);
  }
  .role-w {
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--shell-meta);
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-12) var(--space-20);
  }
  .say {
    margin: 0;
    flex: 1 1 16ch;
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--shell-meta);
  }
  .go {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: var(--control-m);
    padding: 0 var(--space-20);
    border: 1px solid rgba(49, 220, 220, 0.5);
    border-radius: var(--radius-full);
    background: rgba(31, 206, 206, 0.08);
    font-size: 13px;
    font-weight: 600;
    color: var(--bright-cyan);
    text-decoration: none;
    transition: var(--transition-base);
  }
  .go:hover {
    background: rgba(31, 206, 206, 0.16);
    border-color: var(--bright-cyan);
  }
  .go:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
</style>
