# QA02 — Regression, Workflow & Documentation Hardening — Acceptance

Base checkpoint: `9d185aa`

Status: IMPLEMENTED DELTA / LOCAL VERIFY + COMMIT REQUIRED

## Purpose

QA02 closes maintenance findings discovered during the independent audit of the final integrated `9d185aa` ZIP and its GitHub checkpoint.

QA02 is a **maintenance and closure-hardening phase**. It does not add a new product feature, does not add production rules, and does not unlock manufacturing.

## Changes

### 1. Canonical regression coverage

The shareable regression runner now discovers both:

- `tests/*.test.ts`
- `tests/*.test.tsx`

and excludes both private forms:

- `*.internal.test.ts`
- `*.internal.test.tsx`

The internal-evidence runner uses the matching TS/TSX contract.

This closes the gap where human-review/UI integration suites written as `.test.tsx` could exist in the repository but remain outside `npm run test:regression` and therefore outside `npm run verify`.

### 2. Single canonical normal prompt workflow

The normal human-prompt route now uses one visible review state machine:

`REAL USER WORKFLOW V1 → V2–V6`

The legacy `ParametricConstructionProposalPanel` is no longer rendered in parallel under the same successful natural-language prompt state. This removes the possibility of two independent Human Review surfaces describing the same normal prompt proposal.

The direct structured quick-entry route remains separate and may continue to use the legacy AI03 proposal panel until that route is deliberately migrated under its own acceptance boundary.

### 3. SHAREABLE_CLEAN evidence anonymization

Tracked/shareable source, tests and documentation no longer expose the original project label, LTE description name, sample barcodes or source-file SHA-256 fingerprints that came from the private evidence snapshot.

The shareable repository uses the explicit alias `PROJECT_EVIDENCE_A`, synthetic sample descriptions/barcodes and `SHAREABLE_REDACTED_*_SHA256` markers. Aggregate technical counts remain only as derived regression/evidence facts. The locked original XML/LTE files remain outside SHAREABLE_CLEAN under the private internal-evidence boundary.

This is a packaging/privacy hardening change; it does not reinterpret the evidence or promote it to a production rule.

### 4. Current documentation refresh

`README.md` and `docs/CURRENT_ARCHITECTURE_STATUS.md` are updated to describe the actual architecture present at base checkpoint `9d185aa`, including:

- REAL USER WORKFLOW V1;
- integrated V2–V6 milestone;
- AI01–AI05 foundation and current role;
- PROFILE DATA V1 working semantics and PROFILE DATA 03 knowledge/evidence chain;
- explicit production-validation and manufacturing gates;
- the corrected `.test.ts` + `.test.tsx` canonical regression contract;
- the anonymized `PROJECT_EVIDENCE_A` shareable evidence boundary;
- checkpoint provenance and shareable/internal verification boundaries.

Historical acceptance documents remain historical evidence and are not rewritten to pretend they were authored at the current checkpoint.

## Safety non-change

QA02 does not authorize or enable:

- automatic profile selection;
- automatic geometry acceptance;
- exact manufacturer joint geometry;
- production deductions;
- manufacturing tolerances;
- validated production compatibility;
- production unlock;
- DWG/DXF/MACHINE_JOB manufacturing export;
- machine communication;
- machine readiness;
- production approval.

Production and manufacturing remain **locked**.

## Acceptance

On the target FacadeFlow repository run:

```bash
npm ci
npm run test:regression
npm run lint
npm run build
npm run verify
git diff --check
git status --short
```

Expected:

- every shareable `.test.ts` and `.test.tsx` suite is executed by the canonical regression runner;
- private `*.internal.test.ts` / `*.internal.test.tsx` evidence remains excluded from SHAREABLE_CLEAN verification;
- the normal natural-language prompt path exposes one canonical V1→V6 review flow;
- direct structured quick entry remains operational;
- lint has zero errors;
- production build passes;
- safety gates remain fail-closed;
- tracked shareable text does not contain the redacted original project/customer/sample identifiers covered by QA02.

After local verification, stage only the intended QA02 files, review the staged diff, commit/push, verify `origin/<branch>...HEAD = 0 0`, then create a canonical `SHAREABLE_CLEAN` checkpoint using the repository checkpoint generator.
