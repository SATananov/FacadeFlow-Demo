# AI PROMPT KNOWLEDGE CORPUS 10 — Live Module Command Preview State Foundation

Status: **WORKING ACCEPTANCE / NOT COMMITTED / NOT CLOSED**

## Purpose

Corpus 10 turns the already verified sequential module-command state from Corpus 09 into a deterministic, UI-ready preview timeline. It does **not** grant production geometry authority and does **not** wire automatic machine output.

After every command the preview layer exposes a complete current frame containing:

- module number and quantity;
- frame size;
- active cells with stable/sparse Cell IDs and `Клетка N` labels;
- cell bounds in millimetres and normalized percentages for rendering;
- sash presence, opening type and direction per active cell;
- divider IDs, orientation and current position;
- retired Cell IDs;
- whether the latest command was applied or requires Human Review;
- whether the visible state changed.

## Corpus

Exactly 200 unique sequential preview cases, split equally:

1. `FRAME_EQUAL_SPLIT_LIVE_PREVIEW` — 50
2. `MOVE_STABLE_IDS_LIVE_PREVIEW` — 50
3. `DELETE_UNDO_LIVE_PREVIEW` — 50
4. `AMBIGUOUS_NO_MUTATION_LIVE_PREVIEW` — 50

## Locked Cell-ID behaviour

Cell IDs are stable while a cell remains structurally unchanged. Moving a divider or changing a sash does not renumber active cells. A structural split or merge retires only the affected cells and allocates new IDs. Undo restores the prior visible Cell IDs.

## Safety

An unresolved command produces a `REVIEW_REQUIRED` preview frame with no guessed mutation. The preview can continue after a later explicit command, but every frame remains simulation/draft state requiring Human Review.

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

## Boundaries

- AI05.3 remains **WORKING / NOT CLOSED**.
- PROFILE DATA 03 remains **WORKING / NOT CLOSED**.
- Corpus 01–10 remain **WORKING / NOT COMMITTED**.
- No commit or push is part of this layer.
