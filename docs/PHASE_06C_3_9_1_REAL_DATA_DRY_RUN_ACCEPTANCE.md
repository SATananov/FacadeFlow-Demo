# PHASE 06C.3.9.1 — REAL DATA DRY RUN ACCEPTANCE

## Goal
Prove the complete pre-real-data path with a deterministic DEMO-only record before any real source record is allowed into staging.

## Acceptance boundaries
- The dry run uses only explicit DEMO identifiers and never reuses the real Nadezhda profile codes or source filenames.
- The route is explicit: intake contract → quarantine/staging → mapping decisions → named human confirmation → activation-review candidate.
- The scripted mapping helper runs only after an explicit DEMO button click and does not change `autoMappingAllowed: false`.
- Source values, canonical candidates, evidence, reviewer and unresolved values remain separate.
- A named reviewer is required for the HUMAN CONFIRMED mapping state.
- The final dry-run result is only `READY_FOR_ACTIVATION_REVIEW` / `NOT_REVIEWED`.
- `ACTIVE DATA` remains `0` throughout the scenario.
- No persistence, network call, rule validation, production approval, handoff unlock or machine-ready path is introduced.

## Safety statement
`DRY RUN PASS` proves only that the data-foundation workflow can carry a test record to an activation-review candidate. It is not approval of real data, engineering rules or production output.
