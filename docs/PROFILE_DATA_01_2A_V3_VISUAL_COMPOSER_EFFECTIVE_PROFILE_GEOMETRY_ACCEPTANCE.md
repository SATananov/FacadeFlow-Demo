# PROFILE DATA 01.2A V3 — Visual Composer Effective Profile Geometry

## Purpose
V3 turns the exact template-based Visual Composer route from overlap readout-only into a measured structural profile-band renderer.

It deliberately reuses the already accepted PROFILE DATA 01.2 functions:
- `buildOverlapAwareFrameSegments`
- `buildOverlapAwareMullionSegments`

No second overlap formula is introduced.

## Geometry contract
Visual Composer fields are mapped to millimetre leaf regions from their existing normalized template rectangles.

- `OPENABLE` → `OPENING_SASH` adjacency
- `FIXED` → fixed glazing adjacency
- template dividers with explicit percentage positions are mapped to measured mullion center lines
- manually added semantic dividers that do not split the template geometry are **not** promoted to measured geometry

For the current PRELUDE 60 working overlap of 7 mm:
- 482.30 frame: base 42 mm → 35 mm only beside an opening sash; remains 42 mm beside fixed glazing
- 482.21 mullion: base 40 mm → 33 mm with sash on one side; 26 mm with sashes on both sides; remains 40 mm with no sash
- 482.05 sash width is **not** promoted by this phase; its catalogue 56/34 values remain source-only pending assembly confirmation

## Rendering
When exact registered system overlap and confirmed frame/mullion base visible geometry are available:
- the old generic frame rectangle is replaced visually by mm-derived frame segments
- template mullions are rendered as mm-derived structural bands
- field/opening/hardware semantics remain interactive above those bands
- a compact human-audit readout shows base → effective widths in millimetres

When measured profile geometry is unresolved, Visual Composer falls back to its prior conceptual frame rendering and does not invent an overlap.

The existing canvas proportions remain conceptual. Millimetre profile thickness is scaled consistently on its relevant X/Y axis inside the existing Visual Composer viewport; this is still not a production drawing.

## Human Audit
Use PRELUDE 60 / 482.30 / 482.05 / 482.21.

1. Double sash:
   - visible readout contains `Каса 482.30 · 42 → 35 mm`
   - visible readout contains `Делител 482.21 · 40 → 26 mm`
   - central mullion is visibly narrower than its 40 mm base state

2. Mixed sash / fixed:
   - frame readout contains both 35 and 42 mm effective states
   - mullion readout contains `40 → 33 mm`

3. Fixed / fixed:
   - frame remains 42 mm
   - mullion remains 40 mm

## Safety
- 7 mm remains a working human-reviewed simulation value and requires exact production confirmation
- no global fallback
- no automatic profile selection
- no sash-width promotion
- no machine output
- `machineReady=false`
- `productionApproved=false`
