# REAL PRODUCTION DATA — RP01.7 Human Promotion Review Record / Rule Draft Boundary

## Purpose

RP01.7 records an explicit human engineering/technology decision after the RP01.6 promotion gate
has become `ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW`.

It then allows, at most, creation of a **non-executable rule draft artifact** from a current
`APPROVED_FOR_RULE_DRAFT` review.

This phase still does not validate or activate a production rule.

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`.

Therefore current real RP01.6 assessments remain blocked:

- real project count: 1;
- real RP01.5 cross-project corroborated patterns: 0;
- current real RP01.7 promotion reviews recordable: 0.

The cross-project eligible path in focused tests uses `SYNTHETIC_TEST_PROJECT_B` only as
test-only algorithm evidence. It does not create or claim a second real production project.

## Human promotion review

A review can be recorded only when the supplied RP01.6 gate is currently:

`ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW`

The human must explicitly supply:

- decision;
- reviewer;
- timestamp;
- rationale.

Supported decisions:

- `APPROVED_FOR_RULE_DRAFT`
- `REJECTED_FOR_RULE_DRAFT`

A rejection is a valid audit record but cannot produce a draft.

## Promotion-gate fingerprint and invalidation

Every recorded review snapshots deterministic `RP01.7-PROMOTION-GATE-V1` evidence identity.

The fingerprint includes the RP01.6 gate's:

- assessment and corroboration IDs;
- profile/pattern identity;
- distinct project count;
- source projects;
- per-project candidate IDs;
- current candidate/review/rejection/stale counts;
- project qualification state;
- gate state and block reasons.

Reviewer metadata is not part of that evidence identity.

If current gate evidence changes, the old promotion review becomes:

`STALE_REQUIRES_REVIEW`

and it cannot be used for draft creation.

## Non-executable rule draft boundary

A draft can be created only from:

1. a current RP01.7 review;
2. decision `APPROVED_FOR_RULE_DRAFT`;
3. explicit title;
4. explicit proposed rule statement input;
5. explicit creation timestamp.

RP01.7 never derives the rule statement automatically from observed data.

The artifact is explicitly:

`NON_EXECUTABLE_RULE_DRAFT`

with:

- `draftStatus = DRAFT_ONLY`
- `explicitStatementInputRequired = true`
- `automaticRuleDerivationPerformed = false`
- `executable = false`
- `machineInstructionGenerated = false`

## Safety boundary

A recorded human promotion review is not engineering rule validation.

A created draft is not a production rule.

Even when the draft exists:

- `engineeringRuleValidated = false`
- `automaticRulePromotionAllowed = false`
- `productionRuleCreated = false`
- `productionUnlockAllowed = false`
- `machineReady = false`
- `productionApproved = false`

RP01.7 creates no machine instruction and performs no production unlock.

## Acceptance

PASS requires:

- RP01.7 focused real-corpus + synthetic algorithm-only tests;
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
