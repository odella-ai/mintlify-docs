# Coverage refresh delivery notes

## Scope

Implements the coverage gaps identified in `docs-feature-audit.md`, using the local webapp checkout at `2f2c63356` as source evidence. The original audit is a historical baseline, not a description of coverage after this refresh.

No webapp application files, account configuration, production services, or customer data were changed. No claim is made that this is a signed-in production acceptance test or a full audit of every workflow block/provider API.

## Delivered coverage

- Tasks and human approvals, with task state/recovery guidance.
- Organization members/teams, roles and resource access, employee governance, admin read-only conversation access.
- Private skill authoring/import, workshop review/merge, and distinct MCP publication flow.
- Account credits, payment methods, top-up, soft/hard spend limits, usage, tiers/capacity.
- Phone number verification/assignment and channel registration.
- Email, Slack, Teams, Phone/WhatsApp/Signal, Telegram/Discord, and bounded meeting-default setup.
- Browser Talk, document results, and attachment/context limitations.
- Organization brand generation, profile/contact management, saved signatures, account deletion.
- MCP operational recipes and e-signing status/recovery/protected-record/billing guidance.
- Navigation groups and cross-links from quickstart, FAQ, introduction, worker overview/settings, and Documents.

## Accuracy corrections beyond the baseline

- Manual document upload limit: current modal and table both use 50 MiB (displayed as 50MB), not 25MB.
- Model defaults: core declares GPT-6.1 Sol and Wan 3.0, not GPT-5.6 Terra and Seedance 2.0.
- Accountable manager is an authority-bearing governance assignment, not profile metadata only.
- Identity/General Instructions live in worker Settings; Governance is distinct and organization-only.
- Account Models is a comparison/pricing surface; organization text-retention control is in Organization Settings.
- Store Columns save choices do not always reprocess existing files; Storage is an informational tab, not a future retention engine.
- Protected signing stores differ from ordinary editable/deletable knowledge stores.
- Removed unsupported blanket Actions feature-gate claim; local employee tab registration has no such gate. General account/permission availability language remains.

## Screenshot provenance

All six images under `images/guides/` are rendered synthetic Storybook examples, not live customer account captures. Their docs captions say so. The token screenshot is the creation form, not the one-time-secret state.

| File                    | Story ID                                                          |
| ----------------------- | ----------------------------------------------------------------- |
| task-details.png        | workforce-tasks-task-details--waiting-for-input                   |
| approval-review.png     | approvals-task-panel--email-send                                  |
| employee-governance.png | access-control-employee-governance--governance-restricted-editors |
| signing-store.png       | stores-settings-storage--signing-records                          |
| organization-teams.png  | access-control-organization--teams-overview                       |
| developer-token.png     | account-developer--create-token-inline-view                       |

Reproduce from this docs repository with an existing local webapp Storybook:

```bash
node scripts/capture-guide-screenshots.mjs /absolute/path/to/webapp/apps/app http://127.0.0.1:6106
```

The script uses the webapp's Playwright installation, verifies expected content, rejects browser exceptions, blocks external requests (including optional model-logo artwork), and captures/crops at a fixed viewport. It does not start/stop a server, use login credentials, submit mutations, or complete approval actions. All six final captures succeeded and were visually inspected. The existing Storybook server was left running; it was not started by this task.

## Release boundaries retained

- No public Inbox/Insights page: its source README explicitly says mock-only prototype, no production route or provider operations.
- No native app/store availability claims.
- Browser Talk guide is conditional on available controls; no browser compatibility certification or general voice-attachment support is promised.
- Meeting guide covers configured defaults and prerequisites, not universal join/record/transcribe support.
- No unverified numeric price promises; current account/catalog terms remain authoritative.
- No claim that user deletion erases shared or retention-bound records immediately.

## Validation

- `pnpm validate`: passed.
- `pnpm broken-links`: passed; no broken links found.
- `git diff --check`: passed.
- Navigation audit: 152 unique routes, all resolving to local MDX files.
- All guide image references resolve and have descriptive alt text.
- Screenshot capture: all six stories passed, with external traffic blocked and browser exceptions checked.
- Local Mintlify browser smoke: Tasks, Approvals, Governance, MCP setup, and store settings rendered at 1280px and 390px; each guide image decoded successfully and no document-level horizontal overflow was detected (10 route/viewport combinations).
- The temporary Mintlify preview started for this task was stopped. The pre-existing webapp Storybook was left untouched.

Initial browser-smoke retries corrected test-only heading matching/hydration timing; final checks passed. Local preview logged a transient Mintlify stream error during startup, but final page renders and build validation succeeded. These checks are docs/UI validation, not live provider or product rollout acceptance.
