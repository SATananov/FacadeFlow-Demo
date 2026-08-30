# PHASE 06B.2.3 — Unified FacadeFlow Workspace Shell

## Purpose
Unify the visual and navigation shell of the main FacadeFlow workspaces without changing geometry, import interpretation, AI state, catalogue semantics or production boundaries.

## Visual authority
The FacadeFlow AI workspace is the reference implementation for the application shell.

## Accepted top-level workspaces
- FacadeFlow AI
- Конструктор на изделие
- Импорт на проект / чертеж
- Каталог на профилите
- Помощ
- Нестандартно изделие / Custom CAD

## Shell rules
1. Every top-level workspace uses the same technical dark header language.
2. Every top-level workspace shows its section icon, Bulgarian eyebrow/title/subtitle, a consistent back action and the Nadezhda logo at the upper-right.
3. Import, Catalogue and Help no longer present as floating white windows over the underlying FacadeFlow screen; they occupy the full application workspace.
4. The underlying FacadeFlow page stays locked while a top-level workspace is active.
5. Each workspace has one intentional top-level scroll policy. Local scroll remains allowed only for functional content such as CAD/document viewports, inspector lists or Help navigation/content.
6. Custom CAD keeps its existing DrawingWorkspaceShell, CAD viewport, pan/zoom, line/snap/grip/history behaviour and properties logic.
7. AI safety gates and NOT_CONNECTED state are unchanged.
8. No backend, network, machine-ready shortcut, production export or automatic geometry is introduced.

## Human visual audit
Verify at desktop width:
- AI header uses the unified shell and Nadezhda logo is on the right.
- Constructor uses the same header language.
- Import is full-screen and the base application is not visible behind it.
- Catalogue is full-screen and the base application is not visible behind it.
- Help is full-screen and retains readable internal navigation.
- Custom CAD is full-screen and retains the drawing workspace layout.
- Back actions return to the FacadeFlow main screen.
- No top-level section feels like a separate application or a modal layered over another main section.
