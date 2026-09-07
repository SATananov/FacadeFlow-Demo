# PROFILE DATA 03.10 — Manual Assembly Evidence Intake / Registration Foundation

Status: **WORKING**
Parent: **PROFILE DATA 03 OPEN / WORKING**
Base checkpoint: **1e5ce06**

## Purpose

PROFILE DATA 03.10 introduces a manual intake boundary for the missing evidence requirements identified by PROFILE DATA 03.9.

It answers one narrow question:

> Can a technical user register where a missing evidence source came from, without that registration being treated as accepted or validated evidence?

The answer is yes, but the registration remains pending human review.

## Registration model

A manual registration records:

- canonical relation;
- missing requirement kind;
- the exact authority class required by PROFILE DATA 03.9;
- a human-entered source label;
- a human-entered source reference;
- submitter role and timestamp;
- an optional note.

The registration is fingerprinted against the current PROFILE DATA 03.9 readiness state and the exact missing requirement signature.

## Fail-closed behavior

Manual registration is allowed only when the current evidence classification has already passed the human-review gate and PROFILE DATA 03.9 is in `MISSING_EVIDENCE_REQUIREMENTS_IDENTIFIED_PRODUCTION_LOCKED`.

A registration becomes `STALE_REGISTRATION_REVIEW_REQUIRED` if the readiness state or requirement signature changes later.

Multiple active registrations for the same relation and requirement kind are treated as an intake conflict until resolved.

## What registration does not mean

A registered source is **not** accepted evidence.

Registration does not:

- satisfy the missing requirement;
- verify the source;
- create manufacturer approval;
- create verified assembly-node evidence;
- validate exact joint geometry;
- upgrade evidence maturity;
- validate production compatibility;
- unlock production.

A separate human evidence-review layer is still required after intake.

## Safety boundary

- manual evidence registration = **YES**
- registration-only record = **YES**
- human review required = **YES**
- registered submission is accepted evidence = **NO**
- registered submission satisfies requirement = **NO**
- validated evidence created = **NO**
- manufacturer approval = **NO**
- verified assembly-node evidence created = **NO**
- exact joint geometry verified = **NO**
- evidence maturity auto-upgrade = **NO**
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

PROFILE DATA 03.10 is accepted only if the implementation:

1. registers only a currently missing requirement;
2. requires the authority class expected by PROFILE DATA 03.9;
3. requires an explicit human source label and source reference;
4. stores registrations as pending human review;
5. does not remove or satisfy a PROFILE DATA 03.9 requirement;
6. invalidates old registrations when readiness or requirement fingerprints change;
7. fails closed on duplicate active registrations or upstream safety conflicts;
8. keeps every production boundary locked.
