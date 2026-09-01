# REAL PRODUCTION DATA — RP01.16 Reviewed Scenario Coverage Boundary / Simulation Evidence Scope Foundation

## Purpose

RP01.16 turns a current, positively reviewed RP01.15 scenario-consistency package into an explicit
**coverage boundary**.

The boundary answers only:

> Which exact simulation scenarios have current reviewed evidence?

It does not infer an outcome for any scenario outside that exact set.

## Boundary creation requirements

A coverage boundary is defined only when:

- the RP01.15 human scenario-consistency review is still `CURRENT`;
- the RP01.15 review decision is
  `CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS`;
- at least two reviewed scenarios remain present.

Otherwise the boundary is `BLOCKED`.

## Exact reviewed-scenario scope

The boundary snapshots each reviewed scenario with:

- scenario identity JSON;
- RP01.14 repeatability group ID;
- RP01.14 repeatability review record ID;
- RP01.14 evidence fingerprint;
- RP01.14 review fingerprint;
- observed results;
- expected results.

Membership checks are exact-string comparisons against the frozen scenario identity.

Possible membership results:

- `WITHIN_REVIEWED_SCENARIO_SCOPE`
- `OUTSIDE_REVIEWED_SCENARIO_SCOPE`

A scenario outside the exact reviewed set does not inherit any reviewed simulation evidence.

## Fingerprint and invalidation

`RP01.16-SCENARIO-COVERAGE-V1` binds the boundary to:

- RP01.15 group ID;
- RP01.15 review record ID;
- exact rule identity;
- scenario count;
- RP01.15 state and review decision;
- stored RP01.15 review fingerprint;
- current RP01.15 evidence fingerprint;
- exact reviewed scenario identities;
- exact RP01.14 source IDs/fingerprints/results.

If the RP01.15 evidence or review changes, the old coverage boundary becomes:

`STALE_REQUIRES_REVIEW`

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`.

The real pipeline remains blocked upstream because there is no second real corroborating project.
The focused RP01.16 logic tests use synthetic scenario-evidence objects only to test the boundary
algorithm.

## Safety boundary

Even when a scenario is `WITHIN_REVIEWED_SCENARIO_SCOPE`:

- `automaticOutcomeInferenceAllowed = false`
- `inferenceBeyondReviewedScenariosAllowed = false`
- `automaticScenarioGeneralizationAllowed = false`
- `engineeringRuleValidated = false`
- `automaticRulePromotionAllowed = false`
- `productionExecutable = false`
- `machineInstructionGenerated = false`
- `productionRuleCreated = false`
- `productionUnlockAllowed = false`
- `machineReady = false`
- `productionApproved = false`

RP01.16 catalogs evidence scope only. It does not create engineering truth, a production rule,
machine instructions, or production unlock.

## Acceptance

PASS requires:

- RP01.16 focused tests;
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
