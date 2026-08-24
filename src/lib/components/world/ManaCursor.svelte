<script lang="ts">
  import { onMount } from 'svelte';
  import { createAnimatable, animate, utils } from 'animejs';
  import { prefersReduced, hasFinePointer } from '$lib/anime/motion';

  /**
   * The Mana cursor.
   *
   * A bright core dot tracks the pointer almost immediately; a wider ring
   * trails behind on a slower ease, which is what reads as "weight". Elements
   * declare how the cursor should behave near them with `data-cursor`:
   *
   *   data-cursor="poke"  → ring swells, hint label appears
   *   data-cursor="text"  → ring collapses to a caret bar
   *   (a / button / input) → ring tightens and brightens automatically
   *
   * The native pointer is hidden by `body.mana-cursor` in app.css, which this
   * component only adds once it knows the device has a fine pointer and the
   * visitor hasn't asked for reduced motion — so touch and reduced-motion
   * visitors keep their own cursor and none of this runs.
   */

  interface Props {
    /** Label shown when hovering a `data-cursor="poke"` target. */
    pokeHint?: string;
  }

  let { pokeHint = '' }: Props = $props();

  // A fixed pool of sparks, rendered once and reused round-robin. Creating and
  // discarding nodes per click would churn the DOM for no visual gain.
  const SPARK_POOL = 18;
  const SPARKS_PER_CLICK = 6;
  let sparkCursor = 0;

  let dotEl = $state<HTMLDivElement | null>(null);
  let ringEl = $state<HTMLDivElement | null>(null);
  let hintEl = $state<HTMLDivElement | null>(null);
  let sparkLayer = $state<HTMLDivElement | null>(null);

  let active = $state(false);
  let mode = $state<'default' | 'poke' | 'link' | 'text'>('default');
  let visible = $state(false);

  onMount(() => {
    // Touch and reduced-motion visitors keep their own cursor; nothing below
    // runs and the layer stays invisible and inert.
    if (!hasFinePointer() || prefersReduced()) return;
    if (!dotEl || !ringEl) return;

    active = true;
    document.body.classList.add('mana-cursor');

    // Two followers, two lags. The gap between them is the whole effect.
    const dot = createAnimatable(dotEl, { x: 90, y: 90, ease: 'out(3)' });
    const ring = createAnimatable(ringEl, { x: 420, y: 420, ease: 'out(3)' });
    const hint = hintEl ? createAnimatable(hintEl, { x: 520, y: 520, ease: 'out(3)' }) : null;

    let px = 0;
    let py = 0;

    const onMove = (event: PointerEvent) => {
      px = event.clientX;
      py = event.clientY;
      if (!visible) visible = true;
      dot.x(px).y(py);
      ring.x(px).y(py);
      hint?.x(px).y(py);
    };

    // `closest` walks up from the hovered node, so a nested <span> inside a
    // button still resolves to the button's cursor mode.
    const onOver = (event: PointerEvent) => {
      const el = (event.target as Element | null)?.closest?.(
        '[data-cursor],a,button,input,textarea,select,[role="button"]',
      );
      if (!el) {
        mode = 'default';
        return;
      }
      const declared = (el as HTMLElement).dataset?.cursor;
      if (declared === 'poke' || declared === 'text' || declared === 'link') {
        mode = declared;
      } else if (el.matches('input,textarea')) {
        mode = 'text';
      } else {
        mode = 'link';
      }
    };

    const onLeave = () => {
      visible = false;
      mode = 'default';
    };

    // Click scatters a few Mana motes — small, cheap, and it makes every press
    // feel like it landed.
    const onDown = () => {
      animate(ringEl!, {
        scale: [
          { to: 0.72, duration: 120 },
          { to: 1, duration: 420 },
        ],
        ease: 'out(3)',
      });
      if (!sparkLayer) return;
      const pool = sparkLayer.querySelectorAll<HTMLElement>('.spark');
      if (!pool.length) return;

      for (let i = 0; i < SPARKS_PER_CLICK; i++) {
        const spark = pool[(sparkCursor + i) % pool.length];
        const angle = (i / SPARKS_PER_CLICK) * Math.PI * 2 + utils.random(-0.4, 0.4, 2);
        const reach = utils.random(26, 54);
        utils.set(spark, { x: px, y: py, opacity: 1, scale: 1 });
        animate(spark, {
          x: px + Math.cos(angle) * reach,
          y: py + Math.sin(angle) * reach,
          opacity: 0,
          scale: 0.2,
          duration: utils.random(520, 820),
          ease: 'out(3)',
        });
      }
      sparkCursor = (sparkCursor + SPARKS_PER_CLICK) % pool.length;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    return () => {
      document.body.classList.remove('mana-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      dot.revert();
      ring.revert();
      hint?.revert();
    };
  });
</script>

<!-- Always rendered so the bindings exist by the time onMount decides whether
     to take the cursor over. The layer is pointer-events:none and opacity:0
     until it actually activates. -->
<div class="mana-layer" aria-hidden="true" class:visible={active && visible}>
  <div class="sparks" bind:this={sparkLayer}>
    {#each Array(SPARK_POOL) as _, i (i)}
      <span class="spark"></span>
    {/each}
  </div>
  <div class="ring" bind:this={ringEl} data-mode={mode}></div>
  <div class="dot" bind:this={dotEl} data-mode={mode}></div>
  {#if pokeHint}
    <div class="hint" bind:this={hintEl} class:show={mode === 'poke'}>{pokeHint}</div>
  {/if}
</div>

<style>
  .mana-layer {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--duration-slow) var(--ease-out);
  }
  .mana-layer.visible {
    opacity: 1;
  }

  .dot,
  .ring,
  .hint {
    position: fixed;
    left: 0;
    top: 0;
    will-change: transform;
  }

  .dot {
    width: 7px;
    height: 7px;
    margin: -3.5px 0 0 -3.5px;
    border-radius: 50%;
    background: var(--bright-cyan);
    box-shadow:
      0 0 12px rgba(49, 220, 220, 0.95),
      0 0 28px rgba(31, 206, 206, 0.5);
    transition:
      width var(--duration-slow) var(--ease-out),
      height var(--duration-slow) var(--ease-out),
      margin var(--duration-slow) var(--ease-out),
      border-radius var(--duration-slow) var(--ease-out),
      background var(--duration-slow) var(--ease-out);
  }
  .dot[data-mode='poke'] {
    width: 5px;
    height: 5px;
    margin: -2.5px 0 0 -2.5px;
    background: var(--summon-green);
    box-shadow: 0 0 14px rgba(33, 237, 179, 0.95);
  }
  .dot[data-mode='text'] {
    width: 2px;
    height: 22px;
    margin: -11px 0 0 -1px;
    border-radius: 1px;
  }

  .ring {
    width: 34px;
    height: 34px;
    margin: -17px 0 0 -17px;
    border-radius: 50%;
    border: 1px solid rgba(49, 220, 220, 0.55);
    background: rgba(31, 206, 206, 0.06);
    backdrop-filter: saturate(1.3);
    transition:
      width var(--duration-slow) var(--ease-out),
      height var(--duration-slow) var(--ease-out),
      margin var(--duration-slow) var(--ease-out),
      border-color var(--duration-slow) var(--ease-out),
      background var(--duration-slow) var(--ease-out),
      opacity var(--duration-slow) var(--ease-out);
  }
  .ring[data-mode='poke'] {
    width: 74px;
    height: 74px;
    margin: -37px 0 0 -37px;
    border-color: rgba(33, 237, 179, 0.6);
    background: rgba(33, 237, 179, 0.08);
  }
  .ring[data-mode='link'] {
    width: 48px;
    height: 48px;
    margin: -24px 0 0 -24px;
    border-color: rgba(139, 190, 247, 0.75);
    background: rgba(44, 137, 240, 0.1);
  }
  .ring[data-mode='text'] {
    opacity: 0;
  }

  .hint {
    margin: 46px 0 0 0;
    transform-origin: center;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    background: rgba(20, 23, 27, 0.86);
    border: 1px solid rgba(33, 237, 179, 0.32);
    color: var(--label-normal);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-medium);
    white-space: nowrap;
    translate: -50% 0;
    opacity: 0;
    transition: opacity var(--duration-base) var(--ease-out);
  }
  .hint.show {
    opacity: 1;
  }

  .spark {
    position: fixed;
    left: 0;
    top: 0;
    opacity: 0;
    width: 4px;
    height: 4px;
    margin: -2px 0 0 -2px;
    border-radius: 50%;
    background: var(--summon-cyan);
    box-shadow: 0 0 8px rgba(31, 206, 206, 0.9);
    will-change: transform, opacity;
  }
</style>
