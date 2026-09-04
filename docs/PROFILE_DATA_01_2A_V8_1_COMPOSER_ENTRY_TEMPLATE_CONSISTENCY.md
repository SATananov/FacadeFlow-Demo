# PROFILE DATA 01.2A V8.1 — Composer Entry / Template State Consistency

## Status

**IMPLEMENTED IN WORKING TREE — CANONICAL VERIFY + HUMAN VISUAL AUDIT REQUIRED BEFORE CLOSURE**

This hotfix was opened during the V8 human visual audit after a real workflow inconsistency was observed: a structured configuration could already identify a concrete topology (for example `Двукрилен прозорец`) while Visual Composer still opened empty and allowed a different topology to be selected locally. That produced two competing sources of truth.

## Scope

V8.1 is deliberately narrow. It does not change PRELUDE base dimensions, overlap values, effective-geometry mathematics, production authority or Door DEMO safety semantics.

It adds an explicit `composerTemplateId` bridge to the structured configuration and enforces these entry rules:

1. A concrete window preset auto-seeds the matching window composition when Visual Composer opens.
2. A concrete door preset auto-seeds the matching Door DEMO composition when that safe DEMO route opens.
3. A generic / no-preselected-composition entry remains empty so the user can choose locally from the Composer library.
4. If topology is explicit in structured configuration, the Composer library cannot silently replace it with another topology.
5. Reset in explicit-topology mode resets edits to the same topology instead of deleting the canonical topology.
6. Changing an explicit topology in the structured step re-seeds the new topology on the next Composer entry.
7. Switching explicitly from a selected topology to generic clears a previously auto-seeded topology on the next entry.
8. Renaming the product label does not silently clear the selected topology.
9. Category-incompatible template IDs are reconciled to `null` rather than crossing WINDOW/DOOR boundaries.
10. Door DEMO initialization remains derived and does not mutate the source structured configuration.

## Safety boundaries

Unchanged from V8:

- no automatic engineering approval;
- no machine readiness;
- no production approval;
- no production export unlock;
- PRELUDE 7 mm overlap remains a human-reviewed working value only;
- PRELUDE door-sash catalogue entries remain unresolved/unmapped unless separately human-confirmed;
- Door DEMO threshold remains unresolved and DEMO-only.

## Regression evidence required

The V8.1 regression layer must cover:

- all visible WINDOW presets map to compatible Composer templates;
- all visible DOOR presets map to compatible Door Composer templates;
- explicit double/triple/quad topology auto-seeds correctly;
- explicit topology changes re-seed correctly;
- explicit → generic clears only the previously auto-seeded composition;
- generic local template selection remains local and can persist when reopening generic Composer;
- wrong-category template IDs are rejected/reconciled;
- explicit topology library switching is locked;
- Door DEMO explicit/generic entry behavior preserves the existing source-state safety boundary.

## Human visual audit before closure

At minimum verify:

1. Explicit Double window opens directly as Double.
2. Explicit Triple window opens directly as Triple.
3. Explicit Quad window opens directly as Quad.
4. Generic Window opens empty and exposes the normal template library.
5. Explicit Window cannot silently be changed to another topology from the library.
6. Explicit Door DEMO opens directly with the matching door topology.
7. Generic Door DEMO opens empty.
8. Returning from Door DEMO leaves the source PRELUDE configuration unchanged and threshold unresolved.
9. Recheck the V8 geometry invariants: Triple two-sided mullions = 26 mm; Triple open/fixed/open one-sided mullions = 33 mm.

Only after canonical `npm run verify`, this human audit and clean/staged Git checks may V8 + V8.1 be committed and treated as a closed checkpoint.
