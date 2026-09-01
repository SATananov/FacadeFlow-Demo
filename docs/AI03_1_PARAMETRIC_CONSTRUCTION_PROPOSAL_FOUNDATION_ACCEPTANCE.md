# AI03.1 — Parametric Construction Proposal Foundation — Acceptance

Status: READY FOR HUMAN AUDIT

## Scope
AI03.1 converts an existing `FacadeFlowProductIntent` into a proportional, conceptual construction proposal. It does not create accepted CAD geometry.

## Accepted behavior
- Requires supported category, positive overall dimensions and explicit field topology.
- Preserves explicit field roles/opening semantics from evidence.
- Uses explicit divider positions when complete and linear.
- When a field count is explicit but divider positions are absent, may propose equal vertical distribution only as a visible assumption requiring human acceptance.
- Missing topology is BLOCKED; a single field is never inferred from dimensions alone.
- Mixed/incomplete divider topology is BLOCKED rather than guessed.
- Known hardware count/description is carried as metadata; hardware placement remains unresolved unless explicitly sourced.

## Safety boundary
- `proposalGenerated = true`
- `automaticAcceptedGeometry = false`
- `constructorHandoffAllowed = false`
- `rulesValidated = false`
- `machineReady = false`
- `productionApproved = false`
