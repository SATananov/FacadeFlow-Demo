# AI PROMPT KNOWLEDGE CORPUS 07 — Stateful Module Geometry Commands

Status: **WORKING ACCEPTANCE / NOT CLOSED / NOT COMMITTED**

## Goal

Model the real module-by-module workflow described by Trifon after Offer defaults are known:

**Module quantity → frame size → divider commands → Cell IDs → sash placement → updated state after every command**

Corpus 07 is a deterministic **simulation/draft state layer**. It does not grant production geometry authority.

## Stable / sparse Cell ID rule

Cell numbers are persistent IDs, not display positions.

When an active cell is divided:

1. that cell is retired and its ID is never reused;
2. all other active cells keep their existing IDs;
3. newly created cells receive new monotonically increasing IDs;
4. numbering may therefore be sparse (for example active cells `1, 3, 4` after Cell 2 is divided);
5. later commands target the current active Cell ID explicitly.

This directly supports commands such as `place a divider in Cell 3` or `put a sash in Cell 5` without renumbering unrelated cells.

## Corpus

Exactly 200 unique synthetic/private-safe prompts:

- 50 `MODULE_FRAME_QUANTITY`
- 50 `EXPLICIT_DIVIDER_STABLE_IDS`
- 50 `EQUAL_SPLIT_COMPUTED`
- 50 `CELL_TARGET_AND_AMBIGUITY_SAFETY`

## Required behavior

1. Every module can carry a quantity.
2. Frame width/height initializes the draft module and initial Cell 1.
3. Explicit vertical/horizontal divider commands split only the addressed active cell.
4. A divided cell is retired; sibling cells keep their IDs.
5. `split into three equal vertical parts` computes deterministic draft positions (e.g. 2100 mm → 700 / 700 / 700).
6. Sash commands require an active Cell ID and preserve opening/direction semantics.
7. `put a sash there` without an explicit target is unresolved and is not guessed.
8. A reference to a retired Cell ID is unresolved and is not reused.
9. A state snapshot is recorded after every command so the UI can later render the current module state step by step.

## Safety boundary

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

Equal-split arithmetic is deterministic draft math only. It is **not** machine-ready production geometry.

## Phase boundary

- AI05.3 remains **WORKING / NOT CLOSED**.
- PROFILE DATA 03 remains **WORKING / NOT CLOSED**.
- Corpus 01–07 remain **WORKING / NOT COMMITTED**.
- No commit / no push is performed by this package.
