# UI02.1A — AI01–AI04 + Constructor Bulgarian UI Language Consistency

## Scope

Presentation-only normalization of user-facing text in the AI01–AI04 workflow and the AI-to-constructor handoff surface.

Included:
- AI workspace intake and status copy.
- Description interpretation labels, recognized values and user-facing validation messages (`AI01` remains internal).
- Project document intelligence labels, evidence/provenance wording and user-facing source warnings (`AI02` remains internal).
- Proposal review, blockers and safety presentation (`AI03` remains internal).
- Explicit „Продължи в конструктора“ copy and editable-draft feedback (`AI04` remains internal).
- Guided product human-review labels, Nadezhda evidence preview and optional project-structure presentation.
- Constructor handoff banner and AI04 provenance banner in Custom Product Designer.

## Explicitly unchanged

- Internal enums and canonical data contracts (`HUMAN_CONFIRMED`, `NEEDS_REVIEW`, `AI_DRAFT`, `LEFT`, `RIGHT`, etc.).
- AI01–AI04 authority and safety semantics.
- Geometry generation rules.
- Rule validation state.
- Machine/production authorization.
- Backend, persistence or network behavior.

Internal phase identifiers `AI01`–`AI04` remain unchanged in code, schemas, tests and engineering documentation, but are no longer primary user-facing feature names. The UI uses task names: „Разчети описанието“, „Проектни документи“, „Преглед на предложението“ and „Продължи в конструктора“.

Technical product/file identifiers such as AI, CAD, DWG/DXF, PDF, OCR, XML/LTE, SHA-256, JSON, RAL and millimetre units remain technical identifiers and are not translated.

## Safety invariants

- `machineReady` remains false.
- `productionApproved` remains false.
- Automatic geometry remains disallowed.
- Automatic constructor handoff remains disallowed.
- Human review/confirmation remains explicit.

## Verification

- Dedicated UI02.1A language regression test.
- AI01–AI04 regression.
- Constructor/handoff regression.
- Full repository regression through canonical `npm run test:regression` / `npm run verify` on the target workstation.
