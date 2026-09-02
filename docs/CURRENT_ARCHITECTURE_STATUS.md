# FacadeFlow — Current Architecture Status

**Source-of-truth status document**

Baseline independently audited: `42e26f8`
Baseline scope: through `UI01.2B`, `AI01–AI04`, `WP78 / REAL DATA BATCH 01`, and `RP01.21`.

This file records the **current accepted architecture state**. Older phase acceptance files remain historical evidence and may preserve wording such as `READY FOR HUMAN AUDIT`, `TECHNICAL VERIFY REQUIRED`, or `HUMAN VISUAL VERIFY REQUIRED` from the moment they were written. Those historical labels do not override this current status.

## Current accepted state

| Area | Current status | Boundary |
| --- | --- | --- |
| UI01.1 | ACCEPTED | Unified navigation + Projects foundation only |
| UI01.2 | ACCEPTED | Visual alignment only |
| UI01.2A | ACCEPTED | Projects/source context separated from normalized Catalogue records |
| UI01.2B | ACCEPTED | Source-project visual encoding / UTF-8 presentation fix |
| AI01 | CLOSED / ACCEPTED | Prompt → canonical Product Intent; unresolved values remain unresolved |
| AI02 | CLOSED / ACCEPTED | Document evidence → same canonical Product Intent; conflicts stay human-reviewed |
| AI03 | CLOSED / ACCEPTED | Parametric proposal only; no automatic constructor or production authority |
| AI04 | CLOSED / ACCEPTED | Explicit human-reviewed editable handoff only |
| WP78 | CLOSED / ACCEPTED FOUNDATION | Evidence-aware contextual review; no generic production authority |
| RP01.1–RP01.21 | CLOSED / ACCEPTED FOUNDATION | Evidence/simulation/read-only authority groups only |

## Safety invariants

The following remain non-negotiable across the accepted architecture:

- Human review is required before AI proposal handoff to editable constructor geometry.
- `HUMAN_REVIEWED` is not engineering approval and is not production approval.
- Project/source evidence is not automatically promoted to a normalized catalogue fact or generic rule.
- `VALIDATED_FOR_CONTEXT` is context-only.
- No accepted phase may set `machineReady`, `productionApproved`, `productionExecutable`, `engineeringAuthorityGranted`, or equivalent production authority automatically.
- No machine communication or production instruction generation is authorized.
- Real local evidence remains private and must not be included in a `SHAREABLE_CLEAN` checkpoint.

## Canonical verification

The canonical repository verification command is:

```bash
npm run verify
```

It runs:

1. every `tests/*.test.ts` file through `npm run test:regression`;
2. `npm run lint`;
3. `npm run build`.

For a closure/checkpoint, also run:

```bash
git diff --check
git status --short
```

A clean checkpoint must be created only from a clean Git working tree.

## Checkpoint packaging classes

Two explicit package classes are supported:

### `SHAREABLE_CLEAN`

Use:

```powershell
npm run checkpoint:shareable
```

This package excludes private evidence including `local-samples/`, `*.dwg`, and `*.lte`, in addition to Git metadata, dependencies, build output, runtime output, coverage, environment files, logs, and temporary files.

### `INTERNAL_AUDIT`

Use:

```powershell
npm run checkpoint:internal
```

This package may retain private local evidence for a controlled internal audit, but it still excludes Git metadata, dependencies, build/runtime output, coverage, environment files, logs, and temporary files.

## Next major phase

The next major product phase is:

**PROJECT01 — Project Lifecycle**

The first implementation slice should be **PROJECT01.1 — Project Lifecycle Contract & In-Memory State Foundation**.

PROJECT01.1 must begin with typed domain/state contracts and deterministic lifecycle transitions. It must remain session-only/in-memory initially and must not add backend persistence, similarity search, automatic reusable-template promotion, machine output, or production approval.
