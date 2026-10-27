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

## Product accuracy

Verify instructions against current application routes, UI components, and domain behavior. A checked-in component or Storybook example is not proof that a feature is available in every account, region, or production deployment.

For each feature guide, document prerequisites/permissions, setup, expected results, recovery, and relevant billing/security implications. Use the Odella terminology rules in `.agents/skills/odella-copywriting/SKILL.md`.

## UI illustrations

`images/guides/` contains synthetic Storybook captures. Their page captions identify them as examples, not customer data. Reproduce with an already-running local webapp Storybook and the webapp's Playwright installation:

```bash
node scripts/capture-guide-screenshots.mjs /absolute/path/to/webapp/apps/app http://127.0.0.1:6106
```

Inspect captures before committing. Never capture actual tokens, credentials, identity-verification documents, or customer account data. Story IDs and release boundaries are recorded in `.agents/audits/coverage-refresh-notes.md`.

## Publishing

Submit changes through a pull request to `main`; repository rules block direct pushes. Once approved and merged, the connected Mintlify deployment can publish from the default branch. Verify deployment status in Mintlify rather than assuming a Git push completed publication.
