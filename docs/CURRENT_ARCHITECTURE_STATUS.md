# FacadeFlow — Current Architecture Status

**Source-of-truth status document**

Base SHAREABLE_CLEAN source checkpoint independently audited: `7071c2b`.
**PROFILE DATA 01.2A V8 + V8.1 + V8.2 + V8.3 is functionally CLOSED / independently audited at `7071c2b`.** Historical V8.1.1 wording is folded into V8.1 and is not a separate closure artifact. V8.3 provides the working-configuration WINDOW/DOOR UX while preserving strict technical confirmation and production locks.
The post-audit **V8.3.1 Audit Metadata & Reproducibility Hardening** maintenance layer changes only source-of-truth metadata, checkpoint provenance/reproducibility guards, runtime-version declaration and the PRELUDE system-label consistency cleanup. It does **not** reopen or change N-field geometry, Working Configuration state semantics, Visual Composer behavior, AI authority or production safety.

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
| PROFILE DATA 01.2A V8 | CLOSED / INDEPENDENT AUDIT PASS | Canonical divider ratios, explicit sash eligibility and WINDOW/DOOR profile compatibility hardening |
| PROFILE DATA 01.2A V8.1 | CLOSED / INDEPENDENT AUDIT PASS | Explicit Composer topology auto-seed, generic blank entry and topology lock/reset consistency |
| PROFILE DATA 01.2A V8.2 | CLOSED / INDEPENDENT AUDIT PASS | Correct 482.05 base geometry to 78/56; keep glazing-bead dimension deferred/variable and separate from 7 mm overlap |
| PROFILE DATA 01.2A V8.3 | CLOSED / INDEPENDENT AUDIT PASS | One working-configuration UX for WINDOW/DOOR; partial technical data allowed for editing, unknowns remain unknown, strict confirmation/safety unchanged |

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

`SHAREABLE_CLEAN` runs the shareable verification contract, requires a clean working tree and strict `origin/<branch>...HEAD = 0 0` synchronization, and excludes private evidence including `local-samples/`, `*.dwg` and `*.lte`, plus Git metadata, dependencies, build/runtime output, coverage, environment files, logs and temporary files. `-SkipVerify` is not permitted for `SHAREABLE_CLEAN`. `INTERNAL_AUDIT` runs `verify:internal`, so locked evidence regression is required unless an explicit internal-only skip is used.

The checkpoint ZIP contains both `CHECKPOINT_MANIFEST.txt` and deterministic `CHECKPOINT_CONTENT_SHA256.txt`. The content manifest lists sorted SHA-256 hashes for the payload and its own SHA-256 is recorded in the checkpoint manifest. ZIP entry order is deterministic and entry timestamps are fixed. Commit provenance must still be read from the manifest and verified against Git when the repository is available; do not infer it only from the ZIP filename.

## Next step

The V8–V8.3 functional stack is closed. Do not reopen its geometry/state logic without a new explicit finding.

For any maintenance change after audited checkpoint `7071c2b`, run the canonical closure protocol before creating a new shareable checkpoint:

```bash
npm ci
npm run verify
git diff --check
git status --short
```

Then stage only the intended maintenance files, review the staged diff, commit/push, confirm `origin/<branch>...HEAD = 0 0`, and create the canonical `SHAREABLE_CLEAN` checkpoint. After that, the next feature/data phase may be selected under a new explicit acceptance boundary.
