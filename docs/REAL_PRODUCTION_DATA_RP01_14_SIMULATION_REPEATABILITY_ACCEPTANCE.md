# REAL PRODUCTION DATA — RP01.14 Simulation Outcome Evidence Aggregation / Repeatability Review Foundation

## Purpose

RP01.14 aggregates multiple RP01.13 human-reviewed dry-run outcomes for the exact same simulation
scenario and determines whether the evidence is sufficient to become a **repeatability candidate**.

It then adds a separate human repeatability review record.

This is still simulation evidence only.

## Exact scenario identity

Outcomes are grouped only when all of these are identical:

- RP01.10 executable draft ID;
- executable expression;
- execution context;
- canonical input snapshot;
- referenced input identifier;
- comparison operator;
- expected literal.

Different inputs or contexts are separate repeatability groups.

## Repeatability states

`INSUFFICIENT_REPEATABILITY_EVIDENCE`

- fewer than two current positively reviewed dry-runs;
- or fewer than two distinct dry-run record IDs.

`CANDIDATE_REPEATABLE_OUTCOME`

- at least two distinct current positively reviewed dry-runs;
- one consistent observed boolean result;
- one consistent expected boolean result;
- no current rejected outcome reviews.

`CONFLICTING_REPEATABILITY_EVIDENCE`

- sufficient positive evidence exists but current rejected evidence or conflicting results prevent
  repeatability-candidate status.

A candidate is not an engineering rule.

## Human repeatability review

A review can be recorded only for `CANDIDATE_REPEATABLE_OUTCOME`.

Supported decisions:

- `CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT`
- `REJECTED_REPEATABILITY_FOR_SIMULATION_CONTEXT`

Reviewer, timestamp, and rationale are mandatory.

A positive review sets only:

`repeatabilityConfirmedForSimulationContext = true`

It does not authorize cross-scenario inference.

## Fingerprint and invalidation

`RP01.14-REPEATABILITY-V1` binds the review to the exact scenario, evidence counts, states, dry-run
IDs, outcome validation IDs, decisions, results, and RP01.13 evidence fingerprints.

Adding, removing, changing, or staling evidence changes the fingerprint and makes an old review:

`STALE_REQUIRES_REVIEW`

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`, so the real pipeline remains blocked
upstream because there is no second real corroborating project.

`SYNTHETIC_TEST_PROJECT_B` remains test-only algorithm evidence.

## Safety boundary

Even after a positive repeatability review:

- `crossScenarioInferenceAllowed = false`
- `engineeringRuleValidated = false`
- `automaticRulePromotionAllowed = false`
- `productionExecutable = false`
- `machineInstructionGenerated = false`
- `productionRuleCreated = false`
- `productionUnlockAllowed = false`
- `machineReady = false`
- `productionApproved = false`

No CNC/machine output, production export, or production unlock is created.

## Acceptance

PASS requires:

- RP01.14 focused real-corpus + synthetic algorithm-only tests;
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
