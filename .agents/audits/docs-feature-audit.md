# Documentation coverage audit

## Scope and confidence

Compared the local Mintlify docs, including the new MCP/e-signing guides, with `/Users/jordanparker/Programs/webapp` at `2f2c63356` on `feat/inbox-ui-prototype`.

This is a source-level coverage audit, not a signed-in production walkthrough or deployment verification. Routes, components, domain code, and implementation notes establish what needs documentation; they do not establish availability in every account or region. Preview-only functionality is separated below. No webapp files were modified.

Evidence paths below are relative to the webapp repository unless explicitly identified as docs paths.

## Executive finding

The docs explain the product's concepts better than its daily operating procedures. Several substantial app surfaces have no dedicated guide. The most urgent work is correcting misleading Document Store behavior and documenting Tasks, approvals, access governance, and channel setup.

The new MCP and e-signing pages close two introductory gaps, but do not yet provide complete operational reference coverage.

## P0: Correct misleading existing guidance

### 1. Document Store schema changes are not always a full reprocessing operation

**Docs:** `documents/settings-and-integrations.mdx` says saving a changed schema re-runs extraction on existing documents. `documents/create-and-configure.mdx` makes a similar blanket claim.

**App evidence:** `apps/app/src/app/(main)/store/[id]/settings/page.tsx`, `SCHEMA_SAVE_OPTIONS`, provides three choices:

- New files only.
- Fill existing files too, billed per page.
- Rename labels only, without reprocessing.

**Change:** Document the actual decision and billing implications. Use the UI label **Columns** where describing navigation. Include a safe migration example that adds a column without unexpectedly processing the whole store.

### 2. Store settings and deletion guidance omit protected signing stores

**Docs:** `documents/settings-and-integrations.mdx` describes Storage as future work and gives generic permanent-deletion instructions.

**App evidence:** The store settings route includes Access and Storage tabs. Protected signing stores expose only General, Access, and Storage. `apps/app/packages/stores/components/settings/StoreStorageSettingsPanel.tsx` distinguishes standard stores from signing-record stores: signed records cannot be edited, replaced, reprocessed, or deleted; uploads, sync imports, and AI indexing are disabled. Archiving stops new requests but allows already-sent requests to complete; access changes affect past records too. The panel is informational, not an automatic retention/deletion configuration.

**Change:** Explain standard versus signing stores, allowed operations, archive/restore behavior, and retrospective access changes. Do not describe the Storage page as a configurable retention engine, and qualify Delete Vault instructions by store kind.

### 3. Recheck the Actions feature-gate claim

**Docs:** `workforce/actions.mdx` states that Actions are feature-gated.

**App evidence:** `apps/app/packages/workforce/components/employee/EmployeeRightPanel.tsx` includes Actions in the normal tab set and mounts `ActionsTab`; the list component does not contain the gate described by the docs.

**Change:** Verify actual release/account availability before keeping or removing the warning. Source inspection does not exclude a gate elsewhere, so treat this as a claim needing confirmation rather than a proven universal rollout.

## P1: Missing core operating guides

### 4. Tasks and the task lifecycle

**Current coverage:** Calendar and Activity mention tasks, but there is no dedicated Tasks guide or navigation entry.

**Evidence:** `apps/app/src/app/(main)/tasks/page.tsx`; `apps/app/packages/workforce/components/tasks/AgentTaskBoard/index.tsx` and `constants.ts`.

The board exposes Queued, Running, Waiting, Attention, Closed, and Completed lanes. It supports creating tasks, opening details, guidance/resume behavior, and retries. Sources distinguish user requests, API, schedules, triggers, workflows, delegation, and follow-ups.

**Document:** Create a task; select the worker; specify the expected deliverable; interpret each state; distinguish waiting for input from failure; respond with guidance; handle approvals; retry or cancel appropriately; find results. Explain that accepting a task is not completing it.

**Proposed page:** `workforce/tasks.mdx`, under Work management.

### 5. Human approvals as a user journey

**Current coverage:** `workforce/settings-security-privacy.mdx` describes policies, but not the actual review-and-resolve process. E-signing now covers its special case only.

**Evidence:** `apps/app/packages/approvals/components/ApprovalViews.tsx`, `TaskApprovalPanel.tsx`, `primitives/actions.tsx`; approval routes under `apps/app/src/app/(main)/approvals/`.

**Document:** Where approvals appear; inspect the actual action and affected data; Approve once versus Always allow versus Deny; which choices are available for which action; changed/expired/already-resolved requests; why a preview may block approval; what the worker does after approval or denial; how to revoke saved exceptions. Do not imply Always allow is offered for every operation.

**Proposed page:** `workforce/approvals.mdx`, linked from Tasks, Security & Privacy, and e-signing.

### 6. Organization administration and employee governance

**Current coverage:** Platform security gives a high-level explanation; no practical organization, team, role, or resource-sharing guide exists.

**Evidence:** `apps/app/src/app/(main)/account/org/page.tsx`; `apps/app/packages/account/components/organization/settings/OrgSettingsTabs.tsx`; `apps/app/packages/workforce/components/settings/tabs/governance/GovernanceTab.tsx`.

Organization settings expose Members, Invitations, Teams, Roles, Brand, and Settings. Employee governance separately models manager assignment, who can access the worker, who can edit specific areas, and conversation visibility.

**Document:** Invite and remove members; organize teams; assign roles; distinguish account capabilities from resource access; assign a manager; restrict worker access and editing; explain conversation visibility; share Document Stores and other resources. Explain why a visible resource can still be read-only and the distinction between channel contact permission and workforce management permission.

**Proposed pages:** `platform/organization.mdx`, `platform/roles-and-permissions.mdx`, `workforce/governance.mdx`.

### 7. Communication channel setup

**Current coverage:** `workforce/communication-channels.mdx` is an overview without reproducible setup guides.

**Evidence:** `apps/app/packages/application/components/viewers/` contains setup viewers for Email, Slack, Teams, Discord, Telegram, Signal, WhatsApp, Phone, and Google Meet. `PhoneAppViewer.tsx` checks number assignment and capabilities before publishing.

**Document:** A channel capability matrix followed by provider-specific prerequisites, authorization, configuration, publish/test steps, inbound/outbound policy, reconnect/disconnect, and common failures. Distinguish a toolkit connection from a communication channel. Do not imply all providers share the same setup or availability.

**Proposed structure:** A Channels group with individual guides; start with Email, Slack/Teams, and Phone based on rollout/support demand.

### 8. Private skills: creation, review, and publication

**Current coverage:** `workforce/skills.mdx` describes what skills are but not how to author or maintain them.

**Evidence:** `apps/app/src/app/(main)/workforce/skills/page.tsx`; `apps/app/packages/workforce/components/skills/SkillRepositoryWorkspace.tsx`; `SkillsWorkshopFeatureGate.tsx`.

The repository workspace supports private skills, SKILL.md input, merge requests, security scan and evaluation states, and review evidence. The entry point is explicitly feature-gated.

**Document:** Create or import a private skill; required file/metadata format; review changes; understand scan/evaluation outcomes; publish; assign to a worker; edit and retest. Distinguish a saved draft, review request, and usable published version. Explain account-private visibility and availability requirements.

**Proposed pages:** Expand `workforce/skills.mdx`; add `workforce/create-a-skill.mdx`.

### 9. Account billing, credits, usage, and limits

**Current coverage:** `workforce/settings-billing.mdx` covers worker quotes, not the account payment journey.

**Evidence:** `apps/app/src/app/(main)/account/billing/page.tsx`, `usage/page.tsx`, `limits/page.tsx`. Billing exposes credit purchases, payment methods, automatic top-up, a monthly spend limit, invoices, and credit history. Usage exposes daily spend, categories, and ledger events. Limits exposes tier/capacity and upgrade/downgrade flows.

**Document:** Fund the account; configure top-up; understand budget notices versus enforced limits; review charge categories and invoices; distinguish account tier/capacity from worker configuration; troubleshoot insufficient credit. Verify hard/soft budget semantics in the billing domain before describing enforcement. Explain voice and e-signing charging from the active pricing source, without hardcoding unverified rates.

**Proposed pages:** `platform/billing-and-credits.mdx`, `platform/usage-and-limits.mdx`.

## P2: Thin coverage of new capabilities

### 10. Actions and scheduling need an end-to-end tutorial

**Current coverage:** `workforce/actions.mdx` is mostly a field list; Calendar is separate without explaining their shared operational model.

**Evidence:** `apps/app/packages/workforce/components/actions/editor/create-action-modal.tsx`, `time/time-action-dialog.tsx`, and `employee/EmployeeRightPanel.tsx`. The app includes event/time Actions, one-shot/recurring policy, run-now controls, history, disabled states, and timezone selection.

**Document:** Provider connection → trigger → filters → instructions → enable → test → inspect resulting task. Add one-off versus recurring behavior, local timezone handling, employee-off behavior, failed/rate-limited subscriptions, and safe retry guidance. Verify failure semantics against the domain before promising delivery or retry guarantees.

### 11. Browser Talk and document review

**Current coverage:** Channels and Identity mention chat and voice, but no practical Talk guide explains the experience.

**Evidence:** `apps/app/docs/browser-talk-workspace.md` and the chat components it references. Talk preserves a thread, can delegate tasks, shows actual returned files in a canvas, and returns to messages on End. The implementation notes explicitly separate component validation from live audio/release acceptance and say voice attachment submission is not supported by that transport.

**Document:** Start a call, microphone permission, mute/end, task acceptance versus completion, results, opening/downloading a document, continuing in text, and recovery. Keep browser Talk, a phone channel, and meeting participation distinct. Confirm rollout and live acceptance before publishing supported-browser promises or attachment instructions.

**Proposed page:** `workforce/talk.mdx`.

### 12. Phone numbers and meeting participation

**Current coverage:** No dedicated number purchase, verification, assignment, or meeting setup documentation.

**Evidence:** `apps/app/src/app/(main)/account/numbers/page.tsx`, its purchase/verification components, and `apps/app/packages/application/components/viewers/GoogleMeetAppViewer.tsx`.

**Document:** Country/number type, compliance verification, ordering/activation, assignment, SMS/voice capability, and publication checks. For meetings, explain the actual supported join path, meeting URL/dial-in/PIN inputs, access/consent expectations, and limitations. A setup viewer alone is not proof of end-to-end meeting support; validate supported providers before listing them as available.

**Proposed pages:** `platform/phone-numbers.mdx`, channel-specific Phone and Meetings guides.

### 13. Organization brand context

**Current coverage:** No brand setup guide.

**Evidence:** `apps/app/packages/account/components/organization/settings/OrganizationBrandTab.tsx` and the organization route describe uploaded brand materials, generation, status, and review surfaces.

**Document:** Supply a website and approved materials, generate/review guidelines, correct/regenerate, and explain how workers receive the context. Verify downstream propagation before promising that every worker automatically follows every update.

**Proposed page:** `platform/brand-guidelines.mdx`.

### 14. Profile and account lifecycle

**Current coverage:** Worker termination is documented; user-account deletion and personal profile management are not.

**Evidence:** `apps/app/src/app/(main)/account/profile/page.tsx`; `apps/app/packages/account/components/user/UserAccountDeletion.tsx`; `apps/app/packages/esigning/components/SavedSignatureSettings.tsx`.

**Document:** Profile/contact verification, saved signature management, user account deletion and reverification, and the distinction between leaving/removing an organization, deleting an organization, and terminating a worker. Verify retention and ownership-transfer consequences with the domain rather than promising universal data erasure.

**Proposed page:** `platform/profile-and-account.mdx`.

### 15. MCP needs operational recipes after the setup guide

**Current coverage:** The new `integrations/mcp-server.mdx` covers tokens, scopes, clients, and basic reads.

**Evidence:** `apps/server/src/server/mcp/public/tools/manifest.ts` and the provisioning, private-skills, employee-access, actions, files, templates, and workflow tool families.

**Document next:** Read account context → configure a worker → update instructions → assign resources → create work. Add private-skill and upload/template recipes, exact required scope combinations, pagination/error examples, and draft/publish distinctions. Generate or maintain the tool reference from registration schemas to avoid duplicating stale inventories. Keep public user-authorized MCP separate from internal worker MCP.

### 16. E-signing needs an operational follow-up

**Current coverage:** The new `templates/05_e-signing.mdx` covers basic configuration, review, recipients, and tracking.

**Evidence:** `apps/app/packages/esigning/components/` contains saved signatures, request status, public signer entry, and archive surfaces. Store settings distinguish protected signing records from ordinary knowledge stores; billing has a dedicated e-signing path.

**Document next:** Saved signature behavior, signer account/email mismatch recovery, decline/expiry and any supported reminder actions, completion evidence/downloads, protected-store archive/access behavior, and send-time charges. Confirm which controls are actually exposed in V1 before documenting them. Keep the distinction between PDF field configuration and DOCX-to-final-PDF preparation explicit.

## Do not publish as generally available yet

**Unified Inbox and Insights:** `apps/app/packages/inbox/README.md` explicitly describes a frontend-only preview with mock data, no production route/navigation activation, no provider reads/writes, no real sends, and no real access grants. Its call/meeting fixtures are future design previews, not backend acceptance.

Prepare documentation outlines and screenshots only as internal launch work until production routing, backend contracts, authorization, and release acceptance exist. Do not describe synthetic metrics or preview actions as functioning customer capabilities.

Likewise, do not infer native mobile store availability, complete meeting support, or live browser compatibility merely from checked-in code and tests.

## Recommended delivery sequence

1. **Accuracy patch:** Store schema-save choices, Columns label, Access/Storage coverage, protected-store lifecycle; confirm Actions gate language.
2. **Daily work:** Tasks plus approvals, with one complete worked example and troubleshooting flow.
3. **Safe administration:** Organization/team/role/resource access plus worker governance.
4. **Activation:** Real channel setup guides plus private-skill authoring and review.
5. **Commercial clarity:** Account credits, usage, limits, phone numbers, and signing/voice charging explanations.
6. **Capability depth:** Talk/canvas, brand setup, MCP operational recipes, and e-signing recovery/reference.
7. **Launch-gated:** Inbox/Insights and other preview functionality only after release confirmation.

## Navigation and maintenance

- Add Tasks and Approvals to Workforce → Work management.
- Add an Administration group for organization, access, billing, limits, profile, brand, and phone numbers.
- Split channel setup from the generic integrations overview.
- Keep Skills distinct from the broader skill tree.
- Link e-signing records from Documents as well as Templates.
- Add a release-status check to each new page: implemented, enabled for the intended audience, and verified in a representative account.
- Each procedural guide should contain prerequisites/permissions, exact steps, expected success, failure/recovery, and related billing/security considerations.
- Assign a docs owner to feature PRs and update docs when customer-facing labels, states, pricing behavior, or permissions change.

## Limits of this audit

This pass focused on current app routes and the major newly expanded capability areas. It did not verify every workflow block, every provider credential flow, live pricing amounts, production flags, or every account/region. Those need targeted follow-up, not assumptions based on the local branch.
