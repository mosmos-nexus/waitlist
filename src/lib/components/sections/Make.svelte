<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal, animate, prefersReduced } from '$lib/anime/motion';
  import { spring } from 'animejs';
  import Mon from '$lib/components/world/Mon.svelte';

  /**
   * Studio as the editor it is: a canvas you drag nodes onto and wire up.
   *
   * The previous version listed attached tools beside the core with CSS stubs
   * for wires. That is a picture of a node editor, not one — you cannot place
   * anything, nothing connects, and the thing being claimed (no code, you just
   * connect blocks) is exactly what a list fails to demonstrate.
   *
   * Geometry lives in one fixed coordinate space (W x H below) rather than in
   * layout. Every node position, port and wire is a number in that space, so
   * none of it has to be recomputed per breakpoint — the canvas simply scrolls
   * inside its frame on narrow screens, which is how these editors behave on a
   * phone anyway. Wires are cubic beziers between port coordinates.
   *
   * Both input paths work, because drag alone would exclude keyboard users:
   * press and move to drag a node in and place it, or click a palette card to
   * have it land in the next free slot. A pointer that moves less than DRAG_MIN
   * counts as a click.
   *
   * The read-only side nodes are read-only for a product reason, not a design
   * one: a Mon takes work only from Mos and returns it only to Mos, so what
   * goes in and comes out is identical for every Mon and there is nothing to
   * choose. And a Mon Skill is not a second kind of agent — it is a procedure
   * document the Mon opens when a task matches its one-line description, which
   * is why it wires into its own port below the core and is drawn as a page.
   */

  /* ---- the coordinate space ---- */
  const W = 720;
  const H = 470;
  const NODE_W = 168;
  const NODE_H = 54;
  const CORE = { x: 262, y: 168, w: 196, h: 134 };
  /** Where each kind of node wires into. */
  const PORT = {
    tool: { x: CORE.x + CORE.w / 2, y: CORE.y },
    skill: { x: CORE.x + CORE.w / 2, y: CORE.y + CORE.h },
  };
  const IN = { x: 16, y: 186, w: 150, h: 98 };
  const OUT = { x: W - 166, y: 186, w: 150, h: 98 };
  /** Where a click-to-attach node lands, per kind. */
  const SLOT = {
    tool: [
      { x: 30, y: 26 },
      { x: 216, y: 26 },
      { x: 402, y: 26 },
    ],
    skill: [
      { x: 190, y: 372 },
      { x: 390, y: 372 },
    ],
  };

  type Kind = 'tool' | 'skill';
  interface Part {
    kind: Kind;
    name: string;
    desc: string;
    doc?: { when: string; steps: string; files: string };
  }
  interface Placed extends Part {
    x: number;
    y: number;
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
      { kind: 'tool', name: m.make_c_notion(), desc: m.make_c_notion_d() },
      { kind: 'tool', name: m.make_c_github(), desc: m.make_c_github_d() },
    ],
    gen: [
      { kind: 'tool', name: m.make_c_img(), desc: m.make_c_img_d() },
      { kind: 'tool', name: m.make_c_video(), desc: m.make_c_video_d() },
      { kind: 'tool', name: m.make_c_audio(), desc: m.make_c_audio_d() },
    ],
    search: [
      { kind: 'tool', name: m.make_c_ppx(), desc: m.make_c_ppx_d() },
      { kind: 'tool', name: m.make_c_exa(), desc: m.make_c_exa_d() },
    ],
    run: [
      { kind: 'tool', name: m.make_c_browser(), desc: m.make_c_browser_d() },
      { kind: 'tool', name: m.make_c_code(), desc: m.make_c_code_d() },
    ],
    skill: [
      {
        kind: 'skill',
        name: m.make_c_s1(),
        desc: m.make_c_s1_d(),
        doc: { when: m.make_c_s1_when(), steps: m.make_c_s1_steps(), files: m.make_c_s1_files() },
      },
      {
        kind: 'skill',
        name: m.make_c_s2(),
        desc: m.make_c_s2_d(),
        doc: { when: m.make_c_s2_when(), steps: m.make_c_s2_steps(), files: m.make_c_s2_files() },
      },
    ],
  });

  /** Only three tools carry a setting. Most connectors have nothing to decide,
   *  and a panel that appeared for everything would be theatre. `required` is
   *  the one that matters: which places a tool may read cannot be left blank. */

  /**
   * The brain is the model this Mon actually runs on, so it has to be the same
   * list Studio shows — providers and their tiers, not three abstractions.
   *
   * Picked by purpose rather than by name: you say what the Mon will mostly do
   * and the models that suit it get marked. That is Studio's own affordance
   * ("모델 이름을 몰라도 괜찮아요"), and it is the honest one — a maker knows
   * their work, not the routing table.
   */
  const PURPOSES = $derived([
    m.make_pu_1(),
    m.make_pu_2(),
    m.make_pu_3(),
    m.make_pu_4(),
    m.make_pu_5(),
    m.make_pu_6(),
  ]);
  let purpose = $state(0);

  const PROVIDERS = $derived([
    {
      name: 'Claude',
      trait: m.make_pv_claude(),
      tiers: [
        { id: 'opus5', name: 'Opus 5', blurb: m.make_m_opus(), good: [1, 5] },
        { id: 'sonnet5', name: 'Sonnet 5', blurb: m.make_m_sonnet(), good: [0, 5] },
        { id: 'haiku5', name: 'Haiku 5', blurb: m.make_m_haiku(), good: [2, 3] },
      ],
    },
    {
      name: 'Gemini',
      trait: m.make_pv_gemini(),
      tiers: [
        { id: 'pro31', name: '3.1 Pro', blurb: m.make_m_gpro(), good: [0, 1] },
        { id: 'flash36', name: '3.6 Flash', blurb: m.make_m_gflash(), good: [2, 0] },
        { id: 'lite', name: 'Flash-Lite', blurb: m.make_m_glite(), good: [3] },
      ],
    },
    {
      name: 'GPT',
      trait: m.make_pv_gpt(),
      tiers: [
        { id: 'sol', name: '5.6 Sol', blurb: m.make_m_sol(), good: [1, 5] },
        { id: 'terra', name: '5.6 Terra', blurb: m.make_m_terra(), good: [5] },
        { id: 'luna', name: '5.6 Luna', blurb: m.make_m_luna(), good: [3, 2] },
      ],
    },
    {
      name: 'Grok',
      trait: m.make_pv_grok(),
      tiers: [
        { id: 'g46', name: '4.6', blurb: m.make_m_g46(), good: [4, 5] },
        { id: 'gfast', name: '4 Fast', blurb: m.make_m_gfast(), good: [4, 2] },
      ],
    },
  ]);
  let brainId = $state('sonnet5');
  let showModels = $state(false);
  const brain = $derived(
    PROVIDERS.flatMap((pv) => pv.tiers.map((t) => ({ ...t, provider: pv.name }))).find(
      (t) => t.id === brainId,
    ) ?? { id: 'sonnet5', name: 'Sonnet 5', blurb: '', provider: 'Claude', good: [] },
  );

  let placed = $state<Placed[]>([]);
  let core = $state<HTMLElement | null>(null);
  let canvas = $state<HTMLElement | null>(null);

  const tools = $derived(placed.filter((n) => n.kind === 'tool'));
  const skills = $derived(placed.filter((n) => n.kind === 'skill'));
  const isOn = (p: Part) => placed.some((n) => n.name === p.name);
  const countFor = (key: string) => CATALOG[key].filter((p) => isOn(p)).length;

  /* ---- wires ---- */
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  /** Vertical cubic between a node edge and its port. */
  function wireV(nx: number, ny: number, kind: Kind) {
    const x = nx + NODE_W / 2;
    const y = kind === 'tool' ? ny + NODE_H : ny;
    const p = PORT[kind];
    const bend = kind === 'tool' ? 46 : -46;
    return `M ${x},${y} C ${x},${y + bend} ${p.x},${p.y - bend} ${p.x},${p.y}`;
  }
  /** Horizontal cubic for the two fixed side nodes. */
  const wireIn = `M ${IN.x + IN.w},${IN.y + IN.h / 2} C ${IN.x + IN.w + 44},${IN.y + IN.h / 2} ${CORE.x - 44},${CORE.y + CORE.h / 2} ${CORE.x},${CORE.y + CORE.h / 2}`;
  const wireOut = `M ${CORE.x + CORE.w},${CORE.y + CORE.h / 2} C ${CORE.x + CORE.w + 44},${CORE.y + CORE.h / 2} ${OUT.x - 44},${OUT.y + OUT.h / 2} ${OUT.x},${OUT.y + OUT.h / 2}`;

  const wires = $derived(placed.map((n) => ({ name: n.name, d: wireV(n.x, n.y, n.kind) })));

  /* ---- dragging ---- */
  const DRAG_MIN = 6;
  interface Drag {
    part: Part;
    /** Existing node being moved, versus a new one coming from the palette. */
    moving: boolean;
    x: number;
    y: number;
    from: { x: number; y: number };
    live: boolean;
  }
  let drag = $state<Drag | null>(null);
  const ghostWire = $derived(drag?.live ? wireV(drag.x, drag.y, drag.part.kind) : '');

  /** Pointer position in canvas coordinates, accounting for scroll and scale. */
  function toCanvas(event: PointerEvent) {
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    const scale = r.width / W;
    return { x: (event.clientX - r.left) / scale, y: (event.clientY - r.top) / scale };
  }

  function freeSlot(kind: Kind) {
    const used = placed.filter((n) => n.kind === kind).length;
    const list = SLOT[kind];
    return list[Math.min(used, list.length - 1)];
  }

  function attach(part: Part, at?: { x: number; y: number }) {
    const same = placed.filter((n) => n.kind === part.kind);
    const cap = part.kind === 'tool' ? 3 : 2;
    const dropped = same.length >= cap ? same[0].name : null;
    const spot = at ?? freeSlot(part.kind);
    placed = [
      ...placed.filter((n) => n.name !== dropped && n.name !== part.name),
      {
        ...part,
        x: clamp(spot.x, 4, W - NODE_W - 4),
        y: clamp(spot.y, 4, H - NODE_H - 4),
      },
    ];
    if (prefersReduced() || !core) return;
    animate(core, {
      scale: [1, 1.03, 1],
      duration: 620,
      ease: spring({ stiffness: 190, damping: 16 }),
    });
  }

  function detach(name: string) {
    placed = placed.filter((n) => n.name !== name);
  }

  /* Listeners go on the window for the life of a drag, not on the canvas.
     A pointer that leaves the canvas mid-drag would otherwise strand the node,
     and a div carrying pointer handlers needs an ARIA role it has no business
     claiming. */
  function bind() {
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
  }
  function unbind() {
    window.removeEventListener('pointermove', moveDrag);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
  }

  function startDrag(event: PointerEvent, part: Part, moving: boolean) {
    if (event.button != null && event.button !== 0) return;
    const p = toCanvas(event);
    const node = moving ? placed.find((n) => n.name === part.name) : null;
    drag = {
      part,
      moving,
      x: node ? node.x : p.x - NODE_W / 2,
      y: node ? node.y : p.y - NODE_H / 2,
      from: node ? { x: p.x - node.x, y: p.y - node.y } : { x: NODE_W / 2, y: NODE_H / 2 },
      live: false,
    };
    bind();
  }

  function moveDrag(event: PointerEvent) {
    if (!drag) return;
    const p = toCanvas(event);
    const nx = clamp(p.x - drag.from.x, 4, W - NODE_W - 4);
    const ny = clamp(p.y - drag.from.y, 4, H - NODE_H - 4);
    if (!drag.live && Math.hypot(nx - drag.x, ny - drag.y) < DRAG_MIN) return;
    drag = { ...drag, x: nx, y: ny, live: true };
    if (drag.moving) {
      placed = placed.map((n) => (n.name === drag!.part.name ? { ...n, x: nx, y: ny } : n));
    }
  }

  function endDrag() {
    unbind();
    if (!drag) return;
    const { part, moving, live, x, y } = drag;
    drag = null;
    if (!live) {
      // A press that never moved is a click.
      if (moving) return;
      if (isOn(part)) detach(part.name);
      else attach(part);
      return;
    }
    if (!moving) attach(part, { x, y });
  }

  $effect(() => unbind);
</script>

<section class="make section" aria-labelledby="make-title">
  <div class="container">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.make_eyebrow()}</span>
      <h2 class="title" id="make-title">{m.make_title()}</h2>
      <p class="lead">{m.make_lead()}</p>
    </div>

    <div class="stage hud" use:reveal={{ delay: 60, scale: true }}>
      <div class="bar">
        <span class="eyebrow">{m.make_palette()}</span>
        <span class="hint">{m.make_palette_hint()}</span>
      </div>

      <!-- The palette sits above the canvas, so the drag runs downward into it.
           Below the canvas it meant reaching past the whole board to start. -->
      <div class="tabs" role="group" aria-label={m.make_palette()}>
        {#each TABS as t (t.key)}
          {@const n = countFor(t.key)}
          <button
            type="button"
            class="tab"
            class:on={tab === t.key}
            aria-pressed={tab === t.key}
            onclick={() => (tab = t.key)}>{t.label}<i class="n" class:has={n > 0}>{n}</i></button
          >
        {/each}
      </div>

      {#if tab === 'skill'}
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
              class:skill={part.kind === 'skill'}
              aria-pressed={isOn(part)}
              onpointerdown={(e) => startDrag(e, part, false)}
            >
              <span class="card-n">
                {part.name}
                {#if part.kind === 'skill'}<i class="tag">{m.make_skill_doc()}</i>{/if}
              </span>
              <span class="card-d">{part.desc}</span>
            </button>
          </li>
        {/each}
      </ul>

      <div class="frame">
        <div class="canvas" bind:this={canvas} style="width:{W}px;height:{H}px">
          <svg class="wires" width={W} height={H} viewBox="0 0 {W} {H}" aria-hidden="true">
            <path class="w fixed" d={wireIn} />
            <path class="w fixed" d={wireOut} />
            {#each wires as w (w.name)}
              <path class="w" d={w.d} />
            {/each}
            {#if ghostWire}
              <path class="w ghost" d={ghostWire} />
            {/if}
          </svg>

          <div class="node fixed" style="left:{IN.x}px;top:{IN.y}px;width:{IN.w}px;height:{IN.h}px">
            <span class="n-k">{m.make_in()}</span>
            <span class="n-r"><i>TEXT</i>{m.make_in_v()}</span>
            <span class="n-r"><i>LINK</i>{m.make_in_v2()}</span>
          </div>
          <div
            class="node fixed"
            style="left:{OUT.x}px;top:{OUT.y}px;width:{OUT.w}px;height:{OUT.h}px"
          >
            <span class="n-k">{m.make_out()}</span>
            <span class="n-r"><i>TEXT</i>{m.make_out_v()}</span>
            <span class="n-r"><i>FILE</i>{m.make_out_v2()}</span>
          </div>

          <div
            class="core"
            bind:this={core}
            style="left:{CORE.x}px;top:{CORE.y}px;width:{CORE.w}px;height:{CORE.h}px"
          >
            <header>
              <Mon tone="research" size={30} active={placed.length > 0} />
              <span class="c-n">Mon</span>
              <span class="c-kind">{m.make_agent()}</span>
            </header>
            <div class="c-row">
              <span class="c-k">{m.make_brain()}</span>
              <span class="c-v" translate="no">{brain.provider} {brain.name}</span>
            </div>
            <div class="c-row">
              <span class="c-k">{m.make_tools_n()}</span>
              <span class="c-v tnum">{tools.length}</span>
              <span class="c-k">{m.make_skills_n()}</span>
              <span class="c-v tnum">{skills.length}</span>
            </div>
            <span class="port top" aria-hidden="true"></span>
            <span class="port bottom" aria-hidden="true"></span>
          </div>

          {#each placed as n (n.name)}
            <div
              class="node placed"
              class:skill={n.kind === 'skill'}
              class:held={drag?.live && drag.part.name === n.name}
              style="left:{n.x}px;top:{n.y}px;width:{NODE_W}px"
            >
              <button
                type="button"
                class="grip"
                onpointerdown={(e) => startDrag(e, n, true)}
                aria-label={n.name}
              >
                <span class="p-n">
                  {n.name}
                  {#if n.kind === 'skill'}<i class="tag">{m.make_skill_doc()}</i>{/if}
                </span>
                <span class="p-s">{n.kind === 'skill' ? n.doc?.when : n.desc}</span>
              </button>
              <button
                type="button"
                class="off"
                onclick={() => detach(n.name)}
                aria-label="{n.name} — {m.make_remove()}"><span aria-hidden="true">✕</span></button
              >
            </div>
          {/each}

          {#if drag?.live && !drag.moving}
            <div
              class="node ghost"
              style="left:{drag.x}px;top:{drag.y}px;width:{NODE_W}px"
              aria-hidden="true"
            >
              <span class="p-n">{drag.part.name}</span>
              <span class="p-s">{m.make_drop()}</span>
            </div>
          {/if}
        </div>
      </div>

      <div class="brain">
        <div class="bar">
          <span class="eyebrow">{m.make_brain()}</span>
          <span class="hint">{m.make_brain_hint()}</span>
        </div>
        <div class="purposes" role="group" aria-label={m.make_purpose()}>
          {#each PURPOSES as pu, i (pu)}
            <button
              type="button"
              class="tab"
              class:on={purpose === i}
              aria-pressed={purpose === i}
              onclick={() => (purpose = i)}>{pu}</button
            >
          {/each}
        </div>

        <div class="picked">
          <span class="p-k">{m.make_brain_pick()}</span>
          <span class="p-v" translate="no">{brain.provider} {brain.name}</span>
          {#if !showModels}<span class="p-auto">{m.make_auto()}</span>{/if}
          <p class="p-b">{brain.blurb}</p>
        </div>

        <button type="button" class="disclose" onclick={() => (showModels = !showModels)}>
          {showModels ? m.make_close_models() : m.make_open_models()}
          <i aria-hidden="true">{showModels ? '▴' : '▾'}</i>
        </button>

        {#if showModels}
          <div class="models">
            {#each PROVIDERS as pv (pv.name)}
              <div class="pv">
                <div class="pv-head">
                  <span class="pv-n" translate="no">{pv.name}</span>
                  <span class="pv-t">{pv.trait}</span>
                </div>
                {#each pv.tiers as t (t.id)}
                  <button
                    type="button"
                    class="model"
                    class:on={brainId === t.id}
                    class:fit={t.good.includes(purpose)}
                    aria-pressed={brainId === t.id}
                    onclick={() => (brainId = t.id)}
                  >
                    <span class="m-n" translate="no">{t.name}</span>
                    {#if t.good.includes(purpose)}<span class="m-fit">{m.make_fit()}</span>{/if}
                  </button>
                {/each}
              </div>
            {/each}
          </div>
        {/if}
        <p class="tier-d">{m.make_brain_note()}</p>
      </div>
    </div>

    <p class="note" use:reveal={{ delay: 160 }}>{m.make_note()}</p>
  </div>
</section>

<style>
  .head {
    margin-bottom: var(--space-32);
  }
  /* `min-width: 0` on both, or the fixed-size canvas wins.
     A grid item defaults to `min-width: auto`, so the stage refuses to shrink
     below its 720px content and the page itself scrolls sideways instead of the
     canvas frame doing it — measured 452px of page overflow at 320px wide. */
  .stage {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding: var(--space-16);
    min-width: 0;
  }
  .bar {
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

  /* ---- canvas ---- */
  /* One fixed coordinate space, scrolled rather than reflowed. Recomputing node
     positions per breakpoint is how a canvas becomes unmaintainable; panning is
     also what these editors do on a phone. */
  .frame {
    min-width: 0;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    border-radius: var(--radius-m);
    background:
      radial-gradient(circle at 1px 1px, rgba(112, 115, 124, 0.28) 1px, transparent 0) 0 0 / 22px
        22px,
      rgba(8, 10, 16, 0.5);
    border: 1px solid var(--glass-line-soft);
  }
  /* Fixed size, not a percentage. The nodes are positioned in absolute pixels
     inside this coordinate space while the SVG scales with its viewBox, so the
     moment the box stretches the two disagree and every wire leaves its node.
     One size, centred when the frame is wider, panned when it is narrower —
     which is what a canvas viewport is. */
  .canvas {
    position: relative;
    flex: none;
    touch-action: pan-x;
  }
  .frame {
    display: flex;
    justify-content: center;
  }
  svg.wires {
    position: absolute;
    inset: 0;
    overflow: visible;
  }
  .w {
    fill: none;
    stroke: rgba(49, 220, 220, 0.6);
    stroke-width: 1.75;
    stroke-linecap: round;
  }
  .w.fixed {
    stroke: rgba(112, 115, 124, 0.55);
    stroke-dasharray: 4 5;
  }
  .w.ghost {
    stroke: var(--summon-green);
    stroke-dasharray: 7 6;
    stroke-width: 2;
  }

  .node,
  .core {
    position: absolute;
    box-sizing: border-box;
  }
  /* The two read-only side nodes: dashed, flat, no cursor. Nothing here is a
     decision, and the drawing says so before the caption does. */
  .node.fixed {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    padding: 0 11px;
    border: 1px dashed var(--glass-line-soft);
    border-radius: var(--radius-xs);
    background: rgba(18, 20, 28, 0.72);
  }
  .n-k {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--shell-faint);
  }
  .n-r {
    display: flex;
    align-items: baseline;
    gap: 5px;
    font-size: 10.5px;
    line-height: 1.35;
    color: var(--shell-meta);
  }
  .n-r i {
    flex: none;
    padding: 1px 4px;
    border-radius: 3px;
    background: rgba(112, 115, 124, 0.24);
    font-size: 8.5px;
    font-style: normal;
    font-weight: 700;
    color: var(--shell-meta);
  }

  .core {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border: 1.5px solid rgba(49, 220, 220, 0.5);
    border-radius: var(--radius-m);
    background: rgba(10, 26, 32, 0.94);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  }
  .core header {
    display: flex;
    align-items: center;
    gap: 7px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(49, 220, 220, 0.22);
  }
  .c-n {
    font-size: 13px;
    font-weight: 700;
    color: var(--shell-text);
  }
  .c-kind {
    margin-left: auto;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(49, 220, 220, 0.18);
    font-size: 9px;
    font-weight: 700;
    color: var(--bright-cyan);
  }
  .c-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 10.5px;
  }
  .c-k {
    color: var(--shell-faint);
  }
  .c-v {
    margin-right: auto;
    font-weight: 600;
    color: var(--shell-text);
  }
  .c-row .c-k:nth-child(3) {
    margin-left: 0;
  }
  .port {
    position: absolute;
    left: 50%;
    width: 9px;
    height: 9px;
    margin-left: -4.5px;
    border-radius: 50%;
    background: var(--bright-cyan);
    box-shadow: 0 0 0 3px rgba(10, 26, 32, 0.94);
  }
  .port.top {
    top: -4.5px;
  }
  .port.bottom {
    bottom: -4.5px;
  }

  /* placed nodes */
  .node.placed {
    display: flex;
    align-items: stretch;
    border: 1.5px solid var(--glass-line);
    border-radius: var(--radius-xs);
    background: rgba(20, 23, 30, 0.96);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  }
  .node.placed.skill {
    border-radius: 5px;
    border-left-width: 4px;
    border-left-color: rgba(155, 110, 239, 0.85);
    background: rgba(28, 20, 44, 0.96);
  }
  .node.placed.held {
    border-color: var(--summon-green);
  }
  .grip {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 2px 8px 10px;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: grab;
    touch-action: none;
  }
  .p-n {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .p-s {
    overflow: hidden;
    font-size: 10px;
    line-height: 1.3;
    color: var(--shell-meta);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tag {
    flex: none;
    padding: 1px 5px;
    border-radius: 3px;
    background: rgba(155, 110, 239, 0.3);
    font-size: 8.5px;
    font-style: normal;
    font-weight: 700;
    color: rgb(213, 195, 249);
  }
  .off {
    position: relative;
    flex: none;
    width: 24px;
    border: 0;
    border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
    background: transparent;
    font-size: 9px;
    color: var(--shell-meta);
    cursor: pointer;
  }
  /* Drawn at 24px, hit at 44 — a canvas node cannot be 44px tall and still fit
     three of them across, but the target has to be. */
  .off::after {
    content: '';
    position: absolute;
    inset: 50% -6px auto -6px;
    height: var(--control-m);
    transform: translateY(-50%);
  }
  .off:hover {
    color: var(--coral-red);
  }
  .node.ghost {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    border: 2px solid var(--summon-green);
    border-radius: var(--radius-xs);
    background: rgba(20, 23, 30, 0.98);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
    pointer-events: none;
    transform: rotate(-1.5deg);
  }
  .node.ghost .p-s {
    color: var(--summon-green);
  }
  .grip:focus-visible,
  .off:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  /* ---- prompt ---- */
  .brain {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding-top: var(--space-12);
    border-top: 1px solid var(--glass-line-soft);
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-6);
  }
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
  .tab:hover {
    border-color: rgba(49, 220, 220, 0.55);
    color: var(--shell-text);
  }
  .tab.on {
    border-color: transparent;
    background: var(--primary-fill);
    color: var(--static-white);
    font-weight: 600;
  }
  .tab:focus-visible,
  .card:focus-visible,
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
    color: var(--static-white);
  }

  /* ---- palette ---- */
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
  /* A row, not a column: the palette is above the canvas now and a stack of
     full-width cards would push the board off the screen. */
  /* The rail always overflows its column, so the right-hand card is cut. On a
     phone that read as broken rather than as "there is more this way", so the
     cut edge fades out — the affordance every horizontal rail uses. */
  .cards {
    list-style: none;
    margin: 0;
    padding: 0 0 2px;
    display: flex;
    gap: var(--space-8);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent);
  }
  .cards li {
    flex: none;
    width: 208px;
  }
  /* On a phone one card plus a sliver of the next fits; at 208px the second
     card is cut mid-sentence instead, which reads as truncated text rather
     than as a rail. */
  @media (max-width: 520px) {
    .cards li {
      width: 46vw;
    }
  }
  .card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 11px 14px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-xs);
    background: transparent;
    text-align: left;
    cursor: grab;
    touch-action: none;
    transition: var(--transition-base);
  }
  .card:hover {
    border-color: rgba(49, 220, 220, 0.55);
  }
  .card.on {
    border-color: var(--primary-light);
    background: rgba(15, 111, 218, 0.18);
  }
  .card.skill {
    border-radius: 5px;
    border-left-width: 4px;
    border-left-color: rgba(155, 110, 239, 0.55);
  }
  .card.skill.on {
    border-color: rgba(155, 110, 239, 0.65);
    border-left-color: rgb(155, 110, 239);
    background: rgba(122, 62, 234, 0.16);
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

  .tier-d {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--shell-meta);
  }
  /* ---- brains ---- */
  .purposes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6);
  }
  .models {
    display: grid;
    gap: var(--space-8);
  }
  @media (min-width: 720px) {
    .models {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .pv {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: var(--space-12);
    border: 1px solid var(--glass-line-soft);
    border-radius: var(--radius-xs);
  }
  .pv-head {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: 4px;
  }
  .pv-n {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--shell-text);
  }
  .pv-t {
    font-size: 10.5px;
    line-height: 1.45;
    color: var(--shell-meta);
  }
  .model {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: var(--control-m);
    padding: 6px 11px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-full);
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: var(--transition-base);
  }
  .model:hover {
    border-color: rgba(49, 220, 220, 0.55);
  }
  .model.fit {
    border-color: rgba(33, 237, 179, 0.45);
  }
  .model.on {
    border-color: transparent;
    background: var(--primary-fill);
  }
  .m-n {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .model.on .m-n {
    color: var(--static-white);
  }
  .m-fit {
    margin-left: auto;
    flex: none;
    font-size: 9.5px;
    font-weight: 700;
    color: var(--summon-green);
  }
  .model.on .m-fit {
    color: var(--static-white);
  }
  .disclose {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: var(--control-m);
    padding: 0 16px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-full);
    background: transparent;
    font-size: 12px;
    color: var(--shell-body);
    cursor: pointer;
    transition: var(--transition-base);
  }
  .disclose:hover {
    border-color: rgba(49, 220, 220, 0.55);
    color: var(--shell-text);
  }
  .disclose:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  .disclose i {
    font-style: normal;
    font-size: 9px;
    color: var(--shell-meta);
  }
  .p-auto {
    padding: 1px 7px;
    border-radius: 4px;
    background: rgba(33, 237, 179, 0.18);
    font-size: 9.5px;
    font-weight: 700;
    color: var(--summon-green);
  }
  .picked {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px var(--space-10);
    padding: var(--space-12) var(--space-14);
    border-radius: var(--radius-xs);
    background: rgba(15, 111, 218, 0.14);
    border: 1px solid rgba(40, 135, 240, 0.3);
  }
  .p-k {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--shell-faint);
  }
  .p-v {
    font-size: 13px;
    font-weight: 700;
    color: var(--bright-cyan);
  }
  .p-b {
    flex: 1 1 100%;
    margin: 0;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--shell-body);
  }
  .tier-d {
    margin: 0;
    font-size: 11px;
    line-height: 1.55;
    color: var(--shell-faint);
  }
</style>
