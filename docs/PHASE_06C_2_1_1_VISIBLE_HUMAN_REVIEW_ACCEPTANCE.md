# PHASE 06C.2.1.1 — Visible Human Review

Status: implementation candidate — requires local regression/build and human visual verification before lock.

## Acceptance boundary

- Clicking a Nadezhda evidence role gives immediate visible feedback on the selected card.
- The HUMAN REVIEW editor is rendered directly beneath the source-evidence block instead of being hidden below the catalogue list.
- The page scrolls the newly opened review panel into view.
- The chosen role is shown as `ПРЕГЛЕД · ...` and the active role button exposes `aria-pressed=true`.
- No source evidence is promoted until the existing explicit human confirmation flow succeeds.
- No network, persistence, machine output, automatic geometry, expert approval, or rule validation is added.
