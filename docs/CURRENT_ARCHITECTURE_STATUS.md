# FacadeFlow — Current Architecture Status

**Source-of-truth status document**

## Baseline and maintenance state

Current independently audited GitHub/ZIP base: **`9d185aa`** (`workflow: integrate conceptual drawing through manufacturing gates`).

This working tree includes **QA02 — Regression, Workflow & Documentation Hardening** on top of that base. QA02 is a maintenance delta and is not considered closed until the target repository passes canonical local verification, is committed/pushed, is synchronized `0 0` with origin, and is packaged through the canonical checkpoint generator.

Historical acceptance documents remain historical evidence. Their older checkpoint wording does not override executable code, current regression results, safety gates, or this status document.

## Current architecture map

| Area | Current status | Authority / boundary |
| --- | --- | --- |
| UI01–UI02 | IMPLEMENTED FOUNDATION | Unified navigation/workspaces and BG consistency; no production authority |
| PROJECT01 | IMPLEMENTED FOUNDATION | Project lifecycle, source context and project actions |
| AI01 | CLOSED FOUNDATION | Prompt → canonical Product Intent; unknowns stay unresolved |
| AI02 | CLOSED FOUNDATION | Document/source evidence → same Product Intent; conflicts remain human-reviewed |
| AI03 | CLOSED FOUNDATION | Conceptual parametric proposal only; no automatic geometry acceptance |
| AI04 | CLOSED FOUNDATION | Explicit human-reviewed editable constructor handoff only |
| AI05 | IMPLEMENTED KNOWLEDGE/DRAWING FOUNDATION | Construction language/graph, drawing learning and canonical profile assignment/review; no production promotion |
| REAL USER WORKFLOW V1 | IMPLEMENTED | Natural-language clarification, explicit human answers, knowledge gaps, no automatic profile selection |
| REAL USER WORKFLOW V2–V6 | IMPLEMENTED INTEGRATED MILESTONE | V2 conceptual drawing; V3 corrections; V4 constructor preparation; V5/V6 intentionally LOCKED |
| WP78 | CLOSED FOUNDATION | Evidence-aware contextual review only |
| RP01.1–RP01.21 | CLOSED FOUNDATION | Evidence/simulation/read-only authority groups only |
| PROFILE DATA V1 / 01.x–02.x | IMPLEMENTED WORKING MODEL | PRELUDE working geometry/catalogue semantics; not production formulas |
| PROFILE DATA 03 | IMPLEMENTED KNOWLEDGE/EVIDENCE CHAIN | Identity → semantics → compatibility → evidence → readiness/gates → AI context/clarification; still fail-closed |
| Visual Composer | IMPLEMENTED | WINDOW/DOOR working configuration, explicit topology and field focus |
| Import / OCR / DWG foundations | IMPLEMENTED / SAFETY-LIMITED | Human-reviewed local evidence/read-only tooling; no automatic production conversion |
| QA01 | IMPLEMENTED FOUNDATION | Canonical verification/checkpoint primitives |
| QA02 | IMPLEMENTED DELTA / LOCAL VERIFY REQUIRED | TS+TSX regression completeness, single normal prompt workflow, current docs |

## REAL USER WORKFLOW

### V1 — Natural-language clarification

V1 begins from the current human prompt and builds a canonical candidate intent.

Invariants:

- recognized facts and unresolved fields remain distinguishable;
- required structural clarification cannot be bypassed by deferring it;
- human answers create a new candidate interpretation;
- PRELUDE codes may be proposed for confirmation but are never automatically selected;
- unsupported systems remain explicit knowledge gaps;
- changing source description invalidates derived V1 state;
- `automaticProfileSelectionAllowed = false`;
- `automaticGeometryAllowed = false`;
- `productionUnlockAllowed = false`;
- `machineReady = false`.

### V2–V6 — Integrated milestone

Canonical normal-prompt journey:

`human prompt → V1 clarification → V2 conceptual drawing → V3 conversational correction → V2 re-review → V4 explicit editable-constructor preparation → V5 locked production validation → V6 locked manufacturing handoff`

**V2:** builds conceptual parametric drawing/proposal and requires Human Review.
**V3:** applies deterministic candidate edits and invalidates stale drawing review.
**V4:** exposes profile roles/working semantics and allows explicit editable constructor preparation only after review.
**V5:** remains `LOCKED` until authoritative engineering/production knowledge exists.
**V6:** remains `LOCKED`; DWG/DXF/MACHINE_JOB are future targets only.

QA02 removes the parallel legacy AI03 Human Review panel from this normal natural-language prompt path. The direct structured quick-entry route remains separate and retains its current legacy proposal panel until a future explicit migration phase.

## PROFILE DATA current invariants

### PRELUDE working semantics

- `482.30` — `FRAME`: 64 mm working dimension / 42 mm visible width.
- `482.05` — current application `SASH` bridge for **WINDOW**: 78 mm working dimension / 56 mm visible width.
- `482.21` — `MULLION`: 84 mm working dimension / 40 mm visible width.
- `482.26` / `482.27` — catalogue-only door-sash entries; not automatically selectable/mapped.
- PRELUDE sash overlap: 7 mm human-reviewed working value, editable and exact-production-confirmation-required.
- Glazing-bead dimension and sash overlap are separate concepts.
- Reviewed glazing-bead observations do not create a universal bead constant.
- Arithmetic differences between base dimensions are not automatic production formulas.
- Template divider geometry uses canonical numeric `positionRatio`; display percentages are presentation-only.

### PROFILE DATA 03 knowledge/evidence chain

Current chain includes:

1. visual section library / profile shape visualization;
2. knowledge provenance and catalogue visual-truth controls;
3. canonical profile identity;
4. canonical technical semantics;
5. canonical compatibility semantics;
6. assembly evidence foundation;
7. assembly evidence Human Review, summary and readiness;
8. manual evidence intake and review;
9. evidence application bundles;
10. knowledge readiness bundles;
11. system knowledge gates;
12. AI knowledge context;
13. evidence request / safe-response composition;
14. AI clarification intake.

This architecture allows AI to know **what evidence exists, where it came from, how it was reviewed, and what remains unknown**. It does not authorize the jump from catalogue knowledge to production execution.

## Production-validation blockers

V5 must stay locked while any required authoritative layer is missing, including:

- manufacturer assembly compatibility;
- exact joint/section geometry;
- production deductions;
- manufacturing tolerances;
- validated deterministic engineering rules;
- context-specific compatibility validation.

A human-reviewed catalogue dimension or working overlap is not sufficient to unlock production.

## Manufacturing blockers

V6 must stay locked while there is no separate validated manufacturing boundary covering:

- approved production geometry;
- approved deductions/tolerances;
- target manufacturing format semantics;
- export validation;
- machine/vendor compatibility;
- explicit machine communication authorization.

Current application state therefore preserves:

- automatic manufacturing export = NO;
- machine connectivity = NO;
- machine ready = NO;
- production approved = NO.

## Safety invariants

The following remain non-negotiable across the architecture:

- Human Review is required where AI candidates/proposals cross into editable construction preparation.
- `HUMAN_REVIEWED` is not engineering approval and not production approval.
- Project/source evidence is not automatically promoted to a normalized catalogue fact or generic rule.
- `VALIDATED_FOR_CONTEXT` is context-only.
- Knowledge readiness is not production readiness.
- Automatic profile selection is forbidden unless a future explicit authority layer changes that contract.
- No phase may set `machineReady`, `productionApproved`, `productionExecutable`, `engineeringAuthorityGranted`, or equivalent production authority automatically.
- No machine communication or production instruction generation is authorized.
- PRELUDE working semantics/overlap do not authorize cutting, machining or production dimensions.
- Private local evidence must not be included in a `SHAREABLE_CLEAN` checkpoint.
- Shareable derived project evidence is anonymized as `PROJECT_EVIDENCE_A`; original private project/customer labels, sample barcodes and source-file SHA-256 fingerprints are not part of the shareable tracked representation.

## Canonical verification — QA02 contract

Canonical repository verification:

```bash
npm run verify
```

It runs:

1. shareable regression through `npm run test:regression`;
2. `npm run lint`;
3. `npm run build`.

After QA02 the shareable regression runner discovers both:

- `tests/*.test.ts`
- `tests/*.test.tsx`

and excludes both:

- `*.internal.test.ts`
- `*.internal.test.tsx`

This supersedes older QA01 wording that mentioned only `.test.ts`. Existing `.test.tsx` Human Review/UI integration suites are therefore part of canonical verification.

Controlled internal verification:

```bash
npm run verify:internal
```

adds the internal-evidence runner, which uses the same TypeScript/TSX extension contract and requires the private `local-samples/phase05a` evidence checkout.

For closure also run:

```bash
git diff --check
git status --short
```

A clean checkpoint must be created only from a clean Git working tree after intended changes are committed.

## Checkpoint packaging

Use:

```powershell
npm run checkpoint:shareable
npm run checkpoint:internal
```

`SHAREABLE_CLEAN`:

- cannot use `-SkipVerify`;
- requires shareable verification;
- requires clean Git state;
- requires strict `origin/<branch>...HEAD = 0 0` synchronization;
- excludes private evidence, Git metadata, dependencies, build/runtime output, environment files and temporary artifacts;
- writes `CHECKPOINT_MANIFEST.txt` and deterministic `CHECKPOINT_CONTENT_SHA256.txt`;
- uses deterministic entry ordering and fixed ZIP timestamps.

`INTERNAL_AUDIT` may retain private evidence for controlled internal review and runs `verify:internal`.

Commit provenance is read from the checkpoint manifest and should be verified against Git when the repository is available. Do not infer provenance only from a ZIP filename.

## Current closure decision

Base `9d185aa` is functionally and safety-green for the integrated V1→V6 design, but the independent audit found a canonical regression gap because `.test.tsx` suites were not discovered and a duplicate normal-prompt Human Review surface remained.

QA02 addresses those findings. It is ready for target-repository verification but **must not be called CLOSED before**:

```bash
npm ci
npm run verify
git diff --check
git status --short
```

Then:

1. review intended diff;
2. stage only QA02 files;
3. commit/push;
4. `git fetch origin`;
5. confirm `git rev-list --left-right --count origin/master...master` returns `0 0`;
6. confirm clean `git status`;
7. create canonical `SHAREABLE_CLEAN` checkpoint.

## Next technical phase after QA02 closure

Do not unlock V5/V6 by adding UI flags.

The next correct technical direction is a narrowly scoped **production-validation knowledge foundation**: begin with one real PRELUDE assembly relationship (for example FRAME ↔ SASH) and establish authoritative manufacturer compatibility evidence, exact joint geometry, overlap/rebate semantics, deductions, tolerances and validated deterministic rules.

Only cases backed by that authority may later become individually production-validatable. Manufacturing handoff remains a separate later boundary.
