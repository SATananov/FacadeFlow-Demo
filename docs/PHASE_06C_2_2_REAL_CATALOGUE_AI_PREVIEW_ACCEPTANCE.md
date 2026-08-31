# PHASE 06C.2.2 — REAL CATALOGUE → AI BUILDER PREVIEW

Status: implementation candidate — requires local regression/build and human visual verification before lock.

## Acceptance boundary

- The Guided AI Product Builder visibly lists all four real Nadezhda / Vadim-2 source-evidence codes.
- Unreviewed source codes are visibly `LOCKED` and cannot appear in profile-system or role dropdowns.
- A source-backed profile becomes `AVAILABLE` in the preview only after a HUMAN CONFIRMED role exists in the catalogue.
- HUMAN CONFIRMED role availability does not imply expert approval, rule validation, production approval, automatic geometry, or machine readiness.
- The preview never auto-selects a profile, never infers a role, and never mutates the guided product draft.
- The catalogue remains the only place where source-evidence roles are reviewed and confirmed.
- No network, persistence, machine writer, or automatic production geometry is introduced.
