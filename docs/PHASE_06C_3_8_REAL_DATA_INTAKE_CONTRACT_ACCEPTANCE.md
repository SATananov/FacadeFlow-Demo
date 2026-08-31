# PHASE 06C.3.8 — REAL DATA INTAKE CONTRACT

## Purpose
Prepare the strict, source-first contract for future real-data ingestion before any staging/import UI exists.

## Acceptance
- Real data has explicit provenance, identity, product/project and evidence-link fields.
- Missing values remain `UNRESOLVED`; conflicting sources remain `CONFLICT`.
- `READY_FOR_REVIEW` requires all always-required provenance/identity fields, but is not acceptance or validation.
- Conditional product fields are never invented when absent.
- No auto-mapping, staging write, active catalogue mutation, persistence, network, rule validation, handoff or machine-ready path is added.
- Staging begins only in a later phase.

## Safety lock
`READY_FOR_REVIEW != HUMAN_CONFIRMED != ACTIVE_DATA != RULES_VALIDATED != MACHINE_READY`.
