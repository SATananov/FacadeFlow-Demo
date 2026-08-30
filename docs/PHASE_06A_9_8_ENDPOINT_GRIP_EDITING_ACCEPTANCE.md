# PHASE 06A.9.8 — Endpoint Grip Editing / Move Line Geometry

Status: **HUMAN + AUTOMATED ACCEPTANCE REQUIRED**

## Purpose

Phase 06A.9.8 extends the accepted session-only Line selection foundation from Phase 06A.9.7 with direct endpoint-grip editing inside the 2D CAD-like workbench.

The operator can drag either endpoint of a selected helper Line. The drag uses the same model-space coordinates and accepted GRID snap policy as Line creation, but remains completely separate from structured product geometry.

## Included

- the two endpoint grips of a selected Line are draggable in `Избор` mode;
- grips use SVG pointer capture so a drag remains stable when the pointer leaves the small grip target;
- the selected Line shows a live ephemeral preview while an endpoint is being moved;
- active grip receives a distinct drag visual;
- drag preview uses the current GRID step when snap is enabled;
- drag commit uses the same GRID snap policy;
- a completed endpoint drag creates **one Line-history operation only**;
- `Отмени линия` / `Повтори линия` undo and redo the entire endpoint move as one action;
- stable Line ID and monotonic `nextId` are preserved;
- a drag that would collapse the Line to zero length is rejected by the existing Line mutation boundary;
- no-op endpoint drags create no history entry;
- `Escape` during an active drag cancels the transient drag without committing it;
- pointer cancellation also cancels the transient drag;
- entering Line mode or invoking Line undo/redo clears any transient drag state;
- existing numeric Line properties remain available after the drag completes.

## Not included

- dragging the entire Line by its body;
- move, rotate, scale or copy commands;
- midpoint/intersection/endpoint object snaps beyond the existing GRID snap mode;
- orthogonal mode or polar tracking;
- rectangle/polyline/circle/arc tools;
- trim/extend/offset commands;
- product-field drag editing;
- frame/divider/sash geometry drag editing;
- hardware, hinge or handle placement;
- production formulas or tolerances;
- persistence of helper Lines;
- machine export or production export changes;
- backend/network changes.

## Safety / history boundary

Endpoint dragging remains a **session-only helper-Line operation**.

During pointer movement, only transient UI drag state changes. Line history is not written continuously.

Only pointer release may create one Line-history entry, and only when the resulting endpoint is a valid non-zero-length change.

Endpoint dragging:

- does **not** call product `onCommit`;
- does **not** mutate `CustomProduct` geometry;
- does **not** call structured product geometry functions;
- does **not** change human-review state;
- does **not** enter product history;
- does **not** enter simulation export;
- does **not** persist to local storage, backend or network.

## Pointer / cancellation boundary

The grip captures the active pointer on pointer-down. Pointer move updates only the ephemeral preview. Pointer-up releases capture and attempts one snapped commit.

Pointer cancel clears the transient drag.

`Escape` while dragging clears the transient drag first. A later pointer-up from that cancelled gesture must not commit because the parent drag token is no longer active.

## Automated acceptance

Run:

```powershell
npm run test:phase06a9_3
npm run test:phase06a9_4
npm run test:phase06a9_5
npm run test:phase06a9_6
npm run test:phase06a9_7
npm run test:phase06a9_8
npm run lint
npm run build
```

Required results: all PASS.

## Human browser audit

1. Open the custom product 2D workbench and draw at least two helper Lines.
2. Switch to `Избор`, select one Line and confirm both endpoint grips are visible.
3. Drag the start grip; confirm only the start endpoint moves while the end endpoint stays fixed.
4. Drag the end grip; confirm only the end endpoint moves while the start endpoint stays fixed.
5. With GRID snap enabled, set a visible grid step and drag an endpoint between grid points; confirm the live endpoint preview snaps to the grid.
6. Release the pointer and confirm the endpoint stays on the snapped coordinate.
7. Confirm the Line ID in the properties rail does not change after dragging.
8. Confirm the numeric X1/Y1/X2/Y2 values and calculated length/angle reflect the final dragged geometry.
9. Press `Отмени линия` once; confirm the **whole drag** is undone in one action, not in many small pointer-move steps.
10. Press `Повтори линия` once; confirm the whole drag returns in one action.
11. Start dragging an endpoint, move it clearly, press `Escape` before releasing, then release; confirm the original Line geometry remains unchanged.
12. Drag one endpoint exactly onto the opposite endpoint and release; confirm the zero-length Line is rejected and the previous valid geometry remains.
13. Click and release a grip without changing its coordinate; confirm no extra Line undo step is created.
14. Activate `Линия`; confirm existing endpoint grips are not draggable while the Line tool is active.
15. Confirm product verification state, product undo/redo, frame/divider/sash geometry and field selection semantics remain unchanged by endpoint dragging.
16. Confirm the only export remains `Експортирай custom simulation JSON` and helper Lines still do not enter the export.

## Acceptance boundary

PASS means a selected session-only helper Line can have either endpoint directly repositioned with stable pointer capture, current GRID snap, cancellation protection and one-step Line undo/redo, while structured product geometry and all production/export boundaries remain unchanged.
