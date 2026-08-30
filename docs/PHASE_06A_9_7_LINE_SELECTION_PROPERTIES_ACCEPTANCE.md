# PHASE 06A.9.7 — Line Selection + Properties Foundation

Status: **HUMAN + AUTOMATED ACCEPTANCE REQUIRED**

## Purpose

Phase 06A.9.7 makes the accepted session-only Line geometry from Phase 06A.9.5 selectable and numerically inspectable/editable inside the Phase 06A.9.6 CAD-like workbench.

This is intentionally a **selection/properties foundation**, not a new production geometry system.

## Included

- `Избор` mode can select an existing custom drawing Line by clicking a widened transparent hit target;
- selected Line receives a distinct highlight and visible endpoint grips;
- the right properties rail switches from field properties to Line properties while a Line is selected;
- Line properties show stable Line ID, X1/Y1/X2/Y2, calculated length in mm and angle in degrees;
- explicit `Приложи координатите` updates both endpoints only when all coordinates are finite and the Line remains non-zero-length;
- `Изтрий линията` removes the selected Line;
- `Delete` / `Backspace` removes a selected Line when keyboard focus is not inside an input/select/textarea/contenteditable control;
- `Escape` clears Line selection in Select mode;
- entering Line mode clears Line selection;
- selecting a product field clears Line selection and restores the existing field properties panel;
- Line update/delete operations enter the existing **Line history only**, so `Отмени линия` / `Повтори линия` cover create, edit and delete;
- Line IDs and `nextId` remain stable across edits/deletes.

## Not included

- endpoint dragging;
- line move/rotate commands;
- rectangle/polyline/circle/arc tools;
- trim/extend/offset commands;
- endpoint/midpoint/intersection/perpendicular object snaps;
- constraints, orthogonal mode or polar tracking;
- product-field numeric X/Y editing;
- sash hardware editing, hinge placement or handle placement;
- production hardware spacing formulas;
- persistence of helper Lines;
- machine export or production export changes;
- backend/network changes.

## Safety / history boundary

Custom drawing Lines remain a separate session-only drafting layer.

Line selection, numeric Line properties, edit and delete:

- do **not** call product `onCommit`;
- do **not** call structured product geometry mutation functions;
- do **not** change human-review status;
- do **not** enter product history;
- do **not** enter simulation export;
- do **not** persist to local storage, backend or network.

Only the existing Line history changes.

## Interaction boundary

The visible Line remains a thin SVG stroke. Selection uses a wider transparent hit stroke so the operator can reliably click a Line without changing its visual thickness.

The hit stroke is available only in Select mode. While Line mode is active, Line geometry remains non-interactive so the two-click Line command keeps its accepted behavior.

## Automated acceptance

Run:

```powershell
npm run test:phase06a9_3
npm run test:phase06a9_4
npm run test:phase06a9_5
npm run test:phase06a9_6
npm run test:phase06a9_7
npm run lint
npm run build
```

Required results: all PASS.

## Human browser audit

1. Open the custom product 2D workbench.
2. Draw at least two Lines with the existing Line tool.
3. Switch to `Избор` and click one Line.
4. Confirm only that Line is highlighted and its two endpoint grips are visible.
5. Confirm the right rail says `Избрана линия` and shows the stable Line ID.
6. Confirm X1/Y1/X2/Y2 match the Line endpoints and length/angle are shown.
7. Change one numeric endpoint and press `Приложи координатите`; confirm the Line updates.
8. Try equal start/end coordinates; confirm apply is blocked and the zero-length warning appears.
9. Press `Отмени линия`; confirm the numeric edit is undone. Press `Повтори линия`; confirm it returns.
10. Select the Line and press `Delete`; confirm it is removed. Undo/redo the deletion.
11. Select a Line, focus one of its numeric inputs and press Backspace; confirm text editing does not delete the Line.
12. Select a Line and press Escape; confirm only Line selection is cleared.
13. Select a Line, then click a product field; confirm field properties return.
14. Activate `Линия`; confirm existing Lines are not selectable while placing the new Line.
15. Confirm product verification state, product undo/redo and product field geometry are unchanged by Line edits.
16. Confirm the only export remains `Експортирай custom simulation JSON` and helper Lines are not added to it.

## Acceptance boundary

PASS means the operator can select, inspect, numerically edit and delete session-only helper Lines with their own undo/redo history, while product geometry, production semantics and export safety remain unchanged.
