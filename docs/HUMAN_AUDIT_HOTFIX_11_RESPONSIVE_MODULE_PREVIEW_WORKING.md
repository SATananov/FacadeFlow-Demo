# Human Audit Hotfix 11 — Responsive Module Preview (WORKING)

## Trigger
Human Audit screenshots after Hotfix 10 showed a real responsive defect in the One-click QA Demo: when the browser/workspace is zoomed out, the surrounding UI becomes smaller but the module cell preview expands to a very large height.

## Root cause
`ff-offer-module-stage` used the real frame `aspect-ratio` while also taking the full available workspace width. Browser zoom-out increases the CSS viewport width, so a portrait frame such as 1200 × 1400 mm became progressively taller instead of visually shrinking with the rest of the interface.

## Working fix
- Keep the true frame aspect ratio.
- Cap the preview by a stable maximum preview height of 760 CSS px.
- Derive the matching maximum width from the real frame ratio.
- Keep the stage at `width: 100%` only while the available column is narrower than that cap.
- Center the preview inside its grid column.

For the QA demo frame 1200 × 1400 mm the maximum stage size is approximately 651 × 760 CSS px. Browser zoom therefore scales the preview down together with the surrounding UI instead of letting it grow with the enlarged CSS viewport.

## Safety / scope
This hotfix changes presentation sizing only.

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO
- AI05.3 remains OPEN / WORKING
- PROFILE DATA 03 remains OPEN / WORKING
- NO COMMIT / NO PUSH during Human Audit

## Acceptance state
WORKING — requires focused regression, lint/build, and renewed visual Human Audit at normal zoom and at reduced browser zoom before closure.
