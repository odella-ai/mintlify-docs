// Synthetic actual UI only. Never attach to an authenticated customer browser.
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
const logo = await readFile(join(out, 'fixtures/integration-logo.png'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const shots = [
  { file: 'custom-list', id: 'integrations-custom-plugins--custom-integrations-list', expected: 'Acme Knowledge', clip: { x: 60, y: 60, width: 925, height: 355 } },
  { file: 'custom-create', id: 'integrations-custom-plugins--no-authentication-required', expected: 'Create integration', height: 1100, selector: '[role="dialog"]' },
  { file: 'custom-settings', id: 'integrations-custom-plugins--custom-integrations-list', expected: 'Discovered tools', openSettings: true, selector: '[role="dialog"]' },
  { file: 'mcp-oauth-setup', id: 'account-developer--claude-code-o-auth', expected: 'claude mcp', height: 1100, selector: 'section[aria-labelledby]' },
  { file: 'signing-fields', id: 'template-builder-redesign-e-signing--recipient-field', expected: 'Signer', clip: { x: 290, y: 25, width: 340, height: 550 } },
  { file: 'signing-destination', id: 'template-builder-redesign-signing-settings--selected-copy', expected: 'Signing', selector: '[role="dialog"]' },
  { file: 'signing-requests', id: 'documents-e-signing--all-requests', expected: 'Signing' },
  { file: 'signing-recipient', id: 'signing-recipient--review-and-consent', expected: 'Start signing' },
  { file: 'signing-completed', id: 'signing-recipient--final-copy', expected: 'complete', clip: { x: 380, y: 100, width: 520, height: 425 } },
  { file: 'inbox-reader', id: 'inbox-live-reader-mock-backend--reading-email', expected: 'Inbox' },
  { file: 'inbox-setup', id: 'inbox-live-reader-mock-backend--configuration', expected: 'Mailboxes', clip: { x: 255, y: 80, width: 770, height: 450 } },
  { file: 'daily-brief', id: 'inbox-daily-brief--live-today', expected: 'To do', clip: { x: 290, y: 25, width: 700, height: 440 } },
  { file: 'insights', id: 'inbox-live-insights--activation', expected: 'Insights', clip: { x: 165, y: 65, width: 950, height: 305 } },
  { file: 'vault', id: 'account-vault--populated', expected: 'Vault', clip: { x: 190, y: 0, width: 900, height: 390 } },
  { file: 'computer', id: 'browser-review-browser-and-terminal-workspace--request-inside-computer', expected: "I'm done", width: 1440, height: 900, clip: { x: 0, y: 45, width: 1440, height: 855 } },
];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const manifest = [];
let failures = 0;
try {
  // Render only the fictional external website. This image supplies the mock
  // browser transport's page pixels; Odella's Computer UI is never redrawn.
  const portal = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await portal.route('**/*', route => route.abort());
  const portalHtml = await readFile(join(out, 'fixtures/client-portal.html'), 'utf8');
  await portal.setContent(portalHtml);
  const portalBytes = await portal.screenshot({ type: 'jpeg', quality: 95, path: join(out, 'fixtures/client-portal.jpg') });
  await portal.close();
  for (const shot of shots) {
    const { file, id, expected } = shot;
    if (process.env.SHOT && file !== process.env.SHOT) continue;
    const viewport = { width: shot.width ?? 1280, height: shot.height ?? 900 };
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const errors = [];
    const fixtureOverrides = [];
    page.on('pageerror', e => errors.push(e.message));
    if (file === 'computer') {
      fixtureOverrides.push({ kind: 'synthetic-external-website-frame', source: 'fixtures/client-portal.html', sourceSha256: sha256(portalHtml), asset: 'fixtures/client-portal.jpg', sha256: sha256(portalBytes) });
      await page.addInitScript(({ dataUrl }) => {
        const original = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function (...args) {
          // Exact canvas signature of browser-review/fixture.ts, not PDF,
          // charts, product UI, or arbitrary browser canvases.
          if (this.width === 1280 && this.height === 800 && args[0] === 'image/jpeg' && args[1] === 0.75) return dataUrl;
          return original.apply(this, args);
        };
      }, { dataUrl: `data:image/jpeg;base64,${portalBytes.toString('base64')}` });
    }
    if (file.startsWith('custom-')) {
      // Fix only synthetic test data, not product markup. The upstream create
      // fixture returns a 1x1 transparent logo, and its settings omit Acme's logo.
      // Use the same checked-in synthetic icon as the catalog example.
      fixtureOverrides.push({ kind: 'synthetic-integration-logo', asset: 'fixtures/integration-logo.png', sha256: sha256(logo) });
      await page.addInitScript(({ logoUrl }) => {
        const normalize = value => {
          if (!value || typeof value !== 'object') return;
          if (value.name === 'Acme Knowledge') value.logo = logoUrl;
          if (typeof value.logo === 'string' && value.logo.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB')) value.logo = logoUrl;
          Object.values(value).forEach(normalize);
        };
        const wrap = fn => async (...args) => {
          const response = await fn(...args);
          const input = args[0];
          const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href);
          if (!url.pathname.startsWith('/api/plugins/custom') || !response.headers.get('content-type')?.includes('json')) return response;
          const json = await response.clone().json();
          normalize(json);
          return new Response(JSON.stringify(json), { status: response.status, statusText: response.statusText, headers: response.headers });
        };
        let current = wrap(window.fetch.bind(window));
        Object.defineProperty(window, 'fetch', { configurable: true, get: () => current, set: fn => { current = wrap(fn); } });
      }, { logoUrl: `${base.origin}/__docs-fixtures/integration-logo.png` });
    }
    await page.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.origin === base.origin && u.pathname === '/__docs-fixtures/integration-logo.png') return route.fulfill({ contentType: 'image/png', body: logo });
      if (u.origin === base.origin && u.pathname === '/.storybook/mocks/backendUrl.ts' && file === 'computer') {
        // The current local Storybook mock trails the account utility exports.
        // Supply missing routing-only mocks; no UI component is replaced,
        // and all remote network traffic is still blocked.
        const response = await route.fetch();
        let body = await response.text();
        const mocks = {
          getBackendUrlForAccount: '() => window.location.origin',
          getClaimsFromToken: '() => null',
          getServerBackendAudience: '() => window.location.origin',
          SERVER_REGIONS: '["us-east4"]',
        };
        for (const [name, value] of Object.entries(mocks)) {
          if (!new RegExp(`\\b${name}\\b`).test(body)) {
            body += `\nexport const ${name} = ${value};\n`;
            fixtureOverrides.push({ kind: 'missing-storybook-routing-mock', export: name });
          }
        }
        return route.fulfill({ response, body });
      }
      if (u.origin === base.origin || ['data:', 'blob:'].includes(u.protocol)) return route.continue();
      if (!['image', 'font'].includes(route.request().resourceType())) errors.push(`External ${route.request().resourceType()}: ${u.origin}`);
      return route.abort();
    });
    try {
      await page.goto(new URL(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`, base).href, { timeout: 60000, waitUntil: 'domcontentloaded' });
      if (shot.openSettings) await page.getByRole('button', { name: 'Manage Acme Knowledge', exact: true }).click({ timeout: 45000 });
      await page.getByText(expected, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 45000 });
      if (file === 'computer') await page.getByRole('img', { name: 'Your browser' }).first().waitFor({ timeout: 45000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1800);
      // Remove incidental keyboard focus, not content or product controls.
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      const text = await page.locator('body').innerText();
      if (/Couldn't find story|No Preview|Failed to fetch dynamically|component failed to render/i.test(text) || errors.length) throw new Error(errors.join('; ') || text.slice(0, 500));
      let clip = shot.clip;
      if (file === 'custom-list') {
        const last = await page.getByRole('heading', { name: 'Public Documentation', exact: true }).locator('xpath=ancestor::div[contains(@class,"rounded-r3")][1]').boundingBox();
        if (!last) throw new Error('Missing final custom integration card');
        clip = { ...clip, height: Math.ceil(last.y + last.height + 4 - clip.y) };
      }
      if (shot.selector) {
        const el = file === 'mcp-oauth-setup' ? page.locator(shot.selector).filter({ has: page.getByRole('heading', { name: 'MCP connections', exact: true }) }) : page.locator(shot.selector);
        await el.scrollIntoViewIfNeeded();
        const box = await el.boundingBox();
        if (!box) throw new Error('Missing capture element');
        const x = Math.max(0, Math.floor(box.x) - 8), y = Math.max(0, Math.floor(box.y) - 8);
        clip = { x, y, width: Math.min(viewport.width - x, Math.ceil(box.width) + 16), height: Math.min(viewport.height - y, Math.ceil(box.height) + 16) };
        if (box.height + 8 > clip.height) throw new Error('Capture would cut off the element');
      }
      const badImages = await page.evaluate(async area => {
        const bad = [];
        for (const img of document.images) {
          const r = img.getBoundingClientRect();
          if (!r.width || !r.height || r.right <= area.x || r.left >= area.x + area.width || r.bottom <= area.y || r.top >= area.y + area.height) continue;
          try { await img.decode(); } catch { bad.push({ src: img.getAttribute('src'), reason: 'decode failed' }); continue; }
          if (img.naturalWidth <= 1 || img.naturalHeight <= 1) bad.push({ src: img.getAttribute('src'), reason: 'placeholder image' });
        }
        return bad;
      }, clip ?? { x: 0, y: 0, ...viewport });
      if (badImages.length) throw new Error(`Broken/placeholder images in capture: ${JSON.stringify(badImages)}`);
      await page.screenshot({ path: join(out, `${file}.png`), animations: 'disabled', ...(clip ? { clip } : {}) });
      manifest.push({ file: `${file}.png`, story: id, viewport, ...(clip ? { clip } : {}), ...(shot.openSettings ? { interaction: 'Open Manage Acme Knowledge' } : {}), ...(fixtureOverrides.length ? { fixtureOverrides } : {}), sha256: sha256(await readFile(join(out, `${file}.png`))), source: 'Synthetic Storybook UI; not a live account' });
      console.log(`OK ${file}`);
    } catch (e) { failures++; console.error(`FAIL ${file}: ${e.message}; ${errors.join('; ')}`); }
    finally { await page.close(); }
  }
} finally { await browser.close(); }
// A failed full run must not replace the last complete manifest with a partial one.
if (!process.env.SHOT && !failures) await writeFile(join(out, 'provenance.json'), JSON.stringify(manifest, null, 2) + '\n');
if (failures) process.exitCode = 1;
