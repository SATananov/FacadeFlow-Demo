# REAL PRODUCTION DATA — RP01.20 Reviewed Evidence Consumer Audit Trail / Usage Event Foundation

## Purpose

RP01.20 records how RP01.19 reviewed-evidence consumer actions are requested and resolved.

The layer creates an append-only, read-only audit trail of consumer usage events.

It does not change RP01.19 action decisions and does not create prediction, engineering authority,
production authority, or machine output.

## Usage event

Each recorded usage event captures:

- consumer kind: `UI` or `AI_CONTEXT`;
- consumer ID;
- requested RP01.19 consumer action;
- RP01.19 action outcome;
- RP01.19 action reason;
- event timestamp;
- request context;
- scenario identity;
- source RP01.19 contract state/version;
- whether an evidence projection was present.

The event always records the usage as read-only evidence handling.

## Allowed and blocked actions

RP01.20 does not independently authorize actions.

It calls the RP01.19 action gate and records its result.

Therefore:

- allowed display/context actions are logged as `ALLOWED_READ_ONLY`;
- prediction/generalization/engineering/production/machine actions are logged as `BLOCKED`.

A blocked event is still an auditable event.

## Consumer-kind guard

The two positive read-only actions have a consumer-kind boundary:

- `DISPLAY_REVIEWED_EVIDENCE` requires `UI`;
- `EXPOSE_REVIEWED_EVIDENCE_TO_AI_CONTEXT` requires `AI_CONTEXT`.

A mismatched positive-action request is not recorded.

Forbidden actions may still be logged from either consumer kind because the important result is the
blocked RP01.19 decision.

## Audit trail

The audit trail reports:

- event count;
- allowed read-only event count;
- blocked event count;
- UI event count;
- AI-context event count.

Events are presented deterministically by timestamp, then ID.

The API is append-only: existing events are never mutated by recording a new event.

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`.

The real production-data chain remains blocked upstream because there is no second real
corroborating project.

Focused RP01.20 tests use synthetic RP01.17 query data to exercise the RP01.18 → RP01.19 →
RP01.20 consumer-audit path only.

## Safety boundary

RP01.20 always keeps:

- `automaticOutcomeInferenceAllowed = false`
- `inferredOutcome = null`
- `scenarioGeneralizationAllowed = false`
- `inferenceBeyondReviewedScenariosAllowed = false`
- `engineeringAuthorityGranted = false`
- `productionAuthorityGranted = false`
- `machineInstructionGenerated = false`
- `productionUnlockAllowed = false`

The audit trail itself also keeps:

- `readOnlyEvidenceUsageOnly = true`
- `automaticOutcomeInferenceAllowed = false`
- `engineeringAuthorityGranted = false`
- `productionAuthorityGranted = false`
- `machineInstructionGenerated = false`
- `productionUnlockAllowed = false`

No CNC/machine output, production export, or production unlock is created.

## Acceptance

PASS requires:

- RP01.20 focused tests;
- RP01.19 regression;
- RP01.18 regression;
- RP01.17 regression;
- RP01.16 regression;
- RP01.15 regression;
- RP01.14 regression;
- RP01.13 regression;
- RP01.12 regression;
- RP01.11 regression;
- RP01.10 regression;
- RP01.9 regression;
- RP01.8 regression;
- RP01.7 regression;
- RP01.6 regression;
- RP01.5 regression;
- RP01.4 regression;
- RP01.3 regression;
- RP01.2 regression;
- RP01.1 regression;
- Nadezhda evidence regression and audit;
- WP78 project-system evidence regression;
- WP78 evidence-aware rule-gate regression;
- lint;
- production build.
