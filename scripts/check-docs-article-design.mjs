// Supplemental interaction/theme checks; exhaustive light screenshots are separate.
// DOCS_BROWSER_CHANNEL=chrome node scripts/check-docs-article-design.mjs ../webapp/apps/app
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
const appRoot = process.argv[2];
assert(appRoot, 'Pass the app path containing Playwright');
const base = new URL(process.argv[3] ?? 'http://localhost:3334');
assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Use a local docs preview');
const out = resolve(process.argv[4] ?? '/tmp/odella-docs-visual-audit/supplementary');
await mkdir(out, { recursive: true });
const require = createRequire(join(resolve(appRoot), 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.DOCS_BROWSER_CHANNEL ? { channel: process.env.DOCS_BROWSER_CHANNEL } : {}) });
const routes = ['platform/access-control', 'guides/documents-and-knowledge', 'guides/onboard-an-employee', 'block-reference/agents/agent', 'block-reference/io/graph-output', 'templates/03_docx-template', 'workforce/settings-model-intelligence'];
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(new URL('/platform/access-control', base).href);
      if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const route of routes) {
          await page.goto(new URL('/' + route, base).href, { waitUntil: 'domcontentloaded' });
          await page.locator('#content').waitFor();
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1, route);
          assert.equal(await page.locator('html').evaluate((e) => e.classList.contains('dark')), theme === 'dark');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, route);
          assert.equal(await page.locator('#page-title').evaluate((e) => getComputedStyle(e).fontSize), width === 1440 ? '42px' : '32px');
          if (width === 1440) {
            const title = await page.locator('#page-title').boundingBox();
            const copy = await page.locator('#page-context-menu:visible').boundingBox();
            assert(copy && title && copy.y + copy.height <= title.y + 1, `${route}: Copy page competes with title`);
          }
          await page.screenshot({ path: join(out, `${theme}-${width}-${route.replaceAll('/', '--')}.png`), animations: 'disabled' });
        }
      }
      assert.deepEqual(errors, [], `${theme}: browser errors`);
      console.log(`${theme}: seven article/guide/reference layouts at desktop and mobile passed`);
    } finally { await context.close(); }
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 1000 }, reducedMotion: 'reduce' });
  try {
    await page.goto(new URL('/guides/access-and-security', base).href);
    await page.locator('#content a[href="/platform/access-control"]').first().click();
    await page.waitForURL('**/platform/access-control');
    const region = page.locator('[data-docs-table-scroll]').first();
    await region.waitFor();
    assert(await page.locator('.docs-table-hint').first().isVisible());
    assert.equal(await region.getAttribute('role'), 'region');
    assert(await page.locator('#' + await region.getAttribute('aria-describedby')).isVisible());
    await region.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
    assert(await region.evaluate((e) => e.scrollLeft > 0), 'Table must scroll from the keyboard');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForFunction(() => document.querySelectorAll('[data-docs-table-scroll]').length === 0);
    assert.equal(await page.locator('.docs-table-hint').count(), 0, 'Remove hints when table fits');
    await page.goto(new URL('/block-reference/data/image', base).href);
    const illustration = page.locator('img[src="/images/guides/image-block-example.svg"]');
    await illustration.waitFor();
    await illustration.screenshot({ path: join(out, 'image-block-illustration.png') });
    console.log('Tables: client navigation, visible hint, ARIA description, keyboard scrolling, and resize cleanup passed');
  } finally { await page.close(); }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } });
  try {
    const page = await context.newPage();
    await page.goto(new URL('/platform/access-control', base).href);
    assert(await page.locator('#content table').first().isVisible());
    assert(await page.locator('#content table').first().evaluate((table) => {
      let e = table.parentElement;
      while (e && !/^(auto|scroll)$/.test(getComputedStyle(e).overflowX)) e = e.parentElement;
      if (!e || e.scrollWidth <= e.clientWidth) return false;
      e.scrollLeft = 50;
      return e.scrollLeft > 0;
    }), 'Native table scrolling must survive without site JavaScript');
    console.log('No-JavaScript native table scrolling passed');
  } finally { await context.close(); }
} finally { await browser.close(); }
