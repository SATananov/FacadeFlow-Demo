# PHASE 06C.3.2 — Unified DEMO Pipeline / Structured Specification Foundation

## Goal
Before real project data or a connected AI model are introduced, every DEMO station must be able to demonstrate the same safe normalization path:

`DEMO input → common structured review packet → Human Review acknowledgement → rules required → downstream handoff remains locked`

## Common packet
All six DEMO stations use one `FacadeFlowUnifiedReviewPacket` envelope. The envelope records context, input route, optional project path, structured sections, evidence actually available, unresolved items and safety flags.

Supported packet kinds:
- PRODUCT
- PROJECT_SOURCE
- SKETCH_SOURCE
- MANUAL_ROUTE
- KNOWLEDGE_CONTEXT

## Safety semantics
`HUMAN_REVIEWED` means only that a human reviewed the normalized DEMO packet. It does **not** mean:
- product `HUMAN_CONFIRMED`;
- engineering rules validated;
- AI inference accepted;
- automatic geometry approved;
- machine ready;
- production approved.

For project/document and sketch DEMO routes no uploaded file, extracted geometry or evidence record is invented. Missing source data stays unresolved.

For guided window/door routes, normalization may create a deterministic `NEEDS_REVIEW` product specification from the existing DEMO form, but it is never human-confirmed automatically.

## Persistence boundary
The packet is session-only React state. No backend, database, browser storage, network request or production writer is added.

## Acceptance
- All 6 DEMO stations normalize to the same packet envelope.
- Guided product packets remain `NEEDS_REVIEW`.
- Documents/sketch do not fabricate files or evidence.
- Manual/data routes do not pretend to be product specifications.
- Human Review acknowledgement cannot become product Human Confirm.
- Editing captured job metadata invalidates a stale packet.
- Rules and production remain locked.
