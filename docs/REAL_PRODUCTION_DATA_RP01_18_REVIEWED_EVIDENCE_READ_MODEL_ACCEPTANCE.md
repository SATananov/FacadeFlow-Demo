# REAL PRODUCTION DATA — RP01.18 Reviewed Evidence Read Model / Safe Consumer Projection Foundation

## Purpose

RP01.18 converts an RP01.17 exact-scope evidence query result into a safe read-only consumer model
for UI or AI-context presentation.

The consumer model may expose reviewed evidence metadata and historical reviewed simulation results.

It must not convert those results into a newly inferred answer.

## Input boundary

RP01.18 accepts only an RP01.17 `ReviewedScenarioEvidenceQueryResult`.

An available consumer projection requires all of the RP01.17 conditions to already be satisfied:

- `status = EVIDENCE_REFERENCE_AVAILABLE`;
- `exactScopeMatch = true`;
- a non-null RP01.17 evidence reference.

Otherwise the read model is:

`UNAVAILABLE`

and contains no consumer evidence projection.

## Consumer projection

When available, the projection is labeled:

- `HUMAN_REVIEWED_SIMULATION_EVIDENCE`
- `EXACT_REVIEWED_SCENARIO_ONLY`
- `HISTORICAL_REVIEWED_SIMULATION_RESULTS`
- `READ_ONLY_EVIDENCE_PROJECTION`

The projection may contain:

- exact scenario identity;
- RP01.16 boundary ID;
- RP01.15 cross-scenario group and review IDs;
- RP01.14 repeatability group and review IDs;
- RP01.14 evidence/review fingerprints;
- observed reviewed simulation result array;
- expected reviewed simulation result array.

The observed and expected arrays are preserved as evidence. They are not a prediction.

## UI and AI consumer boundary

An available read model may set:

- `mayDisplayReviewedEvidenceReference = true`;
- `mayExposeReviewedEvidenceToAiContext = true`.

But it always keeps:

- `aiContextMayTreatEvidenceAsPrediction = false`;
- `automaticOutcomeInferenceAllowed = false`;
- `inferredOutcome = null`;
- `usableAsCurrentScenarioPrediction = false`.

Therefore a UI may display the evidence and an AI consumer may receive it as context, but neither is
authorized by RP01.18 to transform it into an inferred engineering result.

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`.

The real chain remains blocked upstream because there is no second real corroborating project.
Focused RP01.18 tests use synthetic reviewed-scenario evidence to exercise only the safe consumer
projection algorithm.

## Safety boundary

RP01.18 always keeps:

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
- `engineeringAuthorityGranted = false`
- `productionAuthorityGranted = false`

No engineering authority, machine instruction, CNC output, production export, or production unlock
is created.

## Acceptance

PASS requires:

- RP01.18 focused tests;
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
