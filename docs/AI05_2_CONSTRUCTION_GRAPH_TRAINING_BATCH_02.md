# AI05.2 — Construction Graph Training Batch 02

## Goal

Teach the current local deterministic interpretation layer to turn common human construction language into an explicit **semantic construction graph** before any exact drawing or production calculation is attempted.

AI05.2 is deliberately not a production phase. It does not calculate cut lengths, deductions, tolerances, machining operations, or machine files.

## New semantic graph

`src/aiConstructionGraph.ts` converts `FacadeFlowProductIntent` into a reviewable graph:

- `FRAME` is the outer structural role.
- each logical field becomes a `FIELD` node;
- every openable/sliding field contains a semantic `SASH` child;
- in a linear multi-field description, a semantic `MULLION` is proposed between adjacent fields;
- exact divider position is **not** invented when the source does not provide it;
- exact profile references are copied only when they were explicitly present in the intent.

Example:

`FIXED | OPENABLE | FIXED`

becomes:

`FRAME -> FIXED_FIELD -> MULLION -> OPENABLE_FIELD>SASH -> MULLION -> FIXED_FIELD`

This graph is a construction-language representation, not accepted CAD geometry.

## Prompt hardening

The local interpreter additionally understands ordinal field references such as:

- `първото фиксирано`
- `второто отваряемо`
- `третото фиксирано`
- `четвъртото отваряемо`
- paired forms such as `първото и четвъртото фиксирани`

English `first` through `sixth` are supported by the same deterministic mapping.

## Training corpus

Batch 02 contains 10 synthetic/private-safe reductions of common construction patterns:

- one fixed field;
- one openable field;
- two-field FIX/OPEN and OPEN/FIX;
- three-field FIX/OPEN/FIX and OPEN/FIX/OPEN;
- four-field ordinal mixtures;
- paired ordinal descriptions;
- tilt-turn middle field;
- sliding middle field represented semantically only.

No client identity or verbatim private project text is tracked in the corpus.

## Safety boundary

AI05.2 keeps all existing safety boundaries:

- `HUMAN REVIEW = YES`
- `AUTOMATIC GEOMETRY = NO`
- `EXACT PRODUCTION GEOMETRY = NO`
- `RULES VALIDATED = NO`
- `MACHINE READY = NO`
- `PRODUCTION APPROVED = NO`

A system name such as `PRELUDE 60` does **not** infer exact profile codes. Explicit profile references may be preserved, but are not production approval.

## Acceptance

- graph corpus evaluation: 10/10 expected;
- ordinal field language mapped deterministically;
- `N` linear fields produce `N-1` semantic mullions for review;
- fixed fields never receive a sash node;
- openable/sliding fields receive a semantic sash node;
- no exact profile inference from system name alone;
- no production or machine unlock.
