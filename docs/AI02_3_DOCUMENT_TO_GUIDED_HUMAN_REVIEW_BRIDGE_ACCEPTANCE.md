# AI02.3 — Document → Guided Human Review Bridge — Acceptance

## Goal
Load one selected document candidate group into the existing guided product form without bypassing the existing Human Confirm gate.

## Accepted scope
- Reuses the AI01 safe guided-form bridge.
- Transfers only values supported by the guided form.
- Non-catalogue systems remain manual extracted values.
- Multi-field topology stays Product Intent evidence and is not converted into automatic CAD geometry.
- Document provenance is written into review notes.
- Unresolved/conflicting document values remain visible as not transferred.

## Safety boundary
The bridge forces `reviewAccepted = false` and `status = NEEDS_REVIEW`. Human confirmation, rule validation and later CAD actions remain separate gates.
