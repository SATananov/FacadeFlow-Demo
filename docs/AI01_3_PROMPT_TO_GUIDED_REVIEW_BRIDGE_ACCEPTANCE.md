# AI01.3 — Prompt → Guided Review Bridge — Acceptance

## Goal

Move only compatible scalar prompt-intent values into the existing Guided AI Product Builder so a human can inspect/correct them using the established product workflow.

## Accepted behavior

- Known catalogue systems/profiles are matched only when an exact selectable catalogue value exists.
- Unknown systems/profile codes remain manual review values.
- Width, height, quantity, single-field opening, glazing, finish and compatible hardware metadata can populate the guided draft.
- The guided draft remains `NEEDS_REVIEW` with `reviewAccepted = false`.
- Prompt provenance is preserved in notes.
- Multi-field topology is intentionally **not** converted to automatic guided/CAD geometry.

## Safety boundary

The bridge is a review-data transfer only. It does not confirm a product, validate engineering rules, create machine instructions, or unlock production.

## Verification

`npm run test:ai01_3`
