# PHASE 06C.2.3.1 — Catalogue UX cleanup acceptance

Status: implementation candidate — requires local regression/build and human visual verification before lock.

## Acceptance boundary

- The manual profile editor is hidden when no explicit add/edit/duplicate action is active.
- `+ Добави ръчен профил`, `Редактирай`, and `Дублирай` are the explicit entry points for the manual editor.
- When the manual editor is closed, the catalogue list uses the full available width.
- DEMO profiles do not expose the normal `Основен за тази роля` radio control.
- DEMO profiles remain available to the explicit DEMO preset and stay visibly labelled as test-only placeholders.
- Real selectable profiles keep the active-profile control for normal product selection.
- Source evidence, human-role confirmation, rule-validation, automatic-geometry, and machine-readiness boundaries are unchanged.
- No network, persistence, machine writer, or automatic production geometry is introduced.
