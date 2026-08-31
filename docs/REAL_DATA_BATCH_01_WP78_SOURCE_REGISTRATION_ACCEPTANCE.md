# REAL DATA BATCH 01 — WP 78 Source Registration Acceptance

## Goal
Register the supplied WP 78 source facts without inventing missing engineering data and without promoting the records into the active catalogue before HUMAN AUDIT.

## Locked source
- Source document: `Al systems 2(1).pdf`
- Page: `1`
- SHA-256: `3A49FAE65D9EB98F1F1F27943ABCF8435A6EE5AE989B79EEC2F4061FC98C82DD`
- System label: `WP 78`

## Exact source-backed profile mapping
- `Каса` → `FRAME` → code `78,01`
- `Делител` → `MULLION` → code `78,33`
- `Крило прозорец` → `SASH` → code `78,22`

The comma in every profile code is source data and must not be normalized to a dot, hyphen or digit-only form.

## Additional source notes
- `с PVC обков` is retained only as a generic source note. No hardware brand, model or product code is created.
- `стъклопакети` is retained only as evidence that glazing is mentioned. No glazing SKU, code or specification is created.
- No door profile or threshold profile is present in the WP 78 source table, so none is created in this batch.

## Safety boundary
This batch is source registration only.

- `cataloguePromoted = false`
- `rulesValidated = false`
- `machineReady = false`
- `productionApproved = false`
- `humanAuditRequired = true`

The existing Nadezhda `Вадим-2` group-78 evidence remains separate. Its dot-form observed codes are not rewritten or used as the source for the WP 78 records.
