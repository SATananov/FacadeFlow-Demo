# PHASE 06C.3.5 — Rule Set / Applicability Matrix Foundation Acceptance

## Goal
Prepare the explicit applicability dimensions that future real engineering rules will use before any manufacturer limits, compatibility values, tolerances, or production rules are introduced.

## Accepted behavior
- Rule applicability is separated into product target, system scope, and project scope.
- Supported product targets include window, door, sliding system, facade, and technical detail.
- Single-product vs structured project position is represented separately from product type.
- Exact system, system-family, all-systems, and unresolved system scopes are distinct states.
- The current DEMO session may be shown as context, but it never creates a real applicability decision.
- Every rule-category applicability row starts `UNRESOLVED` with no product targets, no system scope, no project scope, no source links, and no human confirmation.
- A future applicability decision requires at least one human-confirmed source record before it can itself be human-confirmed.
- Changing product target, system scope, project scope, applicability decision, condition, or source links invalidates prior human confirmation.
- Human-confirmed applicability does not validate the engineering rule, rule set, product, handoff, or production.

## Safety boundary
`APPLICABILITY HUMAN_CONFIRMED` ≠ `RULE VALIDATED` ≠ `RULE SET VALIDATED` ≠ `MACHINE_READY`.

No real manufacturer rule, numeric limit, compatibility decision, tolerance, network call, persistence, automatic geometry, machine writer, or production export is introduced.
