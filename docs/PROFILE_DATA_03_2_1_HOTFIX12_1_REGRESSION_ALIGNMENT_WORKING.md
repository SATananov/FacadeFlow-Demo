# PROFILE DATA 03.2.1 — HOTFIX 12.1 Regression Alignment (WORKING)

## Human Audit / verify finding
HOTFIX 12 correctly replaced the generic hand-authored profile-like drawing with the verified PRELUDE catalogue visual, but the older `profileData03_1_1VisualSectionProfileShapePolish.test.ts` still asserted the retired schematic implementation (`ProfileBody`, `profile-section-profile-shell`, schematic-glass markers and the old `MEASUREMENT SCHEMA ONLY` wording).

The failing regression was therefore stale relative to the newer visual-truth safety decision. Re-introducing the old generic drawing only to satisfy that test would be a regression.

## This patch
- updates only the stale legacy regression test;
- asserts the verified PRELUDE catalogue asset path instead of the retired hand-authored profile shell;
- keeps catalogue evidence separate from Nadezhda human-confirmed working measurement semantics;
- preserves explicit safety boundaries: no AI redraw authority, no isolated production contour authority, not machine-ready, not production-approved.

## Status
- HOTFIX 12 visual implementation: unchanged.
- PROFILE DATA 03: OPEN / WORKING.
- AI05.3: OPEN / WORKING.
- NO COMMIT / NO PUSH.
