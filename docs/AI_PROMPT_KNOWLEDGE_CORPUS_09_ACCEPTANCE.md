# AI PROMPT KNOWLEDGE CORPUS 09 — Sequential Command Session / Conversational State

Status: **WORKING ACCEPTANCE / NOT CLOSED / NOT COMMITTED**

## Purpose

Corpus 09 validates whole multi-turn module-construction sessions rather than isolated commands. Every command is evaluated against the visible state produced by all previous commands, and every turn emits an immediate state snapshot suitable for UI refresh.

The layer reuses the already verified Corpus 07 module geometry interpreter and Corpus 08 correction interpreter. It does not change their deterministic rules.

## Core workflow under test

A realistic session can now follow this shape:

1. define module number, quantity and frame size;
2. split or add dividers;
3. address the resulting stable/sparse Cell IDs;
4. place a sash in an exact active cell;
5. correct sash or divider state;
6. Undo a previous correction;
7. continue issuing new commands against the restored visible state;
8. reject ambiguous or retired targets without guessed mutation.

## 200 sequential sessions

- 50 `SEQUENTIAL_BUILD_VISUAL_STATE`
- 50 `CORRECT_UNDO_CONTINUE`
- 50 `DELETE_UNDO_RETARGET_CONTINUE`
- 50 `AMBIGUOUS_TURN_NO_MUTATION`

Each corpus item contains **6–8 sequential commands**, not one isolated instruction.

## Stable Cell ID rule

A Cell ID remains stable while the same addressable cell continues to exist. There is no global renumbering.

Structural split/replacement retires only the affected Cell ID and allocates new IDs for the new cells. Unrelated cells keep their previous IDs.

## Immediate visual state

Corpus 09 produces one session snapshot after **every command**. A UI can therefore render:

`command -> current module state -> next command`

rather than waiting for a long prompt to finish before showing the result.

## Ambiguity safety

An ambiguous turn such as `премести крилото там`, a divider move without a new position, or a correction addressed to a retired cell:

- is not guessed;
- does not mutate the visible module state;
- is recorded as unresolved for Human Review;
- does not prevent a later explicit command from being evaluated safely.

## Safety boundary

Always preserved:

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

This remains a deterministic simulation/draft interpreter. It is not production geometry approval.

## Working boundaries

- AI05.3: **WORKING / NOT CLOSED**
- PROFILE DATA 03: **WORKING / NOT CLOSED**
- Corpus 01–09: **WORKING / NOT COMMITTED**
- No commit / no push performed by this package.

## Expected test boundary after apply

- Total test files: **153**
- Internal excluded: **19**
- Shareable regression: **134**
