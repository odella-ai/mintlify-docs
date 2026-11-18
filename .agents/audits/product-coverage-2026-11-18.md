# Product documentation coverage — 2026-11-18

## Scope and method

Baseline: remote docs `develop` at `02a25d2`; application source at `c2d3d3ccd1`. Compared the main customer-facing App routes, their components, existing MDX, navigation and screenshots. This is a source/UI coverage audit, not production rollout certification, an inventory of every provider action/workflow block, or a live mailbox/signing acceptance test.

The original docs checkout has unrelated local edits; none were copied or overwritten. This change starts from remote develop in an isolated worktree. The older `docs-feature-audit.md` and `coverage-refresh-notes.md` are historical: their assertion that Inbox is entirely mock-only is superseded by the current `LiveInbox`, regional clients and current Inbox README. Historical preview sections of that README are not current release evidence either.

## Findings before this change

| Feature | Baseline coverage | Gap / disposition |
| --- | --- | --- |
| Custom remote MCP integrations | Detailed text guide already exists | No UI screenshots; hidden under Platform. Add catalog/create/settings images, worked example and direction comparison. |
| Odella public MCP server | PAT setup and recipes already exist | No hosted Claude/ChatGPT OAuth setup, newer CLI OAuth, or consent-method distinctions. Add these, UI illustration, recovery and prominent Integrations tab. |
| E-signing | Template and records text guides already exist | No sender/recipient/request-list screenshots; no dedicated recipient walkthrough. Existing guide incorrectly requires a signing store and template policy selector: current UI offers **Save a copy (optional)** / **Signing request only**. Correct this distinction, illustrate setup and add recipient guide. Not correctly classified as wholly absent. |
| Personal Inbox | No dedicated guide/navigation | Add connection/import, collected coverage, drafts/send, message/bulk actions, settings and uncertainty recovery. |
| Daily Brief | No dedicated guide/navigation | Add source verification, actions/reminders, handoff, timing and incomplete-coverage caveats. |
| Organization Insights | No dedicated guide/navigation | Add organization/access/entitlement, account-wide activation, capacity, history preparation, pause/resume and partial coverage. Do not publish synthetic charts as measured results. |
| Personal credential Vault | No committed guide/navigation | Add item creation/replace-only editing, explicit login/API access, browser sign-ins, deletion versus provider revocation. Local uncommitted Vault work in the original checkout is outside this baseline. |
| Computer/browser handoff | Workspace/activity references only | Add current browser/human-control flow, credentials, I'm done/Skip, session versus historical capture, and recovery. |
| Catalog integrations | Generic setup guide | Preserve guide; clarify catalog vs custom vs public MCP. Provider-specific depth remains a follow-up. |
| Employee creation, identity, tools, skills, templates, workflows, knowledge | Dedicated pages exist | Not absent; link to the new connection/browser pages rather than duplicate. |
| Private skill authoring/review | Dedicated guide exists | Not absent; publication availability remains conditional. |
| Tasks, approvals, Actions, Calendar, Activity | Dedicated guides exist | Not absent; new pages cross-link for task outcomes and approvals. |
| Channels: web chat, email, Slack, Teams, phone, WhatsApp, Telegram, Discord, Signal, Meet | Individual guides and sanitized screenshots exist | Not absent. Keep existing richer guides and URLs intact. |
| Standard Document Stores, schemas, imports, access, protected signing stores | Dedicated guides exist | Not absent; personal Vault is a different feature. |
| Organization members/teams, roles/resource access, employee governance | Dedicated pages exist | Not absent; do not replace capability enforcement with role-only authority claims. |
| Billing/credits, usage/limits, phone numbers, profile/signature, brand, models, security | Dedicated pages exist | Not absent. No new unverified rate/plan promises. |
| Marketplace | Overview exists | Not absent; individual listing/category URLs are not separate product features needing one guide each. |
| Admin skill operations, OAuth callbacks, internal/approval redirect routes | Not standalone customer guides | Intentionally not documented as customer features; explain customer entry points, not implementation routes. |

## Evidence map (paths relative to webapp)

- Custom MCP: `apps/app/src/app/(main)/integrations/page.tsx` checks `custom-mcp.manage` rather than a hardcoded administrator role. Updated prerequisites to match. `apps/app/packages/plugins/components/CustomMcpIntegrations.tsx`, `apps/app/.storybook/stories/integrations.stories.tsx`.
- Public MCP/OAuth: `apps/app/packages/account/components/developer/mcp-client-config.ts`, `OAuthConnectionGuide.tsx`, `McpConnectionSetup.tsx`, `apps/app/src/app/(main)/account/developer/page.tsx`; public server tools under `apps/server/src/server/mcp/public/tools/`.
- Signing: `apps/app/.storybook/stories/template-builder-redesign/signing.stories.tsx`, `signing-settings.stories.tsx`, `apps/app/packages/template/components/TemplateBuilderSidebar/TemplateSigningSettings.tsx` (optional copy; no template policy selector), `apps/app/.storybook/stories/documents/esigning.stories.tsx`, `apps/app/.storybook/stories/signing-recipient.stories.tsx`, `apps/app/packages/esigning/components/`.
- Inbox: `apps/app/packages/inbox/README.md` (current runtime sections), `components/LiveInbox.tsx`, `InboxSettingsLayout.tsx`, `InboxOnboarding.tsx`, live transport classes under `io/`; routed pages under `apps/app/src/app/(main)/inbox/`.
- Brief: `components/InboxBrief.tsx`, README factual daily Brief section and `apps/server/docs/inbox-daily-brief.md`.
- Insights: `components/LiveInsights.tsx`, `InsightsAccountGate.tsx`, `io/RemoteInsights.ts`. Activation/readiness is implemented separately from the synthetic analytics dashboard; screenshots do not certify all dashboard metrics.
- Vault: `apps/app/packages/account/components/vault/VaultPanel.tsx`, `VaultItemDialog.tsx`, `VaultEmployeesDialog.tsx`, `BrowserSignIns.tsx`. These current components supersede older settings-only/deferred-access descriptions in `docs/personal-vault.md`.
- Computer: `apps/app/packages/chat/components/browser/BrowserHandoffApprovalCard.tsx`, `BrowserHandoffTakeover.tsx`, `browser-control-surface.tsx`, computer canvas components and `apps/app/.storybook/stories/computer-production.stories.tsx`.

## Screenshot policy

**Visual QA follow-up:** Jordan correctly rejected the initial Computer image and blank integration-logo fixture. The first technical pass was not sufficient visual review. All 15 images were subsequently reviewed individually, with corrections and explicit fixture provenance recorded in `screenshot-visual-review-2026-11-18.md`. Use the current files, not screenshots from the original review ZIP.

Use locally rendered synthetic Storybook fixtures of actual UI components. All new captions explicitly identify example data. Never attach to a customer browser, capture tokens/passwords, submit real approvals, send invitations, or connect a real provider for documentation. The capture script blocks external traffic; optional external image/font requests are aborted. Source stories and viewport are recorded in `images/features/provenance.json`.

These are real Odella UI renders with synthetic data—not redrawn product mockups, live customer evidence, or external-client screenshots. The revised Computer frame contains a fictional external portal rendered from checked-in HTML; only that synthetic page image and documented test-data/routing mocks are substituted. Odella's Computer UI remains unchanged. Third-party Claude/ChatGPT controls are described from the app's current connection instructions; their UI was not independently captured or certified.

## Remaining work / deliberate limits

1. Provider-specific operational guides, especially Xero and regional Smokeball, beyond the generic catalog flow: verify supported actions, tenant/region selection, consent, reconnect and a safe read-only example. Do not invent provider screenshots without an approved synthetic fixture or a sanitized account.
2. A schema-maintained public MCP tool reference is still absent. Existing recipes cover major journeys, not every tool/argument. Prefer generation from registration schemas to a second manual inventory.
3. Every workflow block/provider action was not exhaustively compared. Existing reference pages are not proof every current schema, output and failure is accurate.
4. Insights metrics/findings/benchmark workflows need release-backed evidence before a detailed dashboard guide; activation and readiness documentation must not imply universal metric availability.
5. Native app distribution/platform compatibility, every browser/replay configuration and unattended-login behavior are not certified here. Document only current controls and explicit prerequisites.
6. New screenshots do not complete an end-to-end acceptance test of OAuth, provider sending, signing/legal evidence, billing, or production account rollout. Keep legal/commercial claims tied to approved terms and actual account controls.

Do not report the entire product as fully documented or production-verified. This pass closes the major missing customer-facing surface guides and illustration gaps above, while retaining an explicit follow-up list.

## Delivered validation

- 166 MDX files compile with the cached `@mdx-js/mdx` compiler.
- Global Mintlify `broken-links`: no broken links. This installed CLI does not offer `validate`; no pinned-package validation claim is made.
- 162 unique navigation targets all resolve to local MDX files; no duplicate navigation targets.
- 15 final screenshot captures succeed with external requests blocked, expected visible content checked, and no browser exceptions. All were visually reviewed. SHA-256 hashes, story IDs, viewport and crop coordinates are recorded in the provenance manifest.
- Local Mintlify smoke: ten illustrated routes at 1280px and 390px (20 combinations); every feature image decodes and no document-level horizontal overflow is detected.
- `git diff --check` and capture-script syntax check pass.

Reproduce screenshots using an existing local webapp Storybook:

```bash
node scripts/capture-feature-screenshots.mjs /absolute/path/to/webapp/apps/app http://127.0.0.1:6118
```

The script launches a fresh headless Chrome profile, not an existing signed-in session. It never starts a preview server or modifies account data. Some initially selected broader authoring/review stories did not load with the available local dependencies/environment; they were not published as screenshots or claimed as verified. The final capture list uses the working field/settings/recipient/request surfaces. Neither external client UI nor live authorization/provider effects were tested. Temporary preview servers started for this task are stopped after delivery.
