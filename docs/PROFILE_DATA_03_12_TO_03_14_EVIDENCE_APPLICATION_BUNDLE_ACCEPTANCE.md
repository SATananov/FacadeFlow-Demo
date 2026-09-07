# PROFILE DATA 03.12–03.14 — Evidence Application Bundle

Status: **WORKING BUNDLE**
Base: **65f9ef8 / PROFILE DATA 03.11 CLOSED**

## Purpose

Collapse three closely related evidence-handling steps into one operational bundle so FacadeFlow can move from a human-accepted manual source to an explicitly applied candidate evidence entry and then to a human-reviewed knowledge-requirement decision without repeating APPLY / VERIFY / COMMIT for every micro-step.

## 03.12 — Explicit Evidence Application Gate

A source accepted by PROFILE DATA 03.11 is **not** applied automatically. A technical human must explicitly choose:

- `APPLY_ACCEPTED_SOURCE`
- `HOLD_SOURCE`
- `NEEDS_FURTHER_REVIEW`

Applying a source creates **candidate evidence only**. It does not create validated evidence and does not satisfy a requirement.

## 03.13 — Candidate Evidence Ledger

An explicitly applied accepted source becomes a `CANDIDATE_EVIDENCE_PENDING_REQUIREMENT_REVIEW` entry. Candidate evidence preserves relation, requirement, authority and source provenance.

Candidate evidence is not manufacturer approval, not verified assembly-node evidence and not exact joint geometry.

## 03.14 — Knowledge Requirement Satisfaction Review

A technical human may decide:

- `SATISFIES_KNOWLEDGE_REQUIREMENT`
- `INSUFFICIENT_EVIDENCE`
- `NEEDS_MORE_EVIDENCE`

A positive decision records satisfaction **for the knowledge ledger only**. The source PROFILE DATA 03.9 readiness object is not mutated. The bundle may show a projected remaining knowledge-requirement count, but it does not rewrite upstream evidence maturity.

## Stale protection

03.12 application records are fingerprint-bound to the accepted source review. 03.14 requirement reviews are fingerprint-bound to the candidate evidence entry. Changed provenance invalidates the old decision and requires a new human review.

## Safety boundary

- automatic evidence application = **NO**
- validated evidence created automatically = **NO**
- source readiness mutation = **NO**
- manufacturer approval = **NO**
- verified assembly-node evidence = **NO**
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

## Operational change

03.12, 03.13 and 03.14 are delivered and verified as **one bundle**, with one patch, one VERIFY command and one final commit after the full bundled audit passes.
