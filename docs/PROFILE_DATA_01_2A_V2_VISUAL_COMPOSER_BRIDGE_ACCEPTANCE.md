# PROFILE DATA 01.2A V2 — Exact Visual Composer Bridge Acceptance

## Why V2 exists
The first 01.2A wiring correctly connected the registered profile-system overlap resolver to `CustomProductDesigner`, but the human audit was performed in the separate template-based `VisualTemplateComposer`.

V2 bridges the same resolver into that exact route. It does not create a second overlap formula.

## Accepted bridge
- `StructuredConfigurationWizard` passes the already available `profiles` collection into `VisualTemplateComposer`.
- `VisualTemplateComposer` resolves the active system only from the confirmed configuration profile IDs:
  - `frameProfileId`
  - `sashProfileId`
  - `mullionProfileId`
- PRELUDE 60 resolves to the currently registered 7 mm human-reviewed working value.
- Mixed, missing or unregistered systems get no automatic overlap.
- The exact Visual Composer displays an audit readout with system, overlap and the production-confirmation warning.

## Important boundary
This V2 is the exact-route bridge and visual audit readout.

It does **not** yet claim that the template composer's own legacy conceptual SVG has been converted into measured profile-band geometry. That renderer is a separate geometry implementation from `CustomProductDrawing`.

Therefore Human Audit for V2 checks:
1. PRELUDE 60 appears in the exact Visual Composer.
2. `Застъпване на крилото: 7 mm` appears.
3. the value is labelled as a working human-reviewed value, not production confirmation.
4. DEMO/mixed/unregistered systems do not inherit 7 mm.

Measured 42→35 / 40→33 / 40→26 profile-band rendering in the template composer must be a following renderer-specific step, reusing the already accepted PROFILE DATA 01.2 geometry functions rather than duplicating formulas.

## Safety
- no automatic profile selection;
- no inferred system;
- no global 7 mm fallback;
- no machine output;
- `machineReady` stays false;
- `productionApproved` stays false.
