# PROJECT01.3 — Project Detail / Lifecycle Actions Foundation — Acceptance

## Status

Implementation candidate for human verification.

## Scope

PROJECT01.3 exposes the already-defined PROJECT01.1 lifecycle contract inside the PROJECT01.2 session project workspace. It adds a selected-project detail panel and explicit human-driven lifecycle actions. It does not add persistence, project similarity, automatic reuse, archive/reuse decision UI, backend services, machine output, engineering authority, or production unlock.

## Delivered behavior

- The project selected in the session library opens a detail panel inside Projects.
- Closing the detail explicitly clears `selectedProjectId` without deleting the project.
- DRAFT can be explicitly started and becomes ACTIVE.
- ACTIVE can be explicitly sent to NEEDS_REVIEW.
- NEEDS_REVIEW requires a named human reviewer before the review can be confirmed.
- NEEDS_REVIEW can be returned to ACTIVE; doing so invalidates the previous review confirmation through the canonical PROJECT01.1 transition.
- COMPLETED is reachable only after human review is confirmed.
- COMPLETED remains a historical lifecycle status and does not become a template automatically.
- Reuse remains `NOT_REVIEWED` unless a later separate phase exposes the existing explicit reuse-decision contract.

## Architecture

`src/projectLifecycle.ts` remains the canonical project domain and transition authority.

`src/projectLifecycleActions.ts` is a thin library-level adapter. It locates the requested session project, delegates to the canonical PROJECT01.1 mutation functions, and immutably replaces the project in `ProjectLibraryState`.

`src/components/ProjectDetailPanel.tsx` is presentation and human-input UI only. It does not implement transition rules itself.

`ProjectsWorkspace.tsx` owns only workspace orchestration: selected project, UI blockers, current timestamp, and passing explicit user actions to the lifecycle adapter.

## Safety boundaries

The phase must preserve all of the following:

- `sessionOnly: true`
- `backendPersisted: false`
- `similaritySearchEnabled: false`
- `machineReady: false`
- `productionApproved: false`
- `productionExecutable: false`
- `automaticReuseAllowed: false`

A lifecycle status, including `COMPLETED`, is not engineering approval, machine readiness, production approval, or template authority.

No new use of `localStorage`, `sessionStorage`, IndexedDB, `fetch`, XMLHttpRequest, WebSocket, backend APIs, or external AI services is introduced.

## Automated acceptance

`tests/project01_3ProjectDetailLifecycleActions.test.ts` verifies:

1. explicit selected-project resolution;
2. DRAFT -> ACTIVE;
3. ACTIVE -> NEEDS_REVIEW;
4. lifecycle shortcut blocking;
5. named human reviewer requirement;
6. return-to-ACTIVE review invalidation;
7. completion only after human review;
8. production safety flags throughout the lifecycle;
9. detail wiring through canonical library mutations;
10. explicit visible lifecycle actions;
11. visible session/safety boundaries;
12. responsive detail styling;
13. absence of persistence/network/similarity/production unlock implementation.

The canonical repository verification remains `npm run verify`.

## Human audit

Create one session project and verify this sequence:

1. Select/open the DRAFT project and confirm its detail panel is visible.
2. Click **Стартирай проект** and confirm status becomes ACTIVE.
3. Click **Изпрати за човешки преглед** and confirm status becomes NEEDS_REVIEW.
4. Attempt review confirmation with an empty reviewer and confirm it is blocked.
5. Enter a reviewer name and optional note; confirm the human review.
6. Confirm **Завърши проект** becomes available only after that confirmation.
7. For one trial, use **Върни за редакция** and confirm status returns to ACTIVE and the prior review is invalidated; then repeat review and confirmation.
8. Complete the project and confirm it becomes COMPLETED while the Templates counter remains unchanged.
9. Close the detail and reselect the project; confirm the lifecycle state remains in the current app session.
10. Reload the browser and confirm the project library is still intentionally cleared because persistence is out of scope.

## Explicitly deferred

- archive action UI;
- reusable-template approve/reject UI;
- persistence/database;
- project similarity search;
- automatic copying from source evidence or prior projects;
- project product editing and placement;
- production or machine execution.
