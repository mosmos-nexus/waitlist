import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
/** Newest cached chromium, whatever its build number. Hardcoding one breaks
 *  every time playwright-core is bumped or the cache is pruned. */
export function chromePath() {
  const root = join(process.env.HOME, '.cache/ms-playwright');
  const cands = readdirSync(root)
    .filter((d) => /^chromium(_headless_shell)?-\d+$/.test(d))
    .sort((a, b) => +b.split('-')[1] - +a.split('-')[1])
    .flatMap((d) => [
      join(root, d, 'chrome-linux64/chrome'),
      join(root, d, 'chrome-headless-shell-linux64/chrome-headless-shell'),
    ]);
  const hit = cands.find(existsSync);
  if (!hit) throw new Error('no cached chromium under ' + root);
  return hit;
}
