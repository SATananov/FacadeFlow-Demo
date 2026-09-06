# AI05.3 — Construction Graph → Drawing Generation

## Purpose

AI05.3 turns the reviewable AI05.2 construction graph into a deterministic **conceptual 2D drawing proposal**. The drawing is generated from semantic construction nodes rather than from a disconnected visual template.

Core flow:

`PROMPT / DOCUMENT INTENT → AI05.2 CONSTRUCTION GRAPH → AI05.3 2D DRAWING PROPOSAL → HUMAN REVIEW`

## What the drawing knows

The preview preserves the semantic identity of visible construction elements:

- `FRAME`
- `FIELD` (`FIXED_FIELD`, `OPENABLE_FIELD`, `SLIDING_FIELD`, `PANEL_FIELD`)
- `MULLION`
- `SASH`

When exact profile references are explicitly present in the source intent, they remain attached to the corresponding drawing semantics, e.g. `FRAME 482.30`, `MULLION 482.21`, `SASH 482.05`.

**System name alone still does not infer exact profile codes.**

## Geometry basis

AI05.3 supports the safe linear subset currently represented by AI05.2:

- single field;
- linear vertical field sequences;
- linear horizontal field sequences;
- explicit divider positions when they are already present in the reviewed structured intent;
- otherwise equal field distribution **only as a visible proposal for human review**.

Mixed nested horizontal/vertical topology remains blocked for this phase rather than guessed.

## UI integration

`ParametricConstructionProposalPanel` now renders its 2D product view from the AI05.2 graph through AI05.3. The drawing carries semantic/profile labels so a reviewer can see which visible element represents frame, mullion and sash.

This is the first visible bridge from construction intelligence to automatic drawing generation.

## Training / regression batch

Eight synthetic private-safe cases cover:

- one fixed field;
- `FIX | OPEN`;
- `OPEN | FIX`;
- `FIX | OPEN | FIX`;
- explicit `482.30 / 482.05 / 482.21` semantic preservation;
- four-field alternating construction;
- sliding field semantics;
- PRELUDE system name without automatic exact profile inference.

No original private project wording or client identity is tracked in the corpus.

## Safety boundary

AI05.3 intentionally remains a proposal layer:

- `HUMAN REVIEW = YES`
- `AUTOMATIC DRAWING PROPOSAL = YES`
- `AUTOMATIC GEOMETRY = NO`
- `EXACT PROFILE CONTOUR = NO`
- `PRODUCTION DEDUCTIONS = NO`
- `MANUFACTURING TOLERANCE = NO`
- `RULES VALIDATED = NO`
- `MACHINE READY = NO`
- `PRODUCTION APPROVED = NO`

The SVG display is not a catalogue cross-section and is not production geometry.
