<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal, scrub, animate, prefersReduced } from '$lib/anime/motion';
  import { spring } from 'animejs';
  import Mon from '$lib/components/world/Mon.svelte';

  /**
   * Studio, reduced to the one idea that makes it a studio: a core with ports.
   *
   * Tap to plug, not drag. Dragging is what the real editor does, but on a
   * marketing page it fails on touch, fails on keyboard, and fails whenever a
   * visitor tries it at an angle the demo did not anticipate — and the thing
   * being shown is that a specialist is assembled from parts, which a tap
   * carries just as well.
   */
  type PortKey = 'input' | 'tool' | 'skill' | 'output' | 'guard';

  const PORTS = $derived([
    { key: 'input' as PortKey, label: m.make_port_input() },
    { key: 'tool' as PortKey, label: m.make_port_tool() },
    { key: 'skill' as PortKey, label: m.make_port_skill() },
    { key: 'output' as PortKey, label: m.make_port_output() },
    { key: 'guard' as PortKey, label: m.make_port_guard() },
  ]);

  const PARTS = $derived([
    { port: 'input' as PortKey, name: m.make_p_input_1() },
    { port: 'input' as PortKey, name: m.make_p_input_2() },
    { port: 'tool' as PortKey, name: m.make_p_tool_1() },
    { port: 'tool' as PortKey, name: m.make_p_tool_2() },
    { port: 'skill' as PortKey, name: m.make_p_skill_1() },
    { port: 'skill' as PortKey, name: m.make_p_skill_2() },
    { port: 'output' as PortKey, name: m.make_p_output_1() },
    { port: 'output' as PortKey, name: m.make_p_output_2() },
    { port: 'guard' as PortKey, name: m.make_p_guard_1() },
    { port: 'guard' as PortKey, name: m.make_p_guard_2() },
  ]);

  const TIERS = $derived([
    { name: m.make_tier_1(), desc: m.make_tier_1_d(), mana: 4 },
    { name: m.make_tier_2(), desc: m.make_tier_2_d(), mana: 14 },
    { name: m.make_tier_3(), desc: m.make_tier_3_d(), mana: 28 },
  ]);

  let plugged = $state<Record<PortKey, string[]>>({
    input: [],
    tool: [],
    skill: [],
    output: [],
    guard: [],
  });
  let tier = $state(1);
  let core = $state<HTMLElement | null>(null);

  const count = $derived(Object.values(plugged).reduce((n, list) => n + list.length, 0));
  const isPlugged = (part: { port: PortKey; name: string }) =>
    plugged[part.port].includes(part.name);

  function toggle(part: { port: PortKey; name: string }, el: HTMLElement) {
    const list = plugged[part.port];
    if (list.includes(part.name)) {
      plugged[part.port] = list.filter((n) => n !== part.name);
      return;
    }
    // Output is a single choice; the others accept up to three, as in Studio.
    const cap = part.port === 'output' ? 1 : 3;
    plugged[part.port] = [...list.slice(-(cap - 1)), part.name];

    if (prefersReduced()) return;
    // The chip answers where it was tapped, and the core registers the hit.
    animate(el, { scale: [1, 0.92, 1], duration: 420, ease: 'out(3)' });
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
      <!-- The core. Ports are listed, not drawn as wires: a wire diagram at this
           size becomes decoration, while a labelled slot stays legible. -->
      <div class="board hud" use:reveal={{ delay: 60, scale: true }} use:scrub={{ y: 14 }}>
        <div class="core" bind:this={core}>
          <Mon tone="research" size={52} active={count > 0} />
          <div class="core-meta">
            <span class="eyebrow">{m.make_core()}</span>
            <span class="core-t">{TIERS[tier].name}</span>
          </div>
          <span class="core-est tnum"><b translate="no">Mana</b> {TIERS[tier].mana}</span>
        </div>

        <ul class="ports">
          {#each PORTS as port (port.key)}
            <li class:filled={plugged[port.key].length > 0}>
              <span class="port-k">{port.label}</span>
              {#if plugged[port.key].length}
                <span class="port-v">{plugged[port.key].join(' · ')}</span>
              {:else}
                <span class="port-v empty">—</span>
              {/if}
            </li>
          {/each}
        </ul>

        <div class="tally">
          <span class="tnum">{m.make_parts_count()} <b>{count}</b></span>
          <span class="tnum est">{m.make_est()} <b translate="no">Mana</b> {TIERS[tier].mana}</span>
        </div>
      </div>

      <div class="side">
        <div class="palette hud" use:reveal={{ delay: 100 }}>
          <span class="eyebrow">{m.make_palette()}</span>
          <div class="chips">
            {#each PARTS as part (part.name)}
              <button
                type="button"
                class="chip"
                class:on={isPlugged(part)}
                aria-pressed={isPlugged(part)}
                onclick={(e) => toggle(part, e.currentTarget)}
              >
                {part.name}
              </button>
            {/each}
          </div>
        </div>

        <div class="tiers hud" use:reveal={{ delay: 140 }}>
          <div class="tier-head">
            <span class="eyebrow">{m.make_tier()}</span>
            <span class="hint">{m.make_tier_hint()}</span>
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
                <span class="tier-m tnum">Mana {t.mana}</span>
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
      grid-template-columns: minmax(0, 47fr) minmax(0, 53fr);
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
  .core {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    padding: var(--space-14);
    border: 1px solid rgba(49, 220, 220, 0.28);
    border-radius: var(--radius-m);
    background: rgba(31, 206, 206, 0.07);
  }
  .core-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .core-t {
    font-size: 14px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .core-est {
    margin-left: auto;
    flex: none;
    font-size: 15px;
    font-weight: 700;
    color: var(--bright-cyan);
  }
  .core-est b {
    font-size: 11px;
    font-weight: 500;
    color: var(--shell-meta);
  }

  .ports {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .ports li {
    display: flex;
    align-items: baseline;
    gap: var(--space-12);
    padding: 10px 0;
    border-top: 1px dashed var(--glass-line-soft);
  }
  .ports li:first-child {
    border-top: 0;
  }
  .port-k {
    flex: none;
    width: 5.5em;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--gray3);
  }
  .port-v {
    flex: 1;
    min-width: 0;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--shell-text);
  }
  .port-v.empty {
    color: rgba(174, 184, 194, 0.28);
  }
  .ports li.filled .port-k {
    color: var(--summon-cyan);
  }

  .tally {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-12);
    padding-top: var(--space-12);
    border-top: 1px solid var(--glass-line-soft);
    font-size: 11.5px;
    color: var(--shell-meta);
  }
  .tally b {
    color: var(--shell-text);
  }
  .tally .est {
    margin-left: auto;
  }

  .palette,
  .tiers {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding: var(--space-20);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6);
  }
  .chip {
    /* 44, not 34: the palette is the section's whole interaction and every one
       of these is a tap target. */
    height: var(--control-m);
    padding: 0 15px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-full);
    background: transparent;
    font-size: 12px;
    color: var(--shell-body);
    cursor: pointer;
    transition: var(--transition-base);
  }
  .chip:hover {
    border-color: rgba(49, 220, 220, 0.55);
    color: var(--shell-text);
  }
  .chip.on {
    border-color: transparent;
    background: var(--primary-normal);
    color: var(--static-white);
    font-weight: 600;
  }
  .chip:focus-visible,
  .tier:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  .tier-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-8) var(--space-12);
  }
  .hint {
    font-size: 11px;
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
