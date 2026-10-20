<script lang="ts">
  import { onMount } from 'svelte';
  import { m } from '$lib/locale.svelte';

  const steps = $derived([
    { label: m.empathy_step_1(), sub: m.empathy_step_1_sub() },
    { label: m.empathy_step_2(), sub: m.empathy_step_2_sub() },
    { label: m.empathy_step_3(), sub: m.empathy_step_3_sub() },
    { label: m.empathy_step_4(), sub: m.empathy_step_4_sub() },
  ]);

  // Two masks (row and column layouts) need ids no other element shares.
  const uid = $props.id();

  /*
   * The way back draws itself once, the first time it scrolls into view.
   * The resting state is the drawn one: without JS, under reduced motion, in a
   * full-page capture that never scrolls, or when it is already on screen, the
   * arrow is simply there. Only once the reader starts scrolling and the loop
   * is still below the fold is it hidden (`armed`) — off screen, so nothing
   * visibly disappears — and the observer then draws it (`drawn`).
   */
  let loop: HTMLElement;
  let armed = $state(false);
  let drawn = $state(false);

  onMount(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let io: IntersectionObserver | undefined;
    const arm = () => {
      if (loop.getBoundingClientRect().top <= innerHeight) return;
      armed = true;
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          drawn = true;
          io?.disconnect();
        },
        { threshold: 0.6 },
      );
      io.observe(loop);
    };
    addEventListener('scroll', arm, { once: true, passive: true });
    return () => {
      removeEventListener('scroll', arm);
      io?.disconnect();
    };
  });
</script>

<section class="section empathy" aria-labelledby="empathy-title">
  <div class="container inner">
    <h2 class="title" id="empathy-title">{m.empathy_title()}</h2>

    <div class="loop" class:armed class:drawn bind:this={loop}>
      <div class="track">
        <ol class="steps">
          {#each steps as step (step.label)}
            <li>
              <span class="label">{step.label}</span>
              <span class="sub">{step.sub}</span>
            </li>
          {/each}
        </ol>

        <!-- The dashed way back is decoration; its label below is the content.
             Row layout: from under the last step, back under the first. -->
        <svg class="back row" viewBox="0 0 750 52" preserveAspectRatio="none" aria-hidden="true">
          <mask
            id="back-row-{uid}"
            maskUnits="userSpaceOnUse"
            x="-20"
            y="-20"
            width="790"
            height="92"
          >
            <path
              class="draw"
              pathLength="1"
              d="M750 0 V28 a22 22 0 0 1 -22 22 H22 a22 22 0 0 1 -22 -22 V4"
            />
          </mask>
          <path
            class="dash"
            mask="url(#back-row-{uid})"
            d="M750 0 V28 a22 22 0 0 1 -22 22 H22 a22 22 0 0 1 -22 -22 V4"
          />
          <path class="head" d="M-6 9 L0 2 L6 9" />
        </svg>
        <!-- Column layout: from beside the last step, up the left, into the first. -->
        <svg class="back col" viewBox="0 0 32 300" preserveAspectRatio="none" aria-hidden="true">
          <mask
            id="back-col-{uid}"
            maskUnits="userSpaceOnUse"
            x="-20"
            y="-20"
            width="72"
            height="340"
          >
            <path
              class="draw"
              pathLength="1"
              d="M32 300 H20 a18 18 0 0 1 -18 -18 V18 a18 18 0 0 1 18 -18 H30"
            />
          </mask>
          <path
            class="dash"
            mask="url(#back-col-{uid})"
            d="M32 300 H20 a18 18 0 0 1 -18 -18 V18 a18 18 0 0 1 18 -18 H30"
          />
          <path class="head" d="M25 -6 L32 0 L25 6" />
        </svg>
      </div>
      <p class="again">{m.empathy_again()}</p>
    </div>

    <p class="close">{m.empathy_close()}</p>
  </div>
</section>

<style>
  .inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .title {
    max-width: 22em;
  }

  /* 960 wide at most, so the row's SVG (750 = 960 minus one column) draws at
     1:1 there and only stretches a little on narrower screens. */
  .loop {
    --gap: 40px;
    width: 100%;
    max-width: 960px;
    margin-top: var(--space-56);
  }

  .track {
    position: relative;
  }

  .steps {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--gap);
  }
  .steps li {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-6);
    min-height: 116px;
    padding: var(--space-20) var(--space-16);
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-m);
    background: var(--background-card);
    box-shadow: var(--shadow-e1);
  }
  .label {
    font-size: 20px;
    font-weight: var(--weight-bold);
    line-height: var(--line-height-label);
    color: var(--label-strong);
  }
  .sub {
    font-size: var(--font-size-body-2);
    line-height: 1.45;
    color: var(--label-alternative);
    text-wrap: balance;
  }

  /* Forward arrow into every step after the first: a shaft and a chevron. */
  .steps li + li::before,
  .steps li + li::after {
    content: '';
    position: absolute;
    right: calc(100% + 11px);
    top: 50%;
  }
  .steps li + li::before {
    width: calc(var(--gap) - 22px);
    height: 2px;
    margin-top: -1px;
    border-radius: 1px;
    background: var(--line-normal-strong);
  }
  .steps li + li::after {
    width: 7px;
    height: 7px;
    border-top: 2px solid var(--line-normal-strong);
    border-right: 2px solid var(--line-normal-strong);
    transform: translate(0, -50%) rotate(45deg);
  }

  /*
   * The way back. Equal columns put the first and last centres at 1/8 and 7/8
   * of the row, whatever length each locale gives the labels.
   */
  .back {
    position: absolute;
    overflow: visible;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .back.row {
    left: calc((100% - 3 * var(--gap)) / 8);
    top: calc(100% + 8px);
    width: calc(100% - (100% - 3 * var(--gap)) / 4);
    height: 52px;
  }
  .back.col {
    display: none;
  }
  .dash {
    stroke: var(--primary-light);
    stroke-width: 2;
    stroke-dasharray: 5 5;
    vector-effect: non-scaling-stroke;
  }
  .head {
    stroke: var(--primary-light);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .draw {
    stroke: #fff;
    stroke-width: 12;
    stroke-dasharray: 1;
    stroke-dashoffset: 0;
  }
  .armed .draw {
    stroke-dashoffset: 1;
  }
  .armed .head {
    opacity: 0;
  }
  .armed.drawn .draw {
    stroke-dashoffset: 0;
    transition: stroke-dashoffset 1100ms var(--ease-in-out) 150ms;
  }
  .armed.drawn .head {
    opacity: 1;
    transition: opacity var(--duration-slow) var(--ease-out) 1200ms;
  }

  /* Sits on the bottom of the U (8 + 50 = 58px under the steps), masking the
     dashes behind it. */
  .again {
    position: relative;
    width: fit-content;
    margin: 47px auto 0;
    padding-inline: var(--space-12);
    background: var(--background-page);
    font-size: var(--font-size-body-2);
    font-weight: var(--weight-semibold);
    line-height: 22px;
    color: var(--primary-strong);
  }

  .close {
    margin-top: var(--space-48);
    max-width: 24em;
    font-size: clamp(19px, 0.6vw + 16px, 22px);
    font-weight: var(--weight-semibold);
    line-height: 1.5;
    color: var(--label-strong);
    text-wrap: balance;
  }

  /*
   * Phone: the loop turns into a column and the way back runs up the left.
   * Steps are a fixed 72px with a 28px gap, so the first and last centres sit
   * 300px apart — the column SVG's own height — and it draws at 1:1.
   */
  @media (max-width: 640px) {
    .loop {
      --gap: 28px;
      max-width: 340px;
      margin-top: var(--space-40);
    }
    .track {
      padding-left: 48px;
    }
    .steps {
      grid-template-columns: minmax(0, 1fr);
    }
    .steps li {
      min-height: 72px;
      padding: var(--space-12) var(--space-16);
      gap: var(--space-2);
    }
    .label {
      font-size: var(--font-size-subtitle-1);
    }
    .sub {
      font-size: var(--font-size-caption-1);
    }
    .steps li + li::before,
    .steps li + li::after {
      right: auto;
      top: auto;
      left: 50%;
    }
    .steps li + li::before {
      bottom: calc(100% + 6px);
      width: 2px;
      height: calc(var(--gap) - 12px);
      margin: 0 0 0 -1px;
    }
    .steps li + li::after {
      bottom: calc(100% + 7px);
      transform: translate(-50%, 0) rotate(135deg);
    }
    .back.row {
      display: none;
    }
    .back.col {
      display: block;
      left: 8px;
      top: 36px;
      width: 32px;
      height: calc(100% - 72px);
    }
    /* The label rides the vertical return line, set upright in CJK. */
    .loop {
      position: relative;
    }
    .again {
      position: absolute;
      left: 10px;
      top: 50%;
      margin: 0;
      padding: var(--space-8) 0;
      font-size: var(--font-size-caption-2);
      white-space: nowrap;
      writing-mode: vertical-rl;
      transform: translate(-50%, -50%);
    }
    /* Upright Hangul would stack syllable by syllable; turn the line instead,
       the way English already runs. Japanese keeps its own upright columns. */
    :global(html:lang(ko)) .again {
      text-orientation: sideways;
    }
  }
</style>
