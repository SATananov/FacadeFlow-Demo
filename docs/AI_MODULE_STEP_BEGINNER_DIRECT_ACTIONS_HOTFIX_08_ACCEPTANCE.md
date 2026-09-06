# Human Audit Hotfix 08 — Module Step Beginner Direct Actions

Status: WORKING / NOT COMMITTED

## Human-audit defect

Step 3 (`Модули и бройки`) told a beginner to use the AI assistant above and displayed `НЕПЪЛНО` even when no modules existed. The user had to scroll/search for the correct control and the term “module” was not explained at the point of use. Existing modules also lacked obvious direct actions.

## Accepted UX behavior

- Empty state says there are no modules and shows **＋ Създай първи модул**.
- The button presets `CREATE_MODULE` and scrolls directly to the guided assistant.
- Zero modules shows **Общо изделия: 0** with a neutral explanation.
- A compact `?` explains what a module is in beginner language.
- Existing modules are presented as clear cards with size, quantity and review state.
- Each module exposes **Отвори / ✎ Редактирай / Копирай**.
- Step 3 also exposes **＋ Добави модул** without requiring manual scrolling.
- Copy can preset the exact source module.
- The already verified offer/geometry/completeness runtime is not granted any new production authority.

## Safety boundary

- RULES VALIDATED = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO
- AI05.3 = WORKING / NOT CLOSED
- PROFILE DATA 03 = WORKING / NOT CLOSED
- NO COMMIT / NO PUSH

## Expected local boundary after apply

- 168 total test files
- 19 internal excluded
- 149 shareable test files
