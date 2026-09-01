# AI04.3 — Editable Constructor Provenance & Review — Acceptance

Status: ACCEPTED FOR V1 HUMAN AUDIT

## Constructor behavior
The created product opens in the existing Custom Product Designer as `NEEDS_REVIEW` with `humanReviewConfirmed = false`.

An AI04 provenance banner remains visible and records:
- source proposal id / intent id;
- source kind and mark;
- AI03 geometry basis;
- evidence count;
- unresolved/warning context;
- explicit human-approved proposal flag;
- `RULES VALIDATED: NO`;
- `MACHINE READY: NO`.

Any normal constructor edit continues to use the existing history/validation/re-review behavior. AI04 does not bypass Custom Product Designer validation.
