# UI01.1 — Unified Application Navigation + Projects Foundation

Status: IMPLEMENTED / TECHNICAL VERIFY REQUIRED

## Scope

UI01.1 adds **Projects / Проекти** as a first-class FacadeFlow workspace and places it in the unified main navigation:

`AI → Конструктор → Импорт → Проекти → Каталог → Помощ`

The phase is intentionally visual and architectural only. It does **not** implement project persistence, lifecycle storage, similarity search, reusable-template copying, backend services, machine output, or production approval.

## Projects workspace foundation

The workspace introduces four future project groups with zero-state counts:

- Активни
- За преглед
- Завършени
- Шаблони

It also provides local UI tabs for `Всички / Активни / За преглед / Завършени / Шаблони`. The tabs only change the empty-state explanation; they do not create or persist data.

The **+ Нов проект** action is visible but disabled and explicitly identifies PROJECT01 as the future phase that will activate project creation.

## Reuse boundary

UI01.1 makes the future reuse rule visible before any reuse logic exists:

- a completed project is historical evidence;
- a completed project does not automatically become a template;
- only an explicitly approved reusable example may become a template;
- future AI similarity may recommend comparable projects, but similarity must not mean validity and must not auto-copy a project.

## Safety boundary

UI01.1 adds no:

- backend;
- database or browser persistence;
- network calls;
- AI model calls;
- similarity engine;
- automatic project copying;
- production unlock;
- machine-ready authority;
- machine/CNC export.

Existing AI01–AI04, rule-gate and production-safety boundaries remain unchanged.

## Changed surface

- `src/App.tsx`
- `src/components/FacadeFlowIcons.tsx`
- `src/components/ProjectsWorkspace.tsx`
- `src/projectsWorkspace.css`
- `tests/ui01_1ProjectsNavigation.test.ts`
- `docs/UI01_1_UNIFIED_NAVIGATION_PROJECTS_FOUNDATION_ACCEPTANCE.md`
- `package.json` (test script only)

## Verification

Run:

```powershell
npm run test:ui01_1
npm run lint
npm run build
git diff --check
git status --short
```

Expected UI01.1 test result: all tests pass.

Expected safety result: no persistence/network/production authority introduced by Projects.
