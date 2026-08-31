# REAL DATA BATCH 01 — WP 78.2 Applicability Foundation

## Scope

This slice converts the locked WP 78 source registration into a deterministic applicability layer without promoting WP 78 into the selectable product catalogue.

Source-backed mapping remains exact:

- Каса → `78,01` → `FRAME`
- Делител → `78,33` → `MULLION`
- Крило прозорец → `78,22` → `SASH`

## Applicability

- Source-supported product category: `WINDOW`
- Door support: **not established by this WP 78 source block**
- Profile section dimensions: **unknown in the supplied source**
- Glazing code/specification: **unknown**
- Hardware product code/specification: **unknown**

## Catalogue gate

The current `CatalogueProfile` contract requires real profile dimensions. The supplied WP 78 source does not provide those dimensions, so this slice deliberately does not fabricate them and does not inject WP 78 into `sampleCatalogueProfiles`.

Blockers:

- `PROFILE_DIMENSIONS_UNKNOWN`
- `RULES_NOT_VALIDATED`
- `CATALOGUE_PROMOTION_PENDING`

## Safety lock

- selectable catalogue: NO
- rules validated: NO
- machine ready: NO
- production approved: NO

No code punctuation is normalized. No door/threshold profiles are fabricated. No production or machine behavior is enabled.
