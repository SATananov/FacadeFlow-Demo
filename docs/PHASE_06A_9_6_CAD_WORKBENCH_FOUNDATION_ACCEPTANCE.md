# PHASE 06A.9.6 — CAD Workbench Foundation

Status: **HUMAN + AUTOMATED ACCEPTANCE REQUIRED**

## Purpose

Phase 06A.9.6 turns the accepted Phase 06A.9.5 desktop workbench into a clearer CAD-like drafting environment without turning the product model into unrestricted CAD geometry.

## Included

- lower-left product origin remains canonical `0,0`; positive Y is upward;
- minor coordinate grid remains controlled by the existing 10 / 25 / 50 / 100 mm steps;
- major grid is visual only and is calculated as five minor-grid cells;
- explicit X/Y axes and origin marker;
- zoom-aware top and left millimetre rulers;
- crosshair cursor with optional local X/Y badge;
- compact CAD status bar: active tool, grid, snap, X/Y and zoom;
- explicit `Избор` / `Линия` tool state;
- view-only switches for major grid, axes, rulers and coordinate badge;
- current Line Tool, GRID snap, undo/redo and zero-length rejection remain unchanged;
- existing desktop workbench layout remains: tools left, drawing centre, properties right.

## Not included

- endpoint / midpoint / intersection / perpendicular object snaps;
- rectangle, polyline, trim, extend, move or rotate tools;
- line selection or numeric line editing;
- sash hardware editing, hinge placement or handle placement;
- production hardware spacing formulas;
- machine export or production export changes;
- persistence, backend or network changes.

Hardware controls are intentionally deferred to later structured phases after selection/properties foundations.

## Layering boundary

Drafting aids are pointer-transparent visual layers. They do not call product geometry mutation functions, do not enter product history, and do not enter Line history. Zoom and display switches are viewport state only.

Conceptual 2D order:

1. drafting background / minor grid;
2. major grid;
3. axes / origin;
4. product geometry;
5. custom Line geometry;
6. dimensions and snap marker;
7. rulers and crosshair.

The HTML CAD status bar sits outside SVG model coordinates.

## Automated acceptance

Run:

```powershell
npm run test:phase06a9_3
npm run test:phase06a9_4
npm run test:phase06a9_5
npm run test:phase06a9_6
npm run lint
npm run build
```

Required results: all PASS.

## Human browser audit

1. Open the custom product 2D workbench on desktop.
2. Confirm the drawing remains the dominant centre workspace.
3. Confirm `0,0` is visibly anchored to the lower-left product corner.
4. Confirm X points right and Y points upward.
5. With 50 mm grid, confirm a stronger major line occurs every five minor cells (250 mm).
6. Change grid step and confirm the major grid follows five cells.
7. Confirm top and left rulers show millimetre values and remain readable while zooming.
8. Move the pointer and confirm the crosshair and X/Y readout follow it.
9. With GRID snap enabled, confirm the crosshair/readout uses the snapped coordinate; with snap disabled it follows raw rounded model coordinates.
10. Toggle major grid, axes, rulers and coordinate badge independently.
11. Confirm the bottom CAD status bar reports tool, grid, snap, coordinates and zoom.
12. Run Line: first click, live preview, second click, Undo, Redo, Escape and zero-length rejection.
13. Confirm existing field selection and right-side properties still work.
14. Confirm no new manufacturing or machine export option appears.

## Acceptance boundary

PASS means CAD-like drafting assistance is usable and does not change product geometry semantics, manufacturing semantics or export safety boundaries.


## CAD visibility refinement

The accepted visual target requires the drafting aids to remain obvious at normal desktop fit: the product fills are intentionally translucent inside the workbench, minor and major grids remain readable through the product area, ruler bands are visually distinct, `0,0` has an explicit badge/cross, and the active cursor gets full-span guide lines plus the local crosshair. These remain pointer-transparent view layers only.

## Grid + rulers render fix

The CAD grid now renders as explicit SVG line geometry rather than URL-referenced SVG patterns. This prevents browser pattern-resolution or duplicate-ID behaviour from making the grid disappear. Rulers are anchored directly around the product drawing bounds (top and left), where the operator can read them while working, and fixed X/Y axes render above product fills while remaining below Line geometry. These are still pointer-transparent display aids only.

## Workbench grid + ruler layer fix

The final 06A.9.6 rendering architecture no longer relies on CAD grid/ruler elements living inside the product SVG paint order. The drawing stage now contains three synchronized 820×560 layers: a pointer-transparent workbench grid SVG, the interactive product SVG, and a pointer-transparent guide SVG for rulers/axes/origin. All three share the same model transform and zoom container.

This separation is intentional: product fills cannot hide the grid, and product geometry cannot hide the fixed top/left rulers. The grid remains behind product geometry with translucent field fills; axes and rulers remain above product geometry. No layer mutates product geometry, Line history, export state, persistence or network state.

Manual acceptance for this fix additionally requires that the operator can see the minor grid and stronger major grid at 100% fit before selecting a tool, and that the top/left ruler strips remain visible even when the product itself is selected.
