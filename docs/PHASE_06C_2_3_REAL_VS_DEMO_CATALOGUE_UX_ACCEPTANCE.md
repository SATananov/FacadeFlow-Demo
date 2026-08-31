# PHASE 06C.2.3 — REAL vs DEMO CATALOGUE UX

Status: implementation candidate — requires local regression/build and human visual verification before lock.

## Acceptance boundary

- Guided AI visually separates `РЕАЛЕН КАТАЛОГ · НАДЕЖДА` from `ДЕМО КАТАЛОГ · САМО ЗА ТЕСТ`.
- Normal Guided AI system/profile dropdowns use only selectable non-demonstration profiles.
- Demonstration profiles remain available only when the guided draft is explicitly in DEMO mode (for example through the `ДЕМО` preset).
- HUMAN CONFIRMED Nadezhda source-evidence profiles become eligible for normal real-catalogue dropdowns without automatic selection.
- Pending/unconfirmed source evidence remains visible but locked.
- The profile catalogue groups promoted real profiles separately from demonstration placeholders.
- No role inference, automatic geometry, rule validation, persistence, network behavior, machine export, or production approval is introduced.
