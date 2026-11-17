# Communication channel guide source and release notes

## Scope

Add ten per-channel customer guides plus overview/navigation on a focused branch from mintlify-docs develop 2f728f5. The dirty main checkout on docs/feature-coverage-refresh is not modified or copied wholesale. Its existing channel drafts were read as context only. Webapp source audited at 88fbb3a67a; relevant application/viewer files match the main checkout inspected. Product setup routes, fields and publication behavior were checked, not inferred solely from enum members or Storybook.

Customer guide paths: workforce/channels/{web-chat,email,slack,teams,phone,whatsapp,telegram,discord,signal,google-meet}.mdx. Navigation adds a Communication group and removes the duplicate overview entry from Capabilities.

## Provenance and screenshot treatment

17 existing provider-console images from webapp apps/app/src/assets/images are copied as RGB PNGs under images/channels. See channel-screenshot-provenance.json for exact source/destination hashes and transformations. Final copies inspected as contact sheets. These are historical illustrative provider consoles, not newly captured/live product acceptance screenshots. Captions identify redactions and historical differences.

- Slack: credential illustration cropped before deprecated Verification Token; identifier/credential-value rows covered opaquely. App review identity, obsolete third-party redirect and historical scope list covered opaquely. New docs say to use the current employee-generated manifest, not the pictured values.
- Telegram: success screenshot bot link and complete token line covered opaquely. No token value reproduced in notes or PR text.
- Discord: obsolete manual Application ID screenshot omitted; reset-token screenshot cropped to token control (no token exposed); intents caption distinguishes required/recommended/optional settings from historical all-on picture.
- Teams: example Azure Bot screenshot has a historical pricing label; guide says current in-app guide suggests F0 and to confirm organization-approved current pricing, not copy screenshot.
- Signal: CAPTCHA page screenshot contains no challenge token; guide distinguishes challenge URL from public contact URL.
- No existing standalone setup screenshot was found for web chat, email, phone, WhatsApp or Meet in the source asset set. No fabricated screenshot or customer account capture substituted.

Original source images containing potentially exposed credentials need owner review/rotation and separate source/history remediation. No validation request was made against those credentials. No original secret bytes/pixels were committed to this docs branch.

## Product accuracy boundaries

- WhatsApp is organization-only/paid, present in SkillsAddPanel for organizations, filtered from EmployeeSkillGraph via HIDDEN_APP_TYPES. Registration records pending_manual because direct number-onboarding call is disabled; staff/provider submission is not the same as Meta review. Published is not necessarily provider-ready.
- Google Meet not listed in normal channel picker metadata/list. Backend editor/action support is conditional, OAuth not provided by the defaults form, live join beta/dial-in only. Do not promise a complete self-service connection.
- Slack assisted config-token route needs account channel-management authority and returns four values to the browser; it is not safe to expose that response to a model unchanged.
- Signal requires supported assigned number/SMS routing, automatic OTP and sometimes human CAPTCHA; regional wiring and active registration checked before publishing.
- Phone selector can assign an existing available active number with employee-channel authority; purchases/account inventory need account permissions. Provider compliance/paid approval and calling terms remain distinct.
- Default web/email protected; generated email read-only/member-restricted. Removing optional app is not universal provider uninstall/number release. No working general unpublish/reconnect lifecycle inferred from UI wording.
- Memory settings/dreaming/security policies stay employee-UI-only. Customer guides describe current UI setup, not unimplemented future conversational/MCP commands.

## Validation

- MDX source for all ten new guides and changed overview compiled with installed @mdx-js/mdx 3.1.0.
- Installed global Mintlify 4.2.81 does not implement `mintlify validate`; that command failed with Unknown command. No full current pinned Mintlify production-build pass claimed.
- `mintlify broken-links` passed on the branch.
- Additional checks cover JSON navigation targets, MDX frontmatter/local links/image references, all ten channels, all 17 image provenance hashes and opaque redaction/crop assertions, source references and git diff whitespace.
- No new dependency installation, preview server, provider provisioning, OAuth grant, customer data access, external test message/call, deployment or publication. PR against develop is documentation review, not live Mintlify publication (site publishing follows its approved default-branch workflow).

Detailed backend gaps and proposed sequence live in webapp docs/audits/employee-configuration/communication-channel-setup-audit.md / PR2877. Application implementation remains unchanged.
