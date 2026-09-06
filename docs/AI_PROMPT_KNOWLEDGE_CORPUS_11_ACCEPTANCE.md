# AI PROMPT KNOWLEDGE CORPUS 11 — Live Preview UI Binding / Module Editor Integration

Status: **WORKING ACCEPTANCE / NOT COMMITTED / NOT CLOSED**

## Purpose

Corpus 11 binds the deterministic live module preview from Corpus 10 into a real, display-only React module editor surface inside the AI workspace.

The integration is intentionally narrow:

- it appears only when the description is recognized as a multi-command module session;
- ordinary single-product free-text descriptions remain on the existing prompt path;
- the UI shows the current frame after every command, stable/sparse Cell IDs, frame dimensions, quantity, sash semantics, divider list and command history;
- a user can visually focus a cell and inspect earlier command frames without changing the underlying module state;
- unresolved commands render `ИЗИСКВА УТОЧНЕНИЕ` and keep the previous visible geometry;
- there is no automatic handoff, rule validation, machine output or production approval.

## Corpus

Exactly 200 UI-binding regression sessions, split equally:

1. `EDITOR_CURRENT_FRAME_BINDING` — 50
2. `EDITOR_STABLE_CELL_BINDING` — 50
3. `EDITOR_TIMELINE_BINDING` — 50
4. `EDITOR_REVIEW_GATE_BINDING` — 50

The 200 sessions intentionally reuse the already verified Corpus 10 sequential scenarios so this layer tests **UI projection and integration**, not a new geometry grammar.

## UI contract

`ModuleCommandLivePreviewPanel` is mounted in the AI description workspace but returns `null` unless the text is a multi-command module session. The panel is read-only with respect to construction state.

It exposes:

- current module and frame size;
- quantity;
- active cells as clickable visual focus targets with stable `Клетка N` labels;
- sash opening/direction labels;
- divider ID/orientation/position list;
- retired Cell IDs;
- unresolved count;
- command timeline with current/historical frame inspection;
- visible Human Review status and locked safety boundary.

## Safety

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

Cell selection and timeline selection are UI-only inspection state. They do not mutate construction geometry.

## Boundaries

- AI05.3 remains **WORKING / NOT CLOSED**.
- PROFILE DATA 03 remains **WORKING / NOT CLOSED**.
- Corpus 01–11 remain **WORKING / NOT COMMITTED**.
- No commit or push is part of this layer.
