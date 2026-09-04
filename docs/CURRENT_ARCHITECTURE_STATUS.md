# FacadeFlow — Current Architecture Status

**Source-of-truth status document**

Base SHAREABLE_CLEAN source checkpoint independently audited: `e227a0c`.
Current working hardening stack: **PROFILE DATA 01.2A V8 — N-field Effective Geometry Integrity Hardening**, **V8.1 — Composer Entry / Template State Consistency** (historical V8.1.1 follow-up is folded into V8.1; there is no separate V8.1.1 closure artifact), **V8.2 — PRELUDE 482.05 Base Geometry Correction**, plus **V8.3 — Working Configuration UX**.
V8.2 reached canonical technical verify PASS locally. Human review then identified that the separate user-facing Door DEMO entry was confusing for the intended workflow: users must be able to start with only known data and add missing technical details later. V8.3 changes this access/UX model while preserving all validation and production locks. **The combined stack remains open until V8.3 passes canonical `npm run verify`, the updated human visual audit, clean Git checks and commit.**

Older phase acceptance files remain historical evidence. An acceptance filename never overrides the executable code, regression results, safety gates or this current status.

## Current architecture state

| Area | Current status | Boundary |
| --- | --- | --- |
| UI01.1–UI01.2B | IMPLEMENTED / previously accepted | Unified navigation, Projects foundation and source/catalogue visual separation |
| UI02.1A–UI02.1B | IMPLEMENTED | Bulgarian-language consistency for AI constructor and import surfaces |
| AI01 | CLOSED / ACCEPTED FOUNDATION | Prompt → canonical Product Intent; unresolved values remain unresolved |
| AI02 | CLOSED / ACCEPTED FOUNDATION | Document evidence → same canonical Product Intent; conflicts stay human-reviewed |
| AI03 | CLOSED / ACCEPTED FOUNDATION | Parametric proposal only; no automatic constructor or production authority |
| AI04 | CLOSED / ACCEPTED FOUNDATION | Explicit human-reviewed editable handoff only |
| WP78 | CLOSED / ACCEPTED FOUNDATION | Evidence-aware contextual review; no generic production authority |
| RP01.1–RP01.21 | CLOSED / ACCEPTED FOUNDATION | Evidence/simulation/read-only authority groups only |
| PROJECT01.1–PROJECT01.3B | IMPLEMENTED | Project lifecycle, creation workspace, detail actions and BG UI consistency |
| PROFILE DATA 01.1 | IMPLEMENTED / UPDATED BY V8.2 | PRELUDE 60 base geometry human-confirmed: 482.30 frame 64/42, 482.21 mullion 84/40, 482.05 WINDOW sash 78/56; effective assembled sash width remains separate |
| PROFILE DATA 01.2 / 01.2A | IMPLEMENTED WORKING MODEL | PRELUDE system overlap uses human-reviewed 7 mm working value only; never production authority |
| Visual Composer V4–V7 | IMPLEMENTED / UPDATED BY V8.3 | Explicit field focus and N-field window/door targeting; the old separate Door DEMO entry is superseded by one working-configuration workflow |
| PROFILE DATA 01.2A V8 | IMPLEMENTED — COMBINED CLOSURE PENDING | Canonical divider ratios, explicit sash eligibility and WINDOW/DOOR profile compatibility hardening |
| PROFILE DATA 01.2A V8.1 | IMPLEMENTED — COMBINED CLOSURE PENDING | Explicit Composer topology auto-seed, generic blank entry and topology lock/reset consistency |
| PROFILE DATA 01.2A V8.2 | TECHNICAL VERIFY PASS — COMBINED CLOSURE PENDING | Correct 482.05 base geometry to 78/56; keep glazing-bead dimension deferred/variable and separate from 7 mm overlap |
| PROFILE DATA 01.2A V8.3 | IMPLEMENTED — VERIFY/HUMAN AUDIT PENDING | One working-configuration UX for WINDOW/DOOR; partial technical data allowed for editing, unknowns remain unknown, strict confirmation/safety unchanged |

## PRELUDE 60 effective-geometry invariants

- 482.30: `FRAME`, base visible width 42 mm, human-confirmed base geometry.
- 482.21: `MULLION`, base visible width 40 mm, human-confirmed base geometry.
- 482.05: current application `SASH` bridge for **WINDOW** only; base profile geometry is human-confirmed as 78 mm height / 56 mm visible width. This does not automatically define effective assembled sash width.
- 482.26 / 482.27: catalogue-only door-sash entries; not selectable until explicit human mapping/geometry review.
- Arithmetic differences are 22 mm for frame (64-42), 22 mm for sash (78-56) and 44 mm for mullion (84-40), but these differences are not used as an automatic glazing-bead formula.
- Glazing-bead review is deferred: one reviewed example is 20 mm and 22 mm is common, therefore no universal bead constant or bead geometry calculation is enabled.
- Glazing-bead dimension and sash overlap are separate concepts.
- PRELUDE sash overlap: 7 mm human-reviewed working value, editable and exact-production-confirmation-required.
- Overlap may apply only when an explicit compatible sash profile is selected.
- Template divider geometry uses canonical numeric `positionRatio`; rounded percentage labels are presentation-only.
- Double / Triple / Quad N-field adjacency must be regression-tested together with PRELUDE effective visible geometry.

## Composer-entry invariants

- `composerTemplateId` is the explicit canonical bridge between structured configuration and the initial Composer topology.
- Choosing a concrete preset such as Double / Triple / Quad seeds that exact matching window or door composition when Composer opens.
- Choosing the generic/no-preselected-composition route keeps Composer empty and leaves the template library available for local selection.
- Renaming the product does not silently discard an already selected topology; switching to generic is an explicit action.
- While an explicit topology is configured, Composer cannot silently switch to another topology from the left library. A topology change belongs back in the structured configuration step.
- Reset inside an explicitly seeded Composer resets edits to the same topology instead of erasing or replacing the canonical topology.
- WINDOW and DOOR use the current structured configuration directly in the working composer. Missing system/profile data may stay empty and be entered later.
- Door threshold remains `UNRESOLVED`; conceptual review requires acknowledgement inside the door composer, while production/machine readiness stays locked.
- Internal historical `DEMO-*` template/profile identifiers may remain for regression/provenance, but they are not the user-facing product-workflow concept.

## Safety invariants

The following remain non-negotiable across the architecture:

- Human review is required before AI proposal handoff to editable constructor geometry.
- `HUMAN_REVIEWED` is not engineering approval and is not production approval.
- Project/source evidence is not automatically promoted to a normalized catalogue fact or generic rule.
- `VALIDATED_FOR_CONTEXT` is context-only.
- No phase may set `machineReady`, `productionApproved`, `productionExecutable`, `engineeringAuthorityGranted`, or equivalent production authority automatically.
- No machine communication or production instruction generation is authorized.
- PRELUDE working overlap does not authorize cutting, machining, export or production dimensions.
- Real local evidence remains private and must not be included in a `SHAREABLE_CLEAN` checkpoint.

## Canonical verification

The canonical repository verification command is:

```bash
npm run verify
```

It runs:

1. every shareable `tests/*.test.ts` file through `npm run test:regression`, excluding explicitly private `*.internal.test.ts`;
2. `npm run lint`;
3. `npm run build`.

Locked/private RP01 evidence tests are intentionally separate under `*.internal.test.ts`. `npm run test:internal-evidence` requires `local-samples/phase05a`, and `npm run verify:internal` runs shareable regression + internal evidence + lint + build for controlled InternalAudit checkpoints.

For a closure/checkpoint also run:

```bash
git diff --check
git status --short
```

A clean checkpoint must be created only from a clean Git working tree.

## Checkpoint packaging

Use the canonical scripts:

```powershell
npm run checkpoint:shareable
npm run checkpoint:internal
```

`SHAREABLE_CLEAN` runs the shareable verification contract and excludes private evidence including `local-samples/`, `*.dwg` and `*.lte`, plus Git metadata, dependencies, build/runtime output, coverage, environment files, logs and temporary files. `INTERNAL_AUDIT` runs `verify:internal`, so locked evidence regression is required before that checkpoint can be created.

The checkpoint ZIP is expected to contain the manifest produced by `scripts/New-FacadeFlowCheckpoint.ps1`; do not infer commit provenance only from the ZIP filename.

## Next step

Do **not** start a new major feature phase yet.

First close the combined **PROFILE DATA 01.2A V8 + V8.1 + V8.2 + V8.3** working tree with full canonical verify and the updated human visual audit. The audit must confirm PRELUDE N-field geometry, Composer-entry/template-state consistency, the corrected 482.05 base geometry 78/56, partial-data working access for both WINDOW and DOOR, direct source-configuration editing, unresolved door threshold handling, and the continued separation of deferred glazing-bead semantics from the 7 mm overlap. If that passes, run staged clean checks, commit/push the combined hardening slice and create a canonical shareable checkpoint. Only then select the next feature/data phase.
