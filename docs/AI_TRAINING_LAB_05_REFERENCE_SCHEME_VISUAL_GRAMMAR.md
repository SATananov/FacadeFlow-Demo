# AI TRAINING LAB 05 — Reference Scheme Visual Grammar

Status: WORKING / NOT COMMITTED / NOT CLOSED

## Goal

Use the existing REF-01…REF-17 type schemes as **training/reference knowledge for visual construction grammar**, not as runtime templates that AI selects or copies.

The human assignment remains the source of truth:

`human description → Product Intent → Construction Graph → AI Drawing Visual Grammar → conceptual drawing`

The runtime drawing layer does **not** import `productTemplates`, does not call `getProductTemplate()`, and does not select a REF id.

## What the 17 schemes teach

- number and linear order of fields;
- fixed vs openable vs sliding roles;
- divider count/orientation;
- lower-divider/panel-zone patterns;
- canonical left/right visual semantics where direction is explicitly human/knowledge-confirmed;
- sliding visual language;
- the rule that a demonstration direction is not production truth.

## Direction safety

Canonical FacadeFlow convention used by AI drawing and Visual Composer:

- LEFT opening → `>` visual side symbol;
- RIGHT opening → `<` visual side symbol;
- TILT-TURN combines the side symbol with the tilt symbol;
- missing LEFT/RIGHT remains unresolved; AI does not invent a side.

Legacy `openingNotation` values inside old reference data are not consumed as production truth. Confirmed semantic direction and the human prompt take precedence.

## Generalization requirement

The knowledge layer is deliberately not limited to REF-01…REF-17. Regression coverage includes an unseen five-field topology:

`FIXED | TURN LEFT | FIXED | TURN RIGHT | FIXED`

The same grammar must draw this topology even though there is no matching ready-made REF scheme.

## Safety boundary

- REFERENCE TEMPLATE USED AT RUNTIME = NO
- AUTOMATIC MISSING DIRECTION INFERENCE = NO
- EXACT PRODUCTION GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO
