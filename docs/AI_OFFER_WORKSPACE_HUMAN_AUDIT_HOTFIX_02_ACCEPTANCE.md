# AI Offer Workspace Human Audit Hotfix 02 — Acceptance

Status: WORKING / NOT COMMITTED

## Human Audit defects addressed

1. A combined command such as `Модул 1, 3 броя, каса 2100 х 1400 mm` created the module and quantity but could leave the geometry draft without a frame when the Bulgarian Cyrillic multiplication character `х` was used.
2. The active module selector could inherit a light global button theme, producing a nearly white card with low-contrast text.
3. A failed frame parse could still produce a non-null preview frame and therefore render an empty drawing stage instead of the explicit “frame not set” state.

## Changes

- `aiPromptModuleGeometryInterpreter.ts` now accepts Latin `x`, Cyrillic `х`, multiplication `×`, and `на` between frame dimensions.
- The unified Offer Workspace renders the geometry stage only when real frame dimensions and at least one active cell exist.
- Offer module tabs receive scoped high-contrast dark styles with sufficient selector specificity to override global light button styling.
- Regression coverage verifies the combined offer/module/quantity/frame command for `x`, `х`, and `×`.

## Safety boundaries

- Human Review remains mandatory.
- RULES VALIDATED = NO.
- AUTOMATIC GEOMETRY = NO.
- MACHINE READY = NO.
- PRODUCTION APPROVED = NO.
- No commit / no push.
