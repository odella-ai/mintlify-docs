// DOCS_BROWSER_CHANNEL=chrome node scripts/check-channel-branding-layout.mjs ../webapp/apps/app [http://localhost:3334]
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
assert(process.argv[2], 'Pass the app path containing Playwright');
const require = createRequire(join(resolve(process.argv[2]), 'package.json'));
const { chromium } = require('playwright');
const base = new URL(process.argv[3] ?? 'http://localhost:3334');
assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Use a local public docs preview');
const out = resolve(process.argv[4] ?? '/tmp/odella-channel-branding');
await mkdir(out, { recursive: true });
const routes = (await readdir(join(root, 'workforce/channels'))).filter((file) => file.endsWith('.mdx')).map((file) => 'workforce/channels/' + file.slice(0, -4));
routes.push('workforce/communication-channels', 'guides/connect-tools-and-channels');
const browser = await chromium.launch({ headless: true, ...(process.env.DOCS_BROWSER_CHANNEL ? { channel: process.env.DOCS_BROWSER_CHANNEL } : {}) });
const results = [];
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(new URL('/workforce/channels/slack', base).href);
      if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
      for (const width of [1440, 1024, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const route of routes) {
          const response = await page.goto(new URL('/' + route, base).href, { waitUntil: 'domcontentloaded' });
          assert.equal(response.status(), 200, route);
          const hero = page.locator('.channel-hero');
          await page.locator(route.startsWith('workforce/channels/') ? '.channel-hero' : '.channel-logo-grid').waitFor();
          await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all([...document.querySelectorAll('#content img')].map(async (image) => { image.loading = 'eager'; await image.decode(); }));
            document.documentElement.style.scrollBehavior = 'auto';
            window.scrollTo({ top: 0, behavior: 'instant' });
          });
          assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1, route);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${route}: overflow at ${width}`);
          assert.equal(await page.locator('html').evaluate((e) => e.classList.contains('dark')), theme === 'dark');
          assert.equal(await page.locator('.channel-hero button, .channel-logo-card button, .channel-logo-card a').count(), 0, 'Logos must not add nested controls or lightboxes');
          const logoMetrics = await page.locator('.channel-hero img, .channel-card-logo img').evaluateAll((images) => images.map((image) => ({
            src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0,
            filter: getComputedStyle(image).filter, fit: getComputedStyle(image).objectFit,
          })));
          assert(logoMetrics.every((image) => image.loaded && image.filter === 'none' && image.fit === 'contain'), `${route}: preserve real logo appearance`);
          if (route.startsWith('workforce/channels/')) {
            assert.equal(await hero.count(), 1);
            assert(await hero.getAttribute('aria-label'));
            if (['workforce/channels/whatsapp', 'workforce/channels/google-meet'].includes(route)) {
              const warning = await page.locator('[data-callout-type="warning"]').first().boundingBox();
              assert(warning && warning.y < (await hero.boundingBox()).y, 'Keep availability warnings before artwork');
            }
          } else assert.equal(await page.locator('.channel-logo-card').count(), 10);
          if (width !== 1024) {
            const stem = `${theme}-${width}-${route.replaceAll('/', '--')}`;
            await page.screenshot({ path: join(out, stem + '.png'), fullPage: true, animations: 'disabled' });
            if (route.startsWith('workforce/channels/')) await hero.screenshot({ path: join(out, stem + '-art.png') });
          }
          results.push({ route, width, theme, logos: logoMetrics.length, passed: true });
        }
      }
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } });
  try {
    const page = await context.newPage();
    await page.goto(new URL('/workforce/channels/slack', base).href);
    assert(await page.locator('.channel-hero').isVisible());
    await page.goto(new URL('/workforce/communication-channels', base).href);
    assert.equal(await page.locator('.channel-logo-card').count(), 10);
    await page.locator('.channel-logo-card[data-channel="slack"] img').click();
    await page.waitForURL('**/workforce/channels/slack');
    assert(await page.locator('.channel-hero').isVisible());
  } finally { await context.close(); }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  try {
    await page.goto(new URL('/workforce/communication-channels', base).href);
    const card = page.locator('.channel-logo-card[data-channel="teams"]');
    await card.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/workforce/channels/teams');
  } finally { await page.close(); }
  await writeFile(join(out, 'manifest.json'), JSON.stringify(results, null, 2));
  console.log(`Channel layouts passed: ${routes.length} pages × 3 widths × light/dark; ${routes.length * 4} full-page screenshots; no-JavaScript logo links and keyboard navigation. Evidence: ${out}`);
} finally { await browser.close(); }
