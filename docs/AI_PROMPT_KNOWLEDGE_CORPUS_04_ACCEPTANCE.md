# AI PROMPT KNOWLEDGE CORPUS 04 — Multi-product / Order Reference Layer

Status: **WORKING / NOT CLOSED / NOT COMMITTED**

## Scope

Corpus 04 raises prompt interpretation from one product per prompt to a deterministic multi-product order layer. It does **not** authorize automatic geometry, rule validation, production output, or machine execution.

The layer adds:

- explicit numbered product segmentation;
- multiple windows/doors and quantities in one order prompt;
- ordinal references such as first / second / third;
- bounded group references such as "last two";
- correction application only to explicitly resolved product targets;
- ambiguous pronoun corrections that remain unresolved instead of guessing;
- per-product reuse of the existing AI01.2 deterministic product interpreter;
- order-level Human Review and safety boundaries.

## Corpus composition

Exactly **200 unique prompts**:

- 50 `MULTI_PRODUCT_EXPLICIT`
- 50 `ORDINAL_CORRECTION`
- 50 `GROUP_REFERENCE_OVERRIDE`
- 50 `AMBIGUOUS_REFERENCE_SAFETY`

## Safety invariant

For every order and every product interpretation:

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

Ambiguous references are never mapped to a guessed product.

## Working boundaries

- AI05.3 remains **WORKING / NOT CLOSED**.
- PROFILE DATA 03 remains **WORKING / NOT CLOSED**.
- Corpus 01/02/03 remain regression layers.
- Corpus 04 is a prompt knowledge / deterministic order interpretation layer only.
- No commit / no push is implied by this package.
