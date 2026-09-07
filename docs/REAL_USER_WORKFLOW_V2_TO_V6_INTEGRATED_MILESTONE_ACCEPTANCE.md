# REAL USER WORKFLOW V2–V6 — Integrated Milestone Acceptance

Base checkpoint: `d6863d0`

## Scope

This milestone deliberately replaces a long sequence of small patches with one integrated user-facing workflow.

### V2 — Intent → Conceptual Drawing
- Builds the existing AI03 proportional/parametric proposal from the current human-clarified intent.
- Renders an inline conceptual 2D preview in the prompt workflow.
- Requires an explicit human review action before the proposal is treated as HUMAN_REVIEWED.
- Equal-distribution or other conceptual assumptions remain visible and are accepted only by the explicit review action.

### V3 — Drawing ↔ Conversation Editing
- Accepts deterministic human edit commands for dimensions, selected field roles/opening direction, PRELUDE 60 profile codes, glazing, finish and handle text.
- Every applied command changes only a candidate Product Intent.
- Every applied edit invalidates the previous conceptual drawing review.
- Unsupported commands fail closed with NEEDS_CLARIFICATION.

### V4 — Real Profile Construction Preparation
- Uses the existing AI04 editable-constructor handoff only after V2 human review.
- Shows explicit profile roles FRAME / SASH / MULLION.
- For PRELUDE 60, exposes the human-confirmed working semantics already present in PROFILE DATA V1:
  - 482.30 FRAME: 64 mm working dimension / 42 mm visible width
  - 482.05 SASH: 78 mm working dimension / 56 mm visible width
  - 482.21 MULLION: 84 mm working dimension / 40 mm visible width
- Missing codes are shown as human-confirmation candidates only; automatic profile selection remains forbidden.
- Constructor handoff remains an explicit human action and creates an editable simulation draft only.

### V5 — Production Validation Gate
- Integrated into the same user workflow UI.
- Intentionally LOCKED in this checkpoint.
- Reports concrete blockers instead of pretending that knowledge coverage equals production validation.
- Requires future validated engineering rules, manufacturer assembly compatibility, exact joint geometry, production deductions and manufacturing tolerances.

### V6 — Manufacturing Handoff Gate
- Integrated into the same user workflow UI.
- Intentionally LOCKED in this checkpoint.
- Future target vocabulary: DWG / DXF / MACHINE_JOB.
- No manufacturing export, machine API call, machine connectivity or machine-ready status is enabled.

## State / invalidation
- The V2–V6 milestone state is stored in the FacadeFlow AI job/session state, not only local component state.
- Changing the source description clears V1 and V2–V6 derived state.
- Updating V1 clarification state clears V2–V6 derived state so stale drawing/profile decisions cannot survive changed intent.

## Safety invariants

- AUTOMATIC PROFILE SELECTION = NO
- AUTOMATIC GEOMETRY ACCEPTANCE = NO
- EXACT PROFILE CONTOUR APPLIED = NO
- MANUFACTURER ASSEMBLY COMPATIBILITY VALIDATED = NO
- PRODUCTION DEDUCTIONS APPLIED = NO
- MANUFACTURING TOLERANCE APPLIED = NO
- RULES VALIDATED = NO
- PRODUCTION COMPATIBILITY VALIDATED = NO
- PRODUCTION UNLOCK = NO
- AUTOMATIC MANUFACTURING EXPORT = NO
- MACHINE CONNECTIVITY = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO

## Acceptance target

The visible user journey is now one continuous route:

`normal human prompt → V1 clarification → V2 conceptual drawing → V3 conversational correction → V2 re-review → V4 explicit editable-constructor preparation → V5 locked production validation → V6 locked manufacturing handoff`

V5 and V6 are considered successfully implemented when the application exposes their real blockers and remains fail-closed, not when it unlocks production without authoritative data.
