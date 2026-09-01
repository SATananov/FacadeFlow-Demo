# REAL DATA BATCH 01 — WP78.5 Human Rule Review / Decision Record

## Purpose

WP78.5 adds a narrow human decision-record layer on top of the existing WP78 evidence-aware rule gate and the existing generic FacadeFlow rule-evaluation review flow.

This phase does **not** create engineering rules, infer profile roles, auto-pass rules, validate the complete rule set, approve production, or enable machine output.

## Preconditions

A WP78.5 decision may be recorded only when all of the following are true:

- the WP78.4 evidence gate marks the requested system/role/code as eligible for human rule review;
- the linked generic rule evaluation is already `HUMAN_REVIEWED`;
- the evaluation has a non-empty evaluator and evaluation timestamp;
- the evaluation result is not `NEEDS_EVIDENCE`;
- the requirement is one of the WP78 evidence-relevant requirements (`PROFILE_COMPATIBILITY` or `SOURCE_TRACEABILITY`);
- a human reviewer and review timestamp are supplied.

For source-backed `78,22` (`SASH`), which is not observed in the existing Vadim-2 project evidence, confirmation additionally requires explicit acknowledgement of that project-evidence gap.

## Evidence boundaries preserved

- `78,01` / `78.01` remains source-verified as `FRAME` and project-observed in Vadim-2.
- `78,33` / `78.33` remains source-verified as `MULLION` and project-observed in Vadim-2.
- `78,22` remains source-verified as `SASH` but source-only relative to Vadim-2.
- `78.27` and `78.51` remain project-observed with `ROLE_UNCONFIRMED` and cannot receive a WP78.5 confirmation record.
- unrelated requirements cannot be repurposed as WP78 profile-evidence decisions.

## Human decision vocabulary

- `CONFIRMED_FOR_RULE_CONTEXT`
- `REJECTED_FOR_RULE_CONTEXT`

A recorded decision is a human review record only. It is not a final validation decision.

## Safety invariants

Every WP78.5 record and aggregation keeps:

- `validationDecision = NOT_MADE`
- `rulesValidated = false`
- `finalApprovalCreated = false`
- `handoffLocked = true`
- `productionLocked = true`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

An explicit human rejection is surfaced as a blocker. A complete set of human confirmations is reported only as `HUMAN_REVIEW_RECORDED_PRODUCTION_LOCKED`.

## Acceptance checks

Focused tests must prove that:

1. eligible source + project evidence can receive an explicit human confirmation record only after generic human rule review;
2. non-human-reviewed generic evaluations cannot be accepted;
3. the Vadim evidence gap for `78,22` must be explicitly acknowledged before confirmation;
4. `78.27` and other evidence-blocked role assumptions remain blocked;
5. unrelated rule requirements remain ineligible;
6. an explicit human rejection is recorded as a blocker;
7. aggregation never creates final validation, machine readiness, handoff, or production approval.

## Out of scope

- production unlock;
- machine export or machine connection;
- final rule-set approval;
- automatic human confirmation;
- automatic role inference;
- interpretation of XML `MaxY`/`MaxZ` as confirmed catalogue dimensions;
- UI redesign.
