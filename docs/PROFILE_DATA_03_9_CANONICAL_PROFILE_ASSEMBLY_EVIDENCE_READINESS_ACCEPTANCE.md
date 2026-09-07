# PROFILE DATA 03.9 — Canonical Profile Assembly Evidence Readiness / Missing Evidence Requirements

Status: **WORKING**
Parent: **PROFILE DATA 03 OPEN / WORKING**
Base checkpoint: **fdd5ca3**

## Purpose

PROFILE DATA 03.9 converts the read-only PROFILE DATA 03.8 review summary into an explicit list of missing evidence requirements.

The layer answers a narrow question:

> What evidence is still missing for each canonical profile relation if confidence is to be raised later by real sources and human review?

It does not create, infer, synthesize, approve, or promote evidence.

## Current PRELUDE 60 requirement model

For every canonical relation, current evidence does **not** establish:

- manufacturer pair relation evidence for the exact profile pair;
- a human-verified real assembly node;
- exact joint documentation / exact joint geometry authority.

For a relation whose current maturity is only `CONCEPTUAL_AND_CATALOGUE_SYSTEM_ONLY`, PROFILE DATA 03.9 additionally records a missing human working relation evidence requirement.

Therefore with the current PRELUDE 60 evidence ledger:

- `FRAME 482.30 ↔ MULLION 482.21` has four missing requirement kinds;
- `FRAME 482.30 ↔ SASH 482.05` has three missing requirement kinds because a human-reviewed 7 mm working relation already exists;
- `MULLION 482.21 ↔ SASH 482.05` has three missing requirement kinds because a human-reviewed 7 mm working relation already exists.

## Workflow gating

PROFILE DATA 03.9 preserves the upstream review state:

- blocked upstream remains blocked;
- review conflict remains blocked;
- stale review remains stale;
- incomplete review remains human-review-required;
- request-more-evidence / rejection remains human-action-required;
- accepted current evidence can reach `MISSING_EVIDENCE_REQUIREMENTS_IDENTIFIED_PRODUCTION_LOCKED`.

That final state means only that the current missing requirements have been identified after the current evidence classification was human reviewed. It is not a production readiness state.

## Safety boundary

PROFILE DATA 03.9 is requirements-only.

- automatic evidence generation = **NO**
- evidence maturity auto-upgrade = **NO**
- manufacturer approval = **NO**
- verified assembly-node evidence created = **NO**
- exact joint geometry verified = **NO**
- automatic profile selection = **NO**
- automatic geometry = **NO**
- production compatibility validated = **NO**
- production rule applied = **NO**
- production deductions applied = **NO**
- manufacturing tolerance applied = **NO**
- rules validated = **NO**
- production unlock = **NO**
- machine ready = **NO**
- production approved = **NO**

## Acceptance

PROFILE DATA 03.9 is accepted only if the implementation:

1. lists missing evidence without inventing any evidence;
2. distinguishes a missing human working relation from already-recorded human working relation evidence;
3. keeps manufacturer pair evidence separate from same-system catalogue membership;
4. keeps verified real assembly-node evidence separate from conceptual relations;
5. keeps exact joint documentation separate from working relation rules;
6. preserves upstream human-review blockers;
7. fails closed if upstream data crosses a production safety boundary;
8. keeps every production lock closed.
