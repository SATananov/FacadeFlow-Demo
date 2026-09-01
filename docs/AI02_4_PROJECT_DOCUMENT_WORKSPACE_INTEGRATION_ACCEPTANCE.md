# AI02.4 — Project Document Workspace Integration — Acceptance

## Goal
Make Project Document Intelligence usable directly from FacadeFlow AI → Project / Documents.

## Human workflow
1. Select work context.
2. Select `Project / Documents`.
3. Drop a local project packet.
4. Review source identity and extraction status.
5. Review detected marks and cross-document conflicts.
6. Inspect evidence excerpts.
7. Select one position.
8. Transfer safe compatible values into the guided Human Review form.
9. Complete/correct missing values and use the existing Human Confirm gate.

## Explicit V1 limitations
- PDF: embedded text layer only; scanned pages use the existing Import Center/OCR workflow.
- CSV/TXT/XML/JSON/LTE: local text scan supported.
- DWG/DXF: provenance/read-only inspection only; no geometry-to-product conversion.
- XLSX/DOCX: provenance only; use CSV or text-bearing PDF for local extraction.
- Images: provenance only in this panel; use the existing evidence/OCR workflow.
- One selected product group is handed to the guided form at a time. Batch project creation is not automatic.

## Safety boundary
Documents stay local. Source evidence and human review are mandatory. Automatic geometry, validated engineering rules, production approval and machine readiness remain false.
