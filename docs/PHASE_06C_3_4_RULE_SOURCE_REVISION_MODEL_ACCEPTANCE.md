# PHASE 06C.3.4 — Rule Source & Revision Model Acceptance

## Goal
Prepare the provenance, revision, scope, and repeat-review model that every future real engineering rule must use before rule values are introduced.

## Accepted behavior
- The 06C.3.3 rules gate starts with an empty source registry: `0` source records and `0` human-confirmed source records.
- No rule-set revision is created while there are no confirmed real source records.
- A future source record identifies its rule category, source kind, title, document/reference, exact location, revision, system/scope, and source date.
- Human confirmation is separate metadata: reviewer, review timestamp, and optional note.
- Empty or incomplete source records remain `NEEDS_REVIEW` and cannot become `HUMAN_CONFIRMED`.
- Changing source identity/reference, source location, revision, system/scope, source date, or source kind invalidates an existing human confirmation and requires repeat review.
- Editing only a review note does not change source identity and therefore does not invalidate a confirmed source.
- A human-confirmed source is still only a confirmed source. It does not validate an engineering rule, the full rule set, or the product.
- The UI exposes the required provenance fields and repeat-review policy but does not create fake sources or fake rules.

## Safety boundary
`SOURCE HUMAN_CONFIRMED` ≠ `RULE VALIDATED` ≠ `RULE SET VALIDATED` ≠ `MACHINE_READY`.

No network, persistence, automatic geometry, machine writer, production export, numeric rule value, compatibility decision, or manufacturer rule is introduced.
