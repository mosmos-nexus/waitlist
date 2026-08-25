<script lang="ts">
  import MonBlob from '$lib/components/world/MonBlob.svelte';
  import type { MonRole } from '$lib/anime/mon';
  import { m } from '$lib/locale.svelte';
  import { prefersReduced, reveal } from '$lib/anime/motion';

  /**
   * Mosmos, in miniature.
   *
   * Four surfaces from the wireframes, small enough to try in a minute — and
   * sharing one state, which is the whole point. Bring a Mon in from Hub and
   * Inventory grows; hand a task over on Monitor and Mana comes off the same
   * balance Inventory reports. The circulation is not described here, it is the
   * thing you are operating.
   *
   * It replaced four thumbnails revolving behind the island. Those said the
   * surfaces exist; this lets you find out what they do.
   */

  type Surface = 'monitor' | 'hub' | 'inventory' | 'studio';
  const SURFACES: { key: Surface; plate: 'dark' | 'light' }[] = [
    { key: 'monitor', plate: 'dark' },
    { key: 'hub', plate: 'light' },
    { key: 'inventory', plate: 'light' },
    { key: 'studio', plate: 'light' },
  ];
  /** Product surface names are proper nouns and read the same in every locale. */
  const NAME: Record<Surface, string> = {
    monitor: 'Monitor',
    hub: 'Hub',
    inventory: 'Inventory',
    studio: 'Studio',
  };

  let tab = $state<Surface>('monitor');
  let railEl = $state<HTMLDivElement | null>(null);
  const uid = $props.id();
  const tabId = (k: Surface) => `${uid}-tab-${k}`;
  const panelId = (k: Surface) => `${uid}-panel-${k}`;

  const hint = $derived(
    tab === 'monitor'
      ? m.try_hint_monitor()
      : tab === 'hub'
        ? m.try_hint_hub()
        : tab === 'inventory'
          ? m.try_hint_inventory()
          : m.try_hint_studio(),
  );

  // ---- shared state, the part that makes this one product and not four demos ----

  let mana = $state(330);

  type Held = {
    id: string;
    name: () => string;
    role: MonRole;
    source: 'hub' | 'own';
    fav: boolean;
    used: number;
  };
  let held = $state<Held[]>([
    {
      id: 'research',
      name: m.mon_research_name,
      role: 'research',
      source: 'hub',
      fav: true,
      used: 84,
    },
    {
      id: 'organize',
      name: m.mon_organize_name,
      role: 'organize',
      source: 'own',
      fav: false,
      used: 51,
    },
    { id: 'design', name: m.mon_design_name, role: 'design', source: 'own', fav: false, used: 32 },
  ]);

  // ---- Monitor: hand a task over ----

  type Done = { key: string; label: string; role: MonRole; cost: number };
  const QUEUE: { key: string; label: () => string; role: MonRole; cost: number }[] = [
    { key: 't1', label: m.drift_task_1, role: 'research', cost: 12 },
    { key: 't2', label: m.drift_task_2, role: 'organize', cost: 9 },
    { key: 't3', label: m.drift_task_3, role: 'design', cost: 14 },
    { key: 't4', label: m.drift_task_4, role: 'organize', cost: 7 },
  ];
  let doneKeys = $state<string[]>([]);
  let running = $state<string | null>(null);
  const queue = $derived(QUEUE.filter((t) => !doneKeys.includes(t.key) && t.key !== running));
  const flow = $derived<Done[]>(
    doneKeys
      .map((k) => QUEUE.find((t) => t.key === k))
      .filter((t): t is (typeof QUEUE)[number] => !!t)
      .map((t) => ({ key: t.key, label: t.label(), role: t.role, cost: t.cost })),
  );
  const runningTask = $derived(QUEUE.find((t) => t.key === running) ?? null);
  let runTimer: ReturnType<typeof setTimeout> | undefined;

  function handOver(key: string) {
    if (running) return;
    const task = QUEUE.find((t) => t.key === key);
    if (!task) return;
    running = key;
    const settle = prefersReduced() ? 0 : 1100;
    clearTimeout(runTimer);
    runTimer = setTimeout(() => {
      doneKeys = [key, ...doneKeys];
      mana = Math.max(0, mana - task.cost);
      running = null;
    }, settle);
  }

  // ---- Hub: bring one in ----

  const CATALOG: {
    id: string;
    name: () => string;
    role: MonRole;
    verified: boolean;
    cost: string;
  }[] = [
    { id: 'contract', name: m.mon_contract_name, role: 'design', verified: true, cost: '28~42' },
    { id: 'finance', name: m.mon_finance_name, role: 'organize', verified: false, cost: '18~24' },
    { id: 'research2', name: m.mon_research_name, role: 'research', verified: true, cost: '12~20' },
  ];
  let verifiedOnly = $state(false);
  const catalog = $derived(CATALOG.filter((c) => !verifiedOnly || c.verified));

  function bringIn(id: string) {
    const item = CATALOG.find((c) => c.id === id);
    if (!item || held.some((h) => h.id === id)) return;
    held = [...held, { id, name: item.name, role: item.role, source: 'hub', fav: false, used: 0 }];
  }

  // ---- Inventory: keep it close ----

  let favOnly = $state(false);
  const rows = $derived(held.filter((h) => !favOnly || h.fav));
  const toggleFav = (id: string) =>
    (held = held.map((h) => (h.id === id ? { ...h, fav: !h.fav } : h)));

  // ---- Studio: safeguards sit on the boundary ----

  let guardIn = $state(true);
  let guardOut = $state(false);
  const guardCount = $derived((guardIn ? 1 : 0) + (guardOut ? 1 : 0));

  /**
   * Arrow keys move between tabs, which is what a tablist owes the keyboard.
   * The handler sits on the tabs rather than the list: the tabs are what hold
   * focus, so the list itself never needs to be a tab stop.
   */
  function onRailKey(event: KeyboardEvent) {
    const keys = SURFACES.map((s) => s.key);
    const i = keys.indexOf(tab);
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    const next =
      step !== 0
        ? (i + step + keys.length) % keys.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? keys.length - 1
            : -1;
    if (next < 0) return;
    event.preventDefault();
    tab = keys[next];
    railEl?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(tab))}`)?.focus();
  }
</script>

<section class="try section" aria-labelledby="{uid}-title">
  <div class="container inner">
    <div class="head reveal" use:reveal>
      <span class="eyebrow">{m.try_eyebrow()}</span>
      <h2 class="t-heading-1 title prewrap" id="{uid}-title">{m.try_title()}</h2>
      <p class="t-body-1-reading lead">{m.try_lead()}</p>
    </div>

    <div class="console reveal" use:reveal={{ delay: 80, scale: true }}>
      <div class="rail" role="tablist" aria-label="Mosmos" bind:this={railEl}>
        {#each SURFACES as s (s.key)}
          <button
            type="button"
            role="tab"
            id={tabId(s.key)}
            aria-selected={tab === s.key}
            aria-controls={panelId(s.key)}
            tabindex={tab === s.key ? 0 : -1}
            class:on={tab === s.key}
            onclick={() => (tab = s.key)}
            onkeydown={onRailKey}
          >
            <span translate="no">{NAME[s.key]}</span>
          </button>
        {/each}
        <span class="mana" aria-label="Mana">
          <i class="spark" aria-hidden="true"></i><b translate="no">Mana</b>
          <em>{mana}</em>
        </span>
      </div>

      <!-- One panel is mounted at a time; the rest keep their state in the
           component, so moving between surfaces never resets what you did. -->
      <div
        class="screen"
        data-plate={SURFACES.find((s) => s.key === tab)?.plate}
        role="tabpanel"
        id={panelId(tab)}
        aria-labelledby={tabId(tab)}
        tabindex="0"
      >
        {#if tab === 'monitor'}
          <div class="grid mon-grid">
            <section class="pane">
              <h3 class="pane-cap">{m.try_flow()}</h3>
              {#if flow.length === 0}
                <p class="quiet">{m.try_quiet()}</p>
              {:else}
                <ul class="flow">
                  {#each flow as row (row.key)}
                    <li>
                      <span class="chip-mon" data-role={row.role} aria-hidden="true"></span>
                      <span class="flow-label">{row.label}</span>
                      <span class="cost" translate="no">−{row.cost}</span>
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>

            <section class="pane">
              <h3 class="pane-cap">{m.try_now()}</h3>
              {#if runningTask}
                <div class="running">
                  <MonBlob role={runningTask.role} size={40} activity="working" />
                  <div class="running-meta">
                    <span class="flow-label">{runningTask.label()}</span>
                    <span class="running-state">{m.try_running()}</span>
                  </div>
                </div>
              {:else}
                <p class="quiet">{m.try_quiet()}</p>
              {/if}

              <ul class="queue">
                {#each queue as task (task.key)}
                  <li>
                    <span class="flow-label">{task.label()}</span>
                    <button
                      type="button"
                      class="act"
                      disabled={!!running}
                      onclick={() => handOver(task.key)}
                    >
                      {m.try_assign()}
                      <span class="cost" translate="no">{task.cost}</span>
                    </button>
                  </li>
                {/each}
              </ul>
            </section>
          </div>
        {:else if tab === 'hub'}
          <div class="pane">
            <div class="filters">
              <button
                type="button"
                class="pill"
                aria-pressed={verifiedOnly}
                class:on={verifiedOnly}
                onclick={() => (verifiedOnly = !verifiedOnly)}
              >
                {m.try_verified_only()}
              </button>
              <span class="count" translate="no">Mon {catalog.length}</span>
            </div>
            <ul class="cards">
              {#each catalog as item (item.id)}
                {@const owned = held.some((h) => h.id === item.id)}
                <li class="card">
                  <MonBlob role={item.role} size={42} />
                  <div class="card-meta">
                    <span class="card-name">{item.name()}</span>
                    {#if item.verified}
                      <span class="badge">{m.try_verified()}</span>
                    {/if}
                    <span class="card-cost"><b translate="no">Mana</b> {item.cost}</span>
                  </div>
                  <button
                    type="button"
                    class="act"
                    disabled={owned}
                    onclick={() => bringIn(item.id)}
                  >
                    {owned ? m.try_owned() : m.try_bring()}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {:else if tab === 'inventory'}
          <div class="pane">
            <div class="filters">
              <button
                type="button"
                class="pill"
                aria-pressed={favOnly}
                class:on={favOnly}
                onclick={() => (favOnly = !favOnly)}
              >
                {m.try_fav_only()}
              </button>
              <span class="count" translate="no">Mon {rows.length}</span>
            </div>
            {#if rows.length === 0}
              <p class="quiet">{m.try_empty_fav()}</p>
            {:else}
              <ul class="rows">
                {#each rows as row (row.id)}
                  <li>
                    <button
                      type="button"
                      class="star"
                      aria-pressed={row.fav}
                      aria-label="{m.try_star()} · {row.name()}"
                      onclick={() => toggleFav(row.id)}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          d="M10 2.6l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L2.5 8.1l5.2-.8z"
                        />
                      </svg>
                    </button>
                    <span class="card-name">{row.name()}</span>
                    <span class="source">
                      {row.source === 'hub' ? m.try_source_hub() : m.try_source_own()}
                    </span>
                    <span class="used" translate="no">{row.used}</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {:else}
          <div class="pane studio">
            <div class="canvas" aria-hidden="true">
              <svg viewBox="0 0 300 150">
                <path class="edge" d="M52,75H128M172,75H248" />
                <g class="guard-slot" data-on={guardIn}>
                  <circle cx="100" cy="75" r="15" />
                </g>
                <rect class="node" x="128" y="52" width="44" height="46" rx="12" />
                <g class="guard-slot" data-on={guardOut}>
                  <circle cx="200" cy="75" r="15" />
                </g>
                <circle class="port" cx="36" cy="75" r="13" />
                <circle class="port" cx="264" cy="75" r="13" />
              </svg>
            </div>
            <div class="guards">
              <button
                type="button"
                class="pill"
                aria-pressed={guardIn}
                class:on={guardIn}
                onclick={() => (guardIn = !guardIn)}
              >
                {m.try_guard_in()}
              </button>
              <button
                type="button"
                class="pill"
                aria-pressed={guardOut}
                class:on={guardOut}
                onclick={() => (guardOut = !guardOut)}
              >
                {m.try_guard_out()}
              </button>
              <span class="count" translate="no">{guardCount} / 2</span>
            </div>
            <p class="note">{m.try_note_guard()}</p>
          </div>
        {/if}
      </div>

      <p class="hint" aria-live="polite">{hint}</p>
    </div>
  </div>
</section>

<style>
  .try {
    background:
      radial-gradient(80% 60% at 78% 0%, rgba(31, 206, 206, 0.08), transparent 68%), var(--app-bg);
  }
  .inner {
    display: grid;
    gap: var(--space-32);
  }
  @media (min-width: 1040px) {
    .inner {
      grid-template-columns: minmax(0, 38ch) minmax(0, 1fr);
      gap: var(--space-64);
      align-items: center;
    }
  }
  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
  }
  .eyebrow {
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    letter-spacing: 0.04em;
    color: var(--bright-cyan);
  }
  .title {
    color: var(--label-strong);
    text-wrap: balance;
  }
  .lead {
    color: var(--label-alternative);
  }

  /* ---- the console ---- */
  .console {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    min-width: 0;
  }
  .rail {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: 4px;
    border-radius: var(--radius-full);
    background: rgba(16, 22, 32, 0.7);
    border: 1px solid var(--line-normal-normal);
  }
  .rail button {
    min-height: 34px;
    padding: 0 14px;
    border: 0;
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--label-alternative);
    font-size: var(--font-size-caption-1);
    cursor: pointer;
    touch-action: manipulation;
    transition:
      background var(--duration-base) var(--ease-out),
      color var(--duration-base) var(--ease-out);
  }
  .rail button:hover {
    color: var(--label-strong);
    background: var(--fill-weak);
  }
  .rail button.on {
    background: var(--primary-normal);
    color: var(--static-white);
    font-weight: var(--weight-semibold);
  }
  .rail button:focus-visible,
  .screen:focus-visible,
  .act:focus-visible,
  .pill:focus-visible,
  .star:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  .mana {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding-right: var(--space-12);
    font-size: var(--font-size-caption-1);
    color: var(--label-assistive);
  }
  .mana em {
    font-style: normal;
    font-weight: var(--weight-semibold);
    color: var(--bright-cyan);
    /* Ticks down as you hand work over, so the digits must not shift width. */
    font-variant-numeric: tabular-nums;
  }
  .spark {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--summon-cyan);
    box-shadow: 0 0 8px var(--summon-cyan);
  }

  /* Monitor is the world work runs in; the other three are workshop and market.
     The product splits them by theme, so the console does too. */
  .screen {
    min-height: 306px;
    padding: var(--space-16);
    border-radius: var(--radius-l);
    border: 1px solid var(--line-normal-normal);
  }
  .screen[data-plate='dark'] {
    --ink: #dfe8f7;
    --ink-dim: rgba(223, 232, 247, 0.6);
    --edge: rgba(223, 232, 247, 0.14);
    --sunk: rgba(255, 255, 255, 0.04);
    background: #0a1120;
    color: var(--ink);
  }
  .screen[data-plate='light'] {
    --ink: #16324f;
    --ink-dim: rgba(22, 50, 79, 0.62);
    --edge: rgba(22, 50, 79, 0.14);
    --sunk: rgba(22, 50, 79, 0.05);
    background: #eef2f8;
    color: var(--ink);
  }

  .grid {
    display: grid;
    gap: var(--space-12);
  }
  @media (min-width: 720px) {
    .mon-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  .pane {
    min-width: 0;
  }
  .pane-cap {
    margin: 0 0 var(--space-8);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-dim);
  }
  .quiet {
    margin: 0;
    padding: var(--space-12);
    border-radius: var(--radius-m);
    background: var(--sunk);
    font-size: var(--font-size-caption-1);
    color: var(--ink-dim);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .flow li,
  .queue li,
  .rows li,
  .card {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    padding: 8px 10px;
    border-radius: var(--radius-m);
    background: var(--sunk);
  }
  .queue {
    margin-top: var(--space-10);
  }
  .flow-label {
    flex: 1;
    min-width: 0;
    font-size: var(--font-size-caption-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cost {
    font-size: var(--font-size-caption-2);
    font-variant-numeric: tabular-nums;
    color: var(--ink-dim);
  }
  .chip-mon {
    flex: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }
  .chip-mon[data-role='research'] {
    background: var(--mon-research, #8b82f7);
  }
  .chip-mon[data-role='organize'] {
    background: var(--mon-organize, #21edb3);
  }
  .chip-mon[data-role='design'] {
    background: var(--mon-design, #f06a86);
  }

  .running {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    padding: 8px 10px;
    border-radius: var(--radius-m);
    background: var(--sunk);
  }
  .running-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .running-state {
    font-size: var(--font-size-caption-2);
    color: var(--ink-dim);
  }

  .act {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    padding: 0 12px;
    border-radius: var(--radius-full);
    border: 1px solid var(--edge);
    background: transparent;
    color: inherit;
    font-size: var(--font-size-caption-2);
    cursor: pointer;
    touch-action: manipulation;
    transition:
      background var(--duration-base) var(--ease-out),
      border-color var(--duration-base) var(--ease-out);
  }
  .act:hover:not(:disabled) {
    background: var(--sunk);
    border-color: currentColor;
  }
  .act:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .filters {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    margin-bottom: var(--space-10);
  }
  .pill {
    min-height: 30px;
    padding: 0 13px;
    border-radius: var(--radius-full);
    border: 1px solid var(--edge);
    background: transparent;
    color: inherit;
    font-size: var(--font-size-caption-2);
    cursor: pointer;
    touch-action: manipulation;
    transition:
      background var(--duration-base) var(--ease-out),
      border-color var(--duration-base) var(--ease-out);
  }
  .pill:hover {
    background: var(--sunk);
    border-color: currentColor;
  }
  .pill.on {
    background: var(--primary-normal);
    border-color: var(--primary-normal);
    color: var(--static-white);
    font-weight: var(--weight-semibold);
  }
  .count {
    margin-left: auto;
    font-size: var(--font-size-caption-2);
    font-variant-numeric: tabular-nums;
    color: var(--ink-dim);
  }

  .cards {
    gap: 8px;
  }
  .card-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .card-name {
    flex: 1;
    min-width: 0;
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: rgba(33, 237, 179, 0.16);
    font-size: var(--font-size-caption-2);
    color: #0e7a5c;
  }
  .screen[data-plate='dark'] .badge {
    color: var(--summon-green);
  }
  .card-cost {
    font-size: var(--font-size-caption-2);
    font-variant-numeric: tabular-nums;
    color: var(--ink-dim);
  }

  .star {
    flex: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    touch-action: manipulation;
  }
  .star svg {
    width: 17px;
    height: 17px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linejoin: round;
    opacity: 0.45;
    transition:
      fill var(--duration-base) var(--ease-out),
      opacity var(--duration-base) var(--ease-out);
  }
  .star[aria-pressed='true'] svg {
    fill: #f7c948;
    stroke: #f7c948;
    opacity: 1;
  }
  .source {
    font-size: var(--font-size-caption-2);
    color: var(--ink-dim);
  }
  .used {
    font-size: var(--font-size-caption-2);
    font-variant-numeric: tabular-nums;
    color: var(--ink-dim);
  }

  .studio {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
  }
  .canvas {
    padding: var(--space-8);
    border-radius: var(--radius-m);
    background: var(--sunk);
  }
  .canvas svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 168px;
  }
  .edge {
    fill: none;
    stroke: currentColor;
    stroke-opacity: 0.3;
    stroke-width: 2;
    stroke-dasharray: 4 5;
  }
  .node {
    fill: var(--primary-normal);
    fill-opacity: 0.22;
    stroke: var(--primary-normal);
    stroke-width: 1.6;
  }
  .port {
    fill: currentColor;
    fill-opacity: 0.18;
  }
  .guard-slot circle {
    fill: none;
    stroke: currentColor;
    stroke-opacity: 0.3;
    stroke-width: 1.6;
    stroke-dasharray: 3 4;
    transition:
      fill var(--duration-base) var(--ease-out),
      stroke var(--duration-base) var(--ease-out);
  }
  .guard-slot[data-on='true'] circle {
    fill: var(--summon-green);
    fill-opacity: 0.24;
    stroke: var(--summon-green);
    stroke-opacity: 1;
    stroke-dasharray: none;
  }
  .guards {
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }
  .note {
    margin: 0;
    font-size: var(--font-size-caption-2);
    color: var(--ink-dim);
  }

  .hint {
    margin: 0;
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }

  @media (prefers-reduced-motion: reduce) {
    .rail button,
    .act,
    .pill,
    .star svg,
    .guard-slot circle {
      transition: none;
    }
  }
</style>
