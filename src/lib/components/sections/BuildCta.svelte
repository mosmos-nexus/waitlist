<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import { reveal } from '$lib/anime/motion';

  // The recruit page lives outside the product, so it opens in its own tab and
  // says so.
  const TEAM_URL =
    'https://mosmos-world.notion.site/mosmos-team-specialist-investor-building?pvs=74';

  const ROLES = $derived([m.recruit_role1(), m.recruit_role2(), m.recruit_role3()]);
</script>

<section class="section build">
  <div class="container">
    <div class="panel glass reveal" use:reveal={{ scale: true }}>
      <span class="eyebrow">{m.recruit_eyebrow()}</span>
      <h2 class="t-heading-2 title">{m.recruit_title()}</h2>

      <ul class="roles">
        {#each ROLES as role (role)}
          <li>{role}</li>
        {/each}
      </ul>

      <p class="text">{m.recruit_text()}</p>

      <a class="cta" href={TEAM_URL} target="_blank" rel="noopener noreferrer">
        {m.recruit_cta()}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
        <span class="visually-hidden">({m.recruit_new_tab()})</span>
      </a>
    </div>
  </div>
</section>

<style>
  .build {
    background: var(--app-bg);
  }

  .panel {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-14);
    padding: var(--space-40) var(--space-32);
    /* A faint horizon behind the last panel, so the page ends on the world
       rather than on a flat rectangle. */
    background:
      radial-gradient(90% 120% at 50% 130%, rgba(31, 206, 206, 0.12), transparent 70%),
      linear-gradient(150deg, rgba(35, 41, 47, 0.72) 0%, rgba(20, 23, 27, 0.86) 100%);
  }

  .title {
    color: var(--label-strong);
    max-width: 30ch;
  }

  .roles {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
  }
  .roles li {
    padding: 5px 13px;
    border-radius: var(--radius-full);
    border: 1px solid var(--line-normal-normal);
    background: var(--fill-weak);
    font-size: var(--font-size-caption-1);
    color: var(--label-alternative);
  }

  .text {
    font-size: var(--font-size-body-2);
    color: var(--label-assistive);
  }

  .cta {
    display: inline-flex;
    align-items: center;
    gap: var(--space-8);
    margin-top: var(--space-6);
    min-height: var(--control-m);
    padding: 0 var(--space-24);
    border-radius: var(--radius-full);
    border: 1px solid rgba(44, 137, 240, 0.46);
    color: var(--primary-bright);
    font-size: var(--font-size-label-1);
    font-weight: var(--weight-semibold);
    transition: var(--transition-base);
  }
  .cta:hover {
    background: rgba(44, 137, 240, 0.12);
    border-color: var(--primary-light);
    color: var(--primary-bright);
  }
  .cta:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  .cta svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @media (max-width: 560px) {
    .panel {
      padding: var(--space-32) var(--space-20);
    }
  }
</style>
