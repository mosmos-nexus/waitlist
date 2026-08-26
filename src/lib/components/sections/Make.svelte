<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal, scrub, animate, prefersReduced } from '$lib/anime/motion';
  import { spring } from 'animejs';
  import Mon from '$lib/components/world/Mon.svelte';

  /**
   * Studio, small enough to fit in a section and real enough to try.
   *
   * Four things carried over from the editor, because they are what make it a
   * tool rather than a picture of one:
   *
   * 1. Attached tools are nodes wired into the core, not a list beside it. The
   *    wires are CSS stubs meeting a bus line rather than SVG paths — a graph
   *    drawn with real geometry needs layout maths that breaks at every width,
   *    and what has to read is "these feed that", which a stub and a bus say.
   * 2. Attaching a tool that needs configuring opens its panel. That is the
   *    no-code moment: you did not write anything, and yet there is a decision
   *    in front of you with the consequence spelled out.
   * 3. A required setting left unset marks the node. The page-reading tool can
   *    open anything until you say which places are allowed, so it says so — on
   *    the node, not in a footnote.
   * 4. What goes in and out is read-only, because a Mon only ever takes work
   *    from Mos and hands the result back to Mos. Talking to a person is Mos's
   *    job. That is the same for every Mon, so there is nothing to choose.
   *
   * And the distinction the old version blurred: a Mon is the specialist that
   * runs, rented on the Hub. A Mon Skill is a written procedure you attach to
   * one — bought once, opened by the Mon when a task matches its one-line
   * description, and it never runs by itself. They looked identical here, which
   * made the Hub's rent-versus-buy split meaningless. The Skill now carries a
   * document treatment and says what it is.
   */
  type Slot = 'tool' | 'skill';
  interface Part {
    slot: Slot;
    name: string;
    desc: string;
    /** Skills only: the three parts of the document itself. `desc` stays the
     *  provenance line the palette card shows. */
    doc?: { when: string; steps: string; files: string };
  }
  interface Attached extends Part {
    setting: string | null;
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
      {
        slot: 'skill',
        name: m.make_c_s1(),
        desc: m.make_c_s1_d(),
        doc: { when: m.make_c_s1_when(), steps: m.make_c_s1_steps(), files: m.make_c_s1_files() },
      },
      {
        slot: 'skill',
        name: m.make_c_s2(),
        desc: m.make_c_s2_d(),
        doc: { when: m.make_c_s2_when(), steps: m.make_c_s2_steps(), files: m.make_c_s2_files() },
      },
    ],
  });

  /**
   * Per-tool settings. Only three carry one, which is the honest shape: most
   * connectors have nothing to decide, and a panel that appeared for everything
   * would be theatre.
   *
   * `required` is the one that matters. Which places a tool may read is the
   * setting you cannot leave blank, so leaving it blank stays visible.
   */
  const CONFIG = $derived<
    Record<
      string,
      {
        title: string;
        desc: string;
        options: string[];
        required?: boolean;
        fixed?: { label: string; value: string };
        note?: string;
      }
    >
  >({
    [m.make_c_img()]: {
      title: m.make_cfg_img(),
      desc: m.make_cfg_img_d(),
      options: ['1', '2', '4'],
      fixed: { label: m.make_cfg_img_fixed(), value: m.make_cfg_img_fixed_v() },
      note: m.make_cfg_gen_note(),
    },
    [m.make_c_exa()]: {
      title: m.make_cfg_exa(),
      desc: m.make_cfg_exa_d(),
      options: [m.make_cfg_exa_1(), m.make_cfg_exa_2(), m.make_cfg_exa_3()],
      required: true,
    },
    [m.make_c_notion()]: {
      title: m.make_cfg_notion(),
      desc: m.make_cfg_notion_d(),
      options: [m.make_cfg_notion_1(), m.make_cfg_notion_2()],
    },
  });

  const TIERS = $derived([
    { name: m.make_tier_1(), desc: m.make_tier_1_d(), level: m.make_tier_1_m() },
    { name: m.make_tier_2(), desc: m.make_tier_2_d(), level: m.make_tier_2_m() },
    { name: m.make_tier_3(), desc: m.make_tier_3_d(), level: m.make_tier_3_m() },
  ]);
  let tier = $state(1);

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

  let attached = $state<Attached[]>([]);
  /** Which tool's settings panel is open, by name. */
  let open = $state<string | null>(null);
  let core = $state<HTMLElement | null>(null);

  const tools = $derived(attached.filter((a) => a.slot === 'tool'));
  const skills = $derived(attached.filter((a) => a.slot === 'skill'));
  const isOn = (p: Part) => attached.some((a) => a.name === p.name);
  const needsSetup = (a: Attached) => !!CONFIG[a.name]?.required && a.setting === null;
  const unset = $derived(tools.filter(needsSetup).length);
  const openCfg = $derived(open ? CONFIG[open] : null);
  const openItem = $derived(attached.find((a) => a.name === open) ?? null);
  const countFor = (key: string) => CATALOG[key].filter((p) => isOn(p)).length;

  function toggle(part: Part, el: HTMLElement) {
    if (isOn(part)) {
      attached = attached.filter((a) => a.name !== part.name);
      if (open === part.name) open = null;
      return;
    }
    const same = attached.filter((a) => a.slot === part.slot);
    const drop = same.length >= 3 ? same[0].name : null;
    attached = [...attached.filter((a) => a.name !== drop), { ...part, setting: null }];
    // A tool with settings opens them. Nothing was typed and yet there is a
    // real decision on screen — that is the no-code claim, demonstrated.
    open = CONFIG[part.name] ? part.name : null;

    if (prefersReduced()) return;
    animate(el, { scale: [1, 0.94, 1], duration: 420, ease: 'out(3)' });
    if (core)
      animate(core, {
        scale: [1, 1.02, 1],
        duration: 620,
        ease: spring({ stiffness: 190, damping: 16 }),
      });
  }

  function choose(name: string, value: string) {
    attached = attached.map((a) => (a.name === name ? { ...a, setting: value } : a));
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
        <!-- Tool nodes, wired down into the core. -->
        <div class="wired">
          <span class="wired-k">
            {m.make_wired()}
            {#if tools.length}<b>{tools.length}</b>{/if}
          </span>
          {#if unset}
            <span class="warn-n">{m.make_needs()} {unset}</span>
          {/if}
        </div>
        {#if tools.length}
          <ul class="nodes">
            {#each tools as t (t.name)}
              <li class:warn={needsSetup(t)} class:open={open === t.name}>
                <button
                  type="button"
                  class="node"
                  onclick={() => (open = CONFIG[t.name] ? t.name : null)}
                >
                  <span class="node-n">{t.name}</span>
                  <span class="node-s">
                    {#if needsSetup(t)}
                      {m.make_needs()}
                    {:else if t.setting}
                      {t.setting}
                    {:else}
                      {m.make_cfg_none()}
                    {/if}
                  </span>
                </button>
                <button
                  type="button"
                  class="off"
                  onclick={(e) => toggle(t, e.currentTarget)}
                  aria-label="{t.name} — {m.make_remove()}"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="none">{m.make_none_yet()}</p>
        {/if}
        <div class="bus" aria-hidden="true"></div>

        <!-- Read-only rails either side of the core. -->
        <div class="rails">
          <div class="rail">
            <span class="rail-k">{m.make_in()}</span>
            <span class="rail-r"><i>TEXT</i>{m.make_in_v()}</span>
            <span class="rail-r"><i>LINK</i>{m.make_in_v2()}</span>
          </div>
          <span class="arrow" aria-hidden="true">→</span>
          <div class="core" bind:this={core}>
            {#if tools.length}<span class="badge" aria-hidden="true">{tools.length}</span>{/if}
            <Mon tone="research" size={40} active={attached.length > 0} />
            <div class="core-meta">
              <span class="core-t">{m.make_core()}</span>
              <span class="core-s">{TIERS[tier].name}</span>
            </div>
          </div>
          <span class="arrow" aria-hidden="true">→</span>
          <div class="rail">
            <span class="rail-k">{m.make_out()}</span>
            <span class="rail-r"><i>TEXT</i>{m.make_out_v()}</span>
            <span class="rail-r"><i>FILE</i>{m.make_out_v2()}</span>
          </div>
        </div>
        <p class="rail-note">{m.make_io_note()}</p>

        <!-- Attached Mon Skills. A document, drawn as one. -->
        <div class="skills">
          <span class="slot-k">{m.make_slot_skill()}</span>
          {#if skills.length}
            {#each skills as sk (sk.name)}
              <article class="doc">
                <header>
                  <span class="doc-tag">{m.make_skill_doc()}</span>
                  <span class="doc-n">{sk.name}</span>
                  <button
                    type="button"
                    class="off"
                    onclick={(e) => toggle(sk, e.currentTarget)}
                    aria-label="{sk.name} — {m.make_remove()}"
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </header>
                <dl class="doc-parts">
                  <div>
                    <dt>{m.make_skill_when()}</dt>
                    <dd>{m.make_skill_when_d()}</dd>
                  </div>
                  <div>
                    <dt>{m.make_skill_steps()}</dt>
                    <dd>{sk.desc}</dd>
                  </div>
                  <div>
                    <dt>{m.make_skill_files()}</dt>
                    <dd>checklist.md · report.md</dd>
                  </div>
                </dl>
                <p class="doc-note">{m.make_skill_norun()}</p>
              </article>
            {/each}
          {:else}
            <span class="slot-empty">{m.make_slot_empty()}</span>
          {/if}
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
            <span class="chars tnum">{shown.body.length}{m.make_chars()}</span>
          </div>
          <p class="phint">{shown.hint}</p>
          <p class="pbody" class:joined={promptTab === 'all'}>{shown.body}</p>
        </div>
      </div>

      <div class="side">
        <div class="palette hud" use:reveal={{ delay: 100 }}>
          {#if openCfg && openItem}
            <!-- Settings for one tool, in place of the list. -->
            <div class="cfg">
              <button type="button" class="back" onclick={() => (open = null)}>
                <span aria-hidden="true">‹</span>
                {m.make_cfg_back()}
              </button>
              <div class="cfg-head">
                <span class="cfg-n">{openItem.name}</span>
                {#if openCfg.required}<span class="req">{m.make_cfg_req()}</span>{/if}
              </div>
              <p class="cfg-t">{openCfg.title}</p>
              <p class="cfg-d">{openCfg.desc}</p>
              <div class="opts">
                {#each openCfg.options as o (o)}
                  <button
                    type="button"
                    class="opt"
                    class:on={openItem.setting === o}
                    aria-pressed={openItem.setting === o}
                    onclick={() => choose(openItem.name, o)}
                  >
                    {o}
                  </button>
                {/each}
              </div>
              {#if openCfg.fixed}
                <div class="fixed">
                  <span class="fixed-k">{openCfg.fixed.label}</span>
                  <span class="fixed-v">{openCfg.fixed.value}</span>
                </div>
              {/if}
              {#if openCfg.note}<p class="cfg-note">{openCfg.note}</p>{/if}
            </div>
          {:else}
            <div class="prompt-head">
              <span class="eyebrow">{m.make_palette()}</span>
              <span class="hint">{m.make_palette_hint()}</span>
            </div>
            <div class="tabs" role="group" aria-label={m.make_palette()}>
              {#each TABS as t (t.key)}
                {@const n = countFor(t.key)}
                <button
                  type="button"
                  class="tab"
                  class:on={tab === t.key}
                  aria-pressed={tab === t.key}
                  onclick={() => (tab = t.key)}
                >
                  {t.label}<i class="n" class:has={n > 0}>{n}</i>
                </button>
              {/each}
            </div>

            {#if tab === 'skill'}
              <!-- The one place the two nouns sit side by side, because this is
                   where a visitor would otherwise assume they are the same. -->
              <dl class="what">
                <div>
                  <dt>{m.make_what_mon()}</dt>
                  <dd>{m.make_what_mon_d()}</dd>
                </div>
                <div class="is-skill">
                  <dt>{m.make_what_skill()}</dt>
                  <dd>{m.make_what_skill_d()}</dd>
                </div>
              </dl>
            {/if}

            <ul class="cards">
              {#each CATALOG[tab] as part (part.name)}
                <li>
                  <button
                    type="button"
                    class="card"
                    class:on={isOn(part)}
                    class:skill={part.slot === 'skill'}
                    aria-pressed={isOn(part)}
                    onclick={(e) => toggle(part, e.currentTarget)}
                  >
                    <span class="card-n">
                      {part.name}
                      {#if part.slot === 'skill'}<i class="doc-tag">{m.make_skill_doc()}</i>{/if}
                    </span>
                    <span class="card-d">{part.desc}</span>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
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
      grid-template-columns: minmax(0, 56fr) minmax(0, 44fr);
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
    gap: var(--space-10);
    padding: var(--space-20);
  }

  /* ---- tool nodes + the bus they feed ---- */
  .wired {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-8);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .wired-k {
    color: var(--gray3);
  }
  .wired-k b {
    color: var(--bright-cyan);
  }
  .warn-n {
    margin-left: auto;
    color: var(--coral-red);
  }
  .nodes {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
  }
  .nodes li {
    position: relative;
    display: flex;
    align-items: stretch;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-xs);
    background: rgba(112, 115, 124, 0.1);
  }
  /* The wire. A stub down to the bus line below, which is what makes these read
     as feeding the core instead of listing beside it. */
  .nodes li::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -11px;
    width: 1px;
    height: 11px;
    background: rgba(49, 220, 220, 0.5);
  }
  .node {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 9px 4px 9px 12px;
    border: 0;
    border-radius: var(--radius-xs) 0 0 var(--radius-xs);
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  .node-n {
    font-size: 12px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .node-s {
    font-size: 10.5px;
    color: var(--shell-meta);
  }
  .nodes li.warn {
    border-color: rgba(233, 83, 83, 0.55);
    background: rgba(233, 83, 83, 0.1);
  }
  .nodes li.warn .node-s {
    color: var(--coral-red);
    font-weight: 600;
  }
  .nodes li.open {
    border-color: var(--primary-light);
  }
  /* Drawn small, hit at 44. */
  .off {
    position: relative;
    flex: none;
    width: 26px;
    border: 0;
    border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
    background: transparent;
    font-size: 10px;
    color: var(--shell-meta);
    cursor: pointer;
  }
  .off::after {
    content: '';
    position: absolute;
    inset: 50% 0 auto 0;
    height: var(--control-m);
    transform: translateY(-50%);
  }
  .off:hover {
    color: var(--coral-red);
  }
  .node:focus-visible,
  .off:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  .none {
    margin: 0;
    font-size: 12px;
    color: var(--shell-faint);
  }
  /* The bus the stubs land on. Bright enough to actually trace with the eye —
     at `--glass-line` it composited to about 1.4:1 and the wiring read as
     absent, which left the nodes looking like a list beside the core rather
     than inputs to it. */
  .bus {
    height: 1px;
    margin: 10px 0 2px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(49, 220, 220, 0.42) 14%,
      rgba(49, 220, 220, 0.42) 86%,
      transparent
    );
  }

  /* ---- read-only rails ---- */
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
    gap: 5px;
    padding: var(--space-10) var(--space-12);
    border: 1px dashed var(--glass-line-soft);
    border-radius: var(--radius-xs);
    background: transparent;
  }
  .rail-k {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--shell-faint);
  }
  .rail-r {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 11.5px;
    color: var(--shell-meta);
  }
  .rail-r i {
    flex: none;
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(112, 115, 124, 0.22);
    font-size: 9px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--shell-meta);
  }
  .arrow {
    align-self: center;
    flex: none;
    font-size: 13px;
    color: var(--shell-faint);
  }
  .core {
    position: relative;
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--space-10);
    padding: var(--space-10) var(--space-14);
    border: 1px solid rgba(49, 220, 220, 0.34);
    border-radius: var(--radius-m);
    background: rgba(31, 206, 206, 0.08);
  }
  .badge {
    position: absolute;
    top: -9px;
    left: 50%;
    transform: translateX(-50%);
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: var(--radius-full);
    background: var(--summon-cyan);
    font-size: 10.5px;
    font-weight: 700;
    line-height: 18px;
    text-align: center;
    color: var(--static-black);
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
  @media (max-width: 619px) {
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

  /* ---- attached Mon Skill: a document, not a tool ---- */
  .skills {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding-top: var(--space-12);
    border-top: 1px solid var(--glass-line-soft);
  }
  .slot-k {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--gray3);
  }
  .slot-empty {
    font-size: 12px;
    color: var(--shell-faint);
  }
  /* Squared corners, a spine down the left, a rule under the title: it should
     read as a page, next to nodes that read as parts. */
  .doc {
    border: 1px solid rgba(155, 110, 239, 0.42);
    border-left-width: 3px;
    border-radius: 4px;
    background: rgba(122, 62, 234, 0.09);
    padding: var(--space-12) var(--space-14);
  }
  .doc header {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(155, 110, 239, 0.28);
  }
  .doc-tag {
    flex: none;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(155, 110, 239, 0.28);
    font-size: 9.5px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: rgb(213, 195, 249);
  }
  .doc-n {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--shell-text);
  }
  .doc header .off {
    margin-left: auto;
    width: 22px;
  }
  .doc-parts {
    margin: 8px 0 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .doc-parts div {
    display: flex;
    align-items: baseline;
    gap: var(--space-8);
  }
  .doc-parts dt {
    flex: none;
    width: 8.5em;
    font-size: 10.5px;
    font-weight: 600;
    color: rgb(203, 183, 244);
  }
  .doc-parts dd {
    margin: 0;
    font-size: 11px;
    line-height: 1.5;
    color: var(--shell-meta);
  }
  .doc-note {
    margin: 8px 0 0;
    font-size: 10.5px;
    color: var(--shell-faint);
  }

  /* ---- prompt ---- */
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
    align-items: center;
    gap: var(--space-6);
  }
  .chars {
    margin-left: auto;
    font-size: 10.5px;
    color: var(--shell-faint);
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
  .tier:focus-visible,
  .opt:focus-visible,
  .back:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--summon-green);
  }
  .ptab.on .dot {
    background: var(--static-white);
  }
  /* The per-group count. Zero stays visible but recedes, so the row reads as a
     tally rather than as badges that appear and disappear. */
  .n {
    font-size: 10px;
    font-style: normal;
    font-weight: 700;
    color: var(--shell-faint);
  }
  .n.has {
    color: var(--bright-cyan);
  }
  .tab.on .n {
    /* Full white, not a fade: on the fill this sits over, 0.78 alpha measured
       3.59:1 and 9-10px bold is still normal-size text to WCAG. */
    color: var(--static-white);
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
    white-space: pre-wrap;
  }
  .pbody.joined {
    border: 1px dashed var(--glass-line-soft);
    background: transparent;
    color: var(--shell-meta);
  }

  /* ---- palette ---- */
  .palette,
  .tiers {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding: var(--space-20);
  }
  .what {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    padding: var(--space-12) var(--space-14);
    border-radius: var(--radius-xs);
    background: rgba(112, 115, 124, 0.14);
  }
  .what dt {
    font-size: 12px;
    font-weight: 700;
    color: var(--shell-text);
  }
  .what dd {
    margin: 3px 0 0;
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--shell-meta);
  }
  .what .is-skill dt {
    color: rgb(213, 195, 249);
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
  /* A Skill in the palette already looks like a document, so the same shape
     carries through to the board. */
  .card.skill {
    border-radius: 4px;
    border-left-width: 3px;
    border-left-color: rgba(155, 110, 239, 0.5);
  }
  .card.skill.on {
    border-color: rgba(155, 110, 239, 0.6);
    border-left-color: rgb(155, 110, 239);
    background: rgba(122, 62, 234, 0.14);
  }
  .card-n {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .card-d {
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--shell-meta);
  }

  /* ---- the settings panel ---- */
  .cfg {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }
  .back {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: var(--control-m);
    padding: 0 12px 0 8px;
    margin-left: -8px;
    border: 0;
    border-radius: var(--radius-full);
    background: transparent;
    font-size: 11.5px;
    color: var(--shell-meta);
    cursor: pointer;
  }
  .back:hover {
    color: var(--shell-text);
  }
  .cfg-head {
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }
  .cfg-n {
    font-size: 14px;
    font-weight: 700;
    color: var(--shell-text);
  }
  .req {
    padding: 2px 7px;
    border-radius: var(--radius-full);
    background: rgba(233, 83, 83, 0.18);
    border: 1px solid rgba(233, 83, 83, 0.5);
    font-size: 9.5px;
    font-weight: 700;
    color: rgb(250, 186, 186);
  }
  .cfg-t {
    margin: var(--space-6) 0 0;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .cfg-d {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--shell-meta);
  }
  .opts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6);
  }
  .opt {
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
  .opt:hover {
    border-color: rgba(49, 220, 220, 0.55);
  }
  .opt.on {
    border-color: transparent;
    background: var(--primary-fill);
    color: var(--static-white);
    font-weight: 600;
  }
  .fixed {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 13px;
    border-radius: var(--radius-xs);
    background: rgba(112, 115, 124, 0.14);
  }
  .fixed-k {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--shell-faint);
  }
  .fixed-v {
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--shell-meta);
  }
  .cfg-note {
    margin: 0;
    font-size: 10.5px;
    color: var(--shell-faint);
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
