# Oneleet dependency remediation — October 31, 2026

Generated lockfiles cover the currently published patches without blanket
latest-version updates. Source changes do not close monitored-main alerts until
approved integration/provider refresh (and artifact rebuild where relevant).

fast-uri >=3.1.9, QS >=6.16.1, Undici 7 >=7.30.1 and follow-redirects >=1.16.2. The Undici 7 advisory surfaced during this remediation pass; it is included rather than left for a later scanner refresh.

## Validation

All three generated-lock/override regression tests passed. Full Mintlify build was not run.

## Remaining gates

Develop and main have divergent ancestry. This branch deliberately preserves develop; no force reset, unrelated doc merge or default-branch change was performed. Approved main integration must retain the newer documentation commits. Existing React peer warnings remain visible, not hidden.

