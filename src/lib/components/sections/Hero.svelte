<script lang="ts">
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import { m } from '$lib/locale.svelte';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
  }
  let { onSuccess }: Props = $props();

  // Lucide line icons (pen-line, image), one path each.
  const workers = $derived([
    { name: m.demo_worker_copy(), d: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' },
    {
      name: m.demo_worker_image(),
      d: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm12 8-3.1-3.1a2 2 0 0 0-2.8 0L6 21',
    },
  ]);
</script>

<section class="hero" aria-labelledby="hero-title">
  <div class="container grid">
    <div class="copy">
      <p class="eyebrow"><span class="dot" aria-hidden="true"></span>{m.hero_eyebrow()}</p>
      <h1 id="hero-title">{m.hero_title()}</h1>
      <p class="sub">{m.hero_sub()}</p>
      <div class="form">
        <WaitlistForm {onSuccess} position="hero" />
      </div>
    </div>

    <!-- One finished example, as plain text: what I asked, the one thing I
         decided, and who Mos handed the rest to. It settles in once on load
         and then holds still. -->
    <figure class="card">
      <figcaption class="head">
        <span class="task">{m.demo_task()}</span>
        <span class="tag">{m.demo_example()}</span>
      </figcaption>

      <div class="chat">
        <p class="bubble me in" style:--i={0}>{m.demo_request()}</p>
        <div class="ask in" style:--i={1}>
          <img src="/characters/mos-curious.webp" alt="Mos" width="36" height="36" />
          <p class="bubble mos">{m.demo_ask()}</p>
        </div>
        <p class="answer in" style:--i={2}>
          <span class="pill mine">{m.demo_mine()}</span>
          <span class="bubble me pick">
            <svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg
            >{m.demo_answer()}
          </span>
        </p>
      </div>

      <div class="team">
        <p class="pill handoff in" style:--i={3}>{m.demo_handoff()}</p>
        <ul class="workers">
          {#each workers as w, i (w.d)}
            <li class="in" style:--i={3 + i}>
              <span class="role" aria-hidden="true">
                <svg class="i" viewBox="0 0 24 24"><path d={w.d} /></svg>
              </span>
              <span class="name">{w.name}</span>
              <span class="done">{m.demo_status_done()}</span>
            </li>
          {/each}
        </ul>
        <p class="result in" style:--i={5}>
          <span class="tiles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
          {m.demo_result()}
        </p>
      </div>
    </figure>
  </div>
</section>

<style>
  .hero {
    padding-block: var(--space-24) var(--space-56);
    background:
      radial-gradient(56% 48% at 82% 34%, rgba(15, 111, 218, 0.1), transparent 70%),
      var(--gradient-sky);
  }

  .grid {
    display: grid;
    gap: var(--space-40);
  }

  .copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--status-positive-fill);
    box-shadow: 0 0 0 3px rgba(79, 161, 54, 0.18);
  }

  h1 {
    margin-top: var(--space-12);
    font-size: var(--font-size-h1);
    font-weight: var(--weight-bold);
    line-height: var(--line-height-h1);
    letter-spacing: -0.03em;
    color: var(--label-strong);
    text-wrap: balance;
  }

  .sub {
    margin-top: var(--space-16);
    max-width: 34em;
    font-size: var(--font-size-lead);
    line-height: var(--line-height-lead);
    color: var(--label-alternative);
  }

  .form {
    width: 100%;
    margin-top: var(--space-24);
  }

  /* One caption stack under the CTA: same size, colour and rhythm as the
     form's own microcopy above it. */
  /* ---- The example card ---- */
  .card {
    width: 100%;
    max-width: 440px;
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-l);
    background: var(--background-card);
    box-shadow:
      0 1px 2px rgba(29, 32, 38, 0.04),
      0 20px 44px -28px rgba(15, 63, 128, 0.28);
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-label);
    color: var(--label-normal);
  }

  .head {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-14) var(--space-20);
    border-bottom: 1px solid var(--line-normal-alternative);
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .task {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tag {
    flex: none;
    padding: 2px 9px;
    border-radius: var(--radius-full);
    background: var(--background-tint);
    font-size: var(--font-size-caption-2);
    color: var(--primary-strong);
  }

  .i {
    flex: none;
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .chat {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    padding: var(--space-16) var(--space-20);
  }
  .bubble {
    width: fit-content;
    max-width: 88%;
    padding: var(--space-8) var(--space-14);
    line-height: var(--line-height-body-normal);
  }
  .bubble.me {
    align-self: flex-end;
    border-radius: 16px 16px 4px 16px;
    background: var(--primary-fill);
    color: var(--static-white);
  }
  .ask {
    display: flex;
    align-items: flex-end;
    gap: var(--space-8);
  }
  .ask img {
    flex: none;
    width: 36px;
    height: 36px;
    object-fit: contain;
  }
  .bubble.mos {
    border-radius: 16px 16px 16px 4px;
    background: var(--background-sunken);
  }

  /* The answer is mine, and says so: the H1's "내가 정할 일", in blue. */
  .answer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-8);
  }
  .pick {
    display: inline-flex;
    align-items: center;
    gap: var(--space-6);
    font-weight: var(--weight-semibold);
  }
  .pick .i {
    stroke-width: 2.6;
  }
  .pill {
    flex: none;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-bold);
    white-space: nowrap;
  }
  .mine {
    background: var(--background-tint);
    color: var(--primary-strong);
  }

  /* What Mos handed off: the two AI workers, quieter, on the sunken panel. */
  .team {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    margin: 0 var(--space-12) var(--space-12);
    padding: var(--space-12);
    border-radius: var(--radius-m);
    background: var(--background-page);
  }
  .handoff {
    align-self: flex-start;
    background: var(--background-card);
    box-shadow: inset 0 0 0 1px var(--line-normal-normal);
    color: var(--label-alternative);
  }
  .workers {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  .workers li {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    padding: var(--space-8) var(--space-10);
    border: 1px solid var(--line-normal-alternative);
    border-radius: var(--radius-s);
    background: var(--background-card);
  }
  .role {
    display: grid;
    place-items: center;
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-xs);
    background: var(--background-sunken);
    color: var(--label-alternative);
  }
  .name {
    flex: 1;
    min-width: 0;
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .done {
    flex: none;
    padding: 1px 8px;
    border-radius: var(--radius-full);
    background: rgba(79, 161, 54, 0.12);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    color: var(--status-positive-text);
  }
  .result {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    padding: var(--space-4) var(--space-4) 0;
    font-weight: var(--weight-bold);
    color: var(--label-strong);
  }
  .tiles {
    display: flex;
    gap: 3px;
  }
  .tiles i {
    width: 12px;
    height: 15px;
    border-radius: 3px;
    background: linear-gradient(160deg, var(--color-blue-97), var(--color-blue-80));
    box-shadow: inset 0 0 0 1px rgba(15, 111, 218, 0.12);
  }

  /* One reveal on load, top to bottom, done by ~1.1s; then nothing moves.
     `backwards` fill only, so the settled card is the plain styles above —
     what the server sends and what reduced motion shows. */
  @media (prefers-reduced-motion: no-preference) {
    .in {
      animation: settle 460ms var(--ease-out) backwards;
      animation-delay: calc(80ms + var(--i) * 120ms);
    }
  }
  @keyframes settle {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  /* Phone: tighter, so the email field fits the first screen and the card's
     request shows under the form. The micro line goes — §4 makes the same
     promise in full. */
  @media (max-width: 640px) {
    .hero {
      padding-top: var(--space-12);
    }
    .grid {
      gap: var(--space-20);
    }
    h1 {
      margin-top: var(--space-8);
    }
    .sub {
      margin-top: var(--space-10);
      font-size: 15px;
      line-height: var(--line-height-body-reading);
    }
    .form {
      margin-top: var(--space-16);
    }
    .form :global(form) {
      gap: var(--space-12);
    }
    .head {
      padding: var(--space-12) var(--space-16);
    }
    .chat {
      gap: var(--space-8);
      padding: var(--space-14) var(--space-16);
    }
    .bubble {
      padding: 7px var(--space-12);
    }
    .team {
      gap: var(--space-6);
      margin: 0 var(--space-8) var(--space-8);
      padding: var(--space-10);
    }
    .workers li {
      gap: var(--space-8);
      padding: 6px var(--space-8);
    }
    .role {
      width: 26px;
      height: 26px;
    }
  }

  @media (min-width: 1024px) {
    .hero {
      padding-block: var(--space-48) var(--space-80);
    }
    .grid {
      grid-template-columns: minmax(0, 1fr) min(440px, 42%);
      column-gap: clamp(48px, 6vw, 96px);
      align-items: center;
    }
    .sub {
      margin-top: var(--space-20);
    }
    .form {
      margin-top: var(--space-32);
    }
  }
</style>
