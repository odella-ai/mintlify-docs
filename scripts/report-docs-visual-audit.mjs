// Validate exhaustive capture coverage and join measured evidence to authored review notes.
// This does NOT perform visual review. Read the sheets/full screenshots before updating notes.
// node scripts/report-docs-visual-audit.mjs /tmp/odella-docs-visual-audit > .agents/reviews/visual-page-review.md
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(process.argv[2] ?? '/tmp/odella-docs-visual-audit');
const notes = JSON.parse(await readFile(new URL('../.agents/reviews/visual-page-notes.json', import.meta.url), 'utf8'));
const before = JSON.parse(await readFile(join(root, 'before/manifest.json'), 'utf8'));
const after = JSON.parse(await readFile(join(root, 'after/manifest.json'), 'utf8'));
const routes = [...new Set(after.map((row) => row.route))].sort();
assert.equal(before.length, routes.length * 2, 'Incomplete baseline capture');
assert.equal(after.length, routes.length * 2, 'Incomplete final capture');
assert.deepEqual(Object.keys(notes).sort(), routes, 'Every published page needs an authored critique/decision');
for (const [phase, rows] of [['before', before], ['after', after]]) {
  assert.equal(new Set(rows.map((row) => `${row.route}:${row.width}`)).size, rows.length, 'Duplicate capture');
  for (const route of routes) assert.deepEqual(rows.filter((row) => row.route === route).map((row) => row.width).sort(), [1440, 390]);
  for (const row of rows) {
    assert(!row.failure, `${phase} ${row.route}: ${row.failure}`);
    assert.equal(row.httpStatus, 200, `${phase} ${row.route}: HTTP ${row.httpStatus}`);
    assert((await stat(join(root, phase, row.file))).size > 0, 'Missing screenshot');
    if (phase === 'after') {
      assert.equal(row.h1s.length, 1, `${row.route}: expected one visible H1`);
      assert.equal(row.overflow, false, `${row.route}: document overflow`);
      assert.equal(row.brokenImages.length, 0, `${row.route}: broken image`);
      assert.equal(row.errors.length, 0, `${row.route}: client-side error`);
    }
  }
}
const duplicateCount = new Set(before.filter((row) => row.h1s.length > 1).map((row) => row.route)).size;
const hasMetadata = (row) => row.headings.some((heading) => heading.text.trim().toLowerCase() === 'block metadata');
const metadataCount = after.filter((row) => row.width === 1440 && hasMetadata(row)).length;
assert.equal(metadataCount, before.filter((row) => row.width === 1440 && hasMetadata(row)).length, 'Reference metadata was lost');
const link = (path) => pathToFileURL(join(root, path)).href;
const md = (text) => text.replaceAll('|', '\\|').replaceAll('\n', ' ');
console.log(`# Exhaustive documentation visual review

## Scope and evidence

- **${routes.length} published pages**, including all 88 protected app-linked references, not just sidebar pages.
- **${before.length} before + ${after.length} after full-page PNGs** at 1440px desktop and 390px mobile (1000px viewport height).
- Visual inspection: all before/after overview sheets (top, middle, whole-page silhouette, desktop and mobile); all baseline ending sheets; native-resolution follow-up on article headers, guide hubs, table behavior, and the off-brand example.
- This is a layout/design review, not an assertion that every product instruction or security behavior was reverified. Capturing a page is not itself visual inspection; the authored notes below record the decisions.
- [Before gallery](${link('before/index.html')}) · [After gallery](${link('after/index.html')}). Open any PNG at native resolution. Evidence is local under \`${root}\`, not published or committed as hundreds of large images.
- Contact sheets: \`before/sheets/overview-01…18.png\`, \`before/sheets/endings-01…09.png\`, and \`after/sheets/overview-01…18.png\`. Final ending sheets are also generated for follow-up.

## Reference and design decisions

Visually inspected Grok Bot's [guide index](https://x.ai/bot/guides), [101 guide](https://x.ai/bot/guides/grok-bot-101), and [support guide](https://x.ai/bot/guides/grok-bot-for-support). Reference screenshots are in \`reference/\` beside the galleries.

Borrowed editorial hierarchy, quiet dividers, outcome-led entry points, and scannable choices. Kept Odella's Inter font, neutral surfaces, exact app wordmarks/favicon, Luma sidebar, AI Employee terminology, existing task screenshots, and original narrated walkthrough. Following user feedback, Welcome now uses a native docs header and guide directory instead of the landing-style hero and promotional illustrations. No Grok artwork or branding copied.

## Implemented

1. Shared article system: 42px desktop / 32px mobile titles, quieter neutral text, a header divider, clearer section rhythm, and Copy page moved off the desktop title line. Normal reading width and native responsive navigation remain.
2. Removed **${duplicateCount} duplicate H1s**; retained their old fragment IDs explicitly. The Markdown H1 inside the skill code example is unchanged.
3. Removed redundant title sections from **${metadataCount} short block references**; styled their existing metadata as compact, bounded reference panels. Did not invent missing settings or fabricate product screenshots.
4. Added outcome-led entry panels and an obvious starting action to **all seven guide hubs**. Replaced the two widest hub decision tables with linked choices that stack on mobile.
5. Wide comparison tables keep readable columns. \`docs-tables.js\` adds a visible scroll hint, keyboard focus, and an accessible region only when a table actually overflows. It handles client navigation and resize; native scrolling still works without JavaScript.
6. Replaced the Image Block example containing a large Rivet logo with an explicitly labeled neutral illustration. Actual block screenshots remain; the old asset is not deleted. No fabricated screenshot is presented as the live app.
7. Preserved all 21 local recordings, the landing demo, all 88 protected reference routes, and the existing article/source material apart from redundant headings, the two reformatted decision tables, and a truncated block-introduction cleanup.

## Final measured checks

All **${after.length}/${after.length}** final page/viewport captures return HTTP 200, have exactly one visible H1, no document-level horizontal overflow, no broken content images, and no captured client-side errors. Intended table/code scrolling is not counted as document overflow.

Additional checks: navigation/asset contracts, the existing 14-page 1440/1024/390 layout suite, all 88 app-linked URLs, mobile drawer, original demo keyboard playback/no-fetch-before-play/no-JavaScript fallback, Mintlify broken links and strict build/validation. Supplementary checks cover dark article/guide/metadata surfaces and keyboard table scrolling, resize, and client navigation.

## Page-by-page register

Every row has desktop/mobile before/after evidence and an authored page-specific observation. “Shared article system” is a real shared CSS improvement, not a claim that each page needed a bespoke rewrite. Pages with sound existing media or structure explicitly retain them.

| ID / page | Before D / M | After D / M | Critique and design decision | Applied |
| --- | --- | --- | --- | --- |`);
for (const route of routes) {
  const oldD = before.find((row) => row.route === route && row.width === 1440);
  const oldM = before.find((row) => row.route === route && row.width === 390);
  const newD = after.find((row) => row.route === route && row.width === 1440);
  const newM = after.find((row) => row.route === route && row.width === 390);
  const applied = route === 'introduction' ? ['Native docs header; starting guides; task directory; original walkthrough retained'] : ['Shared article system'];
  if (oldD.h1s.length > 1) applied.push('One H1; old anchor retained');
  if (hasMetadata(newD)) applied.push('Consolidated title; metadata panel');
  if (route.startsWith('guides/')) applied.push('Entry panel and starting action');
  if (['guides/documents-and-knowledge', 'guides/connect-tools-and-channels'].includes(route)) applied.push('Responsive choice cards');
  if (newM.tables.some((table) => table.width > newM.content.width)) applied.push('Readable, scrollable comparison');
  if (route === 'block-reference/data/image') applied.push('Labeled neutral illustration');
  console.log(`| ${newD.id} · \`/${route}\` | [D](${link('before/' + oldD.file)}) / [M](${link('before/' + oldM.file)}) | [D](${link('after/' + newD.file)}) / [M](${link('after/' + newM.file)}) | ${md(notes[route])} | ${applied.join('; ')} |`);
}
console.log(`
## Reproduce

Keep the local preview on port 3334. Playwright is resolved from the sibling web app; contact sheets require Python Pillow and the macOS Arial font.

\`\`\`bash
DOCS_BROWSER_CHANNEL=chrome node scripts/capture-docs-audit.mjs ../webapp/apps/app http://localhost:3334 /tmp/odella-docs-visual-audit before
# Review the before evidence, then make changes.
DOCS_BROWSER_CHANNEL=chrome node scripts/capture-docs-audit.mjs ../webapp/apps/app http://localhost:3334 /tmp/odella-docs-visual-audit after
# Add --retry-failures if Chrome's concurrent full-page capture hits a transient raster error.
python3 scripts/build-docs-contact-sheets.py /tmp/odella-docs-visual-audit before
python3 scripts/build-docs-contact-sheets.py /tmp/odella-docs-visual-audit after
# Inspect sheets and native-resolution issue pages, then update authored notes.
node scripts/report-docs-visual-audit.mjs /tmp/odella-docs-visual-audit > .agents/reviews/visual-page-review.md
\`\`\`

## Retained limitations

- Very long reference pages, especially DOCX syntax and the block catalog, remain long deliberately; code samples and anchored examples were not hidden just to make screenshots shorter.
- Small UI labels inside existing recordings/screenshots still require opening media at full size. The visual pass does not claim to have rerecorded the current application.
- The new neutral illustration is explicitly an illustration, not evidence of a particular deployed editor state.
- Security/deployment verification items in the governance/security audits remain open. Visual polish does not resolve or strengthen those claims.
- The visual review did not publish the site, mutate production data, or make a new product recording.`);
