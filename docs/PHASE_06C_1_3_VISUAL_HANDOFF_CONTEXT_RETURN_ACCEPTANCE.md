# PHASE 06C.1.3 — Visual Handoff + Contextual Return

## Goal
Make the HUMAN CONFIRMED AI → Constructor transition visually understandable and preserve the user's previous AI context when navigating back.

## Acceptance
- The handoff carries the confirmed width and height as immutable source evidence.
- The constructor shows a proportional conceptual SVG preview beside the transferred evidence.
- Preview uses only confirmed product type, dimensions and opening evidence.
- A selected mullion is not drawn when its position is unknown; the UI states that the position is unresolved.
- The handoff panel is visually unified with the FacadeFlow workspace instead of appearing as a detached white data table.
- Type, size and quantity are prominent in the handoff summary.
- When the constructor was opened from a HUMAN CONFIRMED AI draft, header/back navigation returns to that AI workspace and preserves the draft.
- Direct constructor entry from the main FacadeFlow page continues to return to the main page.
- Rules remain unvalidated, automatic geometry remains disabled, and machine-ready remains false.
- No network, persistence, DWG writer, machine writer or production export is introduced.
