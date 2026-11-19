# Screenshot-by-screenshot visual review

Follow-up to Jordan's review of PR31: the first Computer screenshot was not useful documentation and the create-integration dialog had a blank logo. The earlier successful technical checks did not establish visual quality; those images should not have passed the initial visual review.

## Review criteria

Open every final PNG individually, not only a contact sheet. Check legible content, complete controls, coherent state, correct sample branding, no broken/1-pixel images, no accidental focus rings, no fixture-debug output inside the captured product controls, and useful framing. Retain actual product behavior, disabled states and intentional text truncation rather than cosmetically inventing capabilities. Technical checks complement this human-readable visual ledger; they do not replace it.

| Screenshot | Initial finding | Final disposition |
| --- | --- | --- |
| `custom-list.png` | Acme logo present; other custom entries intentionally use the product's puzzle fallback. Last card's border too close to crop edge. | Recaptured all three complete custom cards, including search/create context. Acme icon matches settings; fallback icons remain valid for entries without a logo. |
| `custom-create.png` | Blank 1×1 fixture logo; tool description partially obscured by sticky footer; excessive backdrop. | Replace only the known synthetic logo data, increase viewport height, capture full dialog. Logo, all four steps, tool description, Cancel/Create now visible. |
| `custom-settings.png` | Acme logo inconsistent with the list; incidental close-button focus ring; excessive backdrop. | Open Acme settings from the list, with the same synthetic logo. Capture complete dialog; remove incidental keyboard focus without removing controls. |
| `mcp-oauth-setup.png` | Bottom Server URL row clipped. | Capture the complete MCP connections section, including endpoint/copy control. Staging endpoint remains explicitly captioned as a staging example. |
| `signing-fields.png` | Correct signer/Required/Save controls. Party description is intentionally truncated by the product. | Keep tight field-card capture; exclude fixture state/debug output. Do not widen or redraw product controls. |
| `signing-destination.png` | Correct optional-copy dialog. | Capture the whole dialog by element bounds with a small margin; preserve the optional-copy wording and store-access link. |
| `signing-requests.png` | Correct list, status chips, recipient counts, filters and navigation. Long title intentionally truncated. | Keep full workspace context; no fabricated completion state or removal of native truncation. |
| `signing-recipient.png` | Correct review/consent stage with unsigned sample PDF and Start signing. | Keep visible sample disclaimer, actual PDF layout, recipient controls and privacy notice. Do not crop out safety context or imply this screen has signed. |
| `signing-completed.png` | Correct final state but excessive empty page. | Tighten to complete status panel and Download signed PDF control. All three readiness states remain visible. |
| `inbox-reader.png` | Correct conversation/reader/context layout. Disabled actions explicitly reflect unchecked provider state. | Keep; do not enable actions or replace the honest unavailable state to make the screenshot prettier. |
| `inbox-setup.png` | Mailbox card correct but unrelated label section cut off at bottom. Fixture's 90-day window could be mistaken for the default. | Frame Settings + complete Mailboxes card only. Caption explicitly distinguishes the example window from the seven-day default import. |
| `daily-brief.png` | Correct complete To do list and greeting with due dots. | Keep readable tight framing. Reminder timing/source text remains visible. |
| `insights.png` | Activation correct but unrelated connection onboarding and debug banner cluttered the capture. | Frame full activation area: heading, scope, capacity, acknowledgement, disabled activation control. Do not imply an unconfirmed account is active. |
| `vault.png` | Correct item metadata, controls and browser sign-ins; excessive empty space. | Frame complete populated panel, including title, New item, search/categories, item controls and Sign out of all sites. No secrets shown. |
| `computer.png` | Bare browser-frame image had no Computer/task/handoff context and was mostly blank. | Replace with actual Computer handoff workspace: conversation, browser + terminal, sign-in request, Take over, I'm done, Skip. The browser frame contains a clearly fictional portal, not debugging text or customer data. |

## Transparent fixture handling

- `fixtures/integration-logo.png` is the same existing synthetic icon used by the webapp's Acme catalog fixture (`apps/app/public/images/logo/icon_color.png`). Only synthetic custom-integration response data is normalized: replace the known transparent 1×1 logo and supply Acme's missing settings logo. Product logo components are unchanged. Entries without logos retain the actual fallback behavior.
- `fixtures/client-portal.html` is a fictional external website, rendered locally at the mock remote browser's 1280×800 viewport into `client-portal.jpg`. Only the known mock browser-frame canvas output is substituted. Odella's conversation, Computer, browser, terminal and approval UI are real components, not redrawn screenshots. No real provider, account, password, approval or business operation is involved.
- The current local Storybook's backend URL mock is missing exports imported by the browser workspace. The capture harness supplies only absent routing mock exports in the served test module. It does not modify webapp source or disable product authorization. All external traffic remains blocked.
- Provenance records asset hashes, viewport/crops, the settings-opening interaction and any fixture/mock normalization. No undocumented image editing or logo painting is applied after capture.

## Automated quality gates

The capture script now checks every image intersecting the final capture area for successful decode and non-placeholder dimensions. It rejects broken or 1×1 images, checks expected visible content and browser exceptions, refuses clipped element captures, and writes the complete provenance manifest only after every requested full-run capture succeeds. External image/font requests are blocked rather than fetched; any resulting broken image inside the delivered crop fails the capture.

The absence of an image element is not sufficient to certify branding: the visual review above distinguishes legitimate generic fallback icons from the blank logo fixture defect. The two must not be confused.

## Final checks

- Opened and visually inspected every final screenshot individually, including the revised Computer handoff and all three integration captures.
- Final full 15-shot capture: all pass, with no broken/placeholder images inside the capture areas or browser exceptions.
- Verified all 15 screenshot hashes and every referenced fixture-asset hash against the manifest.
- All 166 MDX files compile; Mintlify broken-links and `git diff --check` pass.
- Re-ran local Mintlify smoke on ten routes at 1280px and 390px: all 20 combinations load their images without document-level horizontal overflow.
- No application source changes, real provider calls, login submissions or approval decisions. Preview processes started for this review are stopped after delivery.
