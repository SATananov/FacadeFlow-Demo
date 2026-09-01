# AI01.1 — Canonical Product Intent Foundation — Acceptance

## Goal

Create one provider-neutral, source-neutral product-intent contract that can later receive information from a natural-language prompt, project documents, a sketch, or manual input and feed the existing FacadeFlow review/specification architecture.

## Why this phase exists

FacadeFlow must not build separate product models for prompt AI, document ingestion, and the manual designer. All routes must converge on one reviewable parametric intent before geometry or production preparation.

## Accepted scope

AI01.1 adds a canonical intent representation for:

- product category, mark, name, quantity;
- overall dimensions;
- profile system and frame/sash/mullion/transom/threshold references;
- ordered product fields and their roles;
- divider orientation and provisional position;
- opening type, direction, and inward/outward swing;
- handles, hinges, locks, mechanisms, and handle height;
- glazing and finishes;
- source evidence and unresolved information;
- conversion into the existing `FacadeFlowProductSpecification` review layer.

Prompt and document routes use the same contract.

## Safety boundary

AI01.1 does **not** connect an AI provider or network endpoint.

AI01.1 does **not** parse free text automatically.

AI01.1 does **not** generate or mutate geometry.

AI01.1 does **not** validate engineering rules.

AI01.1 does **not** create machine instructions, machine connectivity, production exports, or production approval.

Every intent keeps:

- `humanReviewRequired: true`
- `rulesValidated: false`
- `automaticGeometryAllowed: false`
- `simulationOnly: true`
- `machineReady: false`
- `productionApproved: false`

Any conversion to `FacadeFlowProductSpecification` is forced to `NEEDS_REVIEW`.

## Acceptance criteria

1. Prompt, document, sketch, and manual inputs can share one canonical contract.
2. The contract can represent field topology, dividers, profiles, glazing, finish, handles, and hinges.
3. Evidence references are validated and broken references are rejected.
4. Missing information remains explicitly unresolved rather than inferred silently.
5. Invalid dimensions/positions are rejected by structural validation.
6. The existing product specification layer can receive a safe review-only projection.
7. Automatic geometry remains impossible in this phase.
8. Tests, lint, and production build pass.

## Next planned phase

AI01.2 — Prompt Interpretation Adapter / Structured Model Output Contract.

That phase may connect a model only through an explicit provider boundary and must still produce review-only intent. It must not bypass human review or rule validation.
