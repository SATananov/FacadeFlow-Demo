# AI05.3.9 вЂ” Canonical Profile 3D Human Review Decision Gate

Status: **WORKING**
Parent: **AI05.3 OPEN / WORKING**
Source checkpoint: **d6e1a72 / AI05.3.8 CLOSED**

## Goal

Add an explicit human decision gate on top of AI05.3.8 real WebGL canonical-profile inspection evidence.

The reviewer can record one of three decisions for each current canonical profile evidence row:

- `ACCEPT`
- `REQUEST_CORRECTION`
- `REJECT`

The gate records review state only. It does **not** edit a profile assignment, infer a replacement profile, change geometry, validate production rules, or unlock production.

## Required lineage

AI05.3.9 consumes only AI05.3.8 evidence with status `READY_FOR_HUMAN_INSPECTION`.

Each decision is bound to:

- Product Intent lineage;
- real conceptual 3D scene id;
- canonical target kind / target ref;
- canonical profile code;
- current real scene node ids;
- deterministic evidence state key and row signature.

If the inspected canonical trace changes after a decision, the previous decision becomes `STALE_REVIEW_REQUIRED` and cannot count as accepted.

## Row states

- `UNREVIEWED`
- `HUMAN_ACCEPTED`
- `HUMAN_CORRECTION_REQUESTED`
- `HUMAN_REJECTED`
- `STALE_REVIEW_REQUIRED`

## Aggregate states

- `BLOCKED_CONFLICT`
- `STALE_REVIEW_REQUIRED`
- `HUMAN_REVIEW_INCOMPLETE`
- `HUMAN_CHANGES_REQUIRED`
- `HUMAN_ACCEPTED_PRODUCTION_LOCKED`

`HUMAN_ACCEPTED_PRODUCTION_LOCKED` means only that every current canonical profile в†” real conceptual 3D evidence row was explicitly accepted by a human reviewer.

It is **not** production approval.

## Negative decisions

`REQUEST_CORRECTION` and `REJECT` require an explicit human note.

Neither decision can infer or substitute another profile. A corrected profile must come through a later explicit assignment/review flow.

## Fail-closed behavior

The gate blocks or invalidates acceptance when:

- AI05.3.8 evidence is blocked;
- evidence contains conflicts;
- a review refers to a target no longer present;
- multiple active review records exist for the same target;
- the evidence state key changes;
- row signature, profile code, scene id, Product Intent lineage, or node set changes.

## UI

The real conceptual 3D workspace now shows an AI05.3.9 panel under the AI05.3.8 inspection panel.

For every canonical profile evidence row the reviewer can:

- accept the correspondence;
- request correction;
- reject as wrong profile / wrong element;
- clear the current decision.

A note field is present and is mandatory for correction/rejection.

## Safety boundary

- EXPLICIT HUMAN DECISION REQUIRED = YES
- REVIEW DECISION ONLY = YES
- STALE REVIEW INVALIDATION = YES
- PROFILE EDITING HERE = NO
- PROFILE INFERENCE = NO
- AUTOMATIC PROFILE SELECTION = NO
- AUTOMATIC SYSTEM ASSIGNMENT = NO
- AUTOMATIC GEOMETRY = NO
- EXACT PROFILE CONTOUR = NO
- PRODUCTION DEDUCTIONS = NO
- MANUFACTURING TOLERANCE = NO
- RULES VALIDATED = NO
- PRODUCTION UNLOCK = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO

## Verification

Focused verification must run:

1. AI05.3.7 real conceptual 3D tests;
2. AI05.3.8 inspection evidence tests;
3. AI05.3.9 human review gate tests;
4. lint;
5. build;
6. `git diff --check`.

No commit or push is performed by the patch scripts.
