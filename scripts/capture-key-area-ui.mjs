// Capture real product components with synthetic records, never an authenticated account.
// Start scripts/start-key-area-ui-preview.mjs first, then:
// node scripts/capture-key-area-ui.mjs ../webapp/apps/app [http://127.0.0.1:6119]
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const app = resolve(process.argv[2] ?? '../webapp/apps/app');
const base = new URL(process.argv[3] ?? 'http://127.0.0.1:6119');
assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Local synthetic fixtures only');
const { chromium } = createRequire(join(app, 'package.json'))('playwright');
const out = fileURLToPath(new URL('../images/features/automation/', import.meta.url));
await mkdir(out, { recursive: true });
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: app, encoding: 'utf8' }).trim();
const sourceFiles = [
  'packages/workforce/components/actions/time/time-action-calendar.tsx',
  'packages/workforce/components/actions/time/time-action-dialog.tsx',
  'packages/workforce/components/actions/editor/create-action-modal.tsx',
  'packages/account/components/vault/VaultItemDialog.tsx',
];
const componentHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, sha256(await readFile(join(app, file)))])));
const slackLogoUrl = JSON.parse(await readFile(join(app, '.storybook/fixtures/action-composer-catalog.json'), 'utf8')).integrations.find((item) => item.integrationKey === 'composio:slack').logo;
const slackLogo = await readFile(join(app, 'public/images/channel_logos/slack.svg'));
const shots = [
  { file: 'calendar-overview', story: 'docs-key-areas--calendar', expected: 'Weekly support summary' },
  { file: 'schedule-create', story: 'docs-key-areas--new-schedule', expected: 'One time', dialog: true },
  { file: 'schedule-recurring', story: 'docs-key-areas--recurring-schedule', expected: 'Recurring', dialog: true },
  { file: 'event-action', story: 'workforce-actions-create-action-modal--slack-channel-message-pattern', expected: 'Only run if', dialog: true },
  { file: 'vault-new-login', story: 'account-vault--new-login', expected: 'Save login', dialog: true },
];
const browser = await chromium.launch({ channel: process.env.DOCS_BROWSER_CHANNEL ?? 'chrome' });
const records = [];
try {
  for (const shot of shots) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 2, timezoneId: 'Europe/London', reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const blocked = new Set();
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (shot.file === 'event-action' && url.href === slackLogoUrl && route.request().resourceType() === 'image') return route.fulfill({ contentType: 'image/svg+xml', body: slackLogo });
      if (url.origin === base.origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
      blocked.add(url.origin);
      return route.abort();
    });
    try {
      await page.clock.setFixedTime(new Date('2027-02-08T12:00:00Z'));
      await page.goto(new URL(`/iframe.html?id=${shot.story}&viewMode=story&globals=theme:light`, base).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.getByText(shot.expected, { exact: false }).first().waitFor({ timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      const interactions = [];
      if (shot.file === 'schedule-recurring') {
        // Visit real Select popups so their labels register; do not rewrite DOM labels.
        const choices = page.getByRole('combobox');
        for (let i = 0; i < await choices.count(); i++) { await choices.nth(i).click(); await page.keyboard.press('Escape'); }
        await page.getByText('Timezone', { exact: true }).scrollIntoViewIfNeeded();
        interactions.push('Opened and closed select menus without changing values; scrolled settings to show cadence, weekday, and timezone.');
      }
      if (shot.file === 'event-action') {
        await page.getByPlaceholder('Name this action', { exact: true }).fill('Review support requests');
        for (const input of await page.locator('input').all()) if (await input.inputValue() === '(refund|cancel(?:lation)?)') await input.fill('refund');
        interactions.push('Named the Action and narrowed its existing message pattern to refund using the real form.');
      }
      await page.waitForTimeout(1200);
      const badImages = await page.evaluate(async () => {
        const bad = [];
        for (const image of document.images) {
          if (!image.getClientRects().length) continue;
          try { await image.decode(); } catch { bad.push(image.getAttribute('src')); continue; }
          if (image.naturalWidth <= 1) bad.push(image.getAttribute('src'));
        }
        return bad;
      });
      assert.deepEqual(badImages, [], `Broken or placeholder image in ${shot.file}`);
      const text = await page.locator('body').innerText();
      assert(!/The component failed to render|Couldn't find story|No Preview/i.test(text));
      assert.deepEqual(errors, [], `Client errors in ${shot.file}`);
      await page.evaluate(() => document.activeElement?.blur());
      const target = shot.dialog ? page.getByRole('dialog') : page.locator('#storybook-root');
      assert.equal(await target.count(), 1);
      await target.screenshot({ path: join(out, shot.file + '.png'), animations: 'disabled', timeout: 30000 });
      records.push({ file: shot.file + '.png', story: shot.story, sourceHead, componentHashes,
        fixture: 'Synthetic records; real app components. No customer session, live connection, or real secret.',
        fixedTime: '2027-02-08T12:00:00Z', timezone: 'Europe/London', viewport: { width: 1280, height: 760 }, deviceScaleFactor: 2, interactions,
        ...(shot.file === 'event-action' ? { fixtureAsset: { url: slackLogoUrl, source: 'public/images/channel_logos/slack.svg', sha256: sha256(slackLogo), delivery: 'Fulfilled locally; no remote logo request sent' } } : {}),
        blockedExternalOrigins: [...blocked], sha256: sha256(await readFile(join(out, shot.file + '.png'))) });
      console.log(`Captured ${shot.file}`);
    } finally { await context.close(); }
  }
  await writeFile(join(out, 'provenance.json'), JSON.stringify(records, null, 2) + '\n');
} finally { await browser.close(); }
