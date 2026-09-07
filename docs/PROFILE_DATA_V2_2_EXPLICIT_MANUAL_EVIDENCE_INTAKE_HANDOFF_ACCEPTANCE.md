# PROFILE DATA V2.2 — Explicit Manual Evidence Intake Handoff

Source checkpoint: **c8aab2d**

## Purpose

PROFILE DATA V2.2 connects the V2.1 clarification candidate to the existing manual evidence intake boundary without silently registering or accepting evidence.

The new path is:

1. AI asks for a missing source/review through the existing 03.27–03.29 chain.
2. Human provides the answer in V2.1.
3. 03.29 emits a pending intake candidate.
4. Human explicitly chooses to prepare a V2.2 handoff draft.
5. The handoff draft contains the source/reference and requirement metadata needed to prefill a later PROFILE DATA 03.10 manual intake action.
6. PROFILE DATA 03.10 registration is still a separate explicit human action.
7. Existing 03.11+ human review/evidence gates remain unchanged.

## Acceptance requirements

- Source-reference candidates can produce a handoff draft only after an explicit human button action.
- Human-review-renewal candidates cannot be converted into manual evidence registration drafts.
- The handoff preserves relation, requirement kind, authority, source label, source reference and the human note.
- The handoff targets `PROFILE_DATA_03.10` semantically but does not call `createCanonicalProfileAssemblyEvidenceSubmissionRecord`.
- The handoff is invalidated as stale when its source candidate changes and must be recreated explicitly.
- The existing V2.1 capture behavior remains intact.
- Existing PROFILE DATA 03.10 and 03.11 boundaries remain authoritative for registration and source review.

## Safety boundary

- Explicit human handoff required: **YES**
- Handoff draft only: **YES**
- Creates PROFILE DATA 03.10 submission record: **NO**
- Automatic evidence fetch: **NO**
- Automatic evidence registration: **NO**
- Automatic evidence acceptance: **NO**
- Automatic requirement satisfaction: **NO**
- Automatic knowledge resolution: **NO**
- Manufacturer approval: **NO**
- Exact joint geometry verified: **NO**
- Production compatibility validated: **NO**
- Automatic profile selection: **NO**
- Automatic geometry: **NO**
- Rules validated: **NO**
- Production unlock: **NO**
- Machine ready: **NO**

## Expected verification

`npm run verify` must pass on the user's full repository after applying the patch. Any existing non-blocking lint/build warnings remain outside the scope of V2.2 unless they become errors.
