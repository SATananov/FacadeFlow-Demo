# AI PROMPT KNOWLEDGE CORPUS 06 — Project / Floor / Room / Mark Context

Status: **WORKING ACCEPTANCE / NOT CLOSED / NOT COMMITTED**

## Goal

Extend the already verified Offer → Defaults → Modules workflow with deterministic project addressing:

**Project → Floor → Room → Mark → Module**

Corpus 06 must preserve the Offer defaults and module-local semantics from Corpus 05 while adding a safe project-context layer. It must never infer an ambiguous target and must never allow context corrections to leak into sibling floors, rooms, marks or modules.

## Corpus

Exactly 200 unique synthetic/private-safe prompts:

- 50 `PROJECT_CONTEXT_INHERITANCE`
- 50 `EXACT_CONTEXT_OVERRIDE`
- 50 `FLOOR_GROUP_SCOPE`
- 50 `AMBIGUOUS_CONTEXT_SAFETY`

## Required behavior

1. Offer defaults continue to inherit into modules after project addressing is added.
2. `floor + room + mark` may target one module deterministically.
3. Explicit group scope such as `all modules on floor 2` may target the matching floor only.
4. A room-only reference that matches multiple floors must remain unresolved unless an explicit group scope is present.
5. Project-context mark and parsed module mark must agree; mismatch is surfaced for Human Review.
6. No project layer may grant production authority.

## Safety boundary

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

## Phase boundary

- AI05.3 remains **WORKING / NOT CLOSED**.
- PROFILE DATA 03 remains **WORKING / NOT CLOSED**.
- Corpus 01–06 remain **WORKING / NOT COMMITTED**.
- No commit / no push is performed by this package.
