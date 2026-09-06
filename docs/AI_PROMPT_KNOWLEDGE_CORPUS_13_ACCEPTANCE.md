# AI PROMPT KNOWLEDGE CORPUS 13 — Multi-Module Interactive Runtime

Status: **WORKING / NOT COMMITTED / NOT CLOSED**

## Purpose

Corpus 13 extends the verified single-module interactive command runtime into an offer-level multi-module draft workflow:

**Offer → Module 1 / Module 2 / Module 3... → independent interactive state per module**

The layer is intentionally simulation-only. It does not validate production rules, create machine output, or grant production authority.

## Runtime contract

- each module owns an independent `FacadeFlowModuleInteractiveRuntime`;
- switching modules changes only the active view and does not rebuild or overwrite sibling module state;
- stable/sparse Cell IDs remain local to each module;
- `Копирай модул 1 като модул 3` clones the current draft command history into a new independent runtime;
- an explicit copy quantity override changes only the copied module quantity;
- later changes in a copied module do not mutate the source module;
- opening a missing module is `REVIEW_REQUIRED` and causes no state mutation;
- copying into an already existing target module is `REVIEW_REQUIRED` and causes no state mutation;
- ambiguous copy/navigation language is `REVIEW_REQUIRED` and causes no state mutation;
- every multi-module command is tracked in a global session event timeline.

## UI binding

A new `MultiModuleInteractiveRuntimePanel` is mounted in the FacadeFlow AI description workspace. It exposes:

- module tabs;
- active module draft preview;
- per-module quantity, frame dimensions and active Cell IDs;
- copied-from marker;
- offer-level command bar;
- global multi-module event history;
- explicit `REVIEW_REQUIRED` feedback;
- visible safety boundary.

The panel remains local simulation/draft UI. It does not perform automatic handoff or production unlock.

## Corpus coverage

- `MODULE_CREATE_SWITCH`: 50
- `MODULE_STATE_PRESERVATION`: 50
- `MODULE_COPY_INDEPENDENCE`: 50
- `MODULE_TARGET_SAFETY`: 50
- **TOTAL: 200**

## Generation-sandbox verification

- Corpus 13 deterministic evaluator: **200/200 PASS**
- Pure TypeScript multi-module runtime chain: **strict / noUnusedLocals / noUnusedParameters PASS**
- Source module and copied module divergence after later edit: **PASS**
- Missing/duplicate/ambiguous targets produce no state mutation: **PASS**
- Older Geometry / Correction / Session / Live Preview / Editor Binding / Single Interactive runtime files are unchanged from Corpus 12.

## Expected local regression boundary after apply

- total `*.test.ts`: **157**
- `*.internal.test.ts`: **19**
- shareable regression tests: **138**

Full `npm run test:regression`, `npm run lint`, and `npm run build` must be re-run in the user-local repository after applying this delta.

## Safety boundary

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

AI05.3 = **WORKING / NOT CLOSED**  
PROFILE DATA 03 = **WORKING / NOT CLOSED**  
CORPUS 01–13 = **WORKING / NOT COMMITTED**  
NO COMMIT / NO PUSH
