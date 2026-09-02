# PROJECT01.2 — Project Creation & Projects Workspace Integration

Status: IMPLEMENTED / TECHNICAL VERIFY REQUIRED

Baseline: `9993702` (`SHAREABLE_CLEAN`)

## Goal

Wire the accepted PROJECT01.1 in-memory lifecycle contract into the Projects workspace without adding persistence, similarity execution, automatic reuse, AI authority, machine output, or production approval.

PROJECT01.2 activates the previously disabled `+ Нов проект` action and introduces only the minimum safe session workflow:

- human-entered project name;
- human-entered unique project reference;
- optional explicit `FacadeFlowJobType` (`null` when unresolved; never guessed);
- creation as `DRAFT` only;
- session library list;
- explicit selected/active project in the current app session;
- lifecycle summary counts and filters.

## State ownership

`ProjectLibraryState` is owned by `App` rather than by `ProjectsWorkspace`.

This is deliberate: closing and reopening the Projects workspace does not destroy the current in-memory library while the app remains open. Reloading or closing the app does destroy it because PROJECT01.2 adds no persistence adapter.

The existing legacy `project` string used elsewhere in the demo is not silently replaced or coupled to the new lifecycle library in this slice.

## Creation boundary

The UI calls the canonical PROJECT01.1 functions:

- `createProjectRecord`;
- `addProjectToLibrary`;
- `selectProjectInLibrary`.

The form does not invent identity or job type. Name and reference are required. Job type is optional. Duplicate id/reference protection remains enforced by the domain library contract.

Successful creation selects the new project in the session library, but does not transition it to `ACTIVE` automatically.

## Projects workspace behavior

The workspace now shows lifecycle records separately from real source evidence.

Filters mean:

- `Активни`: `DRAFT` + `ACTIVE` current work;
- `За преглед`: `NEEDS_REVIEW`;
- `Завършени`: `COMPLETED` + `ARCHIVED` historical records;
- `Шаблони`: only projects that satisfy the explicit PROJECT01.1 human reuse decision;
- `Източници`: source evidence only, not lifecycle records.

No lifecycle transition controls are introduced in PROJECT01.2. Creation and active selection are the only new project mutations exposed by the UI.

## Source-evidence boundary

`ProjectSourceEvidence` remains a separate evidence surface.

Creating or selecting a lifecycle project does not:

- link source evidence automatically;
- copy source values into the project;
- normalize evidence into catalogue truth;
- promote a source project into a reusable template.

A later explicit phase may add human-directed linking.

## Safety invariants

PROJECT01.2 preserves:

- `sessionOnly: true`;
- `backendPersisted: false`;
- `similaritySearchEnabled: false`;
- `automaticReuseAllowed: false`;
- `machineReady: false`;
- `productionApproved: false`;
- `productionExecutable: false`.

It introduces no:

- backend or database;
- `localStorage`, `sessionStorage`, IndexedDB or filesystem persistence;
- network calls;
- AI model calls or similarity engine;
- automatic lifecycle progression;
- automatic source/project linking;
- automatic reusable-template promotion;
- machine communication;
- production instruction generation;
- change to AI01–AI04, WP78 or RP01 authority contracts.

## Changed surface

- `src/App.tsx`
- `src/components/ProjectsWorkspace.tsx`
- `src/projectWorkspaceModel.ts`
- `src/projectsWorkspace.css`
- `tests/project01_2ProjectsWorkspaceIntegration.test.ts`
- `docs/PROJECT01_2_PROJECT_CREATION_WORKSPACE_INTEGRATION_ACCEPTANCE.md`
- PROJECT01 status wording in the current architecture/PROJECT01.1 docs may be updated at closure.

## Verification

Run:

```powershell
npm run verify
git diff --check
git status --short
```

Expected PROJECT01.2 result:

- project integration tests PASS;
- full regression PASS;
- lint has 0 errors (existing accepted warnings may remain);
- production build PASS;
- no persistence or production-authority regression.

## Human audit

Verify manually:

1. open `Проекти`;
2. click `+ Нов проект`;
3. blank name/reference is blocked;
4. create a project with name/reference and optional type;
5. the project appears as `Чернова` and becomes `Активен в сесията`;
6. create a second project and select between them explicitly;
7. duplicate project reference is blocked;
8. close Projects and reopen it — session projects remain while the app is still open;
9. source evidence remains separate and unchanged;
10. reload/close the app — session project data is not persisted.

## Next slice

After PROJECT01.2 technical and human verification, the next slice should add **explicit lifecycle controls** (for example DRAFT → ACTIVE → NEEDS_REVIEW) and human-review UX without adding persistence or automatic reuse.
