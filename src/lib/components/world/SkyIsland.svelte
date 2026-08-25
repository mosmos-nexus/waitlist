<script lang="ts">
  import { onMount } from 'svelte';
  import { createWorld, type World } from '$lib/anime/world';
  import { m } from '$lib/locale.svelte';

  interface Props {
    /** Raised while a Mon is running, so the body and the orbits speed up. */
    busy?: boolean;
  }
  let { busy = false }: Props = $props();

  let root = $state<HTMLElement | null>(null);
  let world: World | null = null;
  let line = $state('');

  /**
   * The scene sits behind the whole document rather than inside the hero.
   *
   * A visitor keeps the island in view the entire way down, which is what makes
   * the page read as one place instead of a stack of slides — and it is why the
   * drift in `world.ts` is driven by page scroll rather than by section entry.
   */
  onMount(() => {
    if (!root) return;
    world = createWorld(root);
    return () => world?.destroy();
  });

  $effect(() => {
    world?.setBusy(busy);
  });

  /**
   * Where the horizon goes while the layout is stacked.
   *
   * Below 720px the copy runs the full width and the island sits underneath it,
   * so the island's height depends on how tall the copy turned out — and that is
   * something only layout knows. The same sentences wrap to 534px at 320px wide
   * and 491px at 360px, while a `vh` horizon knows neither. Expressed in `vh` it
   * failed at both ends: the island crossed the form on short screens and was
   * pushed to 93% of the fold on tall ones, which is the "too low" this fixes.
   *
   * So measure the copy and place the surface just under it. On a screen with no
   * room left — 320x568 leaves 34px for a 162px island — the result simply falls
   * past the fold, which is the honest outcome rather than an overlap.
   *
   * Above 720px the island sits beside the copy and the CSS `60vh` is right;
   * the override is removed so the stylesheet stays in charge.
   */
  onMount(() => {
    const stacked = matchMedia('(max-width: 719px)');
    let frame = 0;

    const place = () => {
      frame = 0;
      const el = root;
      if (!el) return;
      const copy = document.querySelector<HTMLElement>('.hero .copy');
      if (!stacked.matches || !copy) {
        el.style.removeProperty('--horizon');
        return;
      }
      const cs = getComputedStyle(el);
      // Both are registered with `@property` in app.css so these resolve to
      // numbers; unregistered, `--isle-w` comes back as the literal
      // `min(560px, 132vw)` and parses as NaN.
      const isleW = parseFloat(cs.getPropertyValue('--isle-w'));
      const mosK = parseFloat(cs.getPropertyValue('--mos-k'));
      if (!isleW || !mosK) return;
      // 0.853 is the body's aspect (476:406); 0.011 is how far the island's top
      // surface sits above `--horizon`, both as fractions of the island's width.
      const mosH = isleW * mosK * 0.853;
      const box = copy.getBoundingClientRect();
      // The hero is the first thing in the document, so the copy's offset from
      // the document top is where it sits at rest — which is what the fixed
      // world measures against.
      const copyBottom = box.bottom + window.scrollY;
      // 30px of air, not 20: the body fills its own box, so a smaller gap left
      // it clipping the last line of copy by a few pixels at every width.
      el.style.setProperty('--horizon', `${Math.round(copyBottom + 30 + mosH + isleW * 0.011)}px`);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };

    place();
    // The copy's height moves when the brand webfont swaps in, when the address
    // bar collapses, and on rotation — all three land here.
    const ro = new ResizeObserver(schedule);
    const copy = document.querySelector('.hero .copy');
    if (copy) ro.observe(copy);
    window.addEventListener('resize', schedule);
    stacked.addEventListener('change', schedule);
    document.fonts?.ready.then(schedule).catch(() => {});

    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      stacked.removeEventListener('change', schedule);
    };
  });

  let pokeTimer: ReturnType<typeof setTimeout> | undefined;
  function poke(event: MouseEvent | KeyboardEvent) {
    const point =
      event instanceof MouseEvent && event.clientX
        ? { clientX: event.clientX, clientY: event.clientY }
        : undefined;
    world?.poke(point);
    // Mos answers in words too, so the reaction is not purely decorative.
    const lines = [m.mos_poke_1(), m.mos_poke_2(), m.mos_poke_3(), m.mos_poke_4()];
    line = lines[Math.floor(Math.random() * lines.length)];
    clearTimeout(pokeTimer);
    pokeTimer = setTimeout(() => (line = ''), 2600);
  }
</script>

<div class="world" bind:this={root} aria-hidden="false">
  <!-- Sky. Two washes: the deep gradient, then three coloured pools that keep
       the corners from going flat black. -->
  <div class="layer sky" data-px="0.15" data-scroll="0.1" data-scroll-x="0.12"></div>
  <div class="layer stars" data-px="0.5" data-scroll="0.2" data-scroll-x="0.3"></div>

  <div class="layer" data-px="0.9" data-scroll="0.34" data-scroll-x="0.45">
    <span
      class="mote"
      data-anim="mote"
      style="left:16%;top:62%;width:3px;height:3px;background:rgba(49,220,220,.8);box-shadow:0 0 8px rgba(49,220,220,.8)"
    ></span>
    <span
      class="mote"
      data-anim="mote"
      style="left:29%;top:74%;width:2px;height:2px;background:rgba(236,237,246,.7);box-shadow:0 0 6px rgba(236,237,246,.6)"
    ></span>
    <span
      class="mote"
      data-anim="mote"
      style="left:44%;top:82%;width:3px;height:3px;background:rgba(33,237,179,.75);box-shadow:0 0 8px rgba(33,237,179,.7)"
    ></span>
    <span
      class="mote"
      data-anim="mote"
      style="left:58%;top:70%;width:2px;height:2px;background:rgba(49,220,220,.6);box-shadow:0 0 6px rgba(49,220,220,.6)"
    ></span>
    <span
      class="mote"
      data-anim="mote"
      style="left:69%;top:79%;width:3px;height:3px;background:rgba(236,237,246,.6);box-shadow:0 0 7px rgba(236,237,246,.5)"
    ></span>
    <span
      class="mote"
      data-anim="mote"
      style="left:80%;top:64%;width:2px;height:2px;background:rgba(31,206,206,.7);box-shadow:0 0 6px rgba(31,206,206,.6)"
    ></span>
    <span
      class="mote"
      data-anim="mote"
      style="left:36%;top:56%;width:2px;height:2px;background:rgba(236,237,246,.5);box-shadow:0 0 6px rgba(236,237,246,.4)"
    ></span>
    <span
      class="mote"
      data-anim="mote"
      style="left:62%;top:52%;width:2px;height:2px;background:rgba(33,237,179,.5);box-shadow:0 0 6px rgba(33,237,179,.5)"
    ></span>
  </div>

  <!-- The orbit the Mon travel on. Two rings, opposite directions, tipped back
       so they read as ellipses around the island rather than circles on it. -->
  <div class="layer rings" data-px="0.7" data-scroll="0.52" data-scroll-x="0.55" data-recede="1">
    <div class="halo"></div>
    <div class="ring ring-a">
      <div class="ring-line"></div>
      <div data-anim="orbit-spin" data-speed="1" class="ring-spin">
        <span class="orbiter cyan"></span>
      </div>
    </div>
    <div class="ring ring-b">
      <div class="ring-line dashed"></div>
      <div data-anim="orbit-spin" data-speed="-1.4" class="ring-spin">
        <span class="orbiter green"></span>
      </div>
    </div>
  </div>

  <div class="layer isle" data-px="0.55" data-scroll="0.52" data-scroll-x="0.55" data-recede="1">
    <svg
      data-anim="island"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid meet"
      class="isle-svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="w-isle-halo">
          <stop offset="0" stop-color="rgb(0,200,204)" stop-opacity="0.17"></stop>
          <stop offset="0.55" stop-color="rgb(15,111,218)" stop-opacity="0.09"></stop>
          <stop offset="1" stop-color="rgb(15,111,218)" stop-opacity="0"></stop>
        </radialGradient>
        <linearGradient id="w-isle-top" x1="0.05" y1="0" x2="0.92" y2="1">
          <stop offset="0" stop-color="rgb(5,38,75)"></stop>
          <stop offset="0.42" stop-color="rgb(3,24,48)"></stop>
          <stop offset="1" stop-color="rgb(2,14,27)"></stop>
        </linearGradient>
        <linearGradient id="w-isle-edge" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stop-color="rgb(0,220,224)" stop-opacity="0.4"></stop>
          <stop offset="0.42" stop-color="#31DCDC" stop-opacity="0.14"></stop>
          <stop offset="1" stop-color="rgb(0,220,224)" stop-opacity="0"></stop>
        </linearGradient>
        <linearGradient id="w-isle-mist-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="rgb(139,190,247)" stop-opacity="0"></stop>
          <stop offset="0.36" stop-color="rgb(139,190,247)" stop-opacity="0.12"></stop>
          <stop offset="0.64" stop-color="rgb(139,190,247)" stop-opacity="0.07"></stop>
          <stop offset="1" stop-color="rgb(139,190,247)" stop-opacity="0"></stop>
        </linearGradient>
        <radialGradient id="w-isle-glowspot">
          <stop offset="0" stop-color="#31DCDC" stop-opacity="0.24"></stop>
          <stop offset="1" stop-color="#31DCDC" stop-opacity="0"></stop>
        </radialGradient>
        <clipPath id="w-isle-clip"
          ><path
            d="M1033.4,470.0C1032.4,475.6 1028.7,481.3 1023.4,486.8C1018.2,492.2 1011.3,497.6 1002.0,502.6C992.7,507.6 981.3,512.6 967.5,516.8C953.7,520.9 936.8,524.7 919.1,527.5C901.5,530.4 881.1,532.3 861.8,533.9C842.6,535.4 822.6,536.0 803.6,536.9C784.7,537.8 766.7,538.3 748.0,539.2C729.2,540.0 710.9,541.1 691.0,541.8C671.0,542.5 649.7,543.5 628.4,543.3C607.1,543.1 583.8,542.5 563.2,540.6C542.5,538.8 521.8,535.8 504.5,532.2C487.2,528.7 472.0,524.0 459.4,519.2C446.9,514.5 437.0,509.1 429.0,503.7C421.0,498.3 414.9,492.7 411.4,487.1C407.9,481.4 406.3,475.6 408.2,470.0C410.0,464.4 415.0,458.7 422.4,453.6C429.9,448.4 441.2,443.5 452.9,439.1C464.5,434.6 478.7,430.8 492.2,427.0C505.6,423.1 519.4,419.7 533.6,416.2C547.8,412.6 561.5,409.0 577.3,405.7C593.1,402.5 609.9,399.1 628.4,396.7C646.9,394.3 667.8,392.3 688.3,391.5C708.8,390.7 731.1,391.0 751.6,391.9C772.1,392.8 792.3,394.9 811.3,396.9C830.4,399.0 848.3,401.6 866.1,404.2C883.9,406.9 901.4,409.6 918.3,412.7C935.2,415.9 952.8,419.2 967.5,423.2C982.3,427.3 996.7,431.8 1007.0,436.8C1017.3,441.7 1024.9,447.4 1029.3,452.9C1033.7,458.4 1034.4,464.4 1033.4,470.0Z"
          ></path></clipPath
        >
      </defs>

      <ellipse cx="720" cy="490" rx="480" ry="220" fill="url(#w-isle-halo)"></ellipse>

      <g transform="translate(0,-16)"
        ><g data-anim="isle-body">
          <polygon points="408,470 422,498 566,690" fill="rgb(5,38,75)" fill-opacity="0.9"
          ></polygon>
          <polygon points="422,498 480,526 648,748 566,690" fill="rgb(5,38,75)" fill-opacity="0.6"
          ></polygon>
          <polygon points="480,526 596,543 706,788 648,748" fill="rgb(3,24,48)" fill-opacity="1"
          ></polygon>
          <polygon points="596,543 720,540 768,754 706,788" fill="rgb(3,24,48)" fill-opacity="0.72"
          ></polygon>
          <polygon points="720,540 832,536 854,700 768,754" fill="rgb(2,14,27)" fill-opacity="0.9"
          ></polygon>
          <polygon points="832,536 945,523 906,646 854,700" fill="rgb(2,14,27)" fill-opacity="1"
          ></polygon>
          <polygon
            points="945,523 1010,497 1033,470 906,646"
            fill="rgb(3,24,48)"
            fill-opacity="0.45"
          ></polygon>
          <polygon points="566,690 584,678 575,728" fill="rgb(3,24,48)"></polygon>
          <polygon points="648,748 664,736 656,794" fill="rgb(2,14,27)"></polygon>
          <polygon points="706,788 720,776 713,818" fill="rgb(3,24,48)"></polygon>
          <polygon points="768,754 780,742 774,794" fill="rgb(2,14,27)"></polygon>
          <polygon points="854,700 864,688 859,726" fill="rgb(3,24,48)"></polygon>
          <g stroke="rgb(2,14,27)" stroke-opacity="0.8" fill="none" stroke-width="1.4">
            <path d="M422,498L566,690"></path>
            <path d="M480,526L648,748"></path>
            <path d="M596,543L706,788"></path>
            <path d="M720,540L768,754"></path>
            <path d="M832,536L854,700"></path>
            <path d="M945,523L906,646"></path>
          </g>
          <g stroke="rgb(153,253,255)" stroke-opacity="0.15" fill="none" stroke-width="1.4">
            <path d="M408,470L526,620"></path>
          </g>

          <path
            d="M1033.4,470.0C1032.4,475.6 1028.7,481.3 1023.4,486.8C1018.2,492.2 1011.3,497.6 1002.0,502.6C992.7,507.6 981.3,512.6 967.5,516.8C953.7,520.9 936.8,524.7 919.1,527.5C901.5,530.4 881.1,532.3 861.8,533.9C842.6,535.4 822.6,536.0 803.6,536.9C784.7,537.8 766.7,538.3 748.0,539.2C729.2,540.0 710.9,541.1 691.0,541.8C671.0,542.5 649.7,543.5 628.4,543.3C607.1,543.1 583.8,542.5 563.2,540.6C542.5,538.8 521.8,535.8 504.5,532.2C487.2,528.7 472.0,524.0 459.4,519.2C446.9,514.5 437.0,509.1 429.0,503.7C421.0,498.3 414.9,492.7 411.4,487.1C407.9,481.4 406.3,475.6 408.2,470.0C410.0,464.4 415.0,458.7 422.4,453.6C429.9,448.4 441.2,443.5 452.9,439.1C464.5,434.6 478.7,430.8 492.2,427.0C505.6,423.1 519.4,419.7 533.6,416.2C547.8,412.6 561.5,409.0 577.3,405.7C593.1,402.5 609.9,399.1 628.4,396.7C646.9,394.3 667.8,392.3 688.3,391.5C708.8,390.7 731.1,391.0 751.6,391.9C772.1,392.8 792.3,394.9 811.3,396.9C830.4,399.0 848.3,401.6 866.1,404.2C883.9,406.9 901.4,409.6 918.3,412.7C935.2,415.9 952.8,419.2 967.5,423.2C982.3,427.3 996.7,431.8 1007.0,436.8C1017.3,441.7 1024.9,447.4 1029.3,452.9C1033.7,458.4 1034.4,464.4 1033.4,470.0Z"
            fill="rgb(5,38,75)"
            transform="translate(0,13)"
          ></path>
          <path
            d="M1033.4,470.0C1032.4,475.6 1028.7,481.3 1023.4,486.8C1018.2,492.2 1011.3,497.6 1002.0,502.6C992.7,507.6 981.3,512.6 967.5,516.8C953.7,520.9 936.8,524.7 919.1,527.5C901.5,530.4 881.1,532.3 861.8,533.9C842.6,535.4 822.6,536.0 803.6,536.9C784.7,537.8 766.7,538.3 748.0,539.2C729.2,540.0 710.9,541.1 691.0,541.8C671.0,542.5 649.7,543.5 628.4,543.3C607.1,543.1 583.8,542.5 563.2,540.6C542.5,538.8 521.8,535.8 504.5,532.2C487.2,528.7 472.0,524.0 459.4,519.2C446.9,514.5 437.0,509.1 429.0,503.7C421.0,498.3 414.9,492.7 411.4,487.1C407.9,481.4 406.3,475.6 408.2,470.0C410.0,464.4 415.0,458.7 422.4,453.6C429.9,448.4 441.2,443.5 452.9,439.1C464.5,434.6 478.7,430.8 492.2,427.0C505.6,423.1 519.4,419.7 533.6,416.2C547.8,412.6 561.5,409.0 577.3,405.7C593.1,402.5 609.9,399.1 628.4,396.7C646.9,394.3 667.8,392.3 688.3,391.5C708.8,390.7 731.1,391.0 751.6,391.9C772.1,392.8 792.3,394.9 811.3,396.9C830.4,399.0 848.3,401.6 866.1,404.2C883.9,406.9 901.4,409.6 918.3,412.7C935.2,415.9 952.8,419.2 967.5,423.2C982.3,427.3 996.7,431.8 1007.0,436.8C1017.3,441.7 1024.9,447.4 1029.3,452.9C1033.7,458.4 1034.4,464.4 1033.4,470.0Z"
            fill="url(#w-isle-top)"
          ></path>
          <g clip-path="url(#w-isle-clip)">
            <g fill="rgb(8,62,123)" fill-opacity="0.24">
              <polygon points="576,452 654,438 708,452 646,470"></polygon>
              <polygon points="744,432 822,436 852,452 776,456"></polygon>
              <polygon points="606,498 692,506 758,496 678,486"></polygon>
              <polygon points="830,478 892,484 918,470 862,462"></polygon>
            </g>
            <g fill="rgb(12,87,170)" fill-opacity="0.12">
              <polygon points="504,464 562,450 594,462 532,476"></polygon>
              <polygon points="706,420 762,416 784,428 720,432"></polygon>
            </g>
            <g fill="rgb(2,14,27)" fill-opacity="0.45">
              <polygon points="760,470 856,478 902,496 792,494"></polygon>
              <polygon points="640,428 712,424 744,436 664,442"></polygon>
            </g>
            <ellipse cx="720" cy="466" rx="140" ry="36" fill="url(#w-isle-glowspot)"></ellipse>
            <ellipse
              cx="720"
              cy="470"
              rx="150"
              ry="38"
              fill="none"
              stroke="#31DCDC"
              stroke-opacity="0.13"
              stroke-width="1"
            ></ellipse>
          </g>
          <path
            d="M408,470A300,78 0 0 1 1033,470"
            fill="none"
            stroke="#31DCDC"
            stroke-opacity="0.26"
            stroke-width="1.6"
          ></path>
          <path
            d="M1033.4,470.0C1032.4,475.6 1028.7,481.3 1023.4,486.8C1018.2,492.2 1011.3,497.6 1002.0,502.6C992.7,507.6 981.3,512.6 967.5,516.8C953.7,520.9 936.8,524.7 919.1,527.5C901.5,530.4 881.1,532.3 861.8,533.9C842.6,535.4 822.6,536.0 803.6,536.9C784.7,537.8 766.7,538.3 748.0,539.2C729.2,540.0 710.9,541.1 691.0,541.8C671.0,542.5 649.7,543.5 628.4,543.3C607.1,543.1 583.8,542.5 563.2,540.6C542.5,538.8 521.8,535.8 504.5,532.2C487.2,528.7 472.0,524.0 459.4,519.2C446.9,514.5 437.0,509.1 429.0,503.7C421.0,498.3 414.9,492.7 411.4,487.1C407.9,481.4 406.3,475.6 408.2,470.0C410.0,464.4 415.0,458.7 422.4,453.6C429.9,448.4 441.2,443.5 452.9,439.1C464.5,434.6 478.7,430.8 492.2,427.0C505.6,423.1 519.4,419.7 533.6,416.2C547.8,412.6 561.5,409.0 577.3,405.7C593.1,402.5 609.9,399.1 628.4,396.7C646.9,394.3 667.8,392.3 688.3,391.5C708.8,390.7 731.1,391.0 751.6,391.9C772.1,392.8 792.3,394.9 811.3,396.9C830.4,399.0 848.3,401.6 866.1,404.2C883.9,406.9 901.4,409.6 918.3,412.7C935.2,415.9 952.8,419.2 967.5,423.2C982.3,427.3 996.7,431.8 1007.0,436.8C1017.3,441.7 1024.9,447.4 1029.3,452.9C1033.7,458.4 1034.4,464.4 1033.4,470.0Z"
            fill="none"
            stroke="url(#w-isle-edge)"
            stroke-width="1.4"
          ></path>
          <ellipse
            data-anim="isle-mist"
            cx="720"
            cy="536"
            rx="400"
            ry="20"
            fill="url(#w-isle-mist-g)"
            opacity="0.5"
          ></ellipse>
          <ellipse
            data-anim="isle-mist"
            cx="720"
            cy="586"
            rx="300"
            ry="15"
            fill="url(#w-isle-mist-g)"
            opacity="0.32"
          ></ellipse>
        </g></g
      >

      <g transform="translate(0,-16)">
        <g fill="rgb(5,38,75)" stroke="rgb(153,253,255)" stroke-opacity="0.12" stroke-width="1.2">
          <polygon
            data-anim="isle-rock"
            style="transform-box:fill-box;transform-origin:center"
            points="1146,462 1178,452 1196,474 1180,502 1150,500 1138,480"
          ></polygon>
          <polygon
            data-anim="isle-rock"
            style="transform-box:fill-box;transform-origin:center"
            points="1150,586 1174,580 1184,598 1170,616 1150,612 1144,598"
          ></polygon>
          <polygon
            data-anim="isle-rock"
            style="transform-box:fill-box;transform-origin:center"
            points="238,498 268,490 282,512 266,540 238,536 226,514"
          ></polygon>
        </g>
        <g fill="rgb(153,253,255)">
          <circle data-anim="isle-spark" cx="476" cy="560" r="2.2" opacity="0.55"></circle>
          <circle data-anim="isle-spark" cx="588" cy="640" r="1.8" opacity="0.45"></circle>
          <circle data-anim="isle-spark" cx="812" cy="620" r="2" opacity="0.5"></circle>
          <circle data-anim="isle-spark" cx="930" cy="540" r="1.7" opacity="0.4"></circle>
          <circle data-anim="isle-spark" cx="700" cy="700" r="2" opacity="0.35"></circle>
        </g>
      </g>
    </svg>
    <div class="ring-pulse" data-anim="ring-pulse"></div>
    <div class="ring-pulse green" data-anim="ring-pulse"></div>
  </div>

  <!-- Mos. The button is the poke target; every transform channel it uses is
       one no loop owns, so a poke can never override the float or the breath. -->
  <div class="layer stage" data-px="1.25" data-scroll="0.52" data-scroll-x="0.55" data-recede="1">
    <div class="shadow-slot"><div class="mos-shadow" data-anim="mos-shadow"></div></div>
    <div class="mos-slot">
      <span class="mos-lean" data-anim="mos-lean">
        <button
          type="button"
          class="poke"
          data-anim="mos-give"
          onclick={poke}
          aria-label={m.poke_hint()}
        >
          <span class="mos-inner" data-anim="mos">
            <span class="aura" data-anim="aura"></span>
            <svg data-anim="mos-svg" viewBox="216 220 476 406" class="mos-svg" aria-hidden="true">
              <defs>
                <clipPath id="w-mos-clip"
                  ><path
                    data-anim="mos-clip-path"
                    d="M610.94,292.11c-17.97-14.53-41.63-19.69-65.13-11.21-9.38,3.39-18.63,7.49-28.5,8.92-24.88,3.59-31.33-14.56-47.12-28.75-26.09-23.43-65.1-34.47-98.96-23.14-12.44,4.16-23.34,11.49-32.54,20.66-8.96,8.92-16.31,19.59-21.89,30.76-12.21,24.42-13.98,52.32-24.62,77.3-7.93,18.61-23.13,33.71-35.17,49.68-21.01,27.84-34.21,65.95-24.36,100.73,5.87,20.74,24.05,31.11,41.94,40.39,4.67,2.42,9.42,4.75,14.06,7.26,2.4,1.3,4.83,2.68,7.46,3.43,1.17.33,2.35.67,3.48,1.1,18.12,23.62,47.33,46.33,78.58,44.51,18.44-1.07,36.17-7.34,52.42-15.87,7.13-3.74,15.3-6.72,21.98-11.21,10.89-3.96,21.76,4.75,31.64,8.15,15.38,5.3,31.35,7.26,47.55,7.54,44.77.77,99.22-17.02,129.76-50.85,45.56-50.47-13.97-107.12-18.53-160.04-2.37-27.47.02-56.92-15.7-81.12-4.61-7.09-10.14-13.24-16.36-18.27Z"
                  ></path></clipPath
                >
                <linearGradient id="w-mos-base" x1="0.15" y1="0" x2="0.85" y2="1">
                  <stop offset="0" stop-color="#2E6FC8"></stop>
                  <stop offset="1" stop-color="#0F2F5E"></stop>
                </linearGradient>
                <linearGradient id="w-mos-rim" x1="0.1" y1="0" x2="0.9" y2="1">
                  <stop offset="0" stop-color="#ECEDF6" stop-opacity="0.8"></stop>
                  <stop offset="0.55" stop-color="#31DCDC" stop-opacity="0.42"></stop>
                  <stop offset="1" stop-color="#0F6FDA" stop-opacity="0.28"></stop>
                </linearGradient>
                <radialGradient id="w-mos-glob-1">
                  <stop offset="0" stop-color="#1B7BE8" stop-opacity="0.95"></stop>
                  <stop offset="0.5" stop-color="#1B7BE8" stop-opacity="0.6"></stop>
                  <stop offset="1" stop-color="#1B7BE8" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-mos-glob-2">
                  <stop offset="0" stop-color="#3D8BEE" stop-opacity="0.9"></stop>
                  <stop offset="0.5" stop-color="#3D8BEE" stop-opacity="0.5"></stop>
                  <stop offset="1" stop-color="#3D8BEE" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-mos-glob-3">
                  <stop offset="0" stop-color="#31DCDC" stop-opacity="0.85"></stop>
                  <stop offset="0.5" stop-color="#31DCDC" stop-opacity="0.42"></stop>
                  <stop offset="1" stop-color="#31DCDC" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-mos-glob-4">
                  <stop offset="0" stop-color="#6D4BD8" stop-opacity="0.8"></stop>
                  <stop offset="0.5" stop-color="#6D4BD8" stop-opacity="0.36"></stop>
                  <stop offset="1" stop-color="#6D4BD8" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-mos-glob-5">
                  <stop offset="0" stop-color="#21EDB3" stop-opacity="0.8"></stop>
                  <stop offset="0.5" stop-color="#21EDB3" stop-opacity="0.34"></stop>
                  <stop offset="1" stop-color="#21EDB3" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-mos-gloss">
                  <stop offset="0" stop-color="#F7F8F9" stop-opacity="0.34"></stop>
                  <stop offset="0.6" stop-color="#F7F8F9" stop-opacity="0.12"></stop>
                  <stop offset="1" stop-color="#F7F8F9" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-poke-press">
                  <stop offset="0" stop-color="#0B3A6B" stop-opacity="0.4"></stop>
                  <stop offset="0.66" stop-color="#0B3A6B" stop-opacity="0.16"></stop>
                  <stop offset="1" stop-color="#0B3A6B" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-poke-lift">
                  <stop offset="0" stop-color="#8FD8FF" stop-opacity="0.34"></stop>
                  <stop offset="0.72" stop-color="#8FD8FF" stop-opacity="0.08"></stop>
                  <stop offset="1" stop-color="#8FD8FF" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-poke-band-1">
                  <stop offset="0" stop-color="#7FC4FF" stop-opacity="0"></stop>
                  <stop offset="0.58" stop-color="#7FC4FF" stop-opacity="0.06"></stop>
                  <stop offset="0.84" stop-color="#AEE4FF" stop-opacity="0.5"></stop>
                  <stop offset="1" stop-color="#AEE4FF" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-poke-band-2">
                  <stop offset="0" stop-color="#31DCDC" stop-opacity="0"></stop>
                  <stop offset="0.62" stop-color="#31DCDC" stop-opacity="0.05"></stop>
                  <stop offset="0.86" stop-color="#5FE6E6" stop-opacity="0.36"></stop>
                  <stop offset="1" stop-color="#5FE6E6" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-poke-band-3">
                  <stop offset="0" stop-color="#3D8BEE" stop-opacity="0"></stop>
                  <stop offset="0.68" stop-color="#3D8BEE" stop-opacity="0.04"></stop>
                  <stop offset="0.9" stop-color="#79B6FF" stop-opacity="0.24"></stop>
                  <stop offset="1" stop-color="#79B6FF" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="w-mos-shade">
                  <stop offset="0" stop-color="#06101F" stop-opacity="0.5"></stop>
                  <stop offset="0.6" stop-color="#06101F" stop-opacity="0.2"></stop>
                  <stop offset="1" stop-color="#06101F" stop-opacity="0"></stop>
                </radialGradient>
              </defs>
              <g>
                <path
                  data-anim="mos-fill"
                  fill="url(#w-mos-base)"
                  d="M610.94,292.11c-17.97-14.53-41.63-19.69-65.13-11.21-9.38,3.39-18.63,7.49-28.5,8.92-24.88,3.59-31.33-14.56-47.12-28.75-26.09-23.43-65.1-34.47-98.96-23.14-12.44,4.16-23.34,11.49-32.54,20.66-8.96,8.92-16.31,19.59-21.89,30.76-12.21,24.42-13.98,52.32-24.62,77.3-7.93,18.61-23.13,33.71-35.17,49.68-21.01,27.84-34.21,65.95-24.36,100.73,5.87,20.74,24.05,31.11,41.94,40.39,4.67,2.42,9.42,4.75,14.06,7.26,2.4,1.3,4.83,2.68,7.46,3.43,1.17.33,2.35.67,3.48,1.1,18.12,23.62,47.33,46.33,78.58,44.51,18.44-1.07,36.17-7.34,52.42-15.87,7.13-3.74,15.3-6.72,21.98-11.21,10.89-3.96,21.76,4.75,31.64,8.15,15.38,5.3,31.35,7.26,47.55,7.54,44.77.77,99.22-17.02,129.76-50.85,45.56-50.47-13.97-107.12-18.53-160.04-2.37-27.47.02-56.92-15.7-81.12-4.61-7.09-10.14-13.24-16.36-18.27Z"
                ></path>
                <g data-anim="mos-flow" clip-path="url(#w-mos-clip)" style="pointer-events:none">
                  <circle
                    data-anim="mos-glob"
                    data-tone="blue"
                    data-orbit="30"
                    data-phase="0"
                    data-dur="14000"
                    data-dir="1"
                    cx="452"
                    cy="432"
                    r="176"
                    fill="url(#w-mos-glob-1)"
                    opacity="0.95"
                  ></circle>
                  <circle
                    data-anim="mos-glob"
                    data-tone="light"
                    data-orbit="78"
                    data-phase="40"
                    data-dur="9200"
                    data-dir="1"
                    cx="452"
                    cy="432"
                    r="140"
                    fill="url(#w-mos-glob-2)"
                    opacity="0.9"
                  ></circle>
                  <circle
                    data-anim="mos-glob"
                    data-tone="cyan"
                    data-orbit="62"
                    data-phase="130"
                    data-dur="7600"
                    data-dir="-1"
                    cx="452"
                    cy="432"
                    r="126"
                    fill="url(#w-mos-glob-3)"
                    opacity="0.8"
                  ></circle>
                  <circle
                    data-anim="mos-glob"
                    data-tone="purple"
                    data-orbit="92"
                    data-phase="215"
                    data-dur="11800"
                    data-dir="-1"
                    cx="452"
                    cy="432"
                    r="118"
                    fill="url(#w-mos-glob-4)"
                    opacity="0.7"
                  ></circle>
                  <circle
                    data-anim="mos-glob"
                    data-tone="green"
                    data-orbit="50"
                    data-phase="300"
                    data-dur="8400"
                    data-dir="1"
                    cx="452"
                    cy="432"
                    r="104"
                    fill="url(#w-mos-glob-5)"
                    opacity="0.42"
                  ></circle>
                  <ellipse cx="368" cy="318" rx="132" ry="96" fill="url(#w-mos-gloss)"></ellipse>
                  <ellipse cx="536" cy="566" rx="150" ry="104" fill="url(#w-mos-shade)"></ellipse>
                </g>
                <path
                  data-anim="mos-rim"
                  style="pointer-events:none"
                  fill="none"
                  stroke="url(#w-mos-rim)"
                  stroke-width="3.4"
                  d="M610.94,292.11c-17.97-14.53-41.63-19.69-65.13-11.21-9.38,3.39-18.63,7.49-28.5,8.92-24.88,3.59-31.33-14.56-47.12-28.75-26.09-23.43-65.1-34.47-98.96-23.14-12.44,4.16-23.34,11.49-32.54,20.66-8.96,8.92-16.31,19.59-21.89,30.76-12.21,24.42-13.98,52.32-24.62,77.3-7.93,18.61-23.13,33.71-35.17,49.68-21.01,27.84-34.21,65.95-24.36,100.73,5.87,20.74,24.05,31.11,41.94,40.39,4.67,2.42,9.42,4.75,14.06,7.26,2.4,1.3,4.83,2.68,7.46,3.43,1.17.33,2.35.67,3.48,1.1,18.12,23.62,47.33,46.33,78.58,44.51,18.44-1.07,36.17-7.34,52.42-15.87,7.13-3.74,15.3-6.72,21.98-11.21,10.89-3.96,21.76,4.75,31.64,8.15,15.38,5.3,31.35,7.26,47.55,7.54,44.77.77,99.22-17.02,129.76-50.85,45.56-50.47-13.97-107.12-18.53-160.04-2.37-27.47.02-56.92-15.7-81.12-4.61-7.09-10.14-13.24-16.36-18.27Z"
                ></path>
              </g>
              <g data-anim="poke-fx" clip-path="url(#w-mos-clip)" style="pointer-events:none">
                <circle
                  data-anim="press-dip"
                  cx="452"
                  cy="432"
                  r="40"
                  fill="url(#w-poke-press)"
                  opacity="0"
                  style="transform-box:fill-box;transform-origin:center"
                ></circle>
                <circle
                  data-anim="press-bloom"
                  cx="452"
                  cy="432"
                  r="34"
                  fill="url(#w-poke-lift)"
                  opacity="0"
                  style="transform-box:fill-box;transform-origin:center"
                ></circle>
                <circle
                  data-anim="poke-wave"
                  cx="452"
                  cy="432"
                  r="90"
                  fill="url(#w-poke-band-1)"
                  opacity="0"
                  style="transform-box:fill-box;transform-origin:center"
                ></circle>
                <circle
                  data-anim="poke-wave"
                  cx="452"
                  cy="432"
                  r="90"
                  fill="url(#w-poke-band-2)"
                  opacity="0"
                  style="transform-box:fill-box;transform-origin:center"
                ></circle>
                <circle
                  data-anim="poke-wave"
                  cx="452"
                  cy="432"
                  r="90"
                  fill="url(#w-poke-band-3)"
                  opacity="0"
                  style="transform-box:fill-box;transform-origin:center"
                ></circle>
              </g>
              <g data-anim="mos-face" style="pointer-events:none">
                <g fill="none" stroke="#0B1B33" stroke-linecap="round" opacity="0.88">
                  <g data-anim="mos-calm">
                    <g data-anim="mos-eye" style="transform-box:fill-box;transform-origin:center">
                      <line x1="423.5" y1="399.07" x2="423.5" y2="420.32" stroke-width="8"></line>
                    </g>
                    <g data-anim="mos-eye" style="transform-box:fill-box;transform-origin:center">
                      <line x1="496.61" y1="399.07" x2="496.61" y2="420.32" stroke-width="8"></line>
                    </g>
                  </g>
                  <path d="M460.25,427.67c1.6,9.93,11.76,16.53,22.72,14.76" stroke-width="6"></path>
                  <path d="M460.25,427.67c-1.6,9.93-11.76,16.53-22.72,14.76" stroke-width="6"
                  ></path>
                </g>
                <g
                  data-anim="mos-happy"
                  fill="none"
                  stroke="#0B1B33"
                  stroke-linecap="round"
                  stroke-width="7.5"
                  opacity="0"
                >
                  <path d="M414,398l13,11l-13,11"></path>
                  <path d="M506,398l-13,11l13,11"></path>
                </g>
              </g>
            </svg>
          </span>
        </button>
      </span>
      <p class="say" aria-live="polite">{line}</p>
    </div>
  </div>
</div>

<style>
  /*
   * Fixed, not sticky: the world never moves with the document, and the drift
   * in `world.ts` is what makes it feel like it does. `pointer-events: none`
   * everywhere except Mos, so the scene never eats a click meant for the page.
   */
  .world {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    background: var(--app-bg);
    contain: strict;
  }
  .layer {
    position: absolute;
    inset: -6%;
    /*
     * Every layer here is driven by a transform, and each one is a
     * viewport-sized painted surface. Without promotion the compositor has no
     * cached texture to move and re-rasterises the whole gradient on every
     * scroll frame — measured at 66 ms per frame, which is 15 fps. Promoted, the
     * scroll frame is a texture translation.
     */
    will-change: transform;
  }

  /*
   * The sky, aimed at the island.
   *
   * These pools come from a screen where the island is centred, so their
   * authored positions (50% 66%, 22% 24%, 84% 30%) put the brightest one beside
   * this island rather than behind it — the light and the object it was lighting
   * had come apart, which is most of why the background read as pasted on. They
   * now track `--isle-x` and `--pool-y`, so moving the island moves its glow.
   */
  .sky {
    background:
      radial-gradient(
        44% 36% at calc(50% + var(--isle-x)) var(--pool-y),
        rgba(31, 206, 206, 0.2),
        transparent 70%
      ),
      radial-gradient(46% 34% at 16% 24%, rgba(15, 111, 218, 0.17), transparent 72%),
      radial-gradient(40% 30% at 92% 20%, rgba(84, 54, 180, 0.18), transparent 70%),
      radial-gradient(
        var(--sky-size) at calc(50% + var(--isle-x)) var(--sky-y),
        #1b3a63 0%,
        #13233f 34%,
        #0c1020 64%,
        #08090f 100%
      );
  }

  /*
   * Tiled, not placed. Twelve gradients spread across a viewport-sized box are
   * a viewport-sized raster; the same twelve inside a 520px tile rasterise once
   * and the compositor repeats the texture, which is what keeps a starfield
   * from costing more than the island it sits behind.
   */
  .stars {
    background-repeat: repeat;
    background-size: 520px 520px;
    background-image:
      radial-gradient(1.6px 1.6px at 11% 17%, rgba(236, 237, 246, 0.7), transparent),
      radial-gradient(1.3px 1.3px at 26% 9%, rgba(236, 237, 246, 0.45), transparent),
      radial-gradient(1.7px 1.7px at 41% 21%, rgba(49, 220, 220, 0.5), transparent),
      radial-gradient(1.3px 1.3px at 63% 11%, rgba(236, 237, 246, 0.4), transparent),
      radial-gradient(1.6px 1.6px at 82% 18%, rgba(236, 237, 246, 0.55), transparent),
      radial-gradient(1.3px 1.3px at 92% 33%, rgba(236, 237, 246, 0.35), transparent),
      radial-gradient(1.5px 1.5px at 8% 51%, rgba(236, 237, 246, 0.45), transparent),
      radial-gradient(1.4px 1.4px at 19% 77%, rgba(49, 220, 220, 0.35), transparent),
      radial-gradient(1.7px 1.7px at 47% 87%, rgba(236, 237, 246, 0.32), transparent),
      radial-gradient(1.4px 1.4px at 71% 80%, rgba(236, 237, 246, 0.42), transparent),
      radial-gradient(1.5px 1.5px at 88% 67%, rgba(236, 237, 246, 0.38), transparent),
      radial-gradient(1.3px 1.3px at 57% 62%, rgba(236, 237, 246, 0.25), transparent);
  }
  .mote {
    position: absolute;
    display: block;
    border-radius: 50%;
  }

  /*
   * The island's own horizon. Everything below is positioned against
   * `--horizon`, so moving that one number moves the whole scene together.
   */
  .world {
    /*
     * Stacked layout — the copy runs the full width and the island sits below
     * it.
     *
     * The horizon has to clear a copy block whose height barely changes with
     * the viewport: on a 320px screen the same text simply wraps more. So a
     * pure `vh` horizon fails at both ends — it drove the island into the form
     * on short screens and shoved it to 93 % of the fold on tall ones. This
     * tracks the fold with a floor: tall phones get the island at about 82 %,
     * and below the floor it slides partly under the fold, which is the honest
     * answer when 500px of copy has to fit in 568px of screen.
     */
    --horizon: max(calc(100svh - 150px), 700px);
    /* Capped: at 480–700px wide the old `132vw` grew the island faster than the
       copy narrowed, and they met in the middle. */
    --isle-w: min(560px, 132vw);
    /*
     * Mos's size is a fraction of the island, never of the viewport.
     *
     * They used to be clamped independently — `min(272px, 51vw)` against
     * `min(1180px, 88vw)` — so the ratio between them drifted from 0.57 on a
     * desktop to 1.02 on a phone, where Mos was as wide as the island it stands
     * on. Deriving one from the other holds the proportion at every width. The
     * phone gets a deliberately larger share: there the island is mostly below
     * the fold and works as a plinth, so Mos is the subject.
     */
    --mos-k: 0.26;
    /* On a phone the copy stacks above the island; on a desktop the island
       moves out from under the left-hand column instead of shrinking. */
    --isle-x: 0%;
  }
  /*
   * Side-by-side from 720px, not 1000px. Between the two the hero was still
   * stacking, so a tablet in portrait and a phone in landscape both put the
   * island underneath a full-width copy block and the two collided. There is
   * ample width for two columns well before 1000px; what changes at 1000px is
   * only how far right the island can sit.
   */
  @media (min-width: 720px) {
    .world {
      --horizon: 60vh;
      --isle-w: min(1180px, 88vw);
      --isle-x: 26%;
      /* The reference draft seats Mos at about a third of the disc's width. */
      --mos-k: 0.16;
      --pool-y: 58%;
      --sky-y: 120%;
      --sky-size: 124% 94%;
    }
  }
  @media (min-width: 1000px) {
    .world {
      --isle-x: 20%;
    }
  }

  .rings,
  .isle,
  .stage {
    inset: 0;
  }

  .halo,
  .ring,
  .ring-pulse,
  .shadow-slot,
  .mos-slot {
    position: absolute;
    left: calc(50% + var(--isle-x));
    /* Centred with margins, never `transform`: anime.js writes the whole
       transform property, so a centring translate would be erased the first
       time any loop touched the element. */
    margin-left: calc(var(--w) / -2);
    width: var(--w);
  }

  .halo {
    --w: calc(var(--isle-w) * 0.82);
    top: var(--horizon);
    height: calc(var(--isle-w) * 0.38);
    margin-top: calc(var(--isle-w) * -0.19);
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      rgba(31, 206, 206, 0.22),
      rgba(15, 111, 218, 0.13) 52%,
      transparent 100%
    );
    filter: blur(2px);
  }

  .ring {
    top: var(--horizon);
    height: var(--w);
    margin-top: calc(var(--w) / -2);
    transform: rotateX(72deg);
    transform-style: preserve-3d;
  }
  .ring-a {
    --w: calc(var(--isle-w) * 0.49);
  }
  .ring-b {
    --w: calc(var(--isle-w) * 0.39);
  }
  .ring-line {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid rgba(49, 220, 220, 0.14);
  }
  .ring-line.dashed {
    border: 1px dashed rgba(236, 237, 246, 0.13);
  }
  .ring-spin {
    position: absolute;
    inset: 0;
  }
  .orbiter {
    position: absolute;
    left: 50%;
    top: -4px;
    display: block;
    width: 8px;
    height: 8px;
    margin-left: -4px;
    border-radius: 50%;
  }
  .orbiter.cyan {
    background: var(--summon-cyan);
    box-shadow: 0 0 14px rgba(31, 206, 206, 0.9);
  }
  .orbiter.green {
    background: var(--summon-green);
    box-shadow: 0 0 16px rgba(33, 237, 179, 0.9);
  }

  .isle-svg {
    position: absolute;
    left: calc(50% + var(--isle-x));
    top: var(--horizon);
    width: var(--isle-w);
    max-width: none;
    /* Static: no loop touches this element, so a centring transform is safe. */
    transform: translate(-50%, -52.2%);
    overflow: visible;
  }

  .ring-pulse {
    --w: calc(var(--isle-w) * 0.42);
    top: var(--horizon);
    height: calc(var(--isle-w) * 0.109);
    margin-top: calc(var(--isle-w) * -0.0545);
    border-radius: 50%;
    border: 1px solid rgba(49, 220, 220, 0.3);
    opacity: 0;
  }
  .ring-pulse.green {
    border-color: rgba(33, 237, 179, 0.24);
  }

  /*
   * Seating. The island's top surface reads at `--horizon` minus about 1.1 % of
   * the island's width (the bezier's centre sits at viewBox y 454 of 900, and
   * the svg is offset −52.2 %). Mos's shadow goes there, and Mos's own box is
   * raised so its *bottom* lands on that line rather than hanging over the
   * near rim — which is what made it look like it was falling off the front.
   */
  /*
   * The contact shadow, which is what makes Mos read as standing on the island
   * rather than hovering in front of it. It has to be dark enough to show on a
   * surface that is already dark — the authored 60 % black was invisible there —
   * and wide enough that the gap opened by the bob still reads as a gap.
   */
  .shadow-slot {
    --w: calc(var(--isle-w) * var(--mos-k) * 1.34);
    top: calc(var(--horizon) - var(--isle-w) * 0.014);
    height: calc(var(--isle-w) * var(--mos-k) * 0.32);
  }
  .mos-shadow {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      rgba(1, 6, 14, 0.86),
      rgba(1, 6, 14, 0.42) 58%,
      transparent 100%
    );
    opacity: 0.55;
  }

  .mos-slot {
    --w: calc(var(--isle-w) * var(--mos-k) * 1.8);
    /* Raised so the body's *bottom* lands on the surface line rather than
       hanging over the near rim. 0.899 is the svg's bottom inside its box. */
    top: calc(var(--horizon) - var(--isle-w) * 0.015 - var(--isle-w) * var(--mos-k) * 0.899);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-10);
  }
  /* Scroll-velocity lean. Owns rotate and translateY and nothing else does, so
     the poke's squash on the button and the float on the inner span survive it. */
  .mos-lean {
    display: block;
  }
  .poke {
    /* The one interactive thing in the scene. */
    pointer-events: auto;
    display: block;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    border-radius: 50%;
  }
  .poke:focus-visible {
    outline: 2px solid var(--bright-cyan);
    outline-offset: 8px;
  }
  .mos-inner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--isle-w) * var(--mos-k) * 1.105);
    height: calc(var(--isle-w) * var(--mos-k) * 0.945);
  }
  .aura {
    position: absolute;
    left: 50%;
    top: 52%;
    width: calc(var(--isle-w) * var(--mos-k) * 1.24);
    height: calc(var(--isle-w) * var(--mos-k) * 1.24);
    /* Centred with margins, never `transform`: the aura's own loop writes the
       whole transform property and would erase a centring translate. */
    margin-left: calc(var(--isle-w) * var(--mos-k) * -0.62);
    margin-top: calc(var(--isle-w) * var(--mos-k) * -0.62);
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      rgba(31, 206, 206, 0.3),
      rgba(15, 111, 218, 0.16) 58%,
      transparent
    );
    opacity: 0.6;
  }
  .mos-svg {
    position: relative;
    width: calc(var(--isle-w) * var(--mos-k));
    /* The body's own aspect, 476:406. */
    height: calc(var(--isle-w) * var(--mos-k) * 0.853);
    overflow: visible;
  }

  .say {
    margin: 0;
    min-height: 1.4em;
    max-width: 30ch;
    text-align: center;
    font-size: var(--font-size-caption-1);
    line-height: 1.5;
    color: var(--bright-cyan);
    text-shadow: 0 2px 10px rgba(7, 8, 12, 0.9);
    text-wrap: pretty;
  }

  /* A phone runs the same scene on a fraction of the pixels and a fraction of
     the power budget — the decorative layers are the first thing to go. */
  @media (max-width: 719px) {
    .stars,
    .mote,
    .ring-b {
      display: none;
    }
  }
</style>
