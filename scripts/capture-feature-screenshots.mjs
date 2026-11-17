// Synthetic UI only; never attach to an authenticated customer browser.
// Usage: node scripts/capture-feature-screenshots.mjs /absolute/webapp/apps/app http://127.0.0.1:6118
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const app = process.argv[2];
if (!app) throw new Error('Pass the webapp/apps/app directory');
const base = new URL(process.argv[3] ?? 'http://127.0.0.1:6118');
if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) throw new Error('Local Storybook only');
const { chromium } = createRequire(join(resolve(app), 'package.json'))('playwright');
const out = fileURLToPath(new URL('../images/features/', import.meta.url));
const shots = [
  ['custom-list', 'integrations-custom-plugins--custom-integrations-list', 'Acme Knowledge'],
  ['custom-create', 'integrations-custom-plugins--no-authentication-required', 'Create integration'],
  ['custom-settings', 'integrations-custom-plugins--settings-modal', 'Discovered tools'],
  ['mcp-oauth-setup', 'account-developer--claude-code-o-auth', 'claude mcp'],
  ['signing-fields', 'template-builder-redesign-e-signing--recipient-field', 'Signer'],
  ['signing-destination', 'template-builder-redesign-signing-settings--selected-copy', 'Signing'],
  ['signing-requests', 'documents-e-signing--all-requests', 'Signing'],
  ['signing-recipient', 'signing-recipient--review-and-consent', 'Start signing'],
  ['signing-completed', 'signing-recipient--final-copy', 'complete'],
  ['inbox-reader', 'inbox-live-reader-mock-backend--reading-email', 'Inbox'],
  ['inbox-setup', 'inbox-live-reader-mock-backend--configuration', 'Mailboxes'],
  ['daily-brief', 'inbox-daily-brief--live-today', 'To do'],
  ['insights', 'inbox-live-insights--activation', 'Insights'],
  ['vault', 'account-vault--populated', 'Vault'],
  ['computer', 'chat-computer--browser-screen-expanded', 'Computer'],
];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const manifest = [];
let failures = 0;
try {
  for (const [file, id, expected] of shots) {
    if (process.env.SHOT && file !== process.env.SHOT) continue;
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => {
      const u = new URL(route.request().url());
      if (u.origin === base.origin || ['data:', 'blob:'].includes(u.protocol)) return route.continue();
      // Optional image/font artwork never contacts an external host.
      if (!['image', 'font'].includes(route.request().resourceType())) errors.push(`External ${route.request().resourceType()}: ${u.origin}`);
      return route.abort();
    });
    try {
      await page.goto(new URL(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`, base).href, { timeout: 60000, waitUntil: 'domcontentloaded' });
      await page.getByText(expected, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 45000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2000);
      const text = await page.locator('body').innerText();
      if (/Couldn't find story|No Preview|Failed to fetch dynamically/.test(text) || errors.length) throw new Error(errors.join('; ') || text.slice(0, 500));
      // Crop small settings panels; keep the remaining screenshots at the fixed viewport.
      const clip = file === 'signing-destination' ? { x: 395, y: 365, width: 490, height: 175 }
        : file === 'signing-fields' ? { x: 290, y: 25, width: 340, height: 550 }
        : file === 'mcp-oauth-setup' ? { x: 200, y: 400, width: 780, height: 500 }
        : file === 'custom-list' ? { x: 50, y: 50, width: 940, height: 360 }
        : file === 'daily-brief' ? { x: 290, y: 25, width: 700, height: 440 }
        : file === 'computer' ? { x: 395, y: 85, width: 860, height: 800 }
        : undefined;
      await page.screenshot({ path: join(out, `${file}.png`), animations: 'disabled', ...(clip ? { clip } : {}) });
      manifest.push({ file: `${file}.png`, story: id, viewport: '1280x900', ...(clip ? { clip } : {}), sha256: createHash('sha256').update(await readFile(join(out, `${file}.png`))).digest('hex'), source: 'Synthetic Storybook UI; not a live account' });
      console.log(`OK ${file}`);
    } catch (e) { failures++; console.error(`FAIL ${file}: ${e.message}; ${errors.join('; ')}`); }
    finally { await page.close(); }
  }
} finally { await browser.close(); }
if (!process.env.SHOT) await writeFile(join(out, 'provenance.json'), JSON.stringify(manifest, null, 2) + '\n');
if (failures) process.exitCode = 1;
