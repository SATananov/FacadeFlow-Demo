# REAL DATA 02.3 — Evidence-backed Project Draft Bridge — Acceptance

## Purpose

REAL DATA 02.3 bridges deterministic observations from REAL DATA 02.2 into the canonical `SOURCE_DRAFT` schema from REAL DATA 02.1.

The bridge exists to make future Nadezhda-style project documents reviewable as structured project drafts. It does **not** create a lifecycle `ProjectRecord`, does not human-confirm data, and does not unlock production.

## Accepted behavior

- All extractor candidate evidence is preserved as private source evidence.
- Explicit `обект:` becomes source-backed `siteLocation`.
- Explicit `Модул:`, `Брой:`, `L`, and `H` become separate module records and evidence-backed fields.
- Equal L/H never merge module positions.
- Explicit `Етаж` / `Секция` placement is preserved.
- Explicit offer variants are preserved as separate variant containers.
- Product groups such as PVC / aluminium stay distinct.
- When product groups exist without an explicit offer variant, a structural unscoped wrapper may be created with an **UNRESOLVED** label. This wrapper does not claim that the source contained a commercial variant.
- Explicit group attributes may map to system/color/glazing/hardware/reinforcement.
- Explicit attribute lines encountered in active module context may be preserved as module overrides rather than silently promoted to global defaults.
- Explicit included/excluded items are preserved.
- Explicit VAT wording may map to `vatIncluded`.
- Raw price text remains evidence-only in this phase; numeric price/currency parsing is intentionally deferred.
- Repeated contradictory source values become `CONFLICT`, never “best guess”.
- Missing values remain `UNRESOLVED`.
- Canonical REAL DATA 02.1 validation is run on the result and its errors are returned to the caller.

## Safety boundary

The bridge result must remain:

- `status = SOURCE_DRAFT`
- `humanReviewStatus = NOT_REVIEWED`
- no lifecycle project creation
- no automatic reuse
- no automatic module merge
- no automatic attribute inference
- no opening/sash/divider inference
- no production decision
- `productionLocked = true`
- `machineReady = false`
- `productionApproved = false`

## Privacy

Tracked tests and documentation use synthetic fixtures only. Real customer/project documents supplied for internal reference are not committed and must not enter shareable checkpoints.

## Verification gate

- Focused REAL DATA 02.3 tests must pass.
- Full `npm run verify` must pass.
- `git diff --check` must pass.
- No files outside REAL DATA 02.3 may be modified by the package.
