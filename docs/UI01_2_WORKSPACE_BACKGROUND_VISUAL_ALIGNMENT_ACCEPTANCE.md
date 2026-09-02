# UI01.2 — Workspace Background & Visual Alignment — Acceptance

## Scope

UI01.2 is a styling-only consolidation pass on top of UI01.1. It aligns the light engineering workspaces without changing domain logic, saved data, AI decisions, geometry, imports, profile evidence, rules or production boundaries.

Aligned workspaces:

- Constructor start screen
- Import format chooser
- Projects library foundation
- Profile Catalogue page field
- Help workspace

AI intentionally keeps its specialized dark workbench while continuing to use the shared FacadeFlow header/safety shell.

## Visual contract

- The light workspaces share one quiet technical-grid background.
- The principal desktop content width is capped at 1280 px with responsive side margins.
- Constructor, Import and Projects use the same family of white engineering cards, border weight and restrained shadow.
- Projects tabs have a stronger selected state without adding decorative warning colors.
- The Projects safe-reuse explanation remains secondary to the library itself.
- The disabled `+ Нов проект` action is visibly unavailable until PROJECT01.
- Help uses a centered reading/work area rather than an unbounded full-width document field.
- Catalogue remains deliberately data-dense and is not forced into a narrow card layout.

## Safety boundary

UI01.2 adds CSS only plus an import, acceptance test and documentation. It adds no:

- persistence or backend;
- AI similarity or automatic project reuse;
- product/constructor geometry behavior;
- rule-validation authority;
- machine connection or production export;
- production approval or machine-ready state.

## Acceptance checks

Run:

```powershell
npm run test:ui01_1
npm run test:ui01_2
npm run lint
npm run build
git diff --check
```

Human visual audit:

1. Constructor and Projects should visibly belong to the same light engineering workspace family.
2. Import should use the same grid field and centered desktop rhythm.
3. Projects tabs should clearly show the active filter.
4. The `+ Нов проект` action must read as disabled.
5. Help should remain calm and readable with a bounded content area.
6. Catalogue must remain usable as a wide data workspace.
7. No functional workflow should change.
