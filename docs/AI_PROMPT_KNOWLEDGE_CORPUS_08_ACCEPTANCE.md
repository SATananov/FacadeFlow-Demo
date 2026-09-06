# AI PROMPT KNOWLEDGE CORPUS 08 — Stateful Module Corrections

Status: **WORKING ACCEPTANCE / NOT CLOSED / NOT COMMITTED**

## Purpose

Corpus 08 extends the verified module geometry language from Corpus 07 with safe stateful corrections while preserving stable/sparse Cell IDs.

Core rule confirmed from the real fabrication workflow:

> A cell keeps its Cell ID while it remains the same addressable cell. There is no global renumbering. Structural replacement retires the affected Cell IDs and allocates new IDs only for newly created cells.

This layer remains simulation/draft only. It does not validate production rules and does not grant machine readiness.

## 200 prompt cases

- 50 `MOVE_DIVIDER_STABLE_IDS`
- 50 `DELETE_DIVIDER_STRUCTURAL_IDS`
- 50 `UNDO_RESTORES_VISIBLE_STATE`
- 50 `SASH_CORRECTION_RETARGET_SAFETY`

## Deterministic behavior under test

### Move divider

Moving a divider changes the adjacent draft geometry but does **not** globally renumber cells and does not replace the two adjacent Cell IDs.

Example:

- active cells before move: `2, 3`
- move divider 1 from 700 mm to 800 mm
- active cells after move: `2, 3`

### Delete divider

Deleting a divider is a structural merge. The two child cells affected by the removed divider are retired and one new merged cell receives the next Cell ID.

Example:

- active cells before delete: `2, 3`
- delete divider 1
- retired: `1, 2, 3`
- new active cell: `4`

Unrelated active cells are never renumbered.

### Undo

Undo restores the immediately previous visible module state, including its stable Cell IDs and divider geometry. ID allocation remains monotonic so an ID exposed by a later reverted draft is not silently recycled during the same correction session.

### Sash correction / retarget

A sash can be changed in a specifically addressed active cell or moved from one explicitly named active Cell ID to another. The Cell IDs themselves remain unchanged.

Ambiguous references such as `премести крилото там` and references to retired cells are rejected into Human Review with no state mutation.

## Immediate state refresh

Every correction command creates a correction snapshot suitable for immediate UI refresh after the command.

## Safety boundary

Always preserved:

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

## Working boundaries

- AI05.3: **WORKING / NOT CLOSED**
- PROFILE DATA 03: **WORKING / NOT CLOSED**
- Corpus 01–08: **WORKING / NOT COMMITTED**
- No commit / no push performed by this package.

## Expected test boundary after apply

- Total test files: **152**
- Internal excluded: **19**
- Shareable regression: **133**
