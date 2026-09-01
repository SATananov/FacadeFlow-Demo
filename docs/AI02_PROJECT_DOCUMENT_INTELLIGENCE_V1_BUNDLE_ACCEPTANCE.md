# AI02 — Project Document Intelligence V1 — Bundle Acceptance

## Product direction
AI02 is the second input route into the same canonical Product Intent model introduced by AI01. Prompt input and document input do not create separate product architectures.

## Bundle
- AI02.1 — local document intake + provenance.
- AI02.2 — explicit product candidate extraction + cross-document conflict review.
- AI02.3 — safe document-to-guided-form bridge.
- AI02.4 — FacadeFlow AI document workspace integration.

## What this unlocks
A user can drop a project schedule/specification packet, see detected marked products, compare repeated evidence across documents, expose contradictions, and load one selected position into the same human-review form used by Prompt Intelligence.

## What remains locked
- external AI/LLM provider;
- scanned-page automatic interpretation;
- DWG geometry-to-product interpretation;
- automatic project-wide product creation;
- automatic geometry;
- automatic engineering-rule decisions;
- production/machine output.

## Acceptance command
`npm run test:ai02_documents`, followed by `npm run lint`, `npm run build`, `git diff --check`.

## Next logical layer
AI03 may address document/visual understanding for scanned drawings and geometry evidence, still through source-bound evidence and Human Review. Project-wide batch orchestration should only follow after document candidate quality is proven on real customer project packets.
