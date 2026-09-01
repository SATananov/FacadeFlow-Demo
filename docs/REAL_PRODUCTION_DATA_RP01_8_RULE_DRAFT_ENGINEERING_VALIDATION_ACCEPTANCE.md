# REAL PRODUCTION DATA — RP01.8 Human Rule Draft Validation / Engineering Decision Boundary

## Purpose

RP01.8 records a separate human engineering-context decision over an RP01.7
`NON_EXECUTABLE_RULE_DRAFT`.

The phase validates only whether the explicit draft statement is accepted or rejected in a
named engineering context.

It does not validate an executable engineering rule and it does not create production authority.

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`.

Therefore current real data still has:

- one real project;
- zero real cross-project corroborated patterns;
- zero real RP01.6 promotion-gate eligible patterns;
- zero real RP01.7 rule drafts;
- zero real RP01.8 engineering validations.

Focused multi-project tests continue to use `SYNTHETIC_TEST_PROJECT_B` only as test-only
algorithm evidence. It is not a second claimed real production project.

## Required RP01.7 input

RP01.8 accepts only a draft that remains:

- `NON_EXECUTABLE_RULE_DRAFT`;
- `DRAFT_ONLY`;
- `executable = false`;
- `machineInstructionGenerated = false`;
- production locked.

The draft must still be linked to the supplied current RP01.7 human promotion review and current
RP01.6 gate.

The source promotion review must remain current and must still have decision:

`APPROVED_FOR_RULE_DRAFT`

## Human engineering decision

The validator must explicitly provide:

- decision;
- validator;
- validation timestamp;
- engineering context;
- rationale.

Supported decisions:

- `VALIDATED_FOR_ENGINEERING_CONTEXT`
- `REJECTED_FOR_ENGINEERING_CONTEXT`

A positive decision sets only:

`draftValidatedForEngineeringContext = true`

It does not set `engineeringRuleValidated = true`.

## RP01.8 fingerprint

Every decision snapshots deterministic `RP01.8-RULE-DRAFT-V1` evidence identity including:

- draft artifact ID and draft status;
- source promotion-review and gate IDs;
- corroboration/profile/pattern identity;
- exact draft title and proposed rule statement;
- draft creation timestamp;
- explicit/manual derivation safety state;
- source promotion-review decision;
- source promotion-review gate fingerprint;
- current RP01.6 gate fingerprint.

If the draft text or underlying promotion evidence changes, the old validation becomes:

`STALE_REQUIRES_REVIEW`

## Safety boundary

Even a current:

`VALIDATED_FOR_ENGINEERING_CONTEXT`

record remains review evidence only.

The following remain locked:

- `engineeringRuleValidated = false`
- `executableRuleCreated = false`
- `automaticRulePromotionAllowed = false`
- `productionRuleCreated = false`
- `productionUnlockAllowed = false`
- `machineInstructionGenerated = false`
- `machineReady = false`
- `productionApproved = false`

RP01.8 creates no executable rule and no machine output.

## Acceptance

PASS requires:

- RP01.8 focused real-corpus + synthetic algorithm-only tests;
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
