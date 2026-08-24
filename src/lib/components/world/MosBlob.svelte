<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, spring, utils, stagger } from 'animejs';
  import { createBlob, type BlobHandle } from '$lib/anime/blob';
  import type { MosMood } from '$lib/anime/mos';
  import { MOS_MOOD } from '$lib/anime/mos';
  import {
    prefersReduced,
    hasFinePointer,
    bindVisibility,
    bindViewport,
    isCompactViewport,
  } from '$lib/anime/motion';

  interface Props {
    /** Rendered width in px; height follows the viewBox ratio. */
    size?: number;
    /**
     * Body energy, aura tint and resting expression:
     *   idle    — calm face, cyan aura
     *   working — busier body, Summon Green aura, green glob lit
     *   resting — slow, dim, half-lidded
     *   happy   — calm energy but holding the ^^ face
     */
    mood?: MosMood;
    /** Fires after a poke, so the hero can swap its speech line. */
    onpoke?: () => void;
    /** Accessible label for the interactive body. */
    label?: string;
  }

  let { size = 272, mood = 'idle', onpoke, label = 'Mos' }: Props = $props();

  const uid = $props.id();
  const g = (name: string) => `${name}-${uid}`;

  // Blob geometry — matches the Monitor scene so the character reads identically.
  const CX = 452;
  const CY = 430;
  const R = 192;
  const POKE_R = 176;

  let rootEl = $state<HTMLDivElement | null>(null);
  let svgEl = $state<SVGSVGElement | null>(null);
  let wrapEl = $state<HTMLDivElement | null>(null);
  let auraEl = $state<HTMLDivElement | null>(null);
  let shadowEl = $state<HTMLDivElement | null>(null);
  let blob: BlobHandle | null = null;

  /** Inside the svg — the body, face and poke effects. */
  const q = <T extends Element>(sel: string): T[] =>
    svgEl ? Array.from(svgEl.querySelectorAll<T>(sel)) : [];
  /** Anywhere in the component — the halo rings live outside the svg. */
  const qRoot = <T extends Element>(sel: string): T[] =>
    rootEl ? Array.from(rootEl.querySelectorAll<T>(sel)) : [];

  let pokeTimer: ReturnType<typeof setTimeout> | undefined;

  function poke(event?: MouseEvent | KeyboardEvent) {
    if (!svgEl || !blob) return;
    onpoke?.();
    if (prefersReduced()) return;

    clearTimeout(pokeTimer);

    // Screen point → SVG user units, so the reaction lands under the finger.
    let px = CX;
    let py = CY;
    if (event && 'clientX' in event && svgEl.getScreenCTM) {
      const m = svgEl.getScreenCTM();
      if (m) {
        const p = svgEl.createSVGPoint();
        p.x = event.clientX;
        p.y = event.clientY;
        const local = p.matrixTransform(m.inverse());
        px = local.x;
        py = local.y;
      }
    }
    const angle = Math.atan2(py - CY, px - CX);
    const dist = Math.min(1, Math.hypot(px - CX, py - CY) / POKE_R);
    const at = (el: Element, x: number, y: number) => {
      el.setAttribute('cx', String(x));
      el.setAttribute('cy', String(y));
    };

    // Light, not linework: each wave is a soft radial band in the body's own
    // blues that simply scales outward, so it blends into the internal gradient
    // instead of drawing a ring on top of it.
    const [dip] = q('[data-anim="press-dip"]');
    if (dip) {
      at(dip, px, py);
      utils.set(dip, { opacity: 0.85, scale: 0.34 });
      animate(dip, { scale: 1, duration: 380, ease: 'out(2)' });
      animate(dip, { opacity: 0, scale: 1.55, duration: 1250, delay: 320, ease: 'inOut(2)' });
    }
    const [bloom] = q('[data-anim="press-bloom"]');
    if (bloom) {
      at(bloom, px - Math.cos(angle) * 10, py - Math.sin(angle) * 10 - 4);
      utils.set(bloom, { opacity: 0.8, scale: 0.4 });
      animate(bloom, { scale: 1.4, opacity: 0, duration: 1300, ease: 'out(2)' });
    }
    q('[data-anim="poke-wave"]').forEach((w, i) => {
      at(w, px, py);
      utils.set(w, { opacity: 0, scale: 0.18 });
      animate(w, {
        scale: 1.1 + i * 0.34,
        duration: 1500 + i * 420,
        delay: 70 + i * 230,
        ease: 'out(2)',
      });
      animate(w, {
        opacity: [
          { to: 0.85 - i * 0.16, duration: 260 },
          { to: 0, duration: 1250 + i * 360 },
        ],
        delay: 70 + i * 230,
        ease: 'inOut(2)',
      });
    });

    // The liquid inside slides away from the finger, then eases home.
    q('[data-anim="mos-glob"]').forEach((glob, i) => {
      const push = (17 - i * 2) * (0.55 + dist * 0.45);
      animate(glob, {
        translateX: [
          { to: Math.cos(angle) * push, duration: 330 },
          { to: 0, duration: 1900 },
        ],
        translateY: [
          { to: Math.sin(angle) * push, duration: 330 },
          { to: 0, duration: 1900 },
        ],
        delay: i * 70,
        ease: spring({ stiffness: 34, damping: 7 }),
      });
    });

    animate(svgEl, {
      scaleX: [
        { to: 1 - 0.05 * dist, duration: 200 },
        { to: 1, duration: 1500 },
      ],
      scaleY: [
        { to: 1 + 0.05 * dist, duration: 200 },
        { to: 1, duration: 1500 },
      ],
      ease: spring({ stiffness: 38, damping: 6 }),
    });

    if (wrapEl) {
      animate(wrapEl, {
        x: [
          { to: Math.cos(angle) * 6 * dist, duration: 240 },
          { to: 0, duration: 1800 },
        ],
        y: [
          { to: Math.sin(angle) * 6 * dist, duration: 240 },
          { to: 0, duration: 1800 },
        ],
        ease: spring({ stiffness: 30, damping: 5.5 }),
      });
      animate(wrapEl, {
        rotate: [
          { to: Math.cos(angle) * 2.4 * dist, duration: 300 },
          { to: 0, duration: 1900 },
        ],
        ease: spring({ stiffness: 34, damping: 6 }),
      });
    }

    blob.squish(px - CX, py - CY, dist);

    // Face: calm → happy → calm.
    animate(q('[data-anim="mos-calm"]'), { opacity: [1, 0], duration: 110, ease: 'out(2)' });
    animate(q('[data-anim="mos-happy"]'), { opacity: [0, 1], duration: 240, ease: 'out(3)' });
    pokeTimer = setTimeout(() => {
      animate(q('[data-anim="mos-happy"]'), { opacity: 0, duration: 220, ease: 'in(2)' });
      animate(q('[data-anim="mos-calm"]'), { opacity: 1, duration: 260, ease: 'out(2)' });
    }, 1500);
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      poke(event);
    }
  }

  onMount(() => {
    if (!svgEl) return;

    const reduced = prefersReduced();
    const cleanups: (() => void)[] = [];

    // A phone renders the body at roughly half the size, where half the ring
    // samples are indistinguishable — and the path rewrite is the single most
    // expensive thing on the page.
    const compact = isCompactViewport();

    blob = createBlob({
      targets: [
        svgEl.querySelector<SVGElement>('[data-anim="mos-clip-path"]'),
        svgEl.querySelector<SVGElement>('[data-anim="mos-fill"]'),
        svgEl.querySelector<SVGElement>('[data-anim="mos-rim"]'),
      ],
      cx: CX,
      cy: CY,
      radius: R,
      points: compact ? 64 : 112,
      frameRate: compact ? 30 : 40,
    });

    if (reduced) {
      // One frame of the silhouette, then stop the clock entirely.
      for (const i of blob.instances) i.pause();
      return () => blob?.destroy();
    }

    const loops: { play: () => void; pause: () => void }[] = [...blob.instances];
    const keep = <T extends { play: () => void; pause: () => void }>(a: T) => {
      loops.push(a);
      return a;
    };

    // Float, shadow, aura — the "alive at rest" layer.
    keep(
      animate(wrapEl!, {
        translateY: [0, -15],
        duration: 2800,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );
    if (shadowEl) {
      keep(
        animate(shadowEl, {
          scale: [1, 0.88],
          opacity: [0.55, 0.34],
          duration: 2800,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
        }),
      );
    }
    if (auraEl) {
      keep(
        animate(auraEl, {
          scale: [1, 1.09],
          opacity: [0.5, 0.82],
          duration: 3200,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
        }),
      );
    }

    keep(
      animate(svgEl, {
        rotate: [-7, 7],
        duration: 19000,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );
    keep(
      animate(q('[data-anim="mos-body"]'), {
        scaleX: [1, 1.045],
        scaleY: [1, 0.955],
        duration: 3400,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );

    // Inner globs circle inside the clip, giving the body its liquid interior.
    q<SVGCircleElement>('[data-anim="mos-glob"]').forEach((el) => {
      const orbit = parseFloat(el.dataset.orbit ?? '0') || 0;
      const phase = ((parseFloat(el.dataset.phase ?? '0') || 0) * Math.PI) / 180;
      const dir = parseFloat(el.dataset.dir ?? '1') || 1;
      const duration = parseFloat(el.dataset.dur ?? '9000') || 9000;
      const steps = 5;
      const cxKeys = [];
      const cyKeys = [];
      for (let s = 1; s <= steps; s++) {
        const a = phase + dir * (s / steps) * Math.PI * 2;
        cxKeys.push({ to: CX + orbit * Math.cos(a), duration: duration / steps });
        cyKeys.push({ to: CY + orbit * Math.sin(a) * 0.74, duration: duration / steps });
      }
      utils.set(el, {
        cx: CX + orbit * Math.cos(phase),
        cy: CY + orbit * Math.sin(phase) * 0.74,
      });
      keep(animate(el, { cx: cxKeys, duration, loop: true, ease: 'linear' }));
      keep(animate(el, { cy: cyKeys, duration, loop: true, ease: 'linear' }));
    });

    // Blink.
    keep(
      animate(q('[data-anim="mos-eye"]'), {
        scaleY: [
          { to: 1, duration: 1400 },
          { to: 0.08, duration: 90 },
          { to: 1, duration: 130 },
        ],
        loop: true,
        loopDelay: 2600,
        ease: 'inOut(2)',
      }),
    );

    keep(
      animate(qRoot('[data-anim="ring-pulse"]'), {
        opacity: [0, 0.55, 0],
        scale: [0.9, 1.14],
        duration: 3600,
        loop: true,
        delay: stagger(1500),
        ease: 'out(2)',
      }),
    );

    // Gaze — the face leans toward the cursor. This is the cheap trick that
    // makes the character feel like it noticed you.
    if (hasFinePointer()) {
      const face = q('[data-anim="mos-face"]')[0];
      const onMove = (event: PointerEvent) => {
        if (!svgEl || !face) return;
        const rect = svgEl.getBoundingClientRect();
        const nx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const ny = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        animate(face, {
          translateX: clamp(nx) * 16,
          translateY: clamp(ny) * 12,
          duration: 900,
          ease: 'out(3)',
        });
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      cleanups.push(() => window.removeEventListener('pointermove', onMove));
    }

    cleanups.push(bindVisibility(loops));
    if (wrapEl) cleanups.push(bindViewport(wrapEl, loops));

    return () => {
      clearTimeout(pokeTimer);
      for (const c of cleanups) c();
      blob?.destroy();
      blob = null;
    };
  });

  // Mood drives energy, aura tint and resting face. Reactive so a parent can
  // flip it mid-scene and the same body reads as a different state.
  $effect(() => {
    const spec = MOS_MOOD[mood];
    if (blob && !prefersReduced()) blob.setEnergy(spec.energy);
    if (auraEl) auraEl.style.background = spec.aura;
    if (!svgEl) return;

    utils.set(Array.from(svgEl.querySelectorAll('[data-anim="mos-glob"][data-tone="green"]')), {
      opacity: spec.greenGlob,
    });

    // `happy` holds the ^^ face; every other mood rests on the calm one. A
    // poke still overrides this for its own 1.5s window.
    if (prefersReduced()) {
      utils.set(q('[data-anim="mos-happy"]'), { opacity: spec.happyFace ? 1 : 0 });
      utils.set(q('[data-anim="mos-calm"]'), { opacity: spec.happyFace ? 0 : 1 });
    } else {
      animate(q('[data-anim="mos-happy"]'), {
        opacity: spec.happyFace ? 1 : 0,
        duration: 300,
        ease: 'out(3)',
      });
      animate(q('[data-anim="mos-calm"]'), {
        opacity: spec.happyFace ? 0 : 1,
        duration: 300,
        ease: 'out(3)',
      });
    }
  });
</script>

<div class="mos" bind:this={rootEl} style="--mos-w:{size}px">
  <div class="shadow" bind:this={shadowEl}></div>
  <div class="ring" data-anim="ring-pulse"></div>
  <div class="ring ring-green" data-anim="ring-pulse"></div>

  <div class="wrap" bind:this={wrapEl}>
    <div class="aura" bind:this={auraEl}></div>

    <svg
      bind:this={svgEl}
      viewBox="216 220 476 406"
      role="button"
      tabindex="0"
      aria-label={label}
      data-cursor="poke"
      onclick={poke}
      onkeydown={onKey}
    >
      <defs>
        <clipPath id={g('mos-clip')}>
          <path
            data-anim="mos-clip-path"
            d="M{CX - R},{CY}a{R},{R} 0 1,0 {R * 2},0a{R},{R} 0 1,0 -{R * 2},0"
          />
        </clipPath>
        <linearGradient id={g('mos-base')} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stop-color="#2E6FC8" />
          <stop offset="1" stop-color="#0F2F5E" />
        </linearGradient>
        <linearGradient id={g('mos-rim')} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stop-color="#ECEDF6" stop-opacity="0.8" />
          <stop offset="0.55" stop-color="#31DCDC" stop-opacity="0.42" />
          <stop offset="1" stop-color="#0F6FDA" stop-opacity="0.28" />
        </linearGradient>
        <radialGradient id={g('glob-1')}>
          <stop offset="0" stop-color="#1B7BE8" stop-opacity="0.95" />
          <stop offset="0.5" stop-color="#1B7BE8" stop-opacity="0.6" />
          <stop offset="1" stop-color="#1B7BE8" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('glob-2')}>
          <stop offset="0" stop-color="#3D8BEE" stop-opacity="0.9" />
          <stop offset="0.5" stop-color="#3D8BEE" stop-opacity="0.5" />
          <stop offset="1" stop-color="#3D8BEE" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('glob-3')}>
          <stop offset="0" stop-color="#31DCDC" stop-opacity="0.85" />
          <stop offset="0.5" stop-color="#31DCDC" stop-opacity="0.42" />
          <stop offset="1" stop-color="#31DCDC" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('glob-4')}>
          <stop offset="0" stop-color="#6D4BD8" stop-opacity="0.8" />
          <stop offset="0.5" stop-color="#6D4BD8" stop-opacity="0.36" />
          <stop offset="1" stop-color="#6D4BD8" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('glob-5')}>
          <stop offset="0" stop-color="#21EDB3" stop-opacity="0.8" />
          <stop offset="0.5" stop-color="#21EDB3" stop-opacity="0.34" />
          <stop offset="1" stop-color="#21EDB3" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('gloss')}>
          <stop offset="0" stop-color="#F7F8F9" stop-opacity="0.34" />
          <stop offset="0.6" stop-color="#F7F8F9" stop-opacity="0.12" />
          <stop offset="1" stop-color="#F7F8F9" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('shade')}>
          <stop offset="0" stop-color="#06101F" stop-opacity="0.5" />
          <stop offset="0.6" stop-color="#06101F" stop-opacity="0.2" />
          <stop offset="1" stop-color="#06101F" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('poke-press')}>
          <stop offset="0" stop-color="#0B3A6B" stop-opacity="0.4" />
          <stop offset="0.66" stop-color="#0B3A6B" stop-opacity="0.16" />
          <stop offset="1" stop-color="#0B3A6B" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('poke-lift')}>
          <stop offset="0" stop-color="#8FD8FF" stop-opacity="0.34" />
          <stop offset="0.72" stop-color="#8FD8FF" stop-opacity="0.08" />
          <stop offset="1" stop-color="#8FD8FF" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('band-1')}>
          <stop offset="0" stop-color="#7FC4FF" stop-opacity="0" />
          <stop offset="0.58" stop-color="#7FC4FF" stop-opacity="0.06" />
          <stop offset="0.84" stop-color="#AEE4FF" stop-opacity="0.5" />
          <stop offset="1" stop-color="#AEE4FF" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('band-2')}>
          <stop offset="0" stop-color="#31DCDC" stop-opacity="0" />
          <stop offset="0.62" stop-color="#31DCDC" stop-opacity="0.05" />
          <stop offset="0.86" stop-color="#5FE6E6" stop-opacity="0.36" />
          <stop offset="1" stop-color="#5FE6E6" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('band-3')}>
          <stop offset="0" stop-color="#3D8BEE" stop-opacity="0" />
          <stop offset="0.68" stop-color="#3D8BEE" stop-opacity="0.04" />
          <stop offset="0.9" stop-color="#79B6FF" stop-opacity="0.24" />
          <stop offset="1" stop-color="#79B6FF" stop-opacity="0" />
        </radialGradient>
      </defs>

      <g data-anim="mos-body">
        <path data-anim="mos-fill" fill="url(#{g('mos-base')})" d="" />

        <g data-anim="mos-flow" clip-path="url(#{g('mos-clip')})" style="pointer-events:none">
          <circle
            data-anim="mos-glob"
            data-tone="blue"
            data-orbit="30"
            data-phase="0"
            data-dur="14000"
            data-dir="1"
            cx={CX}
            cy={CY}
            r="176"
            fill="url(#{g('glob-1')})"
            opacity="0.95"
          />
          <circle
            data-anim="mos-glob"
            data-tone="light"
            data-orbit="78"
            data-phase="40"
            data-dur="9200"
            data-dir="1"
            cx={CX}
            cy={CY}
            r="140"
            fill="url(#{g('glob-2')})"
            opacity="0.9"
          />
          <circle
            data-anim="mos-glob"
            data-tone="cyan"
            data-orbit="62"
            data-phase="130"
            data-dur="7600"
            data-dir="-1"
            cx={CX}
            cy={CY}
            r="126"
            fill="url(#{g('glob-3')})"
            opacity="0.8"
          />
          <circle
            data-anim="mos-glob"
            data-tone="purple"
            data-orbit="92"
            data-phase="215"
            data-dur="11800"
            data-dir="-1"
            cx={CX}
            cy={CY}
            r="118"
            fill="url(#{g('glob-4')})"
            opacity="0.7"
          />
          <circle
            data-anim="mos-glob"
            data-tone="green"
            data-orbit="50"
            data-phase="300"
            data-dur="8400"
            data-dir="1"
            cx={CX}
            cy={CY}
            r="104"
            fill="url(#{g('glob-5')})"
            opacity="0.42"
          />
          <ellipse cx="368" cy="318" rx="132" ry="96" fill="url(#{g('gloss')})" />
          <ellipse cx="536" cy="566" rx="150" ry="104" fill="url(#{g('shade')})" />
        </g>

        <path
          data-anim="mos-rim"
          style="pointer-events:none"
          fill="none"
          stroke="url(#{g('mos-rim')})"
          stroke-width="3.4"
          d=""
        />
      </g>

      <g data-anim="poke-fx" clip-path="url(#{g('mos-clip')})" style="pointer-events:none">
        <circle
          data-anim="press-dip"
          cx={CX}
          cy={CY}
          r="40"
          fill="url(#{g('poke-press')})"
          opacity="0"
        />
        <circle
          data-anim="press-bloom"
          cx={CX}
          cy={CY}
          r="34"
          fill="url(#{g('poke-lift')})"
          opacity="0"
        />
        <circle
          data-anim="poke-wave"
          cx={CX}
          cy={CY}
          r="90"
          fill="url(#{g('band-1')})"
          opacity="0"
        />
        <circle
          data-anim="poke-wave"
          cx={CX}
          cy={CY}
          r="90"
          fill="url(#{g('band-2')})"
          opacity="0"
        />
        <circle
          data-anim="poke-wave"
          cx={CX}
          cy={CY}
          r="90"
          fill="url(#{g('band-3')})"
          opacity="0"
        />
      </g>

      <g data-anim="mos-face" style="pointer-events:none">
        <g fill="none" stroke="#0B1B33" stroke-linecap="round" opacity="0.88">
          <g data-anim="mos-calm">
            <g data-anim="mos-eye">
              <line x1="423.5" y1="399.07" x2="423.5" y2="420.32" stroke-width="8" />
            </g>
            <g data-anim="mos-eye">
              <line x1="496.61" y1="399.07" x2="496.61" y2="420.32" stroke-width="8" />
            </g>
          </g>
          <path d="M460.25,427.67c1.6,9.93,11.76,16.53,22.72,14.76" stroke-width="6" />
          <path d="M460.25,427.67c-1.6,9.93-11.76,16.53-22.72,14.76" stroke-width="6" />
        </g>
        <g
          data-anim="mos-happy"
          fill="none"
          stroke="#0B1B33"
          stroke-linecap="round"
          stroke-width="7.5"
          opacity="0"
        >
          <path d="M414,398l13,11l-13,11" />
          <path d="M506,398l-13,11l13,11" />
        </g>
      </g>
    </svg>
  </div>
</div>

<style>
  .mos {
    position: relative;
    width: var(--mos-w);
    aspect-ratio: 476 / 406;
    display: grid;
    place-items: center;
    isolation: isolate;
  }

  .wrap {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }

  svg {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    overflow: visible;
    transform-box: fill-box;
    transform-origin: center;
  }
  svg:focus-visible {
    outline: 2px solid var(--bright-cyan);
    outline-offset: 8px;
    border-radius: var(--radius-l);
  }

  .aura {
    position: absolute;
    left: 50%;
    top: 52%;
    transform: translate(-50%, -50%);
    width: 92%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      rgba(31, 206, 206, 0.3),
      rgba(15, 111, 218, 0.16) 58%,
      transparent
    );
    opacity: 0.6;
    pointer-events: none;
  }

  .shadow {
    position: absolute;
    left: 50%;
    bottom: -6%;
    transform: translateX(-50%);
    width: 68%;
    height: 16%;
    border-radius: 50%;
    background: radial-gradient(closest-side, rgba(0, 0, 0, 0.6), transparent);
    opacity: 0.55;
    pointer-events: none;
  }

  .ring {
    position: absolute;
    left: 50%;
    bottom: 2%;
    transform: translateX(-50%);
    width: 108%;
    height: 26%;
    border-radius: 50%;
    border: 1px solid rgba(49, 220, 220, 0.3);
    opacity: 0;
    pointer-events: none;
  }
  .ring-green {
    border-color: rgba(33, 237, 179, 0.24);
  }

  /* Poke effects scale from their own centre */
  svg :global([data-anim='press-dip']),
  svg :global([data-anim='press-bloom']),
  svg :global([data-anim='poke-wave']) {
    transform-box: fill-box;
    transform-origin: center;
  }
  svg :global([data-anim='mos-eye']) {
    transform-box: fill-box;
    transform-origin: center;
  }
  svg :global([data-anim='mos-body']) {
    transform-box: fill-box;
    transform-origin: center;
  }
  svg :global([data-anim='mos-fill']) {
    cursor: pointer;
  }
</style>
