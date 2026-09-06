# AI DRAWING PROFILE SECTIONS 01 — Catalogue Callouts in the Same Sketch

Status: **WORKING / HUMAN AUDIT REQUIRED**  
Commit / push: **NO**

## Goal

Keep the conceptual AI elevation and the relevant verified PRELUDE profile sections on the same technical sketch card, without inventing profile geometry or an assembled production node.

## Source of truth

For the current PRELUDE 60 working slice, the visual profile shape comes only from the verified catalogue extraction of `PVC Prelude_bg.pdf`, page 2:

- `482.30` — frame / каса
- `482.21` — mullion / делител
- `482.05` — sash / крило

The rendered profile section is the already verified catalogue asset. It is **not AI-redrawn**.

Human-confirmed measurement semantics remain separate Nadezhda evidence:

- `482.30`: `64 − 22 = 42 mm`
- `482.21`: `84 − 22 − 22 = 40 mm` — 22 mm zone on both sides
- `482.05`: `78 − 22 = 56 mm`

For `482.05`, 78 mm remains a human-confirmed working interpretation and is not silently promoted to a manufacturer catalogue dimension.

## Explicit profile selection

Selecting only the system `PRELUDE 60` is **not enough** to assign profile codes. The catalogue contains multiple frames, sashes and mullions.

Quick Select therefore exposes explicit verified-code selectors for the current visual slice:

- Frame / каса: `482.30`
- Sash / крило: `482.05`
- Mullion / делител: `482.21`

No option is selected automatically.

When the exact code is explicitly selected, the conceptual elevation gets a stable callout:

- `A-A` → frame
- `B-B` → mullion
- `C-C` → sash

The corresponding catalogue sections are shown directly below the same conceptual elevation.

## Safety boundary

This slice does **not** claim or create:

- an exact assembled frame+sash+mullion node;
- manufacturing overlaps or rebates;
- glazing/gasket assembly geometry;
- machining deductions;
- validated contour anchor coordinates;
- production tolerances;
- rule validation;
- machine-ready or production-approved geometry.

Safety markers:

- catalogue visual source: **YES**
- AI-redrawn profile: **NO**
- automatic profile assignment: **NO**
- exact assembly: **NO**
- exact production contour: **NO**
- machine ready: **NO**
- production approved: **NO**

## Human Audit

1. Open AI → Quick Select.
2. Select Window, 3 fields, `FIX · tilt-turn right · FIX`, 1200 × 1400, quantity 3.
3. Select system PRELUDE 60.
4. Explicitly select frame `482.30`, sash `482.05`, mullion `482.21`.
5. Apply the structured selection.
6. Confirm the elevation labels show `A-A / B-B / C-C` with the selected codes.
7. Confirm the same sketch card shows the three real catalogue section images and the separate human-confirmed formulas.
8. Confirm the UI states automatic profile assignment = NO and exact assembled node = NO.

AI05.3 remains OPEN / WORKING.  
PROFILE DATA 03 remains OPEN / WORKING.  
NO COMMIT / NO PUSH.
