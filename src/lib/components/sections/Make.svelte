<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal, scrub, animate, prefersReduced } from '$lib/anime/motion';
  import { spring } from 'animejs';
  import Mon from '$lib/components/world/Mon.svelte';

  /**
   * Studio, built from the wireframe's three decisions rather than from a
   * generic node editor.
   *
   * 1. Nothing that has no choice in it becomes a control. A Mon is handed work
   *    by Mos and never speaks to a person, so what goes in and what comes out
   *    is identical for every Mon — text in, text plus files out. The old
   *    version made those two into ports you could plug parts into, which
   *    invented a decision and then asked the visitor to make it. They are now
   *    dimmed, read-only rails: the dimming says "not yours to set".
   *
   * 2. One empty textarea is the hardest thing you can hand a non-expert, so
   *    the system prompt arrives as three named pieces — role, order, rules —
   *    each with a hint about what belongs in it. A fourth tab shows them
   *    joined, read-only, so the whole is visible without being editable in two
   *    places.
   *
   * 3. Tools are connectors, and the palette is grouped the way someone
   *    shopping for one would look: connect, create, find, run. Guards are
   *    gone; they were a category the product does not expose here.
   *
   * Tap to attach, not drag. Dragging is what the real editor does and it fails
   * on touch, fails on keyboard, and fails at any angle the demo did not
   * anticipate. What is being shown is that a specialist is assembled without
   * code, which a tap carries just as well.
   */
  type Slot = 'tool' | 'skill';
  interface Part {
    slot: Slot;
    name: string;
    desc: string;
  }

  const TABS = $derived([
    { key: 'link', label: m.make_t_link() },
    { key: 'gen', label: m.make_t_gen() },
    { key: 'search', label: m.make_t_search() },
    { key: 'run', label: m.make_t_run() },
    { key: 'skill', label: m.make_t_skill() },
  ]);
  let tab = $state('link');

  const CATALOG = $derived<Record<string, Part[]>>({
    link: [
      { slot: 'tool', name: m.make_c_notion(), desc: m.make_c_notion_d() },
      { slot: 'tool', name: m.make_c_github(), desc: m.make_c_github_d() },
    ],
    gen: [
      { slot: 'tool', name: m.make_c_img(), desc: m.make_c_img_d() },
      { slot: 'tool', name: m.make_c_video(), desc: m.make_c_video_d() },
      { slot: 'tool', name: m.make_c_audio(), desc: m.make_c_audio_d() },
    ],
    search: [
      { slot: 'tool', name: m.make_c_ppx(), desc: m.make_c_ppx_d() },
      { slot: 'tool', name: m.make_c_exa(), desc: m.make_c_exa_d() },
    ],
    run: [
      { slot: 'tool', name: m.make_c_browser(), desc: m.make_c_browser_d() },
      { slot: 'tool', name: m.make_c_code(), desc: m.make_c_code_d() },
    ],
    skill: [
      { slot: 'skill', name: m.make_c_s1(), desc: m.make_c_s1_d() },
      { slot: 'skill', name: m.make_c_s2(), desc: m.make_c_s2_d() },
    ],
  });

  /* A level, not a figure. What a run costs in Mana is set by a coefficient
     the strategy still lists as an open experiment, so printing "Mana 14"
     would be inventing a price. */
  const TIERS = $derived([
    { name: m.make_tier_1(), desc: m.make_tier_1_d(), level: m.make_tier_1_m() },
    { name: m.make_tier_2(), desc: m.make_tier_2_d(), level: m.make_tier_2_m() },
    { name: m.make_tier_3(), desc: m.make_tier_3_d(), level: m.make_tier_3_m() },
  ]);
  let tier = $state(1);

  /** The prompt pieces. `all` is derived, never stored — it is a view of the
   *  other three, so it cannot drift from them. */
  const PARTS = $derived([
    { key: 'role', label: m.make_pp_role(), hint: m.make_pp_role_h(), body: m.make_pp_role_b() },
    {
      key: 'steps',
      label: m.make_pp_steps(),
      hint: m.make_pp_steps_h(),
      body: m.make_pp_steps_b(),
    },
    { key: 'keep', label: m.make_pp_keep(), hint: m.make_pp_keep_h(), body: m.make_pp_keep_b() },
  ]);
  let promptTab = $state('steps');
  const joined = $derived(PARTS.map((p) => `${p.label}\n${p.body}`).join('\n\n'));
  const shown = $derived(
    promptTab === 'all'
      ? { label: m.make_pp_all(), hint: m.make_pp_all_h(), body: joined }
      : (PARTS.find((p) => p.key === promptTab) ?? PARTS[0]),
  );

  let attached = $state<Part[]>([]);
  let core = $state<HTMLElement | null>(null);

  const inSlot = (s: Slot) => attached.filter((a) => a.slot === s);
  const isOn = (p: Part) => attached.some((a) => a.name === p.name);

  function toggle(part: Part, el: HTMLElement) {
    if (isOn(part)) {
      attached = attached.filter((a) => a.name !== part.name);
      return;
    }
    // Three per slot, as in Studio — enough to show stacking without the row
    // wrapping into a wall.
    const same = inSlot(part.slot);
    const drop = same.length >= 3 ? same[0].name : null;
    attached = [...attached.filter((a) => a.name !== drop), part];

    if (prefersReduced()) return;
    animate(el, { scale: [1, 0.94, 1], duration: 420, ease: 'out(3)' });
    if (core)
      animate(core, {
        scale: [1, 1.02, 1],
        duration: 620,
        ease: spring({ stiffness: 190, damping: 16 }),
      });
  }
</script>

<section class="make section" aria-labelledby="make-title">
  <div class="container">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.make_eyebrow()}</span>
      <h2 class="title" id="make-title">{m.make_title()}</h2>
      <p class="lead">{m.make_lead()}</p>
    </div>

    <div class="grid">
      <div class="board hud" use:reveal={{ delay: 60, scale: true }} use:scrub={{ y: 14 }}>
        <!-- Read-only rails. Dimmed and tagged, with no control anywhere in
             them, because there is no decision here to make. -->
        <div class="rails">
          <div class="rail">
            <span class="rail-k">{m.make_in()}</span>
            <span class="rail-v">{m.make_in_v()}</span>
          </div>
          <span class="arrow" aria-hidden="true">→</span>
          <div class="core" bind:this={core}>
            <Mon tone="research" size={40} active={attached.length > 0} />
            <div class="core-meta">
              <span class="core-t">{m.make_core()}</span>
              <span class="core-s">{TIERS[tier].name}</span>
            </div>
          </div>
          <span class="arrow" aria-hidden="true">→</span>
          <div class="rail">
            <span class="rail-k">{m.make_out()}</span>
            <span class="rail-v">{m.make_out_v()}</span>
          </div>
        </div>
        <p class="rail-note">{m.make_io_note()}</p>

        <!-- The two slots that do take a decision. -->
        <div class="slots">
          {#each [{ s: 'tool' as Slot, label: m.make_slot_tool() }, { s: 'skill' as Slot, label: m.make_slot_skill() }] as row (row.s)}
            <div class="slot" class:filled={inSlot(row.s).length > 0}>
              <span class="slot-k">{row.label}</span>
              <div class="slot-v">
                {#if inSlot(row.s).length}
                  {#each inSlot(row.s) as a (a.name)}
                    <button type="button" class="tag" onclick={(e) => toggle(a, e.currentTarget)}>
                      {a.name}<i aria-hidden="true">✕</i>
                      <span class="visually-hidden">{m.make_remove()}</span>
                    </button>
                  {/each}
                {:else}
                  <span class="slot-empty">{m.make_slot_empty()}</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- The prompt, in three pieces plus a read-only join. -->
        <div class="prompt">
          <div class="prompt-head">
            <span class="eyebrow">{m.make_prompt()}</span>
            <span class="hint">{m.make_prompt_hint()}</span>
          </div>
          <div class="ptabs" role="group" aria-label={m.make_prompt()}>
            {#each PARTS as p (p.key)}
              <button
                type="button"
                class="ptab"
                class:on={promptTab === p.key}
                aria-pressed={promptTab === p.key}
                onclick={() => (promptTab = p.key)}
              >
                {p.label}<i class="dot" aria-hidden="true"></i>
                <span class="visually-hidden">— {m.make_pp_written()}</span>
              </button>
            {/each}
            <button
              type="button"
              class="ptab all"
              class:on={promptTab === 'all'}
              aria-pressed={promptTab === 'all'}
              onclick={() => (promptTab = 'all')}
            >
              {m.make_pp_all()}
            </button>
          </div>
          <p class="phint">{shown.hint}</p>
          <p class="pbody" class:joined={promptTab === 'all'}>{shown.body}</p>
        </div>
      </div>

      <div class="side">
        <div class="palette hud" use:reveal={{ delay: 100 }}>
          <div class="prompt-head">
            <span class="eyebrow">{m.make_palette()}</span>
            <span class="hint">{m.make_palette_hint()}</span>
          </div>
          <div class="tabs" role="group" aria-label={m.make_palette()}>
            {#each TABS as t (t.key)}
              <button
                type="button"
                class="tab"
                class:on={tab === t.key}
                aria-pressed={tab === t.key}
                onclick={() => (tab = t.key)}
              >
                {t.label}
              </button>
            {/each}
          </div>
          <ul class="cards">
            {#each CATALOG[tab] as part (part.name)}
              <li>
                <button
                  type="button"
                  class="card"
                  class:on={isOn(part)}
                  aria-pressed={isOn(part)}
                  onclick={(e) => toggle(part, e.currentTarget)}
                >
                  <span class="card-n">{part.name}</span>
                  <span class="card-d">{part.desc}</span>
                </button>
              </li>
            {/each}
          </ul>
        </div>

        <div class="tiers hud" use:reveal={{ delay: 140 }}>
          <div class="prompt-head">
            <span class="eyebrow">{m.make_brain()}</span>
            <span class="hint">{m.make_brain_hint()}</span>
          </div>
          <div class="tier-row">
            {#each TIERS as t, i (t.name)}
              <button
                type="button"
                class="tier"
                class:on={tier === i}
                aria-pressed={tier === i}
                onclick={() => (tier = i)}
              >
                <span class="tier-n">{t.name}</span>
                <span class="tier-m">{t.level}</span>
              </button>
            {/each}
          </div>
          <p class="tier-d">{TIERS[tier].desc}</p>
        </div>
      </div>
    </div>

    <p class="note" use:reveal={{ delay: 160 }}>{m.make_note()}</p>
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
  .side {
    display: flex;
    flex-direction: column;
    gap: var(--space-20);
  }

  .board {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
    padding: var(--space-20);
  }

  /* ---- the read-only rails ---- */
  .rails {
    display: flex;
    align-items: stretch;
    gap: var(--space-8);
  }
  .rail {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    padding: var(--space-12) var(--space-10);
    border: 1px dashed var(--glass-line-soft);
    border-radius: var(--radius-xs);
    /* No hover, no cursor, no fill. The flat dashed box is the whole message:
       there is nothing to open here. */
    background: transparent;
    text-align: center;
  }
  .rail-k {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--shell-faint);
  }
  .rail-v {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--shell-meta);
  }
  .arrow {
    align-self: center;
    flex: none;
    font-size: 13px;
    color: var(--shell-faint);
  }
  .core {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--space-10);
    padding: var(--space-10) var(--space-14);
    border: 1px solid rgba(49, 220, 220, 0.34);
    border-radius: var(--radius-m);
    background: rgba(31, 206, 206, 0.08);
  }
  .core-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .core-t {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--shell-text);
  }
  .core-s {
    font-size: 11px;
    color: var(--bright-cyan);
  }
  .rail-note {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--shell-faint);
  }
  /* Below 560px the three boxes stop fitting side by side; stacking keeps the
     in-core-out reading order intact and drops the arrows to vertical. */
  @media (max-width: 559px) {
    .rails {
      flex-direction: column;
    }
    .arrow {
      transform: rotate(90deg);
    }
    .core {
      justify-content: center;
    }
  }

  /* ---- the two slots ---- */
  .slots {
    display: flex;
    flex-direction: column;
    padding-top: var(--space-12);
    border-top: 1px solid var(--glass-line-soft);
  }
  .slot {
    display: flex;
    align-items: baseline;
    gap: var(--space-12);
    padding: 8px 0;
  }
  .slot-k {
    flex: none;
    width: 7.5em;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--gray3);
  }
  .slot.filled .slot-k {
    color: var(--summon-cyan);
  }
  .slot-v {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6);
    min-width: 0;
  }
  .slot-empty {
    font-size: 12px;
    color: var(--shell-faint);
  }
  /* Drawn at 28px but hit at 44: the visual chip has to stay chip-sized next to
     11px labels, and the design system's target floor is 44. */
  .tag {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid rgba(49, 220, 220, 0.4);
    border-radius: var(--radius-full);
    background: rgba(31, 206, 206, 0.1);
    font-size: 11.5px;
    color: var(--shell-text);
    cursor: pointer;
  }
  .tag::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: var(--control-m);
    transform: translateY(-50%);
  }
  .tag i {
    font-style: normal;
    font-size: 10px;
    color: var(--shell-meta);
  }
  .tag:hover i {
    color: var(--coral-red);
  }
  .tag:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  /* ---- the prompt ---- */
  .prompt {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding-top: var(--space-12);
    border-top: 1px solid var(--glass-line-soft);
  }
  .prompt-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-6) var(--space-10);
  }
  .hint {
    font-size: 11px;
    line-height: 1.5;
    color: var(--shell-faint);
  }
  .ptabs,
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6);
  }
  .ptab,
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: var(--control-m);
    padding: 0 14px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-full);
    background: transparent;
    font-size: 12px;
    color: var(--shell-body);
    cursor: pointer;
    transition: var(--transition-base);
  }
  .ptab:hover,
  .tab:hover {
    border-color: rgba(49, 220, 220, 0.55);
    color: var(--shell-text);
  }
  .ptab.on,
  .tab.on {
    border-color: transparent;
    background: var(--primary-fill);
    color: var(--static-white);
    font-weight: 600;
  }
  .ptab:focus-visible,
  .tab:focus-visible,
  .card:focus-visible,
  .tier:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  /* A filled piece carries a dot, so what is left to write is visible without
     opening each tab. The `all` tab is a view, not a piece, so it has none. */
  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--summon-green);
  }
  .ptab.on .dot {
    background: var(--static-white);
  }
  .phint {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--shell-faint);
  }
  .pbody {
    margin: 0;
    padding: var(--space-12) var(--space-14);
    border-radius: var(--radius-xs);
    background: rgba(112, 115, 124, 0.14);
    font-size: 12.5px;
    line-height: 1.7;
    color: var(--shell-body);
    /* The bodies carry authored newlines — numbered steps and one rule per
       line — and losing them turns a procedure into a paragraph. */
    white-space: pre-wrap;
  }
  .pbody.joined {
    border: 1px dashed var(--glass-line-soft);
    background: transparent;
    color: var(--shell-meta);
  }

  /* ---- the palette ---- */
  .palette,
  .tiers {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding: var(--space-20);
  }
  .cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-8);
  }
  .card {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 11px 14px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-xs);
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: var(--transition-base);
  }
  .card:hover {
    border-color: rgba(49, 220, 220, 0.55);
  }
  .card.on {
    border-color: var(--primary-light);
    background: rgba(15, 111, 218, 0.18);
  }
  .card-n {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .card-d {
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--shell-meta);
  }

  .tier-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-8);
  }
  .tier {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 11px 12px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-xs);
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: var(--transition-base);
  }
  .tier:hover {
    border-color: rgba(49, 220, 220, 0.55);
  }
  .tier.on {
    border-color: var(--primary-light);
    background: rgba(15, 111, 218, 0.16);
  }
  .tier-n {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .tier-m {
    font-size: 11px;
    color: var(--shell-meta);
  }
  .tier.on .tier-m {
    color: var(--bright-cyan);
  }
  .tier-d {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--shell-meta);
  }
</style>
