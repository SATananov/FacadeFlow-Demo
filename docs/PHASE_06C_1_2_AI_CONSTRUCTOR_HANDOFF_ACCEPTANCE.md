# PHASE 06C.1.2 — AI → Constructor Handoff

## Goal
Transfer a human-confirmed guided product draft into the existing structured constructor without AI inference, automatic geometry, machine output, or invented catalogue values.

## Acceptance
- Handoff is unavailable until the guided draft and its prepared specification are `HUMAN_CONFIRMED`.
- A confirmed window/door opens directly in `STANDARD_DRAFT`; the constructor route/category chooser is skipped.
- Name, dimensions and valid catalogue-backed system/frame/sash/mullion selections are prefilled.
- Quantity, opening, glazing/fill, finish, hardware, handle, hinge count, threshold evidence and notes remain visible as source evidence in the constructor.
- Manual system/profile codes are preserved as evidence but are **not** injected into catalogue dropdowns until the catalogue/rules layer can verify them.
- Constructor human review is reset: `humanReviewChecked=false`, `status=NEEDS_REVIEW`.
- Rule validation remains separate and incomplete.
- No geometry is created by handoff.
- `simulationOnly=true`, `machineReady=false`, `productionApproved=false`, DWG/machine writers remain unavailable.
- The existing custom CAD entry is explicitly labeled as a no-handoff/manual path in this phase.

## Safety invariant
`HUMAN CONFIRMED SOURCE` does not mean `RULES VALIDATED`, `GEOMETRY CREATED`, or `MACHINE READY`.
