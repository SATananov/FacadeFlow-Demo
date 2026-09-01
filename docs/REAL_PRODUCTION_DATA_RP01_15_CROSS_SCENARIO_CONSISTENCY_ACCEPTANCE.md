# REAL PRODUCTION DATA — RP01.15 Cross-Scenario Simulation Evidence Comparison / Scenario Consistency Review Foundation

## Purpose

RP01.15 compares multiple RP01.14 repeatability-reviewed simulation scenarios for the same
simulation rule identity.

The phase answers a narrow question:

> Are the explicitly reviewed simulation scenarios each supported by current, human-confirmed
> repeatability evidence?

It does **not** infer behavior for unreviewed scenarios.

## Rule-level identity

Repeatability scenarios are compared only when all of these are identical:

- executable draft artifact ID;
- executable expression;
- execution context;
- profile code;
- candidate kind;
- source pattern key;
- operation name.

The scenario itself may differ by input snapshot, identifier, comparison operator, or expected
literal.

## Why different boolean outcomes are allowed

Different simulation inputs may correctly produce different outputs.

Therefore cross-scenario consistency does not mean every scenario must return the same boolean.
It means each explicitly reviewed scenario remains internally repeatable and has a current human
RP01.14 confirmation.

## States

`INSUFFICIENT_SCENARIO_COVERAGE`

- fewer than two distinct reviewed simulation scenarios.

`CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS`

- at least two distinct scenarios;
- every included RP01.14 group is still `CANDIDATE_REPEATABLE_OUTCOME`;
- every included RP01.14 human review is current;
- every included human review is `CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT`.

`CONFLICTING_SCENARIO_REVIEW_EVIDENCE`

- at least two scenarios exist, but one or more repeatability groups/reviews are stale, rejected,
  or no longer candidate evidence.

This state does not itself mean the rule is false; it means the reviewed evidence package is not
clean enough for a cross-scenario consistency candidate.

## Human scenario consistency review

A human review can be recorded only for:

`CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS`

Supported decisions:

- `CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS`
- `REJECTED_SCENARIO_CONSISTENCY`

A positive decision means only that consistency is confirmed across the **explicitly reviewed
scenarios**.

It does not authorize inference beyond them.

## Fingerprint and invalidation

`RP01.15-SCENARIO-CONSISTENCY-V1` binds the review to:

- exact rule identity;
- scenario count;
- current confirmed/rejected/stale counts;
- observed outcome signatures;
- RP01.14 group IDs;
- RP01.14 review IDs;
- exact scenario identities;
- repeatability group/review states and decisions;
- RP01.14 evidence and review fingerprints.

Adding/removing/changing a reviewed scenario changes the fingerprint and makes an old review:

`STALE_REQUIRES_REVIEW`

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`, so the real production-data chain remains
blocked upstream because there is no second real corroborating project.

`SYNTHETIC_TEST_PROJECT_B` remains test-only algorithm evidence.

## Safety boundary

Even after a positive RP01.15 review:

- `inferenceBeyondReviewedScenariosAllowed = false`
- `engineeringRuleValidated = false`
- `automaticRulePromotionAllowed = false`
- `productionExecutable = false`
- `machineInstructionGenerated = false`
- `productionRuleCreated = false`
- `productionUnlockAllowed = false`
- `machineReady = false`
- `productionApproved = false`

No machine instruction, CNC output, production export, or production unlock is created.

## Acceptance

PASS requires:

- RP01.15 focused real-corpus + synthetic algorithm-only tests;
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
