# REAL PRODUCTION DATA — RP01.3 Candidate Production Pattern Foundation

## Purpose

RP01.3 turns **repeated RP01.2 observations** into explicit candidates for human review.

It does not turn repeated observations into production rules.

## Candidate eligibility

Only these RP01.2 pattern classes can become RP01.3 candidates:

- repeated four-field cut tuples (`sxB`, `dxB`, `sxC`, `dxC`);
- repeated exact machining-operation fingerprints.

A source pattern must already be marked `REPEATED_OBSERVATION` by RP01.2.

The following are deliberately excluded from automatic candidate generation:

- `SINGLE_OBSERVATION` patterns;
- broad operation-name frequency alone, such as the count of `STD_HOLE` without its exact observed parameters;
- inferred profile roles;
- inferred system identity.

## Candidate state

New candidates start as:

- `status = CANDIDATE_PRODUCTION_PATTERN`
- `reviewStatus = NOT_REVIEWED`
- `singleProjectOnly = true`
- `crossProjectCorroborated = false`

Human review can record only:

- `CONFIRMED_AS_CANDIDATE`
- `REJECTED_AS_CANDIDATE`

A reviewer name and review timestamp are mandatory. A reviewed candidate is not silently
re-reviewed; a later change requires a future explicit audit/versioning phase.

## Critical semantic boundary

`CONFIRMED_AS_CANDIDATE != PRODUCTION_RULE`

Even a human-confirmed candidate remains:

- sourced from the single `Вадим-2` project only;
- not cross-project corroborated;
- not universally applicable;
- not machine-ready;
- not production-approved.

## Locked safety fields

RP01.3 keeps:

- `candidateIsProductionRule = false`
- `universalRuleInferenceAllowed = false`
- `automaticRulePromotionAllowed = false`
- `productionRuleCreated = false`
- `machineReady = false`
- `productionApproved = false`

## Real-sample acceptance facts

Against the existing locked `local-samples/phase05a` Vadim XML/LTE pair, the current
RP01.2 corpus yields 74 review candidates:

- 4 repeated cut-tuple candidates;
- 70 repeated exact-operation candidates.

Per observed profile code:

- `78.01`: 19 candidates;
- `78.27`: 6 candidates;
- `78.33`: 48 candidates;
- `78.51`: 1 candidate.

These counts describe this locked source corpus only. They are not engineering rules.

## Acceptance

PASS requires:

- RP01.3 focused real-sample tests;
- RP01.2 regression;
- RP01.1 regression;
- Nadezhda evidence regression and source audit;
- WP78 project-system evidence regression;
- WP78 evidence-aware rule-gate regression;
- lint;
- production build.
