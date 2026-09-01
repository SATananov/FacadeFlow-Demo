# REAL PRODUCTION DATA — RP01.6 Cross-Project Evidence Qualification / Human Promotion Gate

## Purpose

RP01.6 determines whether already-corroborated RP01.5 pattern evidence is sufficiently
qualified to **open a human engineering promotion review**.

It does not perform that review and it does not create a production rule.

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`.

Therefore the current real RP01.5 set contains:

- 74 candidate patterns;
- 74 `SINGLE_PROJECT_ONLY`;
- 0 `CROSS_PROJECT_CORROBORATED`.

RP01.6 must therefore keep all 74 current real patterns `BLOCKED`.

No second real production project is inferred or invented.

## Gate requirements

A pattern can become:

`ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW`

only when all of the following are true:

1. RP01.5 reports the exact pattern as `CROSS_PROJECT_CORROBORATED`.
2. At least two distinct projects support that exact pattern.
3. The current candidate still exists for every corroborating project.
4. Every corroborating project has a **current** RP01.4
   `CONFIRMED_AS_CANDIDATE` review for that project candidate.
5. No corroborating project has a current `REJECTED_AS_CANDIDATE` review.

If the RP01.4 evidence fingerprint changes, the previous review becomes stale and no longer
satisfies the current-confirmation requirement.

## Project-level qualification

The gate preserves per-project qualification evidence:

- source project;
- candidate IDs;
- current candidate count;
- current confirmed review count;
- current rejected review count;
- stale review entry count;
- current confirmation state;
- current rejection state;
- project qualification result.

This prevents one reviewed project from standing in for another corroborating project.

## Test-only cross-project fixture

Because the real corpus currently has only one project, focused tests use
`SYNTHETIC_TEST_PROJECT_B` solely to exercise the multi-project gate algorithm.

That fixture is test-only and does not create a second real project or alter real-corpus truth.

## Gate meaning

`ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW` means only:

> the evidence package may be presented to a human engineer/technologist for a later explicit
> promotion review.

It does **not** mean:

- human promotion review completed;
- engineering rule validated;
- production rule created;
- automatic promotion allowed;
- production unlocked;
- machine-ready;
- production approved.

Required locks remain:

- `humanPromotionReviewCompleted = false`
- `ruleDraftCreated = false`
- `engineeringRuleValidated = false`
- `automaticRulePromotionAllowed = false`
- `productionRuleCreated = false`
- `productionUnlockAllowed = false`
- `machineReady = false`
- `productionApproved = false`

## Acceptance

PASS requires:

- RP01.6 focused real-corpus + synthetic algorithm-only tests;
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
