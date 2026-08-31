# PHASE 06C.3.3 — Rules Gate Foundation Acceptance

## Goal
Prepare a source-first rules gate before real engineering data is supplied. The phase defines **categories that must later be checked**, not real engineering rules.

## Accepted behavior
- The rules gate can only be prepared after the unified DEMO packet has been marked `HUMAN_REVIEWED`.
- All six DEMO modes use the same rules-gate envelope.
- Product packets expose rule categories for geometry, profile compatibility, opening/hardware, glazing/fill, finish, threshold applicability, project context, and source traceability.
- Non-product routes defer product-specific categories until real product data exists.
- A door requires a future threshold/lower-node source; a DEMO window does not silently inherit that requirement.
- Every future real rule requires a traceable source and revision.
- No real rule, numeric engineering limit, catalogue rule, source evidence, or rule-set revision is invented in this phase.
- `FRAMEWORK_READY` means only that the checklist structure exists. It does **not** mean rules are validated.
- `rulesValidated`, `machineReady`, and production approval remain `false`.
- Step 5 / constructor handoff remains locked.
- Any change to captured job metadata invalidates the normalized review packet and the rules framework together.

## Safety boundary
`HUMAN_REVIEWED` ≠ `HUMAN_CONFIRMED` ≠ `RULES_VALIDATED` ≠ `MACHINE_READY`.

No network, persistence, automatic geometry, machine writer, or production export is introduced.
