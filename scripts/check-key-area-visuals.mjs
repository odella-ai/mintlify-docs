// node scripts/check-key-area-visuals.mjs [../webapp/apps/app] [http://localhost:3334]
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const assets = join(root, 'images/features/automation');
const manifest = JSON.parse(await readFile(join(assets, 'provenance.json'), 'utf8'));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.length, 5);
assert.equal(new Set(manifest.map((item) => item.file)).size, 5);
for (const item of manifest) {
  const bytes = await readFile(join(assets, item.file));
  assert.equal(hash(bytes), item.sha256, `${item.file}: provenance hash mismatch`);
  assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a');
  assert(bytes.readUInt32BE(16) >= 1000 && bytes.readUInt32BE(20) >= 600, `${item.file}: capture too small`);
  assert.equal(item.timezone, 'Europe/London');
  assert(item.fixture.includes('Synthetic'));
  if (process.argv[2]) for (const [file, sha] of Object.entries(item.componentHashes)) assert.equal(hash(await readFile(resolve(process.argv[2], file))), sha, `App component changed: recapture ${file}`);
}
const requirements = {
  'platform/vault': ['vault.svg', 'vault-new-login.png', '/images/features/vault.png'],
  'workforce/calendar': ['calendar-overview.png', 'schedule-create.png', 'schedule-recurring.png'],
  'workforce/actions': ['event-action.png'],
  'guides/automate-recurring-work': ['schedule-recurring.png'],
};
for (const [route, names] of Object.entries(requirements)) {
  const source = await readFile(join(root, route + '.mdx'), 'utf8');
  for (const name of names) assert(source.includes(name), `${route}: missing ${name}`);
  for (const [, src, alt] of source.matchAll(/<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/g)) { assert(alt.length > 15); if (src.startsWith('/')) await readFile(join(root, src.slice(1))); }
}
const vault = await readFile(join(root, 'platform/vault.mdx'), 'utf8');
assert(vault.includes('not a zero-knowledge') && vault.includes('HTTP-method restriction'));
assert(vault.includes('Concept illustration—not a product screen'));
console.log('Key-area assets passed: five provenance-checked UI captures, original Vault concept, existing screenshots and security qualifications retained.');
if (process.argv[3]) {
  assert(process.argv[2], 'Browser checks need the app path containing Playwright');
  const base = new URL(process.argv[3]);
  assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname));
  const { chromium } = createRequire(join(resolve(process.argv[2]), 'package.json'))('playwright');
  const browser = await chromium.launch({ channel: process.env.DOCS_BROWSER_CHANNEL ?? 'chrome' });
  const out = '/tmp/odella-key-area-audit/supplementary';
  await mkdir(out, { recursive: true });
  try {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(new URL('/platform/vault', base).href);
      if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
      try {
        for (const width of [1440, 1024, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          for (const [route, names] of Object.entries(requirements)) {
            const response = await page.goto(new URL('/' + route, base).href);
            assert.equal(response.status(), 200);
            await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll('#content img')].map(async (image) => { image.loading = 'eager'; await image.decode(); })); });
            assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${route} overflow at ${width}`);
            assert.equal(await page.locator('html').evaluate((e) => e.classList.contains('dark')), theme === 'dark');
            for (const name of names) assert.equal(await page.locator(`#content img[src$="${name}"]`).count(), 1);
            if (width !== 1024) await page.screenshot({ path: join(out, `${theme}-${width}-${route.replaceAll('/', '--')}.png`), fullPage: true });
          }
        }
        assert.deepEqual(errors, []);
        await page.locator('#content img[src$="schedule-recurring.png"]').click();
        await page.getByRole('dialog').waitFor();
        await page.keyboard.press('Escape');
      } finally { await context.close(); }
    }
    console.log('Key-area browser checks passed: four pages × three widths × both themes; UI screenshots open for closer inspection.');
  } finally { await browser.close(); }
}
