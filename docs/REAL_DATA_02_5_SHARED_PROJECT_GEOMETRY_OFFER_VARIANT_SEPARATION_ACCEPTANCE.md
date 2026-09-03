# REAL DATA 02.5 — Shared Project Geometry / Offer Variant Separation

## Status

Acceptance target: **GEOMETRY / OFFER SCOPE SEPARATION FOUNDATION**

REAL DATA 02.5 resolves the highest-value structural gap frozen by REAL DATA 02.4: when a Nadezhda offer contains several configuration variants and then an explicit `Спецификация` section, the later module geometry must remain project-level geometry instead of being attached to the last active offer variant.

## Why this phase exists

The private reference set shows recurring documents where:

- several profile/system alternatives are described first;
- one common module specification follows later;
- the module positions are the geometry of the job, not duplicated copies owned by each price/configuration alternative.

REAL DATA 02.1 already stores modules globally at draft level, but REAL DATA 02.3 could still attach later modules to the last active product group because extractor context remained open after the final variant.

REAL DATA 02.5 introduces explicit section scoping and a safe separation read model.

## Extractor hardening

The deterministic extractor now recognizes these exact headings:

- `Спецификация`
- `Спецификация:`
- `Спецификация на дограма`
- `Спецификация на дограма:`

It emits a source-backed `SPECIFICATION_SECTION` candidate with value `PROJECT_GEOMETRY`.

At this heading the extractor clears stale:

- offer variant context;
- product group context;
- material context;
- active module context;
- commercial include/exclude context.

It does **not** invent applicability between offer variants and the later geometry.

## Bridge hardening

When the bridge receives `SPECIFICATION_SECTION`, it resets the active offer/group/module pointers before later module rows are processed.

Therefore:

- module identity remains in `draft.modules`;
- later shared geometry is not attached to the last variant;
- geometry is not duplicated across variants;
- same-size module positions remain distinct;
- offer configuration remains separate from project geometry.

## Separation read model

`analyzeNadezhdaGeometryOfferSeparation(...)` exposes an explicit safe read model with:

- `projectGeometryModuleIds`;
- `variantScopedModuleIds`;
- `crossVariantModuleIds`;
- per-variant explicit module ids;
- specification evidence refs;
- a separation state.

Possible states:

- `NO_GEOMETRY`
- `PROJECT_GEOMETRY_ONLY`
- `EXPLICIT_SHARED_PROJECT_GEOMETRY`
- `VARIANT_SCOPED_GEOMETRY`
- `MIXED_SCOPES_REVIEW_REQUIRED`

For an explicit shared-geometry section, variant applicability is **not inferred**. Each variant is marked:

`REQUIRES_HUMAN_CONFIRMATION`

This means the system recognizes that geometry is structurally separate, but a human still decides which offer variant/configuration applies to which geometry before any later workflow consumes that relationship.

## Golden fixture hardening

Two synthetic golden families that model real documents with an explicit specification heading are hardened:

- alternative offer variants followed by common geometry;
- four offer variants followed by common geometry.

For these fixtures the previous gap:

`COMMON_GEOMETRY_AFTER_VARIANTS_REQUIRES_EXPLICIT_SCOPE`

is closed.

The ambiguous multi-system fixture intentionally keeps that gap because its synthetic structure has no explicit specification heading separating later modules from the last variant. REAL DATA 02.5 must not infer scope where the source does not state it.

## Safety invariants

REAL DATA 02.5 MUST preserve:

- source evidence only;
- no automatic geometry ownership inference;
- no automatic offer-to-geometry applicability inference;
- no module duplication;
- no module merging;
- no automatic reuse;
- no lifecycle ProjectRecord creation;
- no opening/sash/divider inference;
- no machine code generation;
- `machineReady === false`;
- `productionApproved === false`;
- production remains locked.

## Privacy boundary

No private Nadezhda customer/project file is tracked by this phase.

The golden fixtures remain anonymized synthetic structural reductions. Client identities, original pages, scans, exact original commercial totals and original text blocks remain outside Git and outside shareable checkpoints.

## Acceptance checks

REAL DATA 02.5 passes when:

- `Спецификация` is recognized as an explicit project-geometry section;
- stale offer/group context is cleared at that section;
- common modules after multiple variants remain project-level;
- modules are not attached only to the final offer variant;
- modules are not duplicated across variants;
- variant applicability remains human-review-only;
- same-size positions remain distinct;
- floor placement survives the separation;
- ambiguous no-heading cases remain review-required;
- unrelated REAL DATA 02.4 known gaps remain explicit;
- every resolved geometry value remains evidence-backed;
- privacy and production boundaries remain locked;
- focused tests pass;
- full FacadeFlow verification passes.

## Out of scope

REAL DATA 02.5 does NOT:

- parse numeric price components;
- resolve commercial include/exclude scope across several variants;
- infer a bare glazing line before a module;
- create a Projects workspace record;
- decide which variant a human will select;
- infer construction geometry, opening direction, sash/divider structure or production profiles;
- unlock production or machine export.

## Next phase

The next safe layer can use this separation to build **human-reviewed offer applicability**: a reviewer can explicitly confirm that one or more offer variants apply to the shared project geometry without copying the geometry or changing module identity.
