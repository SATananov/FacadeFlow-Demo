# UI01.2A — Projects / Catalogue Source Separation

Status: IMPLEMENTED / HUMAN VISUAL VERIFY REQUIRED

## Rule

Project/source context belongs in **Projects**. Normalized profile records belong in **Profile Catalogue**.

- `Вадим-2 · XML + LTE` is shown as source-backed project evidence in Projects.
- `WP 78 / REAL DATA BATCH 01` is shown as read-only source evidence in Projects.
- Profile Catalogue no longer duplicates those project dashboards.
- A normalized `CatalogueProfile` may preserve `sourceEvidenceId` / `sourceEvidenceLabel` provenance back to Projects.

## Human review

Nadezhda/Vadim profile evidence remains immutable. FRAME / SASH / MULLION role assignment is an explicit human review action using the existing pending-review and `ProfileEditor` flow. Only the separate normalized catalogue record is added after confirmation.

## Boundaries

- Similar ≠ valid.
- Source evidence ≠ catalogue approval.
- Completed project ≠ automatic template.
- No inferred profile roles.
- No backend or persistence.
- No AI similarity or automatic project reuse.
- No machine-ready or production-approved state.
