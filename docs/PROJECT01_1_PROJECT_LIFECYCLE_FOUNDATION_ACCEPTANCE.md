# PROJECT01.1 — Project Lifecycle Contract & In-Memory State Foundation

Status: IMPLEMENTED / TECHNICAL VERIFY REQUIRED

Baseline: `764a4a4` (`SHAREABLE_CLEAN`)

## Goal

Introduce the first canonical FacadeFlow lifecycle model for user-created projects without activating project creation in the UI and without crossing the existing AI/rule/production safety boundaries.

This phase is intentionally a **domain/state foundation**. It does not add backend storage, browser persistence, similarity search, reusable-template copying, project creation dialogs, or production authority.

## Canonical project contract

`ProjectRecord` owns:

- stable project `id`;
- human-entered `name` and `reference`;
- optional explicit existing `FacadeFlowJobType` (`null` when unresolved; never guessed);
- explicit lifecycle status;
- source/evidence links;
- stable product membership links;
- explicit project-level human review metadata;
- a separate reusable-template decision;
- deterministic created/updated timestamps supplied by the caller;
- session-only and production-safety invariants.

Source evidence is linked by stable references. PROJECT01.1 does not copy or promote source evidence into a trusted project fact automatically.

Product membership stores stable product ids, optional placement-node ids, origin, and product review status. It does not copy machine or production authority into the project record.

## Lifecycle

Allowed transitions are deliberately narrow:

`DRAFT -> ACTIVE -> NEEDS_REVIEW -> COMPLETED -> ARCHIVED`

A reviewed project may return from `NEEDS_REVIEW` to `ACTIVE`; doing so invalidates the previous project-level review and requires a new review before completion.

The phase blocks:

- lifecycle shortcuts;
- completion without explicit human-confirmed project review;
- reuse/template approval before completion.

## Reuse boundary

A completed project remains a historical project by default.

Completion does **not**:

- make the project a template;
- enable automatic reuse;
- validate similarity;
- copy the project into another job.

Reusable-template status requires a separate explicit human decision after completion. Even an approved reusable project keeps `automaticReuseAllowed: false`; later reuse must remain an explicit user action.

## In-memory library state

`ProjectLibraryState` provides a small pure state foundation for later Projects-workspace integration:

- session project list;
- selected project id;
- unique id/reference enforcement;
- immutable add/replace/select operations;
- no storage adapter.

No React UI wiring is introduced in PROJECT01.1. `+ Нов проект` remains disabled until a later PROJECT01 slice integrates the contract into the Projects workspace.

## Safety invariants

PROJECT01.1 hard-codes the following boundaries:

- `sessionOnly: true`;
- `backendPersisted: false`;
- `similaritySearchEnabled: false`;
- `automaticReuseAllowed: false`;
- `machineReady: false`;
- `productionApproved: false`;
- `productionExecutable: false`.

It introduces no:

- backend;
- database;
- `localStorage`, `sessionStorage`, IndexedDB or filesystem persistence;
- network calls;
- AI model calls;
- similarity engine;
- automatic template promotion;
- machine communication;
- production instruction generation;
- modification of AI01–AI04, WP78 or RP01 authority contracts.

## Changed surface

- `src/projectLifecycle.ts`
- `tests/project01_1ProjectLifecycle.test.ts`
- `docs/PROJECT01_1_PROJECT_LIFECYCLE_FOUNDATION_ACCEPTANCE.md`

No existing repository file is modified in this slice. PROJECT01.1 is added as an isolated foundation so the accepted `764a4a4` baseline remains untouched outside the three new files.

## Verification

Run:

```powershell
npm run test:regression
npm run verify
git diff --check
git status --short
```

Expected PROJECT01.1 result: all lifecycle tests pass.

Expected full result: the full regression, lint and production build remain green with only previously accepted inherited warnings.

## Next slice

After PROJECT01.1 is technically verified and accepted, the next slice should be:

**PROJECT01.2 — Project Creation & Projects Workspace Integration**

That phase may wire this in-memory contract into `ProjectsWorkspace`, but it must still remain session-only and must not add backend persistence, similarity execution, automatic reusable-template copying, or production authority.
