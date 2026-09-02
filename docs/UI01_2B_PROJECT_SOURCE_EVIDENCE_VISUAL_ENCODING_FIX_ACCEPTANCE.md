# UI01.2B — Project Source Evidence Visual + Encoding Fix

Status: IMPLEMENTED / HUMAN VISUAL VERIFY REQUIRED

## Purpose

UI01.2B repairs the human-visible source-project presentation introduced by UI01.2A without changing source facts or engineering authority.

## Visual result

- Bulgarian source labels are stored and rendered as UTF-8 text without mojibake.
- `Надежда · Вадим-2` is a dedicated source-project card with four project metrics.
- 78.01 / 78.27 / 78.33 / 78.51 are structured evidence cards with dimensions, XML/LTE counts, lengths and machining counts.
- FRAME / SASH / MULLION review controls use the FacadeFlow visual language.
- Human review opens a dedicated inline review panel; source evidence remains immutable.
- `WP 78` is a separate `REAL DATA BATCH 01 · READ ONLY` card with UNKNOWN dimensions and non-selectable status.
- Catalogue retains only normalized/demo/archive records and provenance links back to Projects.

## Safety boundary

UI01.2B adds no backend, persistence, network, AI similarity, project copy, rule approval, machine writer, production unlock or automatic geometry.

Visible source-project safety state remains:

`RULES VALIDATED: NO · MACHINE READY: NO · PRODUCTION APPROVED: NO`

## Verification

Run:

```powershell
npm run test:ui01_1
npm run test:ui01_2
npm run test:ui01_2a
npm run test:ui01_2b
npm run lint
npm run build
git diff --check
```

Then perform Human Visual Audit of Projects and Catalogue before commit.
