# AI PROMPT KNOWLEDGE CORPUS 05 — Offer / Defaults / Module Context

Status: **WORKING / NOT CLOSED / NOT COMMITTED**

## Real workflow model

Corpus 05 follows the offer workflow supplied by the production domain expert:

1. Create an offer for a specific customer.
2. Set offer-wide defaults such as profile system, colour, glazing and hardware.
3. Add products one by one as numbered **modules**: Module 1, Module 2, Module 3, ...
4. A module inherits offer defaults unless that module contains an explicit local override.
5. A later offer-wide revision updates inheriting modules but must not overwrite explicit module overrides.
6. A correction with no unambiguous offer/module scope is never guessed and stays for Human Review.

This layer models prompt understanding only. It does **not** validate catalogue compatibility, engineering rules, machine instructions or production readiness.

## Corpus composition

Exactly **200 unique prompts**:

- 50 `OFFER_DEFAULTS_INHERITANCE`
- 50 `MODULE_LOCAL_OVERRIDE`
- 50 `OFFER_DEFAULT_REVISION`
- 50 `AMBIGUOUS_SCOPE_SAFETY`

## New deterministic layer

`src/aiPromptOfferInterpreter.ts` adds an offer-level context above the existing single-product parser:

- offer reference extraction;
- customer extraction;
- offer-wide shared defaults;
- numbered module segmentation;
- inherited vs explicit module values;
- bounded module override behavior;
- offer-wide default revision behavior;
- unresolved scope handling;
- per-module reuse of the existing AI01.2 product interpreter.

The shared offer defaults covered by Corpus 05 are:

- profile system;
- exterior finish / colour;
- glazing description;
- hardware mechanism;
- handle / hinge fields are supported by the layer but are not treated as production-validated catalogue data.

## Inheritance rule

For each shared field:

`module explicit value > module correction > offer default`

An offer default is inherited only when the module does not already provide an explicit value or an explicit semantic conflict for that field.

## Safety invariant

For every offer and every effective module interpretation:

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

Ambiguous scope such as "change the colour to RAL 9005" after several modules is not mapped to the offer or to any module unless the target is explicit.

## Working boundaries

- AI05.3 remains **WORKING / NOT CLOSED**.
- PROFILE DATA 03 remains **WORKING / NOT CLOSED**.
- PRELUDE 60 is treated only as recognized prompt data here; Corpus 05 does not close or validate PROFILE DATA 03.
- Corpus 01/02/03 remain single-product regression knowledge layers.
- Corpus 04 remains the generic multi-product/order-reference layer.
- Corpus 05 adds the offer/default/module hierarchy on top.
- No commit / no push is implied by this package.
