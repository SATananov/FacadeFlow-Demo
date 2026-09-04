# PROFILE DATA 01.2A V8 — N-field Effective Geometry Integrity Hardening

Status: **IMPLEMENTED — REQUIRES CANONICAL `npm run verify` + HUMAN VISUAL AUDIT BEFORE COMMIT/CLOSURE**

Source checkpoint: `071355d`

## Purpose

This slice hardens the existing PRELUDE 60 Visual Composer bridge after an independent checkpoint audit found two reachable integrity defects:

1. the 3-field window used exact field ratios (`1/3`, `2/3`) but rounded divider display strings (`33.33%`, `66.67%`) as geometry input, so sash adjacency could fail and a 40 mm mullion could remain unreduced instead of using the working 7 mm overlap on each adjacent sash side;
2. the registered PRELUDE overlap could resolve even when no explicit sash profile was selected.

The slice also prevents PRELUDE 482.05, currently confirmed only as the window `SASH` bridge, from being treated as a compatible door sash. Catalogue-only 482.26 / 482.27 remain unresolved and are **not** promoted into the application selector.

## Implemented changes

### Canonical divider geometry

- Template dividers now carry a numeric `positionRatio` used by effective geometry.
- `placement` remains presentation text only.
- Triple window uses exact `1 / 3` and `2 / 3` ratios while preserving `33.33%` / `66.67%` as display labels.
- Effective profile geometry rejects template dividers without a valid canonical numeric ratio instead of parsing display text.

### Explicit sash eligibility

- `resolveActiveProfileSystemOverlap()` requires an explicit selected `SASH` before returning `APPLIES`.
- Frame-only and frame+mullion PRELUDE selections return `SASH_REQUIRED` with no overlap value.
- Selection IDs must resolve to the role under which they were supplied.
- The deeper effective-geometry builder also requires an explicit `sashProfileCode`, so a caller cannot bypass the resolver and apply sash overlap with no selected sash profile.

### Product-category-aware sash compatibility

- `CatalogueProfile` can declare `compatibleProductCategories`.
- PRELUDE 482.05 is marked `WINDOW` only in the current application bridge.
- Structured configuration validation, reconciliation and profile selector options use product-category-aware compatibility.
- PRELUDE 482.26 / 482.27 remain `CATALOG_ONLY_UNMAPPED` and remain absent from selectable application profiles.
- Door DEMO mode remains a separate derived `DEMO SYSTEM` route with unresolved threshold and no mutation of source configuration.

## Regression coverage

`tests/profileData01_2aV8NFieldEffectiveGeometryIntegrity.test.ts` covers:

- exact Triple ratios independent of rounded display labels;
- Double / Triple / Quad all-open PRELUDE geometry at 1200 and 1400 mm width;
- `40 → 26 mm` for every two-sided mullion in those templates;
- Triple open/fixed/open one-sided `40 → 33 mm` mullions;
- missing-sash overlap gate;
- direct effective-geometry missing-sash rejection;
- WINDOW vs DOOR compatibility for PRELUDE 482.05;
- 482.26 / 482.27 remaining non-selectable;
- production and machine safety locks remaining false.

## Safety boundary

This hardening does **not** promote the working 7 mm overlap into production authority.

- `machineReady = false`
- `productionApproved = false`
- automatic profile selection = not allowed
- global fallback overlap = not allowed
- 482.05 effective sash visible geometry = not promoted
- PRELUDE 482.26 / 482.27 door-sash geometry/role mapping = unresolved
- threshold for door source configuration = unresolved

## Closure gate

Do not mark V8 closed only because this document exists. After applying the patch to the repository, run:

```powershell
npm run verify
git diff --check
git status --short
```

Then perform a human visual audit for:

- Double PRELUDE window;
- Triple PRELUDE window;
- Quad PRELUDE window;
- mixed open/fixed Triple;
- confirmed window without selected sash profile (overlap must stay unresolved);
- PRELUDE door selector (482.05 must not be offered as door sash);
- Door DEMO entry (must remain DEMO-only, threshold unresolved, source unchanged).

Only after those checks pass should the slice be committed and a canonical checkpoint ZIP be created.
