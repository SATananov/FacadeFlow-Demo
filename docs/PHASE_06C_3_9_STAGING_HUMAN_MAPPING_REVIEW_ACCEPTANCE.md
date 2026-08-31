# Phase 06C.3.9 — Staging / Human Mapping Review — Acceptance

## Goal
Prepare the quarantine/staging layer that sits between a real intake record and any future active FacadeFlow data.

## Locked behavior
- Only intake records with status `READY_FOR_REVIEW` may create a staging record.
- Staging preserves source values and evidence references; it never overwrites the source snapshot.
- Mapping decisions are explicit: `KEEP_SOURCE`, `MAP_TO_CANONICAL`, or `ACKNOWLEDGED_UNRESOLVED`.
- No mapping decision is created automatically.
- Human mapping confirmation requires every mapping row to have an explicit valid decision plus reviewer identity and review time.
- Any mapping change invalidates previous human mapping confirmation.
- Any source snapshot change rebuilds staging and invalidates previous mapping confirmation.
- A human-confirmed staging record may only create a `READY_FOR_ACTIVATION_REVIEW` candidate.
- Human mapping confirmation does not activate data, persist records, validate rules, unlock handoff/production, or set machine-ready.

## Safety boundary
`HUMAN MAPPED` is not `ACTIVE DATA`. Phase 06C.3.9 contains no production activation path.
