# REAL DATA 02.1 — Nadezhda Project Pattern Canonical Schema Foundation

## Goal

Create a canonical, evidence-first project-document schema derived from recurring structures observed in private real Nadezhda project documents, without storing those customer documents in the repository and without activating new UI, persistence, AI inference or production behavior.

## Added

- `src/realData/nadezhdaProjectPatternSchema.ts`
- `tests/realData02_1NadezhdaProjectPatternSchema.test.ts`
- `docs/REAL_DATA_02_0_PRIVATE_NADEZHDA_REFERENCE_CORPUS_POLICY.md`
- this acceptance document

## Canonical capabilities

The foundation can represent:

1. a project with no mandatory building/floor hierarchy;
2. optional building/floor/facade/room/zone/section placement paths;
3. distinct modules with quantity, width and height;
4. repeated module geometry without automatic merging;
5. several offer variants over one shared project geometry;
6. mixed product groups inside one variant;
7. system/color/glazing/hardware/reinforcement defaults per product group;
8. explicit module-level overrides;
9. area, per-piece, linear-meter, fixed and other price components;
10. included and excluded commercial items;
11. at least one valid source evidence reference for every resolved field;
12. unresolved and conflict states cannot carry inferred replacement values.

## Explicit non-goals

REAL DATA 02.1 does **not**:

- parse PDF or DOCX automatically;
- add the private real projects to the visible Project Library;
- create templates from customer projects;
- infer opening type or construction from L/H;
- infer profile roles from codes;
- merge same-size modules;
- persist to backend/database/local storage;
- activate machine export;
- grant engineering or production authority.

## Safety

The schema hard-locks:

- `privateReferenceCorpus: true`
- `sourceEvidenceOnly: true`
- `templatePromotionAllowed: false`
- `automaticReuseAllowed: false`
- `automaticModuleMergeAllowed: false`
- `automaticAttributeInferenceAllowed: false`
- `automaticProductionDecisionAllowed: false`
- `productionLocked: true`
- `machineReady: false`
- `productionApproved: false`

## Acceptance

Focused acceptance requires all REAL DATA 02.1 tests to pass and full FacadeFlow regression/lint/build to remain green before commit.
