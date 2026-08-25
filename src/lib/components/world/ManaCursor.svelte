<script lang="ts">
  import { onMount } from 'svelte';
  import { createAnimatable, animate } from 'animejs';
  import { prefersReduced, hasFinePointer } from '$lib/anime/world';

  /**
   * The pointer, as a drop of Mana.
   *
   * Two parts moving at different rates: a hard core that tracks the device
   * exactly, and a ring that lags behind it. The lag is the whole effect — it
   * is the same trick the world layers use, so the cursor belongs to the scene
   * rather than sitting on top of it.
   *
   * Only fine pointers get this. A touch device has no cursor to replace, and
   * hiding the system cursor on a trackpad-less machine would strand anyone who
   * needs it — so the native cursor is only suppressed once this is live.
   */
  let core = $state<HTMLElement | null>(null);
  let ring = $state<HTMLElement | null>(null);
  let live = $state(false);

  onMount(() => {
    if (prefersReduced() || !hasFinePointer() || !core || !ring) return;

    // Two animatables, two speeds. `createAnimatable` keeps one writer per
    // element, which is what stops the hover pulse from fighting the follow.
    // Captured locally: `$state` bindings narrow at the check but not inside
    // the listeners below, and these two never change after mount.
    const coreEl = core;
    const ringEl = ring;
    const coreDriver = createAnimatable(coreEl, { x: 0, y: 0, ease: 'out(3)' });
    const ringDriver = createAnimatable(ringEl, { x: 320, y: 320, ease: 'out(3)' });

    let shown = false;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (!shown) {
        shown = true;
        live = true;
        document.documentElement.classList.add('orb-cursor');
      }
      coreDriver.x(event.clientX).y(event.clientY);
      ringDriver.x(event.clientX).y(event.clientY);
    };

    // Scale lives on the inner span so the follow transform is never touched.
    const inner = ringEl.firstElementChild as HTMLElement;

    /**
     * Three states, not two.
     *
     * `text` is the one that was missing. Over a field the orb replaced the
     * system I-beam with a 57px ring sitting inside the box — on the one control
     * the page exists to collect. The caret is the strongest signal that
     * something can be typed into, so there the orb steps aside entirely and CSS
     * hands the native cursor back.
     */
    const TEXT_FIELD =
      'textarea, input:not([type]), ' +
      'input[type=text], input[type=email], input[type=search], ' +
      'input[type=tel], input[type=url], input[type=password], input[type=number]';

    type Mode = 'idle' | 'hot' | 'text';
    let mode: Mode = 'idle';
    // Written imperatively rather than through a class: a class only added at
    // runtime is invisible to Svelte's selector analysis, so the rule for it
    // gets pruned from the scoped stylesheet as unused.
    const setMode = (next: Mode) => {
      if (next === mode) return;
      mode = next;
      const hot = next === 'hot';
      inner.style.borderColor = hot ? 'rgba(49,220,220,.85)' : 'rgba(49,220,220,.45)';
      inner.style.background = hot ? 'rgba(31,206,206,.14)' : 'rgba(15,111,218,.08)';
      // 1.5, not 1.9: at 57px the ring stopped reading as a cursor and started
      // reading as a component.
      animate(inner, {
        scale: next === 'text' ? 0.4 : hot ? 1.5 : 1,
        opacity: next === 'text' ? 0 : 1,
        duration: 380,
        ease: 'out(3)',
      });
      animate(coreEl, { opacity: next === 'text' ? 0 : 1, duration: 280, ease: 'out(3)' });
    };

    const modeFor = (t: EventTarget | null): Mode => {
      if (!(t instanceof Element)) return 'idle';
      // Only fields you type into. A range or a checkbox is a control you aim
      // at, so it keeps the ring.
      if (t.closest(TEXT_FIELD)) return 'text';
      return t.closest('a, button, select, label, [role="button"], [tabindex]') ? 'hot' : 'idle';
    };
    const onOver = (e: PointerEvent) => setMode(modeFor(e.target));
    const onDown = () => {
      if (mode !== 'text') animate(inner, { scale: 0.7, duration: 140, ease: 'out(2)' });
    };
    const onUp = (e: PointerEvent) => {
      const next = modeFor(e.target);
      if (next === 'text') return;
      animate(inner, { scale: next === 'hot' ? 1.5 : 1, duration: 320, ease: 'out(3)' });
    };

    const onLeave = () => {
      live = false;
      document.documentElement.classList.remove('orb-cursor');
      shown = false;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      document.documentElement.classList.remove('orb-cursor');
      coreDriver.revert();
      ringDriver.revert();
    };
  });
</script>

<div class="orb" class:live aria-hidden="true">
  <div class="ring" bind:this={ring}><span></span></div>
  <div class="core" bind:this={core}><span></span></div>
</div>

<style>
  .orb {
    position: fixed;
    inset: 0;
    z-index: 90;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--duration-slow) var(--ease-out);
  }
  .orb.live {
    opacity: 1;
  }

  .core,
  .ring {
    position: absolute;
    left: 0;
    top: 0;
    /* The follow transform is written by anime.js, so the −50% centring has to
       live on the child instead of on this element. */
    width: 0;
    height: 0;
  }
  .core span,
  .ring span {
    position: absolute;
    display: block;
    border-radius: 50%;
    translate: -50% -50%;
  }
  .core span {
    width: 6px;
    height: 6px;
    background: var(--bright-cyan);
    box-shadow: 0 0 10px rgba(49, 220, 220, 0.9);
  }
  .ring span {
    width: 30px;
    height: 30px;
    border: 1.5px solid rgba(49, 220, 220, 0.45);
    background: rgba(15, 111, 218, 0.08);
    transition:
      border-color var(--duration-base) var(--ease-out),
      background var(--duration-base) var(--ease-out);
  }
  @media (hover: none), (pointer: coarse) {
    .orb {
      display: none;
    }
  }
</style>
