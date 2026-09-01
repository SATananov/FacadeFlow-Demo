# AI01.4 — Prompt Workspace Integration — Acceptance

## Goal

Activate the existing free-description area in FacadeFlow AI as a safe prompt-intelligence review experience while keeping the external AI model disconnected.

## UX

1. User writes a product description.
2. User explicitly clicks **Разчети описанието**.
3. FacadeFlow shows recognized values, confidence class, unresolved items and warnings.
4. If the source text changes, the previous interpretation becomes stale and cannot be applied.
5. User explicitly clicks **Прехвърли разпознатото към формуляра**.
6. Only guided-form-compatible values are transferred, still as `NEEDS_REVIEW`.
7. Existing Human Confirm and constructor handoff gates remain authoritative.

## Safety labels

The UI visibly states:

`AUTOMATIC GEOMETRY: NO · RULES VALIDATED: NO · MACHINE READY: NO`

## Verification

`npm run test:ai01_4`
