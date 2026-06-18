import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const SRC = '.claude/skills/design_system/assets/character';
const OUT = 'static/characters';
await mkdir(OUT, { recursive: true });
const mons = ['mon-design', 'mon-organize', 'mon-research'];
const mosNew = ['mos-resting', 'mos-sleeping'];
for (const f of mons) {
  await sharp(`${SRC}/${f}.png`)
    .resize({ width: 520, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(`${OUT}/${f}.webp`);
  console.log('mon ok', f);
}
for (const f of mosNew) {
  await sharp(`${SRC}/${f}.png`)
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(`${OUT}/${f}.webp`);
  console.log('mos ok', f);
}
console.log('DONE');
