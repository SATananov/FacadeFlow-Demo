# AI05.1 — Construction Language Training Batch 01

## Goal

Start training FacadeFlow's current local deterministic AI behavior to understand construction language as functional product semantics, not only drawing primitives.

This batch deliberately does **not** add machine output, production formulas, automatic profile selection, or LLM network calls.

## Construction semantics

The tracked semantic layer distinguishes at minimum:

- FRAME / каса — outer construction boundary.
- MULLION / делител — internal construction profile separating two adjacent fields.
- SASH / крило — movable profile boundary belonging to an openable field.
- FIELD, FIXED_FIELD, OPENABLE_FIELD.
- GLAZING, GLAZING_BEAD, HINGE, HANDLE, THRESHOLD.

The semantics carry no production-formula authority.

## Training corpus policy

The batch uses tracked **synthetic reductions** derived from the real workflow patterns supplied for FacadeFlow. It does not store original private project text, project/client identity, or private document copies in the repository.

The first training scenarios cover:

1. PRELUDE 60 three-field window with middle openable field, fixed edge fields and explicit 482.30 / 482.05 / 482.21 profile codes.
2. Three-field window with fixed edge fields and explicit tilt-turn middle field.
3. One-field door with explicit threshold.
4. Safety case: PRELUDE system name alone must **not** infer exact profile codes.

## Interpreter improvement

AI05.1 hardens two real conversational patterns:

- direct role + profile reference, e.g. `крило 482.05`;
- compound field descriptions, e.g. `лявото и дясното фиксирани` or `крайните фиксирани`.

Generic `отваряемо` remains semantically openable but the exact opening type remains unresolved until the source states it.

## Safety boundary

- HUMAN REVIEW REQUIRED = YES
- RULES VALIDATED = NO
- AUTOMATIC PROFILE SELECTION = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO
