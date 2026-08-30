# PHASE 06B.2.1 + 06B.2.2 — Unified CAD + AI Visual System

## Scope

This checkpoint is visual/UX-only. It establishes a shared professional CAD/AI visual language and upgrades the AI intake launchpad without changing product geometry, import interpretation, CAD editing behavior, AI safety boundaries, persistence, networking, or machine/export behavior.

## 06B.2.1 — Unified application shell

- The main FacadeFlow header uses a compact technical navigation dock.
- AI, Product Designer, Import, Profile Catalogue and Help use one consistent outline SVG icon family.
- The Nadezhda brand remains visible and unchanged as the supplied brand asset.
- Simulation-only and local-application badges remain visible.
- Existing navigation callbacks are reused; no new routing/backend dependency is introduced.
- Existing profile workspace, operations workspace and drawing logic remain unchanged.

## 06B.2.2 — AI launchpad

- The AI workspace uses the same dark industrial/CAD visual language as the application shell.
- Job scopes remain exactly: BUILDING, HOUSE, SMALL_PROJECT, SINGLE_PRODUCT, CUSTOM_ORDER and TECHNICAL_DETAIL.
- Each scope has a technical outline icon plus a deterministic inline SVG blueprint preview.
- Blueprint previews are decorative UI only. They are not generated geometry and do not modify product state.
- Input modes remain exactly: DOCUMENTS, DESCRIPTION, SKETCH and MANUAL.
- Existing AI intake state transitions and human-gate behavior remain unchanged.
- Knowledge Base navigation remains available.

## Safety boundaries preserved

- `aiModelStatus = NOT_CONNECTED`
- `automaticGeometryAllowed = false`
- `humanReviewRequired = true`
- `rulesValidationRequired = true`
- `sourceEvidenceRequired = true`
- `productionApproved = false`
- no backend or network API added
- no machine communication added
- no production file generation added

## Human visual audit

Verify at desktop width:

1. Main app header is readable and all five navigation actions are visible and usable.
2. FacadeFlow AI opens from the new icon dock.
3. AI header and safety/status rails remain clearly readable.
4. Six job cards render with distinct technical icons and blueprint previews.
5. Selecting any job card still reveals metadata + four input modes.
6. Input-mode selection and existing destination buttons still work.
7. AI model remains visibly disconnected and no automatic geometry occurs.
8. Main legacy workspace below the shell remains functionally unchanged.

Responsive check:

- navigation dock remains usable through horizontal overflow on narrow desktop/tablet widths;
- AI job cards collapse from 3 → 2 → 1 columns;
- AI input cards collapse cleanly;
- no critical action is hidden solely because of viewport width.
