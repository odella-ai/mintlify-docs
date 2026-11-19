# Chat-first work and review

## Scope

- Lead the Assign and review work sidebar and guide with chat and everyday channel use, not the task board.
- Add `workforce/chat` and `workforce/contact-an-employee`; keep channel installation guides in their existing setup group.
- Align Welcome, How Odella works, quickstart, Talk, and Tasks with the same conversation-first path.
- Explain channel-specific approval controls, especially Signal reactions, and browser takeover for passwords, MFA, and CAPTCHAs.
- Explain matching Vault logins, optional post-handoff Save/Update/Not now, and separate Save in Vault requests without conflating saved passwords, API grants, or website sessions.

## Product evidence

Read-only source inspection of sibling webapp commit `c2d3d3ccd1c4ba58eeb0a6f2f31eec4f29205e90`. Paths below are relative to that checkout. No authenticated sessions, provider actions, approvals, assignments, credential entry/saving, or production acceptance tests were performed.

| Guidance | Source |
| --- | --- |
| Published web application controls Chat availability and opens the employee conversation | `apps/app/packages/workforce/components/display/EmployeeChatButton.tsx` |
| Published contact rows can be addresses or connection-only status | `apps/app/packages/workforce/components/modals/ContactDetailsModal.tsx` |
| Signal approval prompt, offered decisions, signed-in review | `apps/server/src/gateway/channels/plugins/signal/exec-approvals.ts` |
| Exact-message reactions; thumbs-up/down and skin tones; no always-allow reaction | `apps/server/src/gateway/channels/plugins/signal/approval-reactions.ts` |
| Reaction matching, linked identity admission, allowed decisions | `apps/server/src/gateway/channels/plugins/signal/webhook-handler.ts`, `apps/server/src/gateway/channels/operations/approval-callbacks.ts` |
| Channel buttons and review-link differences | `apps/server/src/gateway/channels/plugins/{slack,msteams,telegram,discord,whatsapp,email,sms}/exec-approvals.ts` |
| Browser/Vault requests require in-app completion | `apps/server/src/gateway/operations/approvals/approval-sanitizer.ts`, `apps/app/packages/approvals/components/ApprovalViews.tsx` |
| Login/MFA/CAPTCHA handoff | `packages/agent-core/src/tools/web/browser/index.ts`, `packages/agent-core/src/tools/web/browser/handoff.ts` |
| Take over / Hand back controls | `apps/app/packages/chat/components/browser/browser-control-surface.tsx` |
| Matching-site saved-login picker and incomplete-sign-in warnings | `apps/app/packages/chat/components/browser/saved-login-picker.tsx` |
| Optional captured-login Save / Update / Not now and confirmation | `apps/app/packages/chat/components/browser/save-login-prompt.tsx` |
| Save in Vault / I don't have it; login and API-key paths remain distinct | `apps/app/packages/chat/components/vault/VaultRequestApprovalCard.tsx` |

These are source-supported instructions, not proof of production provider delivery or enforcement. Existing security qualifications and deferred provider-specific screenshots are unchanged. No new screenshot is presented as live evidence.

## Verification

- `pnpm validate`: passed.
- `pnpm broken-links`: passed; no broken links.
- `pnpm test:security`: all 20 tests passed.
- Navigation: 85 active pages, 88 protected app-linked reference URLs, three other hidden references, eight archived/redirected routes. Added a regression check for conversation/channel-use ordering before Tasks.
- Asset, channel-branding, key-area visual, and setup-visual checks: passed. All 21 recordings retained; existing original-component captures and provenance untouched.
- Changed-page browser checks: 13 pages × three widths (1440, 1024, 390) × both themes = 78 cases. All HTTP 200, one H1, no document overflow, broken content images, or captured client errors. 52 full-page screenshots at `/tmp/odella-chat-first-qa/`; manifest in the same directory.
- Keyboard activation of the guide's Start a conversation link and generated Signal/Vault heading anchors passed in both themes.
- Visually inspected guide, chat, approvals, and browser-handoff captures, including mobile and dark examples.
- Supplemental article-design checks: seven layouts at desktop/mobile in both themes, keyboard-scrollable accessible tables, resize cleanup, and no-JavaScript table scrolling passed.
- `git diff --check`: passed.

Existing unrelated audit files and `images/product/` remain untouched. No changes to application source, vendor marks, the original narrated demo, or protected workflow reference routes.
