# REAL DATA BATCH 01 — WP78.3 Catalogue Visibility

Status: HUMAN AUDIT REQUIRED

## Scope

Expose the already registered WP 78 source-backed profile-role evidence inside the Profile Catalogue UI without promoting it to normal selectable `CatalogueProfile` records.

## Source-backed records

- Каса → `78,01` → FRAME
- Делител → `78,33` → MULLION
- Крило прозорец → `78,22` → SASH

Codes remain exactly as supplied, including comma punctuation.

## Safe visibility rules

- WP 78 is shown as READ ONLY source evidence.
- Product category evidence is WINDOW only.
- Profile dimensions remain explicitly unknown.
- No `dimensionA` / `dimensionB` values are fabricated.
- No WP 78 records are inserted into `sampleCatalogueProfiles`.
- No WP 78 row can be selected as an active catalogue profile.
- No door support is inferred.
- Existing source notes for PVC hardware and glazing remain evidence only.

## Locked gates

- Catalogue selectable: NO
- Rules validated: NO
- Machine ready: NO
- Production approved: NO

## Verification

Focused WP78.3 tests, WP78.1 regression, WP78.2 regression, lint and production build must pass before commit.
