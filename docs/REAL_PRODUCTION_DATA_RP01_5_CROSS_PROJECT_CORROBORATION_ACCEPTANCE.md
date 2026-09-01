# REAL PRODUCTION DATA — RP01.5 Cross-Project Corroboration Foundation

## Purpose

RP01.5 distinguishes repetition inside one project from exact pattern evidence observed
across distinct projects.

The current locked real production corpus contains only the `Вадим-2` project. Therefore
every current real RP01.3 candidate remains:

`SINGLE_PROJECT_ONLY`

and:

`crossProjectCorroborated = false`

RP01.5 does not invent or infer any additional real project.

## Exact pattern identity

Cross-project corroboration requires exact equality of:

- profile code;
- candidate kind (`CUT_TUPLE` or `EXACT_OPERATION`);
- source pattern key;
- operation name when applicable.

Evidence count is deliberately not part of pattern identity. The same exact pattern can be
observed a different number of times in different projects.

No fuzzy, dimensional-near, profile-family or AI similarity match is accepted by this layer.

## Distinct-project rule

At least two distinct source-project labels must contain the exact same candidate pattern before:

`CROSS_PROJECT_CORROBORATED`

is reported.

Repeated or duplicated candidate evidence from one project never counts as cross-project evidence.

## Per-project provenance

Each corroboration record preserves:

- source project;
- candidate occurrence count within that project;
- candidate IDs;
- per-candidate evidence counts;
- project evidence total;
- aggregate evidence count across projects.

This prevents a large count from one project being presented as if it were independent
cross-project support.

## Test-only second project

Focused tests use a clearly labelled `SYNTHETIC_TEST_PROJECT_B` only to prove the generic
corroboration algorithm.

That fixture is test evidence only and is not asserted to be an external production source.

## Safety boundary

Cross-project corroboration is stronger evidence, but is still not a production rule.

RP01.5 does not:

- create a production rule;
- automatically confirm candidate review;
- infer profile role or system identity;
- infer universal cut/machining rules;
- enable automatic geometry;
- create machine output;
- mark anything machine-ready;
- approve production.

Required locks remain:

- `humanReviewStillRequired = true`
- `automaticRulePromotionAllowed = false`
- `candidateIsProductionRule = false`
- `productionRuleCreated = false`
- `machineReady = false`
- `productionApproved = false`

## Acceptance

PASS requires:

- RP01.5 focused tests against the real locked Vadim corpus plus synthetic algorithm-only fixtures;
- RP01.4 regression;
- RP01.3 regression;
- RP01.2 regression;
- RP01.1 regression;
- Nadezhda evidence regression and audit;
- WP78 project-system bridge regression;
- WP78 evidence-aware gate regression;
- lint;
- production build.
