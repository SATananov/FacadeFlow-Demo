# AI Prompt Knowledge Corpus 16 — Offer Completeness + Human Review Gate

Status: **WORKING / NOT COMMITTED**

## Goal

Add a deterministic, read-first completeness layer on top of Corpus 15 so an offer can show which modules are incomplete, which are ready for Human Review, and which have been explicitly Human Confirmed.

This layer does **not** validate production rules and does **not** authorize machine output.

## Required completeness fields per module

1. Frame dimensions
2. Quantity
3. Profile system
4. Finish / colour
5. Glazing
6. Hardware
7. Opening disposition: at least one explicit sash/opening or explicit fixed disposition
8. Valid current geometry draft

A module is `READY_FOR_HUMAN_REVIEW` only when all eight checks are complete and the current module draft is not in `REVIEW_REQUIRED` state.

## Human Review Gate

- `Потвърди Модул N` is accepted only when Module N is complete.
- `Потвърди всички готови модули` confirms only complete modules.
- Human Confirm stores a fingerprint of the exact reviewed module state.
- Any later effective change in quantity, settings or geometry invalidates the affected module confirmation.
- An ambiguous command that produces no mutation does not erase a valid confirmation.
- Offer-wide revisions invalidate only modules whose effective reviewed state actually changes. A module-local override that keeps the effective value unchanged remains confirmed.

## Corpus tracks

- 50 `COMPLETE_READY_FOR_REVIEW`
- 50 `INCOMPLETE_FIELD_DISCOVERY`
- 50 `HUMAN_CONFIRM_GATE`
- 50 `CONFIRMATION_INVALIDATION_SAFETY`
- Total: **200 cases**

## Safety boundary

Even when every module is `HUMAN_CONFIRMED`:

- `HUMAN REVIEW REQUIRED = YES`
- `RULES VALIDATED = NO`
- `AUTOMATIC GEOMETRY = NO`
- `SIMULATION ONLY = YES`
- `MACHINE READY = NO`
- `PRODUCTION APPROVED = NO`

Human Confirm in Corpus 16 means only that the current draft was explicitly reviewed at this gate. It is not a production unlock.

## Expected repository boundary after apply

- Total `tests/*.test.ts`: **160**
- Internal excluded `*.internal.test.ts`: **19**
- Shareable test files: **141**

AI05.3 and PROFILE DATA 03 remain open working layers. No commit and no push are part of Corpus 16.
