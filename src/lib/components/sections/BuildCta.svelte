<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import { m } from '$lib/paraglide/messages.js';

  // Secondary, intentionally lower-emphasis path for a different audience: people who
  // want to help BUILD Mosmos as early teammates (domain experts, founding members,
  // would-be colleagues) — framed as joining the early team, not as an investor pitch.
  // Placed after the re-CTA so it reaches end-of-page, higher-intent readers without
  // competing with the single primary waitlist CTA. Purple/outline marks it secondary.
  const TEAM_URL =
    'https://mosmos-world.notion.site/mosmos-team-specialist-investor-building?pvs=74';
</script>

<section class="build">
  <div class="container">
    <div class="band" use:reveal>
      <div class="art" aria-hidden="true">
        <img src="/characters/mos-curious.webp" alt="" width={72} height={71} loading="lazy" />
      </div>
      <div class="copy">
        <p class="eyebrow">{m.recruit_eyebrow()}</p>
        <h2 class="title">{m.recruit_title()}</h2>
        <ul class="roles">
          <li>{m.recruit_role1()}</li>
          <li>{m.recruit_role2()}</li>
          <li>{m.recruit_role3()}</li>
        </ul>
        <p class="text">{m.recruit_text()}</p>
      </div>
      <a class="cta" href={TEAM_URL} target="_blank" rel="noopener noreferrer">
        <span>{m.recruit_cta()}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M5 11l6-6m0 0H6m5 0v5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="visually-hidden">({m.recruit_new_tab()})</span>
      </a>
    </div>
  </div>
</section>

<style>
  .build {
    padding-block: var(--space-3xl);
    background: var(--surface-page);
    border-top: 1px solid var(--border-subtle);
  }
  .band {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    padding: var(--space-lg) var(--space-xl);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-left: 3px solid var(--purple-pop);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-e1);
  }
  .art {
    flex: none;
    display: grid;
    place-items: center;
  }
  .art img {
    width: 72px;
    height: auto;
    animation: bob 5.5s var(--ease-in-out) infinite;
  }
  @keyframes bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
  .copy {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .title {
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
    color: var(--text-strong);
  }
  .roles {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 2px 0;
    padding: 0;
  }
  .roles li {
    font-size: var(--fs-caption);
    font-weight: var(--fw-medium);
    color: var(--color-secondary);
    background: rgba(155, 110, 239, 0.1);
    padding: 2px 10px;
    border-radius: var(--radius-pill);
  }
  .text {
    margin: 0;
    font-size: var(--fs-body-sm);
    line-height: var(--lh-body-sm);
    color: var(--text-muted);
  }
  .cta {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    height: var(--control-md);
    padding-inline: var(--space-lg);
    border: 1px solid var(--color-secondary);
    border-radius: var(--radius-pill);
    color: var(--color-secondary);
    font-size: var(--fs-body-sm);
    font-weight: var(--fw-semibold);
    text-decoration: none;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }
  .cta:hover {
    background: rgba(155, 110, 239, 0.1);
    text-decoration: none;
    transform: translateY(-1px);
  }
  .cta svg {
    width: 15px;
    height: 15px;
  }

  @media (max-width: 720px) {
    .band {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-md);
      padding: var(--space-lg);
    }
    .cta {
      width: 100%;
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .art img {
      animation: none;
    }
  }
</style>
