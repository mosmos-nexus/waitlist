// Generates the social-preview (Open Graph) images committed at static/og-{ko,en}.png.
//   node scripts/generate-og.mjs
import sharp from 'sharp';
import { statSync } from 'node:fs';

const W = 1200;
const H = 630;

const VARIANTS = {
  ko: { tagline: '내 AI가 자라는 세계', slogan: '말만 하세요. 움직이는 건 Mos.', taglineSize: 66 },
  en: {
    tagline: 'A world where my AI grows up',
    slogan: 'Just say it. Mos does the moving.',
    taglineSize: 46,
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function bg({ tagline, slogan, taglineSize }) {
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#EAF2FC"/><stop offset="1" stop-color="#F7F8F9"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.18" r="0.55">
      <stop offset="0" stop-color="#0F6FDA" stop-opacity="0.20"/>
      <stop offset="1" stop-color="#0F6FDA" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="80" y="330" font-family="NanumSquare" font-weight="700" font-size="${taglineSize}" fill="#1D2026">${esc(tagline)}</text>
  <text x="80" y="396" font-family="NanumSquare" font-weight="400" font-size="30" fill="#4F555F">${esc(slogan)}</text>
</svg>`);
}

const logo = await sharp('static/brand/mosmos-horizontal-color.svg')
  .resize({ width: 240 })
  .png()
  .toBuffer();
const character = await sharp('static/characters/mos-greeting.webp')
  .resize({ width: 340 })
  .png()
  .toBuffer();

for (const [locale, v] of Object.entries(VARIANTS)) {
  const out = `static/og-${locale}.png`;
  await sharp(bg(v))
    .composite([
      { input: logo, top: 72, left: 80 },
      { input: character, top: 250, left: 820 },
    ])
    .png()
    .toFile(out);
  console.log(`${out}  ${(statSync(out).size / 1024).toFixed(1)} KB`);
}
