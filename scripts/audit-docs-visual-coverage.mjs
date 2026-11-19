// Inventory visible task/setup pages, distinguishing UI screenshots from logos.
// node scripts/audit-docs-visual-coverage.mjs [/tmp/odella-key-area-audit/before/manifest.json]
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const load = async (path) => JSON.parse(await readFile(path, 'utf8'));
const config = await load(join(root, 'docs.json'));
const plan = await load(join(root, '.agents/reviews/key-area-visual-plan.json'));
const routes = [];
function walk(x, hidden = false) {
  if (Array.isArray(x)) return x.forEach((v) => walk(v, hidden));
  if (!x || typeof x !== 'object' || hidden || x.hidden === true) return;
  if (x.root) routes.push(x.root);
  for (const p of x.pages ?? []) typeof p === 'string' ? routes.push(p) : walk(p);
  for (const g of x.groups ?? []) walk(g);
}
walk(config.navigation);
assert.equal(new Set(routes).size, routes.length);
const evidence = process.argv[2] ? await load(process.argv[2]) : [];
const rows = [];
for (const route of routes) {
  const text = await readFile(join(root, route + '.mdx'), 'utf8');
  const images = [...text.matchAll(/<img\b[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const marks = images.filter((p) => p === '/favicon.svg' || p.includes('/channels/logos/'));
  const concepts = images.filter((p) => p.includes('/illustrations/') || p.endsWith('.svg') && !marks.includes(p));
  const screenshots = images.filter((p) => !marks.includes(p) && !concepts.includes(p));
  const videos = [...text.matchAll(/<video\b/g)].length;
  const status = plan.implemented[route] ? 'Implemented' : plan.deferred?.[route] ? 'Deferred: setup fixture' : plan.next[route] ? 'Next: product UI' : plan.later[route] ? 'Later / verify first' : plan.keepText.includes(route) ? 'Keep text-first' : screenshots.length || videos || marks.length ? 'Keep existing visuals' : 'Keep guide/reference concise';
  const note = plan.implemented[route] ?? plan.deferred?.[route] ?? plan.next[route] ?? plan.later[route] ?? (plan.keepText.includes(route) ? 'A screenshot or decorative hero is not required for this reference. Add one only for a concrete setup gap.' : 'Preserve useful existing media. Guide hubs should route to the detailed walkthrough instead of repeating galleries.');
  const baseline = evidence.filter((r) => r.route === route);
  if (process.argv[2]) {
    assert.equal(baseline.length, 2, `Need desktop/mobile baseline: ${route}`);
    assert(baseline.every((r) => !r.failure && r.httpStatus === 200 && !r.overflow && !r.brokenImages.length && !r.errors.length), `Bad baseline capture: ${route}`);
  }
  rows.push({ route, title: text.match(/^title: "(.*)"/m)?.[1] ?? route, status, note, screenshots, concepts, marks, videos, ...(plan.implemented[route] && plan.later[route] ? { followUp: plan.later[route] } : {}), baseline: baseline.map(({ width, file }) => ({ width, file })) });
}
for (const group of ['implemented', 'next', 'later', 'deferred']) for (const route of Object.keys(plan[group])) assert(routes.includes(route), `Plan references hidden/missing page: ${route}`);
await writeFile(join(root, '.agents/reviews/key-area-visual-coverage.json'), JSON.stringify(rows, null, 2) + '\n');
const counts = Object.fromEntries([...new Set(rows.map((r) => r.status))].map((s) => [s, rows.filter((r) => r.status === s).length]));
const md = [
  '# Key-area visual coverage audit', '',
  `Scope: **${rows.length} visible pages**. Hidden app-linked workflow references and the three compatibility channel pages remain untouched by this inventory.`, '',
  '## Findings', '',
  '- The biggest setup gaps were Calendar and Actions: both were text-only. Vault had a real list screenshot, but no explanatory illustration or item form.',
  '- This pass adds an original Vault concept illustration and real product-component captures for the login form, Calendar, schedule creation/recurrence, and an event Action. All screenshots use synthetic records, never customer data.',
  '- All 15 original priority setup pages now have real UI captures and relevant setup guidance. Additional account, permissions, credential-scope, and employee-orientation follow-ups are implemented too.',
  '- Five provider/channel-specific setup captures are explicitly deferred pending faithful fixtures or confirmation of supported account controls. Provider-admin read-only screenshots remain service-specific; Odella policy UI is not a substitute.',
  '- Do not use generic lock/robot art as a substitute for showing settings. Diagrams are most useful for identity/credential scope and the worker → task → reviewed result relationship.',
  '- Existing channel marks, tours, signing/Inbox/Computer screenshots, and security walkthroughs already provide useful visual coverage. Keep them. Logos identify products; they are not evidence of setup or successful connection.',
  '- Welcome stays documentation-native. Do not add decorative heroes to every guide, reference, billing, or destructive-operation page.', '',
  '## Evidence and limitations', '',
  process.argv[2] ? `Captured all ${rows.length} visible pages at 1440px and 390px: **${evidence.length} baseline screenshots**. Files: \`${process.argv[2]}\`. Contact-sheet review identifies density/coverage; it is not a production feature acceptance or security test.` : 'Run with the baseline manifest to verify desktop/mobile capture coverage.',
  '', 'New UI capture provenance is in `images/features/automation/provenance.json`. It records the app source commit/component hashes, fictional records, fixed time/timezone, and image hashes. The Vault illustration is explicitly labeled as a concept, not a product screen. API-key sharing now has a faithful no-secret/no-save fixture. Further actual-product captures and fixture details are in `images/features/setup/provenance.json`.', '',
  '## Coverage summary', '', ...Object.entries(counts).map(([s, n]) => `- ${s}: ${n}`), '',
  '## Page-by-page decisions', '',
  '| Page | Decision | Existing/new visual assets | Action |', '| --- | --- | --- | --- |',
  ...rows.map((r) => `| [${r.title}](/${r.route}) | ${r.status} | ${r.screenshots.length} screenshot(s), ${r.concepts.length} concept(s), ${r.marks.length} mark(s), ${r.videos} video element(s) | ${r.note.replaceAll('|', '/')} |`), '',
  'Video counts include light/dark elements, not unique recordings. The inventory separates channel logos/concepts from screenshots; non-logo raster images are candidates for UI evidence and still require provenance review.', '',
];
await writeFile(join(root, '.agents/reviews/key-area-visual-audit.md'), md.join('\n'));
console.log(`Audited ${rows.length} visible pages. ${JSON.stringify(counts)}`);
