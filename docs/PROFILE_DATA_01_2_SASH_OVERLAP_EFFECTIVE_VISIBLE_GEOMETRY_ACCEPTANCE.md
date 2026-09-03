# PROFILE DATA 01.2 — Sash Overlap & Effective Visible Geometry

## Purpose

PROFILE DATA 01.2 turns the newly confirmed assembly rule into an explicit, testable FacadeFlow geometry contract:

> The sash overlap is a **profile-system parameter**. It may differ by system (for example 6, 7 or 8 mm). Frame and mullion visible width is reduced only on a side where a sash is actually adjacent. If there is no sash on that side, the structural profile keeps its full base visible width.

This phase does **not** turn the overlap into a global constant and does **not** give machine/production authority to the result.

## System-level overlap input

`RegisteredProfileCatalogSystem` now carries:

- `sashOverlapMm`
- `sashOverlapEditable`
- `sashOverlapState`
- `sashOverlapProductionConfirmationRequired`

For PRELUDE 60, the current simulation model carries a human-reviewed working value of **7 mm**. It remains editable and explicitly requires exact production confirmation before production use.

The architecture accepts an explicit value per system; 6, 7, 8 mm or another valid positive value is not inferred from profile dimensions.

## Base vs effective visible width

PROFILE DATA 01.1 established the base structural visible widths:

- PRELUDE 60 / 482.30 frame: `42 mm`
- PRELUDE 60 / 482.21 mullion: `40 mm`

PROFILE DATA 01.2 adds the assembly result:

`effectiveVisibleWidth = baseVisibleWidth - overlap(side A if sash) - overlap(side B if sash)`

### PRELUDE 60 examples with the current 7 mm working input

- frame 42, no adjacent sash → **42 mm**
- frame 42, sash on the interior side → **35 mm**
- mullion 40, no adjacent sash → **40 mm**
- mullion 40, sash on one side → **33 mm**
- mullion 40, sashes on both sides → **26 mm**

## Segment-aware geometry

The reduction is not applied blindly to an entire frame or mullion.

The new geometry functions inspect actual leaf adjacency and split the structural profile into segments when needed. This matters for mixed constructions such as:

- sash above + fixed field below;
- sash on one side of a mullion + fixed glazing on the other;
- sash on both sides of a mullion;
- fixed fields with no sash overlap.

Only the segment that actually touches an `OPENING_SASH` receives the overlap reduction.

## Renderer foundation

`CustomProductDrawing` now accepts an explicit optional:

`sashOverlapMm`.

When `sashOverlapMm` is explicitly supplied:

- frame bands use overlap-aware segments;
- mullion bands use left/right or top/bottom sash adjacency;
- the SVG exposes audit attributes for base width, effective width and overlap application count.

When the prop is absent, the renderer preserves the PROFILE DATA 01.1 behavior and does not invent an overlap value.

This preserves compatibility with DEMO or systems whose overlap has not been entered/reviewed yet.

## Sash boundary

This rule reduces the visible part of **frame and mullion** that is covered by the sash.

It does **not** subtract the system overlap from the sash visible width itself. The 482.05 sash effective visible-width interpretation remains a separate profile/assembly concern.

## Safety boundaries

- no global overlap fallback;
- no inference from profile dimensions;
- no reduction when no sash is adjacent;
- no automatic profile selection;
- no machine output;
- no production approval;
- exact production overlap confirmation remains required.

`machineReady = false`

`productionApproved = false`

## Acceptance

The focused tests cover:

- 42 → 42 without sash;
- 42 → 35 with one 7 mm sash overlap;
- 40 → 33 with sash on one side;
- 40 → 26 with sashes on both sides;
- explicit 6 and 8 mm system values;
- rejection of invalid overlap values;
- fixed vs sash frame segments;
- vertical and horizontal mullions;
- mixed sash/fixed segment-aware behavior;
- renderer explicit-prop/fallback contract;
- production and machine locks.

## Follow-up

A later UI/catalogue editing phase may expose the system overlap field in a dedicated profile-system editor. PROFILE DATA 01.2 establishes the canonical field and geometry contract first, so that UI editing cannot invent a second incompatible overlap model.
