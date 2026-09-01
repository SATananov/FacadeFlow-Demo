# REAL PRODUCTION DATA — RP01.17 Reviewed Scenario Evidence Query Gate / Exact-Scope Retrieval Foundation

## Purpose

RP01.17 adds a read-only query gate over the RP01.16 reviewed-scenario coverage boundary.

The gate answers only:

> Is there current, human-reviewed simulation evidence for this exact scenario identity?

It does not execute a rule and does not infer an outcome.

## Exact-scope query behavior

The query requires:

- an RP01.16 coverage boundary;
- the current RP01.15 cross-scenario evidence group;
- the current RP01.15 human scenario-consistency review;
- the exact `scenarioIdentityJson` being queried.

The RP01.16 boundary is re-assessed before retrieval.

Possible statuses:

- `EVIDENCE_REFERENCE_AVAILABLE`
- `NO_REVIEWED_EVIDENCE`

Possible blocking reasons:

- `COVERAGE_BOUNDARY_NOT_CURRENT`
- `SCENARIO_OUTSIDE_REVIEWED_SCOPE`

## Evidence reference

On an exact current scope match, RP01.17 may return only a reference package containing:

- RP01.16 boundary ID;
- RP01.15 cross-scenario evidence group ID;
- RP01.15 scenario-consistency review record ID;
- exact scenario identity JSON;
- RP01.14 repeatability group ID;
- RP01.14 repeatability review record ID;
- RP01.14 evidence fingerprint;
- RP01.14 review fingerprint;
- observed simulation results;
- expected simulation results.

The reference is labeled:

`EXACT_REVIEWED_SCENARIO_ONLY`

These are reviewed evidence values, not a newly inferred answer.

## No inferred outcome

RP01.17 always keeps:

- `automaticOutcomeInferenceAllowed = false`
- `inferredOutcome = null`

Even when an exact evidence reference is available.

A consumer may display the reviewed evidence reference, but RP01.17 does not decide what a new
simulation or production outcome should be.

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`.

The real chain remains blocked upstream because there is no second real corroborating project.
Focused RP01.17 tests use synthetic reviewed-scenario evidence to exercise the exact-scope query
algorithm.

## Safety boundary

RP01.17 always keeps:

- `scenarioGeneralizationAllowed = false`
- `inferenceBeyondReviewedScenariosAllowed = false`
- `engineeringRuleValidated = false`
- `automaticRulePromotionAllowed = false`
- `productionExecutable = false`
- `machineInstructionGenerated = false`
- `productionRuleCreated = false`
- `productionUnlockAllowed = false`
- `machineReady = false`
- `productionApproved = false`

No engineering authority, machine instruction, CNC output, production export, or production unlock
is created.

## Acceptance

PASS requires:

- RP01.17 focused tests;
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
