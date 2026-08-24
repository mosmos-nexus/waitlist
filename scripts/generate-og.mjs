// Generates the social-preview (Open Graph) images committed at static/og-{ko,en,ja}.png.
//   node scripts/generate-og.mjs
//
// The cards follow the site's dark deep-space direction: the same sky gradient
// and bloom as the hero, the island's cyan horizon arc, and Mos as the glossy
// blob rather than the retired cloud illustration.
//
// Text is rendered by librsvg through fontconfig, so the brand faces must be
// resolvable on the machine running this. Install Pretendard (Latin/Hangul) and
// Pretendard JP (kana/kanji) locally, or point FONTCONFIG_FILE at a config that
// includes them, before running. Check with:
//   fc-match Pretendard && fc-match "Pretendard JP"
import sharp from 'sharp';
import { statSync } from 'node:fs';

const W = 1200;
const H = 630;

// SVG text doesn't wrap, so the tagline is authored as explicit lines — the
// same breaks the hero uses, which also keeps it clear of Mos on the right.
const VARIANTS = {
  ko: {
    tagline: ['쓸수록 손발 맞는', '내 AI 조력자'],
    slogan: '말하면 Mos가 받고, Mon이 나눠서 해내요.',
    taglineSize: 60,
    font: 'Pretendard',
  },
  en: {
    tagline: ['The AI that gets better', 'at working with you'],
    slogan: 'Say the goal. Mos takes it from there.',
    taglineSize: 52,
    font: 'Pretendard',
  },
  ja: {
    tagline: ['使うほど息の合う、', 'わたしのAI'],
    slogan: '伝えればMosが受け取り、Monが分けあって仕上げます。',
    taglineSize: 56,
    // Pretendard JP carries kana and kanji at the same metrics as Pretendard.
    font: 'Pretendard JP',
    sloganSize: 25,
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function bg({ tagline, slogan, taglineSize, sloganSize = 28, font }) {
  const lineHeight = Math.round(taglineSize * 1.3);
  // Bottom-align the block so one- and two-line taglines share a baseline.
  const firstBaseline = 350 - (tagline.length - 1) * lineHeight;
  const headline = tagline
    .map(
      (line, i) =>
        `<text x="80" y="${firstBaseline + i * lineHeight}" font-family="${font}" font-weight="700" font-size="${taglineSize}" fill="#FFFFFF">${esc(line)}</text>`,
    )
    .join('\n  ');

  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sky" cx="0.5" cy="1.18" r="1.1">
      <stop offset="0" stop-color="#1B3A63"/>
      <stop offset="0.34" stop-color="#12203A"/>
      <stop offset="0.62" stop-color="#0C1020"/>
      <stop offset="1" stop-color="#08090F"/>
    </radialGradient>
    <radialGradient id="bloomA" cx="0.22" cy="0.24" r="0.5">
      <stop offset="0" stop-color="#0F6FDA" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#0F6FDA" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bloomB" cx="0.8" cy="0.62" r="0.5">
      <stop offset="0" stop-color="#1FCECE" stop-opacity="0.20"/>
      <stop offset="1" stop-color="#1FCECE" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#bloomA)"/>
  <rect width="${W}" height="${H}" fill="url(#bloomB)"/>

  <!-- Starfield -->
  <g fill="#ECEDF6">
    <circle cx="132" cy="92" r="1.6" opacity="0.7"/>
    <circle cx="318" cy="58" r="1.3" opacity="0.45"/>
    <circle cx="498" cy="124" r="1.7" opacity="0.5" fill="#31DCDC"/>
    <circle cx="742" cy="70" r="1.3" opacity="0.4"/>
    <circle cx="988" cy="108" r="1.6" opacity="0.55"/>
    <circle cx="1112" cy="196" r="1.3" opacity="0.35"/>
    <circle cx="96" cy="306" r="1.5" opacity="0.4"/>
    <circle cx="228" cy="466" r="1.4" opacity="0.35" fill="#31DCDC"/>
    <circle cx="1064" cy="404" r="1.5" opacity="0.38"/>
  </g>

  <!-- The island's horizon arc, echoing the hero's disc rim -->
  <ellipse cx="905" cy="470" rx="330" ry="118" fill="#31DCDC" opacity="0.06"/>
  <path d="M600,470 A305,86 0 0 1 1210,470" fill="none" stroke="#31DCDC" stroke-opacity="0.28" stroke-width="1.8"/>
  <path d="M655,506 A250,66 0 0 1 1155,506" fill="none" stroke="#ECEDF6" stroke-opacity="0.10" stroke-width="1.4"/>

  ${headline}
  <text x="80" y="412" font-family="${font}" font-weight="400" font-size="${sloganSize}" fill="#AEB8C2">${esc(slogan)}</text>
</svg>`);
}

/**
 * One frozen frame of Mos's silhouette, computed with the same maths the live
 * character runs (src/lib/anime/blob.ts): a ring of samples pushed inward by
 * Gaussian dents, plus two low-order ripples, smoothed with closed Catmull-Rom.
 *
 * Duplicated rather than imported because that module pulls in animejs, which
 * needs a DOM. Keeping the formula identical is what matters — the card should
 * show the same creature the page does, not a rounder stand-in.
 */
function blobPath({ cx = 170, cy = 170, r = 146, points = 128 } = {}) {
  const TAU = Math.PI * 2;
  // A pleasing static pose: three dents at fixed angles, depths and widths.
  const dents = [
    { at: 0.55, depth: 0.2, width: 0.46 },
    { at: 2.5, depth: 0.16, width: 0.52 },
    { at: 4.5, depth: 0.185, width: 0.42 },
  ];
  const ring = [];
  for (let n = 0; n < points; n++) {
    const a = (n / points) * TAU;
    let cut = 0;
    for (const d of dents) {
      const dist = Math.abs(((((a - d.at) % TAU) + TAU + Math.PI) % TAU) - Math.PI);
      const u = dist / d.width;
      if (u > 2.6) continue;
      cut += d.depth * Math.exp(-u * u);
    }
    if (cut > 0.42) cut = 0.42;
    const wave = Math.cos(a * 2 + 0.7) * 0.022 + Math.cos(a * 3 + 2.4) * 0.016;
    const rad = r * (1 + wave - cut);
    ring.push([cx + Math.cos(a) * rad * 1.02, cy + Math.sin(a) * rad * 0.98]);
  }

  const n = ring.length;
  let d = `M${ring[0][0].toFixed(1)},${ring[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i - 1 + n) % n];
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    const p3 = ring[(i + 2) % n];
    d +=
      `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}` +
      ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}` +
      ` ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

const BODY = blobPath();

/** Mos as the procedural blob reads at card size; the face keeps it warm. */
const mos = Buffer.from(`<svg width="340" height="340" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="c"><path d="${BODY}"/></clipPath>
    <linearGradient id="base" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#2E6FC8"/><stop offset="1" stop-color="#0F2F5E"/>
    </linearGradient>
    <linearGradient id="rim" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#ECEDF6" stop-opacity="0.8"/>
      <stop offset="0.55" stop-color="#31DCDC" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#0F6FDA" stop-opacity="0.28"/>
    </linearGradient>
    <radialGradient id="g1"><stop offset="0" stop-color="#3D8BEE" stop-opacity="0.9"/><stop offset="1" stop-color="#3D8BEE" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2"><stop offset="0" stop-color="#31DCDC" stop-opacity="0.75"/><stop offset="1" stop-color="#31DCDC" stop-opacity="0"/></radialGradient>
    <radialGradient id="gloss"><stop offset="0" stop-color="#F7F8F9" stop-opacity="0.34"/><stop offset="1" stop-color="#F7F8F9" stop-opacity="0"/></radialGradient>
  </defs>
  <path d="${BODY}" fill="url(#base)"/>
  <g clip-path="url(#c)">
    <circle cx="128" cy="150" r="130" fill="url(#g1)"/>
    <circle cx="222" cy="230" r="112" fill="url(#g2)"/>
    <ellipse cx="118" cy="106" rx="86" ry="62" fill="url(#gloss)"/>
  </g>
  <path d="${BODY}" fill="none" stroke="url(#rim)" stroke-width="3.4"/>
  <g fill="none" stroke="#0B1B33" stroke-linecap="round" opacity="0.88">
    <line x1="136" y1="168" x2="136" y2="192" stroke-width="9"/>
    <line x1="212" y1="168" x2="212" y2="192" stroke-width="9"/>
    <path d="M174,200c1.7,10.5 12.4,17.4 24,15.6" stroke-width="6.5"/>
    <path d="M174,200c-1.7,10.5 -12.4,17.4 -24,15.6" stroke-width="6.5"/>
  </g>
</svg>`);

const logo = await sharp('static/brand/mosmos-horizontal-white.svg')
  .resize({ width: 230 })
  .png()
  .toBuffer();
const character = await sharp(mos).resize({ width: 300 }).png().toBuffer();

for (const [locale, v] of Object.entries(VARIANTS)) {
  const out = `static/og-${locale}.png`;
  await sharp(bg(v))
    .composite([
      { input: logo, top: 74, left: 80 },
      { input: character, top: 214, left: 806 },
    ])
    .png()
    .toFile(out);
  console.log(`${out}  ${(statSync(out).size / 1024).toFixed(1)} KB`);
}
