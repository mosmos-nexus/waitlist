<script lang="ts">
  import { onMount } from 'svelte';
  import { slide, type TransitionConfig } from 'svelte/transition';
  import { cubicOut, cubicInOut } from 'svelte/easing';
  import { MediaQuery } from 'svelte/reactivity';
  import { prefersReducedMotion } from 'svelte/motion';
  import { track } from '@vercel/analytics';
  import { m } from '$lib/locale.svelte';

  /*
   * Storyboard cue points in ms (spec "Hero demo storyboard", v2). F0 is the
   * split summary that first paint, no-JS and reduced-motion show; it only
   * opens the first pass. Every later pass runs F1 → F7 and wraps back to F1.
   */
  const CUE = {
    f1: 600,
    type: 1000,
    sent: 2150,
    f2: 2400,
    pick: 3600,
    answered: 3950,
    f3: 4400,
    approve: 6000,
    approved: 6300,
    f4: 6800,
    hub: 7100, // the hub opens under two empty seats
    mark: 7900, // Mos picks the two this job needs
    mark2: 8150,
    call: 8700, // and they move up into the team
    call2: 9000,
    f5: 9900, // the hub folds away, the team works
    copyDone: 10700,
    imageRun: 10900,
    ask: 11700, // the later-called member asks the earlier one
    reply: 12700,
    imageDone: 13600,
    f6: 14300,
    choose: 15900,
    f7: 16700,
    back: 17900, // job done: both go back to the hub
    back2: 18150,
    fade: 20000,
    end: 20400,
  };
  const FRAMES = [0, CUE.f1, CUE.f2, CUE.f3, CUE.f4, CUE.f5, CUE.f6, CUE.f7];
  const POSES = ['greeting', 'curious', 'working', 'happy'] as const;
  const POSE_OF_FRAME = [0, 0, 1, 1, 2, 2, 3, 3];

  // Phones fold the task summary, so F3 runs 600ms shorter and every cue from
  // the approval on comes that much earlier.
  const compact = new MediaQuery('max-width: 640px');
  const at = (ms: number) => (compact.current && ms >= CUE.approve ? ms - 600 : ms);

  let t = $state(0);
  const past = (ms: number) => t >= at(ms);
  const frame = $derived(FRAMES.findLastIndex((ms) => t >= at(ms)));
  const pose = $derived(POSES[POSE_OF_FRAME[frame]]);

  // Line icons, one path each.
  const G = {
    copy: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    image:
      'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm12 8-3.1-3.1a2 2 0 0 0-2.8 0L6 21',
    slides: 'M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm7 12v4m-4 0h8',
    novel: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zm0 13a3 3 0 0 1 3-3h11',
    pricing: 'M11 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm9 15-4.3-4.3',
    reels: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm5 4 5 3-5 3z',
    newsletter:
      'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 7l9 6 9-6',
    product: 'M3 12V4h8l9 9-8 8zm4.5-6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
    seo: 'M5 9h14M5 15h14M10 4 8 20m8-16-2 16',
    press: 'M4 10v4h3l7 4V6l-7 4zm14-1a4 4 0 0 1 0 6',
    doc: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zm0 0v5h5M9 13h6m-6 4h4',
    folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    brief: 'M5 7h14M5 12h14M5 17h9',
    tick: 'M20 6 9 17l-5-5',
    short: 'M12 4 3 20h18z',
  };

  const decisions = $derived([
    { label: m.demo_me_1(), note: m.demo_me_1_note() },
    { label: m.demo_me_2(), note: m.demo_me_2_note() },
    { label: m.demo_me_3(), note: m.demo_me_3_note() },
  ]);

  // The hub: job titles (examples — in the app, creators name them). The two
  // this job needs sit in the middle of the pool, not at its head, so calling
  // them in reads as picking.
  const hub = $derived([
    { id: 'slides', name: m.hub_job_1(), g: G.slides },
    { id: 'copy', name: m.demo_worker_copy(), g: G.copy },
    { id: 'novel', name: m.hub_job_2(), g: G.novel },
    { id: 'pricing', name: m.hub_job_3(), g: G.pricing },
    { id: 'image', name: m.demo_worker_image(), g: G.image },
    { id: 'reels', name: m.hub_job_4(), g: G.reels },
    { id: 'newsletter', name: m.hub_job_5(), g: G.newsletter },
    { id: 'product', name: m.hub_job_6(), g: G.product },
    { id: 'seo', name: m.hub_job_7(), g: G.seo },
    { id: 'press', name: m.hub_job_8(), g: G.press },
  ]);
  type Job = (typeof hub)[number];
  const MEMBER: Record<string, number> = { copy: 0, image: 1 };
  const members = $derived([
    { ...hub[1], output: m.demo_file_copy(), og: G.doc },
    { ...hub[4], output: m.demo_file_image(), og: G.image },
  ]);
  // The strip under F0 and F7 leads with the two seats the team left, so
  // they are always on screen to come back to.
  const strip = $derived([hub[1], hub[4], hub[0], hub[2], hub[3], ...hub.slice(5)]);

  const marked = $derived([past(CUE.mark), past(CUE.mark2)]);
  const called = $derived([past(CUE.call), past(CUE.call2)]);
  const home = $derived([past(CUE.back), past(CUE.back2)]);

  type Status = 'todo' | 'running' | 'done';
  const status = $derived<Status[]>([
    !past(CUE.f5) ? 'todo' : past(CUE.copyDone) ? 'done' : 'running',
    past(CUE.imageDone) ? 'done' : past(CUE.imageRun) ? 'running' : 'todo',
  ]);
  const doneCount = $derived(status.filter((s) => s === 'done').length);

  // F1: Mos opens with a question, then the request types straight into its
  // bubble at ~28ms a character, squeezed for longer locales so it always
  // lands before it is sent.
  const typing = $derived(t >= CUE.type && t < CUE.sent);
  const typed = $derived.by(() => {
    const text = m.demo_request();
    if (!typing) return text;
    const perChar = Math.min(28, (CUE.sent - CUE.type - 150) / text.length);
    return text.slice(0, Math.ceil((t - CUE.type) / perChar));
  });

  // The feed sits in the middle of the stage while it is short; once it
  // outgrows the stage the newest item holds the bottom and the oldest slide
  // up under a fade.
  let feedList: HTMLElement;
  let overflowing = $state(false);

  /* ---- Playback ----
     The loop runs only while every condition holds: hydrated (effects never
     run on the server), motion allowed, on screen, tab visible, not paused by
     the button, and not held by hover/focus. Pressing play beats a hold until
     the pointer and focus have both left (the APG carousel rule). */
  let board: HTMLElement;
  let reducedClass = $state(false);
  const reduced = $derived(prefersReducedMotion.current || reducedClass);
  let inView = $state(false);
  let tabHidden = $state(false);
  let hover = $state(false);
  let focus = $state(false);
  let forced = $state(false);
  let paused = $state(false);
  const playing = $derived(
    !reduced && !paused && inView && !tabHidden && (forced || !(hover || focus)),
  );

  $effect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      // Clamp so a throttled frame cannot skip a whole beat.
      const next = t + Math.min(now - last, 100);
      last = now;
      t = next >= at(CUE.end) ? CUE.f1 : next;
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  });

  onMount(() => {
    reducedClass = document.documentElement.classList.contains('reduced-motion');
    tabHidden = document.hidden;
    const io = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
    io.observe(board);
    const ro = new ResizeObserver(() => (overflowing = feedList.offsetTop < 0));
    ro.observe(feedList);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  });

  function release() {
    if (!hover && !focus) forced = false;
  }

  function toggle() {
    paused = !paused;
    if (paused) track('demo_pause');
    else forced = true;
  }

  // Reduced motion: no loop; the visitor walks F1 → F7 (then back to F0), and
  // each step lands on that frame's settled state.
  let step = $state(0);
  function stepNext() {
    step = (step + 1) % FRAMES.length;
    t = step === 0 ? 0 : step === 7 ? at(CUE.fade) - 1 : at(FRAMES[step + 1]) - 1;
    if (step) track('demo_step', { step });
  }

  const enter = $derived({ duration: reduced ? 0 : 360, easing: cubicOut });

  /*
   * A worker moving between the hub and the team: Svelte's crossfade without
   * the scale. The chip that leaves and the chip that arrives travel the same
   * path while one fades into the other, so the title never squashes when the
   * two spots wrap it differently. Paired by key; an unpaired chip just
   * appears or goes.
   */
  const HOP = 640;
  const leaving = new Map<string, Element>();
  const arriving = new Map<string, Element>();
  function hop(
    node: Element,
    { key }: { key: string },
    { direction }: { direction: 'in' | 'out' | 'both' },
  ) {
    const [mine, theirs] = direction === 'in' ? [arriving, leaving] : [leaving, arriving];
    mine.set(key, node);
    return (): TransitionConfig => {
      const other = theirs.get(key);
      if (!other || reduced) {
        mine.delete(key);
        return { duration: 0 };
      }
      theirs.delete(key);
      const a = other.getBoundingClientRect();
      const b = node.getBoundingClientRect();
      const [dx, dy] = [a.left - b.left, a.top - b.top];
      return {
        duration: HOP,
        easing: cubicInOut,
        css: (k, u) => `z-index: 3; opacity: ${k}; transform: translate(${u * dx}px, ${u * dy}px)`,
      };
    };
  }
</script>

<svelte:document onvisibilitychange={() => (tabHidden = document.hidden)} />

{#snippet glyph(d: string, cls = '')}
  <svg class="i {cls}" viewBox="0 0 24 24"><path {d} /></svg>
{/snippet}

{#snippet file(w: (typeof members)[number])}
  <span class="file">{@render glyph(w.og)}{w.output}</span>
{/snippet}

<!-- A worker is a chip with its job title, wherever it sits. A seat keeps the
     chip's size when the worker is away (a dashed outline in the hub), so
     nothing around it moves when it leaves or comes back. -->
{#snippet seat(w: Job, here: boolean, key: string, mark = false, away = '')}
  <span class="seat">
    <span class="chip ghost">{@render glyph(w.g)}<span>{w.name}</span></span>
    {#if away && !here}<span class="away">{away}</span>{/if}
    {#if here}
      <span class="chip" class:marked={mark} in:hop={{ key }} out:hop={{ key }}>
        {@render glyph(w.g)}<span>{w.name}</span>
      </span>
    {/if}
  </span>
{/snippet}

{#snippet group(label: string)}
  <p class="group">{label}<span class="tag">{m.demo_example()}</span></p>
{/snippet}

<!-- The hub at rest, under F0 and F7: one faint row. In F0 the two seats are
     empty — their workers are out on this job. -->
{#snippet hubStrip(back: boolean[])}
  <div class="strip">
    {@render group(m.hub_label())}
    <ul class="row">
      {#each strip as h (h.id)}
        <li>
          {@render seat(
            h,
            !(h.id in MEMBER) || back[MEMBER[h.id]],
            `e-${h.id}`,
            false,
            m.demo_away(),
          )}
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

<div
  class="board"
  role="group"
  data-frame={frame}
  bind:this={board}
  onpointerenter={() => (hover = true)}
  onpointerleave={() => {
    hover = false;
    release();
  }}
  onfocusin={() => (focus = true)}
  onfocusout={(e) => {
    if (board.contains(e.relatedTarget as Node | null)) return;
    focus = false;
    release();
  }}
>
  <!-- The title bar says up front that this is an example, not the app. The
       controls share its row but sit outside the picture below, so they stay
       real buttons. -->
  <div class="bar">
    <p class="head" aria-hidden="true">
      {@render glyph(G.folder)}
      <span class="task">{m.demo_task()}</span>
      <span class="tag">{m.demo_example()}</span>
    </p>
    <button
      type="button"
      class="ctl pause"
      aria-label={m.demo_pause()}
      title={m.demo_pause()}
      aria-pressed={paused}
      onclick={toggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {#if paused}
          <path class="fill" d="M8 5.5v13l10-6.5z" />
        {:else}
          <path d="M9 6v12M15 6v12" />
        {/if}
      </svg>
    </button>
    <button type="button" class="ctl step" onclick={stepNext}>
      <span class="step-label">{m.demo_step()}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
      {#if step}<span class="count">{step}/7</span>{/if}
    </button>
  </div>

  <!-- One summary for assistive tech; the board itself is a picture of a
       product screen, and reading its every chip aloud would be noise. -->
  <div class="screen" role="img" aria-label={m.demo_label()}>
    <div class="avatar" aria-hidden="true">
      {#each POSES as p (p)}
        <img
          class:on={p === pose}
          src="/characters/mos-{p}.webp"
          alt=""
          width="88"
          height="88"
          loading={p === 'greeting' ? 'eager' : 'lazy'}
          decoding="async"
        />
      {/each}
    </div>

    <div class="stage" aria-hidden="true">
      <!-- F0 · the split, as a summary -->
      <div class="layer summary" class:on={frame === 0}>
        <p class="bubble me">{m.demo_request()}</p>
        <div class="lanes">
          <div class="lane me">
            <span class="turn me">{m.demo_turn_me()}</span>
            <ul class="decisions">
              {#each decisions as d (d.label)}
                <li>
                  {@render glyph(G.tick, 'tick')}
                  <span><b>{d.label}</b><small>{d.note}</small></span>
                </li>
              {/each}
            </ul>
          </div>
          <div class="lane mos">
            <span class="turn mos">{m.demo_turn_mos()}</span>
            {@render group(m.hub_team())}
            <ul class="members">
              {#each members as w (w.id)}
                <li>
                  <span class="chip">
                    {@render glyph(w.g)}<span>{w.name}</span>{@render glyph(
                      G.tick,
                      'tick done-tick',
                    )}
                  </span>
                  <span class="meta">
                    <span class="status done">{m.demo_status_done()}</span>{@render file(w)}
                  </span>
                </li>
              {/each}
            </ul>
            <p class="outputs">
              {#each members as w (w.id)}{@render file(w)}{/each}
            </p>
          </div>
        </div>
        {@render hubStrip([false, false])}
      </div>

      <!-- F1–F6 · the conversation -->
      <div class="layer feed" class:on={frame >= 1 && frame <= 6} class:overflowing>
        <div class="feed-list" bind:this={feedList}>
          {#if past(CUE.f1)}
            <div class="item" in:slide={enter}>
              <p class="bubble mos">{m.demo_opener()}</p>
            </div>
          {/if}

          {#if past(CUE.type)}
            <div class="item" in:slide={enter}>
              <p class="bubble me">
                {typed}{#if typing}<i class="caret"></i>{/if}
              </p>
            </div>
          {/if}

          {#if past(CUE.f2)}
            <div class="item" in:slide={enter}>
              <div class="card" class:active={frame === 2}>
                <span class="turn me float" class:on={frame === 2}>{m.demo_turn_me()}</span>
                <p class="card-head">
                  <span class="glyph sm">?</span>
                  <b>{m.demo_ask_label()}</b>
                  <span class="tag">{m.demo_ask_no()}</span>
                  <span class="note" class:later={!past(CUE.answered)}>{m.demo_answered()}</span>
                </p>
                <div class="well">
                  <p class="ask">{m.demo_ask()}</p>
                  <div class="reveal" class:on={!past(CUE.answered)}>
                    <div>
                      <div class="choices">
                        <span class="choice" class:picked={past(CUE.pick)}>{m.demo_deadline()}</span
                        >
                        <span class="choice">{m.demo_quality()}</span>
                      </div>
                    </div>
                  </div>
                  <div class="reveal" class:on={past(CUE.answered)}>
                    <div><p class="answer">{m.demo_deadline()}</p></div>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          {#if past(CUE.f3)}
            <div class="item" in:slide={enter}>
              <div class="card" class:active={frame === 3}>
                <span class="turn me float" class:on={frame === 3}>{m.demo_turn_me()}</span>
                <p class="card-head">
                  <span class="glyph sm">{@render glyph(G.brief)}</span>
                  <b>{m.demo_brief_title()}</b>
                  <span class="note" class:ok={past(CUE.approved)}>
                    {past(CUE.approved) ? m.demo_brief_approved() : m.demo_brief_waiting()}
                  </span>
                </p>
                <dl class="well fields">
                  <dt>{m.demo_brief_goal_label()}</dt>
                  <dd>{m.demo_brief_goal()}</dd>
                  <dt class="extra">{m.demo_brief_todo_label()}</dt>
                  <dd class="extra">{m.demo_brief_todo()}</dd>
                  <dt>{m.demo_brief_criteria_label()}</dt>
                  <dd>
                    <ul>
                      <li>{m.demo_criterion_1()}</li>
                      <li>{m.demo_criterion_2()}</li>
                      <li>{m.demo_criterion_3()}</li>
                    </ul>
                  </dd>
                  <dt class="extra">{m.demo_brief_later_label()}</dt>
                  <dd class="extra">{m.demo_brief_later()}</dd>
                </dl>
                <p class="more">{m.demo_brief_more()}</p>
                <span class="option" class:picked={past(CUE.approve)}>
                  <i class="radio"></i>{m.demo_brief_start()}
                </span>
              </div>
            </div>
          {/if}

          {#if past(CUE.f4)}
            <div class="item" in:slide={enter}>
              <p class="bubble mos">{m.demo_assign()}</p>
            </div>
          {/if}

          <!-- F4–F5 · this job's team over the hub. Mos marks two workers in
               the hub, they move up into the team's seats, the hub folds away,
               and the team works; the later one asks the earlier one. -->
          {#if past(CUE.hub)}
            <div class="item" in:slide={enter}>
              <div class="crew" class:active={frame === 4 || frame === 5}>
                <span class="turn mos float" class:on={frame === 4 || frame === 5}
                  >{m.demo_turn_mos()}</span
                >
                <div class="crew-head">
                  {@render group(m.hub_team())}
                  <span class="progress">
                    <span class="bar-track"><i style:width="{doneCount * 50}%"></i></span>
                    <b>{doneCount}/2</b>
                  </span>
                </div>
                <ol class="team">
                  {#each members as w, i (w.id)}
                    {#if i === 1}
                      <li class="reveal handoff" class:on={past(CUE.ask)}>
                        <div>
                          <div class="thread">
                            <p class="say">
                              {@render glyph(members[1].g)}<span>{m.demo_team_ask()}</span>
                            </p>
                            <p class="say reply" class:on={past(CUE.reply)}>
                              {@render glyph(members[0].g)}<span>{m.demo_team_reply()}</span>
                            </p>
                          </div>
                        </div>
                      </li>
                    {/if}
                    <li class="member" class:on={called[i]}>
                      <div class="m-head">
                        {@render seat(w, called[i], `f-${w.id}`)}
                        <span class="status {status[i]}" class:later={!called[i]}>
                          {status[i] === 'done'
                            ? m.demo_status_done()
                            : status[i] === 'running'
                              ? m.demo_status_running()
                              : m.demo_status_todo()}
                        </span>
                      </div>
                      <div class="reveal" class:on={status[i] === 'done'}>
                        <div>
                          <div class="preview">
                            <p class="preview-head">
                              {@render file(w)}<span class="eg">{m.demo_example()}</span>
                            </p>
                            {#if i === 0}
                              <p class="snippet">{m.demo_preview_copy()}</p>
                            {:else}
                              <span class="thumbs">
                                {#each [1, 2, 3, 4, 5] as n (n)}<i>{@render glyph(G.image)}</i
                                  >{/each}
                              </span>
                            {/if}
                          </div>
                        </div>
                      </div>
                    </li>
                  {/each}
                </ol>
                <div class="reveal" class:on={!past(CUE.f5)}>
                  <div>
                    <div class="hub">
                      {@render group(m.hub_label())}
                      <ul class="pool">
                        {#each hub as h (h.id)}
                          {@const i = MEMBER[h.id]}
                          <li>
                            {@render seat(
                              h,
                              i === undefined || !called[i],
                              `f-${h.id}`,
                              i !== undefined && marked[i],
                            )}
                          </li>
                        {/each}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          {#if past(CUE.f6)}
            <div class="item" in:slide={enter}>
              <div class="card" class:active={frame === 6}>
                <span class="turn me float" class:on={frame === 6}>{m.demo_turn_me()}</span>
                <p class="card-head">
                  <span class="glyph sm ok">{@render glyph(G.tick, 'tick')}</span>
                  <b>{m.demo_report()}</b>
                </p>
                <ul class="results">
                  <li>{@render glyph(G.tick, 'tick')}{m.demo_criterion_1()}</li>
                  <li>{@render glyph(G.tick, 'tick')}{m.demo_criterion_2()}</li>
                  <li class="short">{@render glyph(G.short)}{m.demo_report_short()}</li>
                </ul>
                <div class="choices">
                  <span class="choice">{m.demo_use()}</span>
                  <span class="choice" class:picked={past(CUE.choose)}>{m.demo_more()}</span>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- F7 · who did what; the team goes back to the hub, the folder stays -->
      <div class="layer end" class:on={frame === 7 && !past(CUE.fade)}>
        <div class="lanes">
          <div class="lane me">
            <span class="turn me">{m.demo_end_me()}</span>
            <ul class="decisions">
              {#each decisions as d (d.label)}
                <li>
                  {@render glyph(G.tick, 'tick')}
                  <span><b>{d.label}</b><small>{d.note}</small></span>
                </li>
              {/each}
            </ul>
          </div>
          <div class="lane mos">
            <span class="turn mos">{m.demo_end_team()}</span>
            <ul class="members">
              {#each members as w, i (w.id)}
                <li>{@render seat(w, !home[i], `e-${w.id}`)}</li>
              {/each}
            </ul>
            <p class="returned" class:on={home[1]}>{m.demo_returned()}</p>
          </div>
        </div>
        <div class="result">
          <p class="root">{@render glyph(G.folder)}<b>{m.demo_task()}</b></p>
          <span class="note">{m.demo_folder_note()}</span>
          <span class="files">
            {#each members as w (w.id)}{@render file(w)}{/each}
          </span>
        </div>
        {@render hubStrip(home)}
      </div>
    </div>
  </div>
</div>

<style>
  /* No set height: the stage below sizes itself (the loop still never
     pushes the page around — see .stage). */
  .board {
    position: relative;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-m);
    background: var(--background-card);
    box-shadow:
      0 1px 2px rgba(29, 32, 38, 0.04),
      0 24px 48px -20px rgba(15, 63, 128, 0.22);
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-label);
    color: var(--label-normal);
  }

  .screen {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  /* ---- Mos: sits on the card's top-left edge, pose changes per frame ---- */
  .avatar {
    position: absolute;
    top: -42px;
    left: 14px;
    z-index: 4;
    width: 88px;
    height: 88px;
    filter: drop-shadow(0 8px 10px rgba(15, 111, 218, 0.16));
  }
  .avatar img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center bottom;
    opacity: 0;
    transform: scale(0.94) translateY(3px);
    transition:
      opacity 400ms var(--ease-out),
      transform 500ms var(--ease-out);
  }
  .avatar img.on {
    opacity: 1;
    transform: none;
  }

  /* Title bar: Mos's seat on the left, the demo's one control on the right. */
  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    flex: none;
    height: 56px;
    padding: 0 var(--space-12) 0 112px;
    border-bottom: 1px solid var(--line-normal-alternative);
  }
  /* width: 0 keeps the title out of the board's min-content width, which
     would otherwise widen the hero's auto grid track on a narrow phone; it
     truncates instead. */
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    flex: 1;
    width: 0;
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .head .i {
    color: var(--primary-normal);
  }
  .task {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* "Example" is the first thing the bar says about the picture below, so
     it is a filled pill rather than a hairline one — still small. */
  .head .tag {
    flex: none;
    padding: 2px 9px;
    border: 0;
    background: var(--background-tint);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
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
  .tick {
    color: var(--primary-normal);
    stroke-width: 2.6;
  }

  /* ---- Stage: three stacked layers that crossfade ----
     F0 and F7 share one grid cell in the flow, so the stage is exactly as tall
     as the taller of the two in this locale at this width — no empty band to
     pad a fixed box with. The feed is laid over that cell and never adds
     height, so the loop cannot move the page. */
  .stage {
    position: relative;
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .layer {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: var(--space-16);
    overflow: hidden;
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 250ms var(--ease-out),
      visibility 0s linear 250ms;
  }
  /* Out first, then in: two half-visible screens on top of each other read
     as mush. */
  .layer.on {
    opacity: 1;
    visibility: visible;
    transition: opacity 350ms var(--ease-out) 200ms;
  }
  .summary,
  .end {
    position: relative;
    inset: auto;
    grid-area: 1 / 1;
    gap: var(--space-12);
  }
  /* The list fills the stage from the top while it is short; once it is
     taller, flex-end pins its newest item to the bottom and the overflow runs
     out of the top, under the fade. */
  .feed {
    justify-content: flex-end;
    padding-top: 0;
  }
  .feed.overflowing {
    mask-image: linear-gradient(to bottom, transparent, #000 56px);
  }
  .feed-list {
    display: flex;
    flex: none;
    flex-direction: column;
    justify-content: center;
    min-height: 100%;
  }
  .item {
    flex: none;
    padding-top: var(--space-12);
  }
  .item > :global(*) {
    animation: rise 420ms var(--ease-out) both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }

  /* ---- Chat bubbles ---- */
  .bubble {
    max-width: 84%;
    padding: var(--space-10) var(--space-14);
    line-height: var(--line-height-body-normal);
  }
  .bubble.me {
    align-self: flex-end;
    margin-left: auto;
    width: fit-content;
    min-height: calc(1.5em + 20px);
    border-radius: 14px 14px 4px 14px;
    background: var(--primary-fill);
    color: var(--static-white);
  }
  .caret {
    display: inline-block;
    width: 1.5px;
    height: 1.1em;
    margin-left: 1px;
    vertical-align: -0.15em;
    background: currentColor;
    animation: blink 1s steps(1) infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
  .bubble.mos {
    width: fit-content;
    border-radius: 14px 14px 14px 4px;
    background: var(--background-sunken);
    color: var(--label-normal);
  }

  /* ---- Turn badges ---- */
  .turn {
    align-self: flex-start;
    flex: none;
    padding: 3px 9px;
    border-radius: var(--radius-full);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-bold);
    line-height: var(--line-height-label);
    white-space: nowrap;
  }
  .turn.me {
    background: var(--primary-fill);
    color: var(--static-white);
  }
  /* Outlined, so Mos's lane reads as the quieter half of the split. */
  .turn.mos {
    background: var(--background-card);
    box-shadow: inset 0 0 0 1px var(--line-normal-strong);
    color: var(--label-strong);
  }
  /* In the feed the badge rides the top edge of whichever card is up now. */
  .turn.float {
    position: absolute;
    top: -10px;
    left: 12px;
    z-index: 1;
    opacity: 0;
    transform: translateY(2px);
    transition:
      opacity 250ms var(--ease-out),
      transform 250ms var(--ease-out);
  }
  .turn.float.on {
    opacity: 1;
    transform: none;
  }

  /* ---- Lanes (F0 and F7) ----
     Whichever of F0 and F7 is shorter takes the shared cell's slack inside its
     lanes (flex: 1), so the request stays at the top of a phone's first screen
     and neither frame leaves a blank band. */
  .lanes {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-12);
  }
  .lane {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    padding: var(--space-14) var(--space-12) var(--space-12);
    border-radius: var(--radius-s);
  }
  .lane .turn {
    padding: 4px 11px;
    font-size: var(--font-size-caption-1);
  }
  .lane.me {
    background: var(--background-tint);
  }
  .lane.mos {
    background: var(--background-sunken);
  }
  .decisions,
  .members {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }
  .decisions li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-8);
    padding: var(--space-10) var(--space-12);
    border: 1px solid rgba(15, 111, 218, 0.14);
    border-radius: var(--radius-xs);
    background: var(--background-card);
  }
  .decisions .tick {
    margin-top: 2px;
  }
  .decisions span {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .decisions b {
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .decisions small {
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }

  /* "이번 작업팀 · 예시" / "작업자 허브 · 예시": the name of a group of
     workers, with the example tag that every such group carries. */
  .group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px var(--space-6);
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-bold);
    color: var(--label-strong);
  }
  .tag {
    padding: 1px 7px;
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-full);
    background: var(--background-card);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-medium);
    color: var(--label-alternative);
    white-space: nowrap;
  }

  /* ---- A worker ---- */
  .chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-6);
    max-width: 100%;
    padding: 5px 10px 5px 8px;
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-xs);
    background: var(--background-card);
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    line-height: 1.35;
    color: var(--label-strong);
    transition:
      border-color 300ms,
      background-color 300ms,
      box-shadow 300ms,
      color 300ms;
  }
  .chip .i {
    width: 14px;
    height: 14px;
    color: var(--label-alternative);
  }
  .seat {
    display: inline-grid;
    grid-template-columns: minmax(0, auto);
    max-width: 100%;
    vertical-align: top;
  }
  .seat > * {
    grid-area: 1 / 1;
  }
  /* The ghost holds the seat at the worker's size; with the worker away it
     shows as a dashed outline. */
  .ghost {
    border-style: dashed;
    border-color: var(--line-normal-strong);
    background: transparent;
  }
  .ghost > :global(*) {
    visibility: hidden;
  }
  .member.on .ghost {
    border-color: transparent;
  }
  /* In the hub at rest, an empty seat says where its worker is. */
  .away {
    align-self: center;
    justify-self: center;
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-medium);
    color: var(--label-assistive);
    white-space: nowrap;
  }
  .chip.marked {
    border-color: var(--primary-normal);
    background: var(--background-tint);
    box-shadow: 0 0 0 3px rgba(15, 111, 218, 0.14);
    color: var(--primary-strong);
  }
  .chip.marked .i {
    color: var(--primary-normal);
  }

  /* F0: each member with its status and what it left in the folder. */
  .members li {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-6);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4) var(--space-6);
    padding-left: 2px;
  }
  .done-tick,
  .outputs {
    display: none;
  }

  /* F7: once the workers have gone back, their seats stay as outlines and
     a line says where they went (its room is kept from the start). */
  .returned {
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-medium);
    color: var(--label-alternative);
    opacity: 0;
    transform: translateY(4px);
    transition:
      opacity 400ms var(--ease-out) 300ms,
      transform 400ms var(--ease-out) 300ms;
  }
  .returned.on {
    opacity: 1;
    transform: none;
  }

  /* F7: the folder, which stays when the team has gone. */
  .result {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-6) var(--space-10);
    padding: var(--space-10) var(--space-12);
    border: 1px solid var(--line-normal-alternative);
    border-radius: var(--radius-s);
    font-size: var(--font-size-caption-1);
  }
  .root {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    min-width: 0;
  }
  .root .i {
    width: 15px;
    height: 15px;
    color: var(--primary-normal);
  }
  .root b {
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .result .note {
    margin: 0;
    font-weight: var(--weight-medium);
    color: var(--label-alternative);
  }
  .files {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6);
    margin-left: auto;
  }

  /* ---- The hub at rest (F0, F7): a faint single row that runs off the
     right edge. clip-path, not overflow, cuts it there: a worker coming back
     flies in from the lanes above, which overflow would hide. ---- */
  .strip {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding-top: var(--space-10);
    border-top: 1px dashed var(--line-normal-normal);
  }
  .strip .group {
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    color: var(--label-alternative);
  }
  .row {
    position: relative;
    display: flex;
    gap: var(--space-6);
    clip-path: inset(-100vh 0 0 0);
  }
  .row::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 48px;
    background: linear-gradient(to right, transparent, var(--background-card));
    pointer-events: none;
  }
  .row li {
    display: flex;
    flex: none;
    max-width: 46%;
  }
  .strip .chip {
    padding: 3px 9px 3px 7px;
    border-color: var(--line-normal-alternative);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-medium);
    color: var(--label-alternative);
  }
  .strip .ghost {
    border-color: var(--line-normal-strong);
  }
  .strip .chip > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ---- Status ---- */
  .status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex: none;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    white-space: nowrap;
    transition:
      background-color 300ms,
      color 300ms,
      opacity 300ms;
  }
  .status.done {
    background: rgba(79, 161, 54, 0.12);
    color: var(--status-positive-text);
  }
  .status.running {
    background: var(--background-tint);
    color: var(--primary-strong);
  }
  .status.running::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse 1.1s var(--ease-in-out) infinite;
  }
  .status.todo {
    box-shadow: inset 0 0 0 1px var(--line-normal-normal);
    color: var(--label-assistive);
  }
  .status.later {
    opacity: 0;
  }
  @keyframes pulse {
    50% {
      opacity: 0.25;
    }
  }

  .file {
    display: inline-flex;
    align-items: center;
    gap: var(--space-4);
    padding: 3px 8px;
    border-radius: 6px;
    background: var(--background-page);
    font-size: var(--font-size-caption-2);
    font-variant-numeric: tabular-nums;
    color: var(--label-alternative);
    white-space: nowrap;
  }
  .lane .file {
    background: var(--background-card);
  }
  .file .i {
    width: 12px;
    height: 12px;
  }

  /* ---- F4–F5: this job's team, over the hub ---- */
  .crew {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    padding: var(--space-14) var(--space-12) var(--space-12);
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: var(--background-sunken);
    transition: border-color 300ms;
  }
  .crew.active {
    border-color: var(--line-normal-normal);
  }
  .crew-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-10);
  }
  .progress {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    width: 30%;
    font-size: var(--font-size-caption-1);
  }
  .bar-track {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: var(--line-normal-normal);
    overflow: hidden;
  }
  .bar-track i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--primary-normal);
    transition: width 500ms var(--ease-out);
  }
  .progress b {
    font-variant-numeric: tabular-nums;
    color: var(--label-strong);
  }

  .team {
    display: flex;
    flex-direction: column;
  }
  /* A member's card draws itself around the chip once it has arrived. */
  .member {
    margin-top: var(--space-6);
    padding: var(--space-8);
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    transition:
      background-color 400ms var(--ease-out),
      border-color 400ms var(--ease-out),
      box-shadow 400ms var(--ease-out);
  }
  .member:first-child {
    margin-top: 0;
  }
  .member.on {
    border-color: var(--line-normal-alternative);
    background: var(--background-card);
    box-shadow: var(--shadow-e1);
    transition-delay: 450ms;
  }
  .m-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-8);
  }
  .m-head .status {
    margin-top: 4px;
    transition:
      background-color 300ms,
      color 300ms,
      opacity 300ms var(--ease-out) 500ms;
  }
  .member .chip:not(.ghost) {
    border-color: transparent;
    background: transparent;
    transition: none;
  }
  .member .reveal > div > * {
    margin-top: var(--space-8);
  }

  /* The handoff: a hairline from the later member up to the earlier one,
     with what it asked and what came back. */
  .thread {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-6);
    padding: var(--space-10) 0 var(--space-8) 34px;
  }
  .thread::before,
  .thread::after {
    content: '';
    position: absolute;
    left: 21px;
  }
  .thread::before {
    top: 2px;
    bottom: 0;
    width: 1.5px;
    margin-left: -0.75px;
    background: var(--primary-light);
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform 500ms var(--ease-out);
  }
  .thread::after {
    top: 1px;
    width: 7px;
    height: 7px;
    margin-left: -3.5px;
    border-top: 1.5px solid var(--primary-light);
    border-left: 1.5px solid var(--primary-light);
    transform: rotate(45deg);
    opacity: 0;
    transition: opacity 200ms 400ms;
  }
  .handoff.on .thread::before {
    transform: none;
  }
  .handoff.on .thread::after {
    opacity: 1;
  }
  .say {
    display: inline-flex;
    align-items: flex-start;
    gap: var(--space-6);
    max-width: 100%;
    padding: 6px 11px 6px 8px;
    border: 1px solid var(--line-normal-normal);
    border-radius: 10px 10px 10px 3px;
    background: var(--background-card);
    font-size: var(--font-size-caption-1);
    line-height: var(--line-height-body-normal);
    color: var(--label-normal);
    opacity: 0;
    transform: translateY(4px);
    transition:
      opacity 350ms var(--ease-out) 350ms,
      transform 350ms var(--ease-out) 350ms;
  }
  .say .i {
    width: 14px;
    height: 14px;
    margin-top: 2px;
    color: var(--label-alternative);
  }
  .handoff.on .say {
    opacity: 1;
    transform: none;
  }
  .handoff.on .say.reply:not(.on) {
    opacity: 0;
    transform: translateY(4px);
  }
  .say.reply {
    border-color: transparent;
    background: var(--background-tint);
    font-weight: var(--weight-semibold);
    color: var(--primary-strong);
    transition-delay: 0ms;
  }
  .say.reply .i {
    color: var(--primary-normal);
  }

  /* The hub, open: every worker is a chip; the two this job needs light up
     before they leave. */
  .hub {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    margin-top: var(--space-4);
    padding-top: var(--space-12);
    border-top: 1px dashed var(--line-normal-strong);
  }
  .pool {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6);
  }
  .pool li {
    display: flex;
  }
  .pool .chip {
    font-weight: var(--weight-medium);
    color: var(--label-normal);
    white-space: nowrap;
  }

  /* ---- What a worker made: small, calm, and marked as an example ---- */
  .preview {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-8);
    border-radius: var(--radius-xs);
    background: var(--background-page);
  }
  .preview-head {
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }
  .preview .file {
    padding: 0;
    background: none;
    font-weight: var(--weight-semibold);
  }
  .eg {
    margin-left: auto;
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }
  .snippet {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    padding-left: var(--space-10);
    border-left: 2px solid var(--primary-bright);
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-medium);
    line-height: var(--line-height-body-normal);
    color: var(--label-strong);
  }
  /* Five square slides, for a carousel. */
  .thumbs {
    display: flex;
    gap: var(--space-6);
  }
  .thumbs i {
    display: grid;
    place-items: center;
    width: 38px;
    aspect-ratio: 1;
    border-radius: 6px;
    background: var(--gradient-brand);
    color: rgba(255, 255, 255, 0.9);
  }
  .thumbs i:nth-child(2n) {
    background: linear-gradient(160deg, var(--color-blue-70), var(--color-blue-80));
  }
  .thumbs i:nth-child(3n) {
    background: linear-gradient(110deg, var(--color-blue-80), var(--color-blue-55));
  }
  .thumbs .i {
    width: 14px;
    height: 14px;
  }

  /* Height that opens and closes without a jump. */
  .reveal {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 350ms var(--ease-out),
      opacity 300ms var(--ease-out);
  }
  .reveal.on {
    grid-template-rows: 1fr;
    opacity: 1;
  }
  .reveal > div {
    min-height: 0;
    overflow: hidden;
  }

  /* ---- Feed cards ---- */
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    padding: var(--space-12) var(--space-14) var(--space-14);
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-s);
    background: var(--background-card);
    transition:
      border-color 300ms,
      box-shadow 300ms;
  }
  .card.active {
    border-color: rgba(15, 111, 218, 0.5);
    box-shadow: 0 0 0 3px rgba(15, 111, 218, 0.1);
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    font-size: var(--font-size-caption-1);
    color: var(--label-strong);
  }
  .card-head b {
    font-weight: var(--weight-semibold);
  }
  .glyph {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: var(--radius-xs);
    background: var(--background-sunken);
    color: var(--label-alternative);
  }
  .glyph.sm {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--background-tint);
    color: var(--primary-normal);
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-bold);
  }
  .glyph.sm .i {
    width: 14px;
    height: 14px;
  }
  .glyph.ok {
    background: rgba(79, 161, 54, 0.12);
  }
  .glyph.ok .tick {
    color: var(--status-positive-text);
  }
  .note {
    margin-left: auto;
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
    white-space: nowrap;
    transition:
      opacity 250ms,
      color 250ms;
  }
  .note.ok {
    color: var(--status-positive-text);
    font-weight: var(--weight-semibold);
  }
  .note.later {
    opacity: 0;
  }

  .well {
    padding: var(--space-10) var(--space-12);
    border-radius: var(--radius-xs);
    background: var(--background-page);
  }
  .ask {
    font-size: var(--font-size-caption-1);
    color: var(--label-alternative);
  }
  .answer {
    padding-top: 4px;
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }

  .choices {
    display: flex;
    gap: var(--space-6);
    padding-top: var(--space-8);
  }
  .choice {
    padding: 6px 14px;
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-full);
    background: var(--background-card);
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-medium);
    color: var(--label-normal);
    transition:
      background-color 250ms,
      border-color 250ms,
      color 250ms;
  }
  .choice.picked {
    border-color: var(--primary-fill);
    background: var(--primary-fill);
    color: var(--static-white);
  }
  .card > .choices {
    padding-top: 0;
  }

  .fields {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 6px var(--space-14);
    margin: 0;
    font-size: var(--font-size-caption-1);
  }
  .fields dt {
    color: var(--label-assistive);
  }
  .fields dd {
    margin: 0;
    color: var(--label-strong);
  }
  .fields ul {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .fields li::before {
    content: '·';
    margin-right: 6px;
    color: var(--label-assistive);
  }
  .more {
    display: none;
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }

  .option {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding: 8px 12px;
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-xs);
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
    transition:
      background-color 250ms,
      border-color 250ms;
  }
  .radio {
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--line-normal-strong);
    border-radius: 50%;
    transition:
      border-width 200ms,
      border-color 200ms;
  }
  .option.picked {
    border-color: var(--primary-normal);
    background: var(--background-tint);
  }
  .option.picked .radio {
    border: 4px solid var(--primary-normal);
  }

  .results {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: var(--font-size-caption-1);
    color: var(--label-strong);
  }
  .results li {
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }
  .results .i {
    width: 14px;
    height: 14px;
  }
  .results .tick {
    color: var(--status-positive-text);
  }
  .results .short {
    color: var(--status-warning-text);
  }

  /* ---- The demo's own controls ---- */
  .ctl {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-6);
    flex: none;
    height: 44px;
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-full);
    background: var(--background-card);
    color: var(--label-normal);
    cursor: pointer;
    transition:
      background-color 150ms,
      border-color 150ms;
  }
  .ctl:hover {
    border-color: var(--line-normal-strong);
    background: var(--background-page);
  }
  /* The icon swaps on click; if the swapped node were the hit target,
     Chromium would never send the board its pointerleave and hover would
     stick. Keep the button itself under the pointer. */
  .ctl > :global(*) {
    pointer-events: none;
  }
  .pause {
    width: 44px;
  }
  .pause svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .pause .fill {
    fill: currentColor;
    stroke-width: 1.5;
  }
  .step {
    display: none;
    padding: 0 var(--space-16);
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    color: var(--primary-strong);
  }
  .step svg {
    display: none;
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .count {
    font-variant-numeric: tabular-nums;
    color: var(--label-assistive);
  }
  /* Reduced motion never runs the loop, so the stepper replaces pause. The
     class mirrors the media query before first paint (app.html). */
  :global(html.reduced-motion) .pause {
    display: none;
  }
  :global(html.reduced-motion) .step {
    display: inline-flex;
  }
  @media (prefers-reduced-motion: reduce) {
    .pause {
      display: none;
    }
    .step {
      display: inline-flex;
    }
  }

  /* Small phones: the title keeps its words, the folder glyph goes. */
  @media (max-width: 400px) {
    .head > .i {
      display: none;
    }
  }

  /* ---- Phone: the split has to fit the first screen under the form, so
     the board is short, Mos sits inside the bar, and the two lanes stay side
     by side with only what tells them apart: the request in one line, my
     three decisions, and this job's two workers, each marked done. ---- */
  @media (max-width: 640px) {
    .avatar {
      top: -12px;
      left: 8px;
      width: 52px;
      height: 52px;
    }
    .bar,
    .head {
      gap: var(--space-6);
    }
    .bar {
      height: 48px;
      padding: 0 var(--space-8) 0 66px;
    }
    .layer {
      padding: var(--space-12);
    }
    .feed {
      padding-top: 0;
    }
    /* The stepper keeps its words for assistive tech, and shows an arrow. */
    .step {
      min-width: 44px;
      padding: 0 var(--space-10);
    }
    .step-label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .step svg {
      display: block;
    }
    .summary,
    .end {
      gap: var(--space-6);
    }
    .summary .bubble {
      max-width: 100%;
      min-height: 0;
      padding: 7px 12px;
      overflow: hidden;
      font-size: var(--font-size-caption-1);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* Mos's half is a little wider: it holds the job titles. */
    .lanes {
      grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
      gap: var(--space-8);
    }
    .lane {
      gap: var(--space-6);
      padding: var(--space-8);
      font-size: var(--font-size-caption-1);
    }
    .lane .turn {
      padding: 3px 8px;
      font-size: var(--font-size-caption-2);
    }
    /* F7's lane names are longer than F0's badges; they may take two lines. */
    .end .lane .turn {
      white-space: normal;
      border-radius: 10px;
    }
    .decisions small,
    .fields .extra,
    .meta {
      display: none;
    }
    .outputs {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-4);
      margin-top: var(--space-2);
    }
    .outputs .file {
      white-space: normal;
    }
    .decisions {
      gap: 6px;
    }
    .decisions li {
      gap: 6px;
      padding: 0;
      border: 0;
      background: none;
      line-height: var(--line-height-label);
    }
    .lane .tick {
      width: 14px;
      height: 14px;
      margin-top: 2px;
    }
    .lane .group {
      font-size: var(--font-size-caption-2);
    }
    .members {
      gap: var(--space-6);
    }
    /* Half a phone is narrow: the job title wraps, the role glyph goes, and
       a tick inside the chip stands for "done". */
    .lane .chip,
    .pool .chip {
      padding: 3px 8px;
      font-size: var(--font-size-caption-2);
      line-height: 1.3;
    }
    /* Two rows of the hub at rest: the two empty seats, then two more. */
    .row {
      flex-wrap: wrap;
      height: 54px;
      row-gap: var(--space-6);
    }
    .lane .chip .i:not(.done-tick),
    .pool .chip .i,
    .strip .chip .i {
      display: none;
    }
    .lane .done-tick {
      display: block;
      align-self: flex-end;
      margin: 0 0 2px auto;
      color: var(--status-positive-text);
    }
    .returned {
      font-size: var(--font-size-caption-2);
    }
    .result {
      padding: var(--space-8) var(--space-10);
    }
    .files {
      margin-left: 0;
    }
    .crew {
      gap: var(--space-8);
      padding: var(--space-12) var(--space-8) var(--space-8);
    }
    .pool {
      gap: var(--space-4);
    }
    .hub {
      gap: var(--space-6);
      margin-top: 0;
      padding-top: var(--space-8);
    }
    /* The stage gets a little taller than F0 needs, so this job's team and
       the hub fit together in F4, and both members with their handoff in
       F5. The hub shows eight of its workers here. */
    .stage {
      min-height: 360px;
    }
    .pool li:nth-child(n + 9) {
      display: none;
    }
    .member {
      padding: var(--space-4) var(--space-6);
    }
    .preview {
      padding: 0;
      background: none;
    }
    .member .reveal > div > * {
      margin-top: var(--space-6);
    }
    .thread {
      padding: var(--space-6) 0 var(--space-4) 30px;
    }
    .thread::before,
    .thread::after {
      left: 19px;
    }
    .say {
      font-size: var(--font-size-caption-2);
    }
    .thumbs i {
      width: 32px;
    }
    .snippet {
      display: none;
    }
    .more {
      display: block;
      margin-top: -4px;
    }
  }
</style>
