# AI PROMPT KNOWLEDGE CORPUS 14 — Offer Runtime + Module Defaults Integration

Status: **WORKING / NOT COMMITTED / NOT CLOSED**

## Purpose

Corpus 14 connects the verified offer-default semantics from Corpus 05 with the verified multi-module interactive runtime from Corpus 13:

**Client → Offer defaults → Module 1 / Module 2 / Module 3... → local overrides → effective settings**

The layer remains deterministic, local, simulation-only and Human-Review gated.

## Runtime contract

- offer defaults may carry profile system, finish, glazing, hardware, handle and hinge information;
- every module inherits available offer defaults unless that module has an explicit local override for the same field;
- a module-local override never leaks to sibling modules;
- an explicit offer-wide revision updates inherited values across modules;
- an offer-wide revision never clobbers an explicit module override;
- a copied module receives an independent copy of the source module overrides;
- later changes in the copied module do not mutate the source module;
- a shared-setting command with no explicit offer/module scope is `REVIEW_REQUIRED` and causes no mutation;
- conflicting shared settings are `REVIEW_REQUIRED` and are not silently resolved;
- geometry remains delegated to the already verified multi-module runtime;
- module geometry state and offer settings remain separate concerns.

## UI binding

A new `OfferModulesInteractiveRuntimePanel` is mounted in the FacadeFlow AI description workspace. It exposes:

- current offer defaults and revision;
- module tabs;
- effective settings per module;
- explicit `НАСЛЕДЕНО` versus `OVERRIDE` markers;
- the selected module's current geometry draft;
- offer/module command input;
- event history and review status;
- visible safety boundary.

The panel is a local draft/simulation surface only. It does not perform automatic constructor handoff, machine output or production approval.

## Corpus coverage

- `OFFER_DEFAULTS_INHERITANCE`: 50
- `MODULE_OVERRIDE_PRESERVATION`: 50
- `OFFER_WIDE_REVISION`: 50
- `SCOPE_SAFETY_AND_COPY`: 50
- **TOTAL: 200**

## Generation-sandbox verification

- Corpus 14 deterministic evaluator: **200/200 PASS**
- Pure TypeScript offer + multi-module runtime chain: **strict / noUnusedLocals / noUnusedParameters PASS**
- React/JSX Offer Modules panel: **selective TypeScript check PASS**
- Offer-wide revision preserves module overrides: **PASS**
- Copied module override independence: **PASS**
- Ambiguous setting scope causes no visible-state mutation: **PASS**
- Existing Corpus 07–13 runtime source files are unchanged from Corpus 13.

## Expected local regression boundary after apply

- total `*.test.ts`: **158**
- `*.internal.test.ts`: **19**
- shareable regression tests: **139**

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
CORPUS 01–14 = **WORKING / NOT COMMITTED**  
NO COMMIT / NO PUSH
