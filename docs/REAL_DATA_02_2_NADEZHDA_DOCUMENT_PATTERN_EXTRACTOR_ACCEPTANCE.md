# REAL DATA 02.2 — Nadezhda Document Pattern Extractor Foundation

## Goal

Add a deterministic, evidence-first text pattern extractor for recurring Nadezhda project-document structures, using only synthetic tracked fixtures and keeping the private customer corpus outside the repository.

REAL DATA 02.2 consumes **already extracted text**. It does not open or execute DOCX/PDF content itself and it does not create an active FacadeFlow project.

## Added

- `src/realData/nadezhdaDocumentPatternExtractor.ts`
- `tests/realData02_2NadezhdaDocumentPatternExtractor.test.ts`
- this acceptance document

## Explicit patterns recognized

The first deterministic layer can observe explicit source text for:

- `обект:` / site-location text;
- `Вариант N` offer headings;
- PVC and aluminium product-group headings;
- optional `Етаж` and `Секция` placement;
- `Модул:` reference;
- `Брой:` quantity;
- `L = ... mm` width;
- `H = ... mm` height;
- explicit `Профил:` / `Система:` text;
- explicit color, glazing, hardware and reinforcement text;
- explicit included / excluded commercial sections;
- price lines as source text and explicit `с ДДС` / `без ДДС` wording.

Every candidate retains source kind, source reference, raw text and line locator. Context is copied from **explicit preceding headings only**.

## Safety and privacy boundaries

REAL DATA 02.2 does not:

- store the real Nadezhda customer documents in tracked fixtures;
- infer opening direction, sash/divider construction or profile role from dimensions;
- merge modules with the same width and height;
- infer missing system, glazing, hardware or reinforcement;
- create a `ProjectRecord` automatically;
- create a canonical project draft automatically;
- promote source projects to templates;
- persist to backend/database/local storage;
- unlock machine or production output.

Hard locks remain:

- private source: true;
- read-only: true;
- source evidence only: true;
- automatic draft creation: false;
- automatic attribute inference: false;
- automatic module merge: false;
- automatic production decision: false;
- production locked: true;
- machine ready: false;
- production approved: false.

## Next phase boundary

REAL DATA 02.3 may map reviewed REAL DATA 02.2 observations into the REAL DATA 02.1 canonical `SOURCE_DRAFT` schema. That later bridge must preserve evidence refs and keep unresolved values unresolved.

## Acceptance

Focused REAL DATA 02.2 tests and full FacadeFlow regression/lint/build must pass before commit.
