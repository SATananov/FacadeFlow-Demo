# AI TRAINING LAB 06 — Single-leaf door with lower panel runtime semantics

Working training/runtime extension. Not a closure document for AI05.3 or PROFILE DATA 03.

## Goal
Teach the runtime interpretation/drawing pipeline to understand an explicit one-leaf door with an internal horizontal divider and lower opaque panel without loading a REF template at runtime.

Example human instruction:
- balcony door 900 × 2200 mm;
- one high openable leaf;
- left opening;
- internal horizontal divider;
- lower opaque panel 500 mm;
- upper zone glazed.

## Runtime semantics
- explicit `one leaf` is sufficient evidence for one top-level field;
- the lower panel remains nested inside that leaf, not a second top-level field;
- the opening symbol spans the full leaf;
- the internal divider is horizontal;
- the lower panel height is used only when explicitly supplied;
- missing lower-panel height is never invented;
- REF-11 / REF-15 are training references only and are not runtime dependencies.

## Safety boundary
- conceptual AI drawing only;
- exact profile for the internal divider remains unresolved unless supplied;
- automatic geometry authority: NO;
- rules validated: NO;
- machine ready: NO;
- production approved: NO;
- AI04 constructor handoff is blocked while nested lower-panel geometry has no lossless editable representation.
