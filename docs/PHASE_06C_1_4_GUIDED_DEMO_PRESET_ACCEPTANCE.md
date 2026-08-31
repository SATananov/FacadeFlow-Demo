# PHASE 06C.1.4 — Guided Demo Preset

## Goal
Reduce repetitive manual entry during development and visual regression checks without bypassing any Human Gate or production boundary.

## Acceptance
- Guided Builder exposes one visible **ДЕМО** action.
- With no product type selected, DEMO prepares a complete example **window**.
- If the human has selected **Door**, DEMO prepares a complete example door instead.
- DEMO prefers the existing `DEMO SYSTEM` catalogue profiles and falls back to clearly named manual DEMO codes only if those sample catalogue records are unavailable.
- DEMO data are visibly marked as sample/test data.
- Applying DEMO clears any prepared/confirmed guided proposal and returns the draft to `NEEDS_REVIEW` / `SOURCE_CAPTURED`.
- DEMO never checks the human-review checkbox and never performs Human Confirm.
- Rules validation, automatic geometry, production approval, machine readiness, persistence, network calls and machine export remain unchanged and disabled.

## Typical presets
- Window: 1400 × 1200 mm, DEMO SYSTEM, turn opening, left/inward, sample glazing/color/hardware.
- Door: 900 × 2100 mm, DEMO SYSTEM, right/inward, explicit sample threshold and door hardware.
