# PROFILE DATA 03.8 — Canonical Profile Assembly Evidence Review Summary / Gate Aggregation

Status: **WORKING**
Parent: **PROFILE DATA 03 OPEN / WORKING**

## Purpose

PROFILE DATA 03.8 aggregates the relation-level human review states from PROFILE DATA 03.7 into one read-only summary gate for the current product evidence set.

The gate answers only this narrow question:

> Have all currently surfaced canonical assembly-evidence classifications been human-reviewed and accepted as the current evidence classification?

A PASS here is **not** manufacturer approval, does not promote evidence maturity, does not create verified assembly-node evidence, does not verify exact joint geometry, and does not validate production compatibility.

## Inputs

- PROFILE DATA 03.7 human-review gate
- current evidence fingerprint / state key
- relation-level review states for the canonical profile relations present in the current evidence set

## Aggregate outcomes

- `BLOCKED_UPSTREAM`
- `BLOCKED_REVIEW_CONFLICT`
- `STALE_REVIEW_REQUIRED`
- `HUMAN_REVIEW_INCOMPLETE`
- `HUMAN_ACTION_REQUIRED`
- `CURRENT_EVIDENCE_ACCEPTED_PRODUCTION_LOCKED`

The final state means only that every current relation has `HUMAN_ACCEPTED_CURRENT_EVIDENCE` for the unchanged source evidence.

## Fail-closed integrity checks

PROFILE DATA 03.8 blocks if:

- aggregate counters do not match relation-level states;
- PROFILE DATA 03.7 says review is complete/accepted while the relation rows disagree;
- any upstream gate or row unexpectedly claims manufacturer approval, verified assembly-node evidence, exact joint verification, production validation, production unlock, or machine readiness.

## Stale review behavior

The summary uses a human-review state fingerprint. If the upstream evidence or human-review state changes, the aggregate result is recomputed. A prior PASS is never persisted over changed evidence.

## Safety boundary

PROFILE DATA 03.8 is summary-only.

- evidence maturity changed: **NO**
- manufacturer assembly compatibility validated: **NO**
- verified assembly-node evidence created: **NO**
- exact joint geometry verified: **NO**
- automatic profile selection: **NO**
- automatic geometry: **NO**
- production compatibility validated: **NO**
- production rule applied: **NO**
- production deductions applied: **NO**
- manufacturing tolerance applied: **NO**
- rules validated: **NO**
- production unlock: **NO**
- machine ready: **NO**
- production approved: **NO**

## Acceptance criteria

1. Unreviewed relations aggregate to `HUMAN_REVIEW_INCOMPLETE`.
2. Accepted current evidence on every current relation aggregates to `CURRENT_EVIDENCE_ACCEPTED_PRODUCTION_LOCKED`.
3. `REQUEST_MORE_EVIDENCE` or `REJECT_CURRENT_EVIDENCE` aggregates to `HUMAN_ACTION_REQUIRED`.
4. Stale relation reviews aggregate to `STALE_REVIEW_REQUIRED`.
5. Upstream safety inconsistencies fail closed.
6. The summary does not edit evidence, profile assignments, geometry, or human review records.
7. No summary result can unlock production or machine output.
