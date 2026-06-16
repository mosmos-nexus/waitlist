// Regenerates the optimized brand character images committed under static/characters/.
// Source PNGs (6–7 MB each) live in mosmos-design-system.zip; we ship ~25 KB webp for LCP.
//
//   1) unzip the character art:  unzip -o mosmos-design-system.zip \
//        "mosmos-design-system/project/assets/character/*" -d /tmp/mos-chars
//   2) node scripts/optimize-assets.mjs
import sharp from 'sharp';
import { statSync } from 'node:fs';

const SRC = '/tmp/mos-chars/mosmos-design-system/project/assets/character';
const OUT = 'static/characters';
const POSES = ['greeting', 'happy', 'working', 'curious'];

for (const pose of POSES) {
  const outPath = `${OUT}/mos-${pose}.webp`;
  await sharp(`${SRC}/mos-${pose}.png`)
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outPath);
  console.log(`mos-${pose}.webp  ${(statSync(outPath).size / 1024).toFixed(1)} KB`);
}
