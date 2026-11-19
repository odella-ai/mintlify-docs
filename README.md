# Odella documentation

Customer documentation built with Mintlify. Navigation and site settings live in `docs.json`; guides use MDX.

## Development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The local preview runs on port 3334. Run commands from this repository's root.

## Validate changes

```bash
pnpm validate
pnpm broken-links
git diff --check
```

Add new public guides to `docs.json`, use descriptive image alt text, and check internal links. Keep internal audit/release notes under `.agents/`, outside public navigation.

## Navigation and page design

The site uses Luma with one persistent sidebar, not product-area header tabs:

- **Start here:** welcome, mental model, first task, and common questions.
- **Guides:** collapsible groups organized around outcomes. Each group's `root` points to an actionable landing page under `guides/`.
- **Reference:** employee interface/settings detail and developer connections.

Visual-workflow builder/block pages remain relevant, app-linked reference. Their groups use `hidden: true` and `searchable: true`: keep the original URLs and search access, but omit them from the normal sidebar and employee onboarding path. Do not delete or redirect these reference pages. Recurring employee work should start with Calendar and Actions, not a builder tutorial. `scripts/app-reference-routes.json` protects the 88 existing reference URLs.

Keep existing page URLs stable when changing titles or grouping. When retiring a page, preserve the draft privately and add a useful redirect instead of leaving a broken URL. Use clear action labels for guides and precise product names for reference. Add a new public page to exactly one navigation location; use links for related paths instead of duplicating the page in several groups. Avoid making every resource or setting a prerequisite for a user's first task.

The welcome page is a documentation index, not a marketing landing page: it uses Luma's normal header, reading width, and table of contents, with two starting guides, the original narrated walkthrough, and a concise task-guide directory. `.docs-welcome` styles in `styles.css` scope the video player and minor spacing; there is no oversized custom hero, product mockup, or channel illustration. All articles share the Odella editorial layer: stronger titles, quiet dividers, neutral cards, and compact reference metadata. The seven guide hubs have outcome-led starting panels. `docs-tables.js` adds a scroll hint and keyboard-accessible region only to genuinely overflowing tables; native scrolling still works without JavaScript. Inspect both homepage and article layouts when changing global styles or widths.

```bash
node scripts/check-docs-navigation.mjs
DOCS_BROWSER_CHANNEL=chrome node scripts/check-docs-layout.mjs /absolute/path/to/webapp/apps/app
```

The layout check needs the preview running on port 3334 and uses the supplied app's Playwright installation. Pass a different local preview URL as the second argument if needed. It checks representative pages at desktop, tablet, and mobile widths, plus the mobile drawer, employee-setup link, retired tutorial redirect, visible app preview/posters, and dark theme. The navigation check needs no browser and checks active/compatibility page coverage, retired-route handling, duplicate routes, and exclusion of workflow material from the visible path.

## Exhaustive visual review

The authored page-by-page design register is `.agents/reviews/visual-page-review.md`; its observations live in `visual-page-notes.json` alongside it. It covers all 162 published pages, including the hidden app-linked references, not just the representative layout smoke test.

```bash
DOCS_BROWSER_CHANNEL=chrome node scripts/capture-docs-audit.mjs ../webapp/apps/app http://localhost:3334 /tmp/odella-docs-visual-audit before
# Inspect the baseline, make changes, then capture the final state.
DOCS_BROWSER_CHANNEL=chrome node scripts/capture-docs-audit.mjs ../webapp/apps/app http://localhost:3334 /tmp/odella-docs-visual-audit after
python3 scripts/build-docs-contact-sheets.py /tmp/odella-docs-visual-audit before
python3 scripts/build-docs-contact-sheets.py /tmp/odella-docs-visual-audit after
DOCS_BROWSER_CHANNEL=chrome node scripts/check-docs-article-design.mjs ../webapp/apps/app
# Review images and update authored notes before regenerating the register.
node scripts/report-docs-visual-audit.mjs /tmp/odella-docs-visual-audit > .agents/reviews/visual-page-review.md
```

Each capture phase saves 324 full-page desktop/mobile PNGs, a manifest, and a local gallery. Contact sheets show page tops, middles, silhouettes, and endings; open full PNGs to inspect issues at native resolution. The sheet builder requires Python Pillow and macOS Arial. Keep generated images outside the published repository. The report checks complete before/after coverage, HTTP status, one visible H1, broken images, document overflow, and client errors; it does **not** substitute for visual inspection. The supplementary design check covers representative dark/light articles, Copy page positioning, and keyboard/no-JavaScript table scrolling.

If Chrome reports a transient full-page raster error under concurrent capture, rerun the same command with `--retry-failures` for serial recovery. Use `--routes=path/to/page,another/page` to refresh changed pages without overwriting the other evidence. Do not overwrite a historical baseline after making design changes.

## Content audit and retirement

The page-by-page decision register lives at `.agents/reviews/content-audit.md`. Regenerate it after moving or retiring content:

```bash
node scripts/audit-docs-content.mjs > .agents/reviews/content-audit.md
```

The six workflow tutorials and their screenshots are preserved under `.agents/archive/workflow-tutorial/`, outside public publishing. The former Skill tree and worker Templates explainers were merged into Employee profile and Assign and use document templates, with redirects and archived drafts. Keep genuinely distinct instructions; do not add another overview merely to mirror a UI noun.

## Product accuracy

Verify instructions against current application routes, UI components, and domain behavior. A checked-in component or Storybook example is not proof that a feature is available in every account, region, or production deployment.

For each feature guide, document prerequisites/permissions, setup, expected results, recovery, and relevant billing/security implications. Use the Odella terminology rules in `.agents/skills/odella-copywriting/SKILL.md`.

## Branding and recordings

Use the web app's favicon and wordmark assets, not a separately drawn docs variant. `favicon.svg`, `favicon.png`, and `favicon.ico` match `webapp/apps/app/public/`; `logo/light.png` and `logo/dark.png` match its grayscale and white wordmarks. `docs.json` selects the SVG favicon and these PNG wordmarks.

Keep sidebar groups and page labels text-only. Expansion arrows, search, playback controls, and other functional controls are different from decorative navigation icons.

Preserve useful screen recordings when reorganizing content. Keep the recordings near the relevant task or link to them explicitly; do not replace them all with prose. Account setup clips can live in labelled expanders, with the workspace tour and worker-creation recording visible in their guides. Preserve light/dark variants, playback controls, and muted inline playback. Use `preload="metadata"` for restored recordings to avoid downloading every clip at page load.

```bash
node scripts/check-docs-assets.mjs /absolute/path/to/webapp/apps/app /absolute/path/to/landing
```

This checks every existing video is referenced, local recording/GIF sources exist, quickstart recordings remain available, sidebar page labels have no decorative icons, and the selected branding matches the supplied web app. The optional landing path checks copied illustrations/poster byte-for-byte and verifies the hosted demo URL against the landing source. Omit both paths for local media checks alone.

The welcome page streams the landing page's actual narrated demo from `https://www.odella.ai/videos/odella-demo.mp4`, with its original poster copied under `images/landing/`. This avoids duplicating the approximately 60 MB source in the docs or depending on large-file handling in the docs host. It is not the older `WorkforceAgent` screen recording, which remains in the employee guides. `images/landing/employee-workspace.webp` and `channels.webp` are exact copies of the landing hero mockup and channel illustration. Source metadata is `../landing/src/data/demo-video.ts`.

`landing-demo.js` progressively adds the landing-style play overlay. It keeps `preload="none"`, does not autoplay or mute the narration, and enables native controls on play. Without JavaScript, native playback controls remain available. Keep the video and its poster together when updating the demo; never substitute a recording merely because it shows the same product.

## UI illustrations

`images/guides/` contains synthetic Storybook captures and the explicitly labeled `image-block-example.svg` illustration. The latter replaces an old Rivet-branded example, not the actual block screenshots. Page captions identify examples rather than customer data or fabricated live UI. Reproduce with an already-running local webapp Storybook and the webapp's Playwright installation:

```bash
node scripts/capture-guide-screenshots.mjs /absolute/path/to/webapp/apps/app http://127.0.0.1:6106
```

Inspect captures before committing. Never capture actual tokens, credentials, identity-verification documents, or customer account data. Story IDs and release boundaries are recorded in `.agents/audits/coverage-refresh-notes.md`.

## Publishing

Submit changes through a pull request to `main`; repository rules block direct pushes. Once approved and merged, the connected Mintlify deployment can publish from the default branch. Verify deployment status in Mintlify rather than assuming a Git push completed publication.
