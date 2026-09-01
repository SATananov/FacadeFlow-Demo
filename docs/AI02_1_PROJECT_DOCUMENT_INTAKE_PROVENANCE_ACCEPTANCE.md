# AI02.1 — Project Document Intake & Provenance — Acceptance

## Goal
Accept a local project packet as read-only evidence and record the identity of every source before any product interpretation.

## Accepted scope
- Multiple local files in one AI workspace packet.
- SHA-256, file name, MIME, size, page count and capture time.
- PDF text-layer extraction in browser memory.
- Local text extraction for TXT/MD/SPEC, CSV, XML, JSON and LTE.
- DWG/DXF/XLSX/DOCX/images registered as provenance-only when AI02 V1 has no reliable text reader for them.
- Existing Import Center remains the route for PDF OCR/image evidence and read-only DWG inspection.

## Safety boundary
No upload, network model, automatic OCR, geometry conversion, CAD mutation, production export or machine output. Sources are read-only, session-only evidence.

## Acceptance
1. A source always has a SHA-256 identity before interpretation.
2. Text is never invented for scanned PDFs, images, DWG/DXF, XLSX or DOCX.
3. PDF text is extracted locally through the existing pdfjs dependency.
4. File/page/sha provenance survives into downstream evidence.
5. `AUTOMATIC GEOMETRY = NO`, `RULES VALIDATED = NO`, `MACHINE READY = NO`.
