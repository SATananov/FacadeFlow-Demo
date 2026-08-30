# PHASE 06A.9.9 — Move Whole Line / Drag Selected Line

Status: **HUMAN + AUTOMATED ACCEPTANCE REQUIRED**

## Purpose

Phase 06A.9.9 extends the accepted session-only Line editing foundation from Phase 06A.9.8 with direct translation of an already selected helper Line by dragging its body in the 2D CAD-like workbench.

The move is a pure translation: both endpoints receive the same delta, so Line length and angle are preserved. The operation remains completely separate from structured product geometry.

## Included

- a helper Line must already be selected before its body can be dragged;
- the wide invisible Line hit-stroke becomes the move handle for the selected Line in `Избор` mode;
- body drag uses SVG pointer capture so movement remains stable when the pointer leaves the hit-stroke;
- the selected Line and both endpoint grips move together in a live ephemeral preview;
- the Line ID remains stable;
- Line length and angle remain unchanged by whole-Line movement;
- GRID snap quantizes the **translation delta** to the current grid step when snap is enabled;
- delta snapping preserves any existing endpoint offset and never reshapes the Line;
- with snap disabled, the model-space pointer delta is used directly;
- a completed body drag creates **one Line-history operation only**;
- `Отмени линия` / `Повтори линия` undo and redo the complete translation as one action;
- no-op drags create no history entry;
- `Escape` during an active body drag cancels the transient preview without committing;
- pointer cancellation also cancels the transient body drag;
- endpoint-grip editing from Phase 06A.9.8 remains available and separate;
- entering Line mode or invoking Line undo/redo clears any transient body drag.

## Not included

- rotation, scaling or mirroring;
- copy/array commands;
- multi-selection or group move;
- midpoint/intersection/perpendicular/object snaps beyond the accepted GRID snap mode;
- orthogonal mode or polar tracking;
- rectangle/polyline/circle/arc tools;
- trim/extend/offset commands;
- moving structured product fields, frame, divider or sash geometry;
- hardware, hinge or handle placement;
- persistence of helper Lines;
- production formulas or tolerances;
- machine export or production export changes;
- backend/network changes.

## Translation / snap boundary

Whole-Line movement is calculated from the model-space pointer position captured on pointer-down.

When GRID snap is enabled, the raw movement delta is rounded independently on X and Y to the current grid step. The same snapped delta is applied to both endpoints.

This means:

- the Line is translated only;
- its vector `(X2-X1, Y2-Y1)` is unchanged;
- its length and angle are unchanged;
- a Line created or numerically edited off-grid does not jump into a different shape.

## Safety / history boundary

Whole-Line dragging remains a **session-only helper-Line operation**.

During pointer movement, only transient UI drag state changes. Line history is not written continuously.

Only pointer release may create one Line-history entry, and only when the snapped translation delta is non-zero.

Whole-Line dragging:

- does **not** call product `onCommit`;
- does **not** mutate `CustomProduct` geometry;
- does **not** call structured product geometry functions;
- does **not** change human-review state;
- does **not** enter product history;
- does **not** enter simulation export;
- does **not** persist to local storage, backend or network.

## Pointer / cancellation boundary

The selected Line hit-stroke captures the active pointer on pointer-down. Pointer move updates only the ephemeral translation preview. Pointer-up releases capture and attempts one translation commit.

Pointer cancel clears the transient drag.

`Escape` while dragging clears the transient body-drag token first. A later pointer-up from that cancelled gesture cannot commit because the parent drag token is no longer active.

Endpoint grips remain higher-priority direct-edit handles: dragging a grip continues to move only that endpoint and does not start a body translation.

## Automated acceptance

Run:

```powershell
npm run test:phase06a9_3
npm run test:phase06a9_4
npm run test:phase06a9_5
npm run test:phase06a9_6
npm run test:phase06a9_7
npm run test:phase06a9_8
npm run test:phase06a9_9
npm run lint
npm run build
```

Required results: all PASS.

## Human browser audit — 16 points

1. Open the custom product 2D workbench and draw at least two helper Lines.
2. In `Избор`, click one Line once and confirm it becomes selected with both endpoint grips visible.
3. Drag the **body** of the selected Line, not a grip; confirm the entire Line moves in live preview.
4. Confirm both endpoint grips move together with the Line body during preview.
5. Release the pointer and confirm both endpoints remain at the translated positions.
6. Confirm the Line ID in the properties rail is unchanged after the move.
7. Confirm Line length and angle before/after the whole-Line move are unchanged.
8. Confirm X1/Y1 and X2/Y2 all change by the same X/Y translation delta.
9. With GRID snap enabled at a visible step (for example 50 mm), drag the Line by a non-grid amount; confirm the translation occurs in grid-step increments and the Line shape is preserved.
10. Turn snap off and confirm a body drag can use a non-grid model-space translation.
11. Press `Отмени линия` once; confirm the **whole drag** is undone in one action.
12. Press `Повтори линия` once; confirm the whole drag returns in one action.
13. Start a body drag, move clearly, press `Escape` before releasing, then release; confirm the original geometry remains unchanged.
14. Click/press and release the selected Line body without an effective movement; confirm no extra Line undo step is created. Also confirm endpoint-grip editing still moves only one endpoint.
15. Activate `Линия`; confirm existing Line bodies cannot be dragged, and confirm product verification state, product undo/redo and frame/divider/sash geometry are unchanged by Line movement.
16. Confirm the only export remains `Експортирай custom simulation JSON` and helper Lines still do not enter the export.

## Acceptance boundary

PASS means an already selected session-only helper Line can be translated directly by dragging its body with stable pointer capture, delta-based GRID snap, cancellation protection and one-step Line undo/redo, while preserving Line identity/shape and all structured product and production/export boundaries.
