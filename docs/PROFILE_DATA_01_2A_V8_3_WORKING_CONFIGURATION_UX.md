# PROFILE DATA 01.2A V8.3 — Working Configuration UX

## Purpose

V8.3 replaces the product-composer idea of a separate user-facing **DEMO mode** with one clear **working configuration** workflow for windows and doors.

The user may start with only the information that is actually known. Missing technical values stay visibly empty and may be added later. This is an editing/access change only; it does not relax technical confirmation, engineering, production or machine safety boundaries.

## User workflow

1. Product category, name and positive overall dimensions are sufficient to continue to the review step and open the working composer.
2. Profile system, frame, sash and mullion may remain empty while the composition is being built.
3. A preselected Double / Triple / Quad topology still auto-loads exactly that topology. Generic entry still opens an empty composer.
4. The right properties rail exposes the same technical-data panel for WINDOW and DOOR so known values can be added without leaving the composer.
5. Unknown values are never replaced with inferred, example or fallback values.
6. A service example profile system may still exist internally for historical regression and test fixtures, but the normal product-composer UX labels it as a **service example**, not as a separate product mode.

## Door behavior

Door composition no longer requires a separate derived `DEMO SYSTEM` configuration before entry. The working composer receives the current structured source configuration directly.

The threshold remains explicitly `UNRESOLVED`. The user may work on topology, opening, infill and hardware, but conceptual review requires an explicit acknowledgement inside the door composer that the threshold is still unresolved and the product is not production-ready.

This does not map or activate PRELUDE 482.26 / 482.27 door-sash catalogue records. PRELUDE 482.05 remains WINDOW-only in the application bridge.

## Glazing / glazing bead boundary

Glazing package and glazing-bead data remain deferred in V8.3. The reviewed example of 20 mm and the common 22 mm observation are not converted into a universal constant. No 20/22 mm value is inserted, inferred or calculated automatically.

The glazing-bead concept remains separate from the PRELUDE working sash overlap of 7 mm.

## Confirmation and safety

Working-composer access and technical confirmation are deliberately separate:

- working access: product name + positive overall dimensions + compatible optional topology;
- full technical confirmation: existing strict validation still requires the required technical data and human review;
- DOOR full technical confirmation remains blocked while threshold semantics are unresolved;
- `machineReady`, `productionApproved`, `geometryCreated`, `exportAvailable`, DWG-write and machine connectivity remain locked.

A working configuration is therefore an editable incomplete product state, not engineering approval and not a production drawing.

## Regression focus

V8.3 adds/updates regression coverage for:

- working access with missing system/profiles;
- strict technical confirmation remaining blocked by missing data;
- one shared technical-data editor in WINDOW and DOOR composers;
- no separate user-facing Door DEMO gate or source-configuration replacement;
- unresolved threshold acknowledgement inside the door composer;
- glazing/bead 20/22 mm remaining deferred and non-calculated;
- existing V8/V8.1/V8.2 topology, PRELUDE geometry and safety behavior remaining intact.

## Closure

V8.3 is not closed by this document. Closure requires canonical `npm run verify`, `git diff --check`, combined human visual audit, staged diff review, commit/push and clean origin synchronization.
