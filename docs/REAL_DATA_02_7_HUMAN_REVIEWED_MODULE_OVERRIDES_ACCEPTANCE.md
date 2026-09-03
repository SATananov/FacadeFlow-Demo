# REAL DATA 02.7 — Human-reviewed Module Overrides / Special Cases

## Purpose

REAL DATA 02.7 adds a safe, human-reviewed layer for module-specific exceptions after REAL DATA 02.6 has explicitly confirmed offer applicability.

Typical examples:
- a special glazing package for one module;
- a different system/profile for one position;
- a module-specific color;
- hardware, reinforcement, fill or notes that differ from the surrounding product group.

## Contract

An override is accepted only when:

1. the offer variant exists;
2. the module exists;
3. REAL DATA 02.6 explicitly marks that variant as `APPLIES` for that module;
4. the override value is non-empty;
5. at least one valid source evidence reference is supplied;
6. reviewer identity and review timestamp are present.

The layer never mutates the source draft.

## Conflict rule

Two human decisions for the same:

`variantId + moduleId + field`

with different values become:

`CONFLICT_REVIEW_REQUIRED`

There is no last-write-wins behavior.

Repeated human decisions with the same value remain `RESOLVED` and retain all decision/evidence references.

## Supported override fields

- `SYSTEM`
- `COLOR`
- `GLAZING`
- `HARDWARE`
- `REINFORCEMENT`
- `FILL`
- `NOTES`

## Safety boundaries

REAL DATA 02.7:
- does not infer overrides automatically;
- does not select an offer automatically;
- does not duplicate or merge modules;
- does not create a lifecycle project;
- does not mutate source evidence;
- does not allow automatic reuse;
- keeps `machineReady = false`;
- keeps `productionApproved = false`.

## Acceptance

Focused regression covers 21 cases, including:
- valid special glazing;
- separate modules/fields;
- conflicting human decisions;
- evidence validation;
- applicability gating;
- reviewer/timestamp validation;
- duplicate ids;
- locked production boundaries.

No UI changes are part of REAL DATA 02.7.
