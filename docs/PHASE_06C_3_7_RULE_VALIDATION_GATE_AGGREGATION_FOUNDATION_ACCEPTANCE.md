# PHASE 06C.3.7 — Rule Validation / Gate Aggregation Foundation

## Goal
Prepare a deterministic aggregation layer that combines multiple individually reviewed rule-evaluation results into one gate status without creating final engineering approval, handoff permission, production approval, or machine readiness.

## Aggregate states
- `INCOMPLETE` — at least one evaluation is missing evidence or human review, or the set is empty.
- `BLOCKED_BY_FAIL` — at least one HUMAN REVIEWED evaluation is `FAIL`; this state has precedence over incomplete rows.
- `REVIEWED_COMPLETE` — every evaluation is HUMAN REVIEWED and no reviewed result is `FAIL`.

## Safety boundary
`REVIEWED_COMPLETE` is not a synonym for `rulesValidated`. It only means the available evaluation set has been fully human-reviewed with no FAIL. Phase 06C.3.7 never creates a final validation decision and always keeps handoff, production, and machine-ready states locked.

## Acceptance
- Unreviewed PASS/FAIL values do not contribute to reviewed aggregate counts.
- A reviewed FAIL blocks the aggregate and cannot be hidden by unresolved rows.
- An empty set cannot become a vacuous PASS.
- A fully reviewed non-failing set may become `REVIEWED_COMPLETE`, while `rulesValidated=false`, `finalApprovalCreated=false`, `handoffLocked=true`, `productionLocked=true`, and `machineReady=false` remain mandatory.
- No network, persistence, production writer, or machine integration is added.
