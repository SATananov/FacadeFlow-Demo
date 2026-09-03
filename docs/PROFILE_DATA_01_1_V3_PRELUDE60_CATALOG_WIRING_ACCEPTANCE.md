# PROFILE DATA 01.1 V3 — Multi-Catalog Registry + PRELUDE 60 Wiring

## Purpose

V3 wires the first real profile catalogue into the live FacadeFlow constructor while preserving the existing DEMO catalogue as a separate test fixture.

The architecture is intentionally multi-catalog capable, but **PRELUDE 60 is the only real catalogue activated by this phase**.

## Source-backed PRELUDE 60 registry

Source: `PVC Prelude_bg.pdf`.

The source lists the PRELUDE 60 mm main profiles, including:

- 482.30 — frame
- 482.20 — frame
- 482.05 — sash
- 482.18 — sash
- 482.25 — sash
- 482.23 — sash
- 482.21 — mullion
- 482.24 — mullion
- 482.26 / 482.27 — door sash
- 482.11 — overhung

The registry records those source-backed codes, but V3 does **not** silently activate every source entry in the current app model.

## Current live selector bridge

Only the profiles that have the required current FacadeFlow role mapping are exposed in the live PRELUDE 60 selector:

### 482.30 — frame

- app role: FRAME
- source/catalog height: 64 mm
- source/catalog visible width: 42 mm
- base geometry state: HUMAN CONFIRMED

### 482.21 — mullion

- app role: MULLION
- source/catalog height: 84 mm
- source/catalog visible width: 40 mm
- base geometry state: HUMAN CONFIRMED

### 482.05 — sash

- app role: SASH
- catalogue source values: 56 / 34 mm
- role: human reviewed
- effective visible/assembly geometry: **NOT promoted automatically**
- assembly state remains pending separate confirmation

The catalogue values for 482.05 are therefore kept as source evidence and are not used by PROFILE DATA 01.1 V2 as an automatic structural sash width.

## Regression-preserving seed split

`sampleCatalogueProfiles` remains exactly the legacy DEMO-only fixture.

New `applicationCatalogueProfiles` contains:

- DEMO SYSTEM
- PRELUDE 60

`App.tsx` initializes the live profile catalogue from `applicationCatalogueProfiles`.

This keeps old DEMO tests deterministic while exposing PRELUDE 60 in the normal structured constructor.

## UI expectation after V3

At `Стандартно изделие → Прозорец → Профилна система`, the system selector should show:

- DEMO SYSTEM
- PRELUDE 60

When PRELUDE 60 is chosen, the current role dropdowns should expose:

- frame: 482.30
- sash: 482.05
- mullion: 482.21

No profile is selected automatically.

## Explicit non-goals

V3 does not:

- activate REHAU, ETEM, WDS or another real catalogue;
- infer geometry for other PRELUDE source entries;
- calculate the ~7 mm frame/sash overlap;
- calculate effective visible width from overlap;
- decide the two-sash mullion overlap case;
- create production geometry;
- unlock machine output.

## Safety

- automaticProfileSelectionAllowed = false
- automaticCatalogExpansionAllowed = false
- automaticAssemblyOverlapFormulaAllowed = false
- effectiveVisibleWidthFromOverlapAllowed = false
- machineReady = false
- productionApproved = false

## Human Audit

After VERIFY PASS:

1. Open Standard Product → Window.
2. Reach Profile System.
3. Confirm both `DEMO SYSTEM` and `PRELUDE 60` are visible.
4. Select `PRELUDE 60`.
5. Confirm the profile step offers `482.30`, `482.05`, `482.21`.
6. Do not enter any 7 mm overlap rule yet.

PROFILE DATA 01.2 will own the overlap/effective-visible-width rules after the remaining human clarification.
