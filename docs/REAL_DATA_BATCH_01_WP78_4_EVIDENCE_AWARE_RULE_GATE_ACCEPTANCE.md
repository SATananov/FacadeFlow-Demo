# REAL DATA BATCH 01 — WP78.4 Evidence-aware Rule Validation Gate

## Scope

This slice connects the existing WP 78 source/project evidence bridge to the existing Phase 06C.3.6 rule-evaluation and Phase 06C.3.7 rule-aggregation foundations.

It is an evidence precondition layer only. It does **not** create a real rule PASS, does **not** set `rulesValidated`, and does **not** unlock machine or production output.

## Evidence classes

- `SOURCE_VERIFIED_PROJECT_OBSERVED` — the requested code/role is verified by the WP 78 source sheet and the normalized code is also observed in the existing Vadim-2 project evidence.
- `SOURCE_VERIFIED_SOURCE_ONLY` — the requested code/role is verified by the WP 78 source sheet but has no matching code observation in Vadim-2.
- `PROJECT_OBSERVED_ROLE_UNCONFIRMED` — the code is observed in Vadim-2 but no source-backed role is established.
- `SOURCE_ROLE_MISMATCH` — a source-backed code is requested under a role that contradicts the verified source role.
- `UNKNOWN_CODE` — no WP 78 source or Vadim project evidence exists for the code.
- `SYSTEM_MISMATCH` — the specialized WP 78 gate was asked to assess a different system.

## Deterministic WP 78 behavior

- `78,01` / `78.01` + `FRAME` → eligible for human rule review; source verified + project observed.
- `78,33` / `78.33` + `MULLION` → eligible for human rule review; source verified + project observed.
- `78,22` + `SASH` → eligible with an explicit Vadim project-evidence gap.
- `78.27` and `78.51` → role assumption blocked; real project observations remain role-unconfirmed.
- A verified code requested under the wrong role is blocked.
- Unknown codes are blocked.

Comma/dot normalization is comparison-only. Original source and project literals remain preserved by the underlying WP78.3.1 evidence bridge.

## Existing rule-engine integration

The adapter calls `aggregateFacadeFlowRuleEvaluations` and keeps the existing generic aggregate unchanged.

Evidence readiness can only allow a request to proceed into **human rule review**. It never synthesizes a `PASS` result and never changes the Phase 06C.3.7 invariant that validation/final approval remain unmade.

Relevant existing gate requirements are:

- `PROFILE_COMPATIBILITY`
- `SOURCE_TRACEABILITY`

## Safety locks

All outputs remain:

- `autoRulePassAllowed = false`
- `rulesValidated = false`
- `finalApprovalCreated = false`
- `handoffLocked = true`
- `productionLocked = true`
- `machineReady = false`
- `productionApproved = false`

## Acceptance

Focused tests must prove verified source/project matches, source-only evidence gaps, role-unconfirmed project observations, role mismatch blocking, unknown-code blocking, system mismatch blocking, evidence aggregation, integration with the existing rule aggregation, and persistent production locks.
