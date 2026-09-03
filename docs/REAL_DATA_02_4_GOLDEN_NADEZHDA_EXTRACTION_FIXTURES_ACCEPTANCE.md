# REAL DATA 02.4 — Golden Nadezhda Extraction Fixtures

## Status

Acceptance target: **GOLDEN FIXTURE FOUNDATION / TRACKED-SAFE**

This phase turns the private Nadezhda reference corpus into a small tracked regression corpus without copying private client documents into the repository.

The tracked fixtures are **synthetic structural reductions**. They preserve recurring document shapes observed in the private source set while removing client identity, original prose, exact commercial values and original file content.

## Why this phase exists

REAL DATA 02.1 defined the canonical source-draft schema.

REAL DATA 02.2 added deterministic document-pattern extraction.

REAL DATA 02.3 bridged extracted evidence into a canonical `SOURCE_DRAFT`.

REAL DATA 02.4 now gives those layers a stable regression target based on the real ways Nadezhda project/offer documents are structured.

The goal is not to memorize historical projects. The goal is to preserve the recurring structural cases that future documents may resemble.

## Private-corpus boundary

The repository MUST NOT contain:

- original customer/project files;
- customer/company identities from the private reference corpus;
- copied pages, screenshots or scans;
- original commercial totals or quotations;
- original document text blocks.

Tracked fixtures MUST declare:

- `derivedFromPrivateReferencePattern: true`;
- `containsOriginalPrivateDocumentText: false`;
- `containsClientIdentity: false`;
- `safeForTrackedRegressionFixture: true`.

Private source documents remain external evidence and are not shareable checkpoint content.

## Seven golden pattern families

The synthetic fixture registry covers seven recurring structural families observed in the private corpus:

1. **Mixed product groups** — PVC, thermal aluminium and cold aluminium/door groups inside one job.
2. **Floor hierarchy** — explicit floor headings followed by module positions, quantities and L/H values.
3. **Alternative offer variants with shared geometry** — multiple system/configuration alternatives followed by one common module specification.
4. **Multi-basis pricing** — area, piece and linear-meter commercial components alongside module geometry.
5. **Multiple offer variants** — several alternatives over one common module geometry set.
6. **Multiple systems inside an offer variant plus included/excluded sections** — standard and sliding groups with different hardware and commercial inclusions/exclusions.
7. **Mixed groups with pre-module special attributes** — a special glazing note placed before selected module rows.

## Required invariants

Every golden fixture must preserve these rules:

- module position identity is independent from geometry;
- same `L/H` MUST NOT merge module records;
- floor/section placement is optional and evidence-backed;
- product-group material classification comes only from explicit source text;
- offer alternatives do not imply automatic reuse;
- missing attributes remain unresolved;
- unsupported patterns are recorded as explicit known gaps;
- no source value is human-confirmed automatically;
- no lifecycle `ProjectRecord` is created;
- no machine/production decision is created.

## Explicit known gaps frozen by REAL DATA 02.4

REAL DATA 02.4 intentionally records current limitations instead of hiding them:

### 1. Shared geometry after multiple offer variants

When several variants are followed by one common module specification, REAL DATA 02.3 currently associates the later modules with the last active explicit group. REAL DATA 02.4 marks this as:

`COMMON_GEOMETRY_AFTER_VARIANTS_REQUIRES_EXPLICIT_SCOPE`

A later phase must introduce a safe geometry-vs-offer scope model rather than duplicating or guessing.

### 2. Multi-basis numeric pricing

Pricing lines are preserved as source evidence, but numeric area/per-piece/linear-meter components are not yet promoted into canonical price components.

Known gap:

`MULTI_BASIS_PRICING_REMAINS_TEXT_EVIDENCE`

### 3. Commercial include/exclude scope after multiple variants

Included/excluded sections are currently attached to the active variant context. When a source document may intend the section to apply to the entire offer, human review is required.

Known gap:

`COMMERCIAL_SCOPE_AFTER_MULTIPLE_VARIANTS_REQUIRES_REVIEW`

### 4. Bare special glazing before a module row

A bare glazing description that appears before a selected module and lacks an explicit `Стъклопакет:` label is not interpreted as a module override.

Known gap:

`BARE_PRE_MODULE_GLAZING_REQUIRES_HARDENING`

The system must leave this unresolved rather than infer a module assignment.

## Acceptance checks

REAL DATA 02.4 passes when:

- exactly seven synthetic golden pattern families are tracked;
- tracked fixtures contain no private client/project identifiers;
- all fixtures preserve module-position count;
- product-group and material structure remains explicit-source-only;
- repeated geometry remains separate records;
- floor placement survives the extractor/bridge path;
- known gaps remain explicit and finite;
- every resolved canonical value remains evidence-backed;
- `machineReady === false`;
- `productionApproved === false`;
- `automaticModuleMergeAllowed === false`;
- `automaticReuseAllowed === false`;
- focused tests pass;
- full FacadeFlow verification passes.

## Out of scope

REAL DATA 02.4 does NOT:

- improve the extractor for the known gaps;
- parse numeric pricing into price components;
- create real projects in the Projects workspace;
- store private reference documents in Git;
- infer opening direction, sash/divider structure or production profile geometry;
- create templates from historical projects;
- unlock production or machine export.

## Next phase

The golden fixtures now provide a safe basis for targeted hardening. The next phase should resolve the highest-value known gaps one at a time, beginning with the separation of **shared project geometry** from **offer-variant configuration** so multiple offer alternatives can reference one evidence-backed geometry set without duplicating or mutating module identity.
